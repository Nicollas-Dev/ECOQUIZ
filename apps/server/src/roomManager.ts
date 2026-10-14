import { randomBytes, randomInt, randomUUID } from "node:crypto";
import type { Server, Socket } from "socket.io";
import type {
  AnswerStat,
  LeaderboardEntry,
  Participant,
  Question,
  QuestionReveal,
  RoomSnapshot,
  RoomStatus,
  Track
} from "@ecoquiz/shared";
import { getTrackWithQuestions, redactQuestion } from "./repositories.js";
import { getQuiz, hashToken, shuffled } from "./quizService.js";
import type { CreatedRoom } from "@ecoquiz/shared";

const ROOM_FINISHED_TTL_MS = 15 * 60 * 1000;
const ROOM_INACTIVE_TTL_MS = 2 * 60 * 60 * 1000;

type ParticipantState = Participant & {
  socketId: string;
  joinedAt: number;
  lastSeenAt: number;
  tokenHash: string;
};

type AnswerState = {
  participantId: string;
  optionId: string;
  answeredAt: number;
  responseMs: number;
  correct: boolean;
  points: number;
};

type RoomState = {
  pin: string;
  track: Track;
  questions: Question[];
  status: RoomStatus;
  participants: Map<string, ParticipantState>;
  hostSocketId?: string;
  hostTokenHash: string;
  questionIndex: number;
  questionStartedAt?: number;
  questionEndsAt?: number;
  answers: Map<string, AnswerState>;
  reveal?: QuestionReveal;
  timeout?: NodeJS.Timeout;
  createdAt: number;
  updatedAt: number;
  finishedAt?: number;
};

export class RoomError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

export class RoomManager {
  private rooms = new Map<string, RoomState>();

  constructor(private io: Server) {
    const cleanupInterval = setInterval(() => this.cleanupRooms(), 60 * 1000);
    cleanupInterval.unref?.();
  }

  async createRoom(trackId?: string, quizId?: string, creatorId?: string): Promise<CreatedRoom> {
    if (this.rooms.size >= 500) throw new RoomError("Limite de salas ativas atingido. Tente novamente mais tarde.", 503);
    let content: { track: Track; questions: Question[] } | null;
    if (quizId && creatorId) {
      const quiz = await getQuiz(creatorId, quizId);
      content = {
        track: { id: quiz.id, slug: quiz.id, name: quiz.title, description: quiz.description, icon: "shopping-bag", ods: quiz.odsIds.map(id => id.replace("ods-", "ODS ")), accent: "#2F8054" },
        questions: (quiz.randomOrder ? shuffled(quiz.questions) : quiz.questions).map(q => ({
          id: q.id, prompt: q.prompt, options: q.options, correctOptionId: q.correctOptionId, explanation: q.explanation,
          ods: q.odsId?.replace("ods-", "ODS ") ?? "", timeLimit: q.timeLimit
        }))
      };
    } else { content = trackId ? await getTrackWithQuestions(trackId) : null; }

    if (!content || content.questions.length === 0) {
      throw new RoomError("O quiz precisa ter pelo menos uma pergunta válida.", 400);
    }

    const pin = this.generatePin();
    const now = Date.now();
    const hostToken = randomBytes(32).toString("hex");

    const room: RoomState = {
      pin,
      track: content.track,
      questions: content.questions.map(q => {
        const options = q.options.map(o => ({ ...o, id: randomUUID() }));
        return { ...q, id: randomUUID(), options, correctOptionId: options[q.options.findIndex(o => o.id === q.correctOptionId)].id };
      }),
      hostTokenHash: hashToken(hostToken),
      status: "lobby",
      participants: new Map(),
      questionIndex: 0,
      answers: new Map(),
      createdAt: now,
      updatedAt: now
    };

    this.rooms.set(pin, room);
    return { ...this.toSnapshot(room), hostToken };
  }

  getRoomSnapshot(pin: string): RoomSnapshot {
    return this.toSnapshot(this.expectRoom(pin));
  }

  attachHost(socket: Socket, pin: string, hostToken: string): RoomSnapshot {
    const room = this.expectRoom(pin);
    if (hashToken(hostToken) !== room.hostTokenHash) throw new RoomError("Credencial de controle da sala inválida.", 403);
    if (socket.data.pin && socket.data.pin !== pin) throw new RoomError("Desconecte antes de trocar de sala.");
    if (socket.data.role === "participant") throw new RoomError("Use outra conexão para controlar a sala.");

    room.hostSocketId = socket.id;
    room.updatedAt = Date.now();
    socket.data.role = "host";
    socket.data.pin = pin;
    socket.join(this.channel(pin));

    this.emitRoom(room);
    return this.toSnapshot(room);
  }

  joinParticipant(socket: Socket, pin: string, nicknameInput: string, resumeToken?: string): RoomSnapshot & { participantToken: string; participantId: string } {
    const room = this.expectRoom(pin);
    if (socket.data.pin) throw new RoomError("Você já está conectado a uma sala.", 409);
    if (resumeToken) {
      const participant = [...room.participants.values()].find(p => p.tokenHash === hashToken(resumeToken));
      if (!participant) throw new RoomError("Credencial do participante inválida.", 401);
      const oldSocket = this.io.sockets.sockets.get(participant.socketId);
      participant.socketId = socket.id; participant.connected = true; participant.lastSeenAt = Date.now();
      socket.data.role = "participant"; socket.data.pin = pin; socket.data.participantId = participant.id;
      socket.join(this.channel(pin)); oldSocket?.disconnect(); this.emitRoom(room);
      return { ...this.toSnapshot(room), participantToken: resumeToken, participantId: participant.id };
    }
    if (room.participants.size >= 200) throw new RoomError("Esta sala atingiu o limite de 200 participantes.");
    const nickname = nicknameInput.trim().replace(/\s+/g, " ");

    if (room.status !== "lobby") {
      throw new RoomError("Esta partida já começou. Peça ao professor para criar uma nova sala.", 409);
    }

    if (nickname.length < 2 || nickname.length > 20) {
      throw new RoomError("Use um apelido entre 2 e 20 caracteres.");
    }

    const nicknameAlreadyActive = [...room.participants.values()].some(
      (participant) =>
        participant.connected && participant.nickname.toLocaleLowerCase("pt-BR") === nickname.toLocaleLowerCase("pt-BR")
    );

    if (nicknameAlreadyActive) {
      throw new RoomError("Esse apelido já está em uso nesta sala.");
    }

    const now = Date.now();
    const participantToken = randomBytes(32).toString("hex");
    const participant: ParticipantState = {
      id: randomUUID(),
      socketId: socket.id,
      nickname,
      score: 0,
      connected: true,
      joinedAt: now,
      lastSeenAt: now,
      tokenHash: hashToken(participantToken)
    };

    room.participants.set(participant.id, participant);
    room.updatedAt = now;

    socket.data.role = "participant";
    socket.data.pin = pin;
    socket.data.participantId = participant.id;
    socket.join(this.channel(pin));

    this.emitRoom(room);
    return { ...this.toSnapshot(room), participantToken, participantId: participant.id };
  }

  startGame(socket: Socket, pin: string): RoomSnapshot {
    const room = this.expectRoom(pin);
    this.assertHost(socket, room);

    if (room.status !== "lobby") {
      throw new RoomError("A partida já foi iniciada.");
    }

    if (this.connectedParticipants(room).length === 0) {
      throw new RoomError("É necessário ter pelo menos um participante conectado.");
    }

    this.startQuestion(room, 0);
    return this.toSnapshot(room);
  }

  submitAnswer(socket: Socket, pin: string, optionId: string, questionId: string): RoomSnapshot {
    const room = this.expectRoom(pin);
    const participantId = socket.data.participantId as string | undefined;

    if (!participantId || socket.data.pin !== pin) {
      throw new RoomError("Participante não reconhecido nesta sala.", 401);
    }

    const participant = room.participants.get(participantId);
    const question = this.currentQuestion(room);

    if (!participant || !participant.connected || participant.socketId !== socket.id || socket.data.role !== "participant") {
      throw new RoomError("Participante desconectado ou não encontrado.", 401);
    }

    if (room.status !== "question" || !question || !room.questionStartedAt || !room.questionEndsAt) {
      throw new RoomError("Não há pergunta aberta para resposta.");
    }
    if (question.id !== questionId) throw new RoomError("Esta resposta pertence a outra pergunta.");

    if (Date.now() >= room.questionEndsAt) {
      throw new RoomError("O tempo para responder acabou.");
    }

    if (room.answers.has(participantId)) {
      throw new RoomError("Cada participante pode responder apenas uma vez por pergunta.");
    }

    if (!question.options.some((option) => option.id === optionId)) {
      throw new RoomError("Alternativa inválida.");
    }

    const answeredAt = Date.now();
    const responseMs = Math.max(0, answeredAt - room.questionStartedAt);
    const correct = optionId === question.correctOptionId;
    const points = correct ? this.calculatePoints(question.timeLimit, responseMs) : 0;

    room.answers.set(participantId, {
      participantId,
      optionId,
      answeredAt,
      responseMs,
      correct,
      points
    });

    participant.lastSeenAt = answeredAt;
    room.updatedAt = answeredAt;

    const activeParticipants = this.connectedParticipants(room);
    if (activeParticipants.length > 0 && activeParticipants.every(p => room.answers.has(p.id))) {
      this.revealQuestion(room.pin);
    } else {
      this.emitRoom(room);
    }

    return this.toSnapshot(room);
  }

  advanceQuestion(socket: Socket, pin: string): RoomSnapshot {
    const room = this.expectRoom(pin);
    this.assertHost(socket, room);

    if (room.status !== "reveal") {
      throw new RoomError("Aguarde o encerramento da pergunta antes de avançar.");
    }

    const nextIndex = room.questionIndex + 1;

    if (nextIndex >= room.questions.length) {
      this.finishRoom(room);
      return this.toSnapshot(room);
    }

    this.startQuestion(room, nextIndex);
    return this.toSnapshot(room);
  }

  restartRoom(socket: Socket, pin: string): RoomSnapshot {
    const room = this.expectRoom(pin);
    this.assertHost(socket, room);

    this.clearQuestionTimer(room);
    for (const participant of room.participants.values()) {
      participant.score = 0;
    }

    room.status = "lobby";
    room.questionIndex = 0;
    room.questionStartedAt = undefined;
    room.questionEndsAt = undefined;
    room.answers.clear();
    room.reveal = undefined;
    room.finishedAt = undefined;
    room.updatedAt = Date.now();

    this.emitRoom(room);
    return this.toSnapshot(room);
  }

  handleDisconnect(socket: Socket): void {
    const pin = socket.data.pin as string | undefined;
    const role = socket.data.role as string | undefined;

    if (!pin) {
      return;
    }

    const room = this.rooms.get(pin);
    if (!room) {
      return;
    }

    if (role === "host" && room.hostSocketId === socket.id) {
      room.hostSocketId = undefined;
    }

    if (role === "participant") {
      const participantId = socket.data.participantId as string | undefined;
      const participant = participantId ? room.participants.get(participantId) : undefined;

      if (participant && participant.socketId === socket.id) {
        participant.connected = false;
        participant.lastSeenAt = Date.now();
      }
    }

    room.updatedAt = Date.now();

    const activeParticipants = this.connectedParticipants(room);
    if (room.status === "question" && activeParticipants.length > 0 && activeParticipants.every(p => room.answers.has(p.id))) {
      this.revealQuestion(room.pin);
      return;
    }

    this.emitRoom(room);
  }

  private startQuestion(room: RoomState, questionIndex: number): void {
    this.clearQuestionTimer(room);

    const question = room.questions[questionIndex];
    const correctIndex = question.options.findIndex(o => o.id === question.correctOptionId);
    question.id = randomUUID();
    question.options = question.options.map(o => ({ ...o, id: randomUUID() }));
    question.correctOptionId = question.options[correctIndex].id;
    const now = Date.now();

    room.status = "question";
    room.questionIndex = questionIndex;
    room.questionStartedAt = now;
    room.questionEndsAt = now + question.timeLimit * 1000;
    room.answers.clear();
    room.reveal = undefined;
    room.updatedAt = now;

    room.timeout = setTimeout(() => this.revealQuestion(room.pin), question.timeLimit * 1000);
    room.timeout.unref?.();

    this.emitRoom(room);
  }

  private revealQuestion(pin: string): void {
    const room = this.rooms.get(pin);
    if (!room || room.status !== "question") {
      return;
    }

    const question = this.currentQuestion(room);
    if (!question) {
      return;
    }

    this.clearQuestionTimer(room);

    for (const answer of room.answers.values()) {
      const participant = room.participants.get(answer.participantId);
      if (participant) {
        participant.score += answer.points;
      }
    }

    room.status = "reveal";
    room.questionEndsAt = undefined;
    room.reveal = {
      questionId: question.id,
      correctOptionId: question.correctOptionId,
      explanation: question.explanation,
      ods: question.ods,
      answerStats: question.options.map<AnswerStat>((option) => ({
        optionId: option.id,
        label: option.label,
        count: [...room.answers.values()].filter((answer) => answer.optionId === option.id).length
      }))
    };
    room.updatedAt = Date.now();

    this.emitRoom(room);
  }

  private finishRoom(room: RoomState): void {
    this.clearQuestionTimer(room);
    room.status = "finished";
    room.questionStartedAt = undefined;
    room.questionEndsAt = undefined;
    room.answers.clear();
    room.reveal = undefined;
    room.finishedAt = Date.now();
    room.updatedAt = Date.now();
    this.emitRoom(room);
  }

  private calculatePoints(timeLimitSeconds: number, responseMs: number): number {
    const limitMs = timeLimitSeconds * 1000;
    const remainingRatio = Math.max(0, Math.min(1, (limitMs - responseMs) / limitMs));
    return Math.round(500 + remainingRatio * 500);
  }

  private currentQuestion(room: RoomState): Question | undefined {
    return room.questions[room.questionIndex];
  }

  private connectedParticipants(room: RoomState): ParticipantState[] {
    return [...room.participants.values()].filter((participant) => participant.connected);
  }

  private toSnapshot(room: RoomState): RoomSnapshot {
    const currentQuestion =
      room.status === "question" || room.status === "reveal" ? this.currentQuestion(room) : undefined;

    return {
      pin: room.pin,
      track: room.track,
      status: room.status,
      participants: [...room.participants.values()]
        .sort((a, b) => a.joinedAt - b.joinedAt)
        .map(({ id, nickname, score, connected }) => ({
          id,
          nickname,
          score,
          connected
        })),
      activeParticipantCount: this.connectedParticipants(room).length,
      questionIndex: room.status === "lobby" ? 0 : room.questionIndex,
      questionCount: room.questions.length,
      currentQuestion: currentQuestion ? redactQuestion(currentQuestion) : undefined,
      questionEndsAt: room.status === "question" ? room.questionEndsAt : undefined,
      serverNow: Date.now(),
      answeredCount: room.answers.size,
      reveal: room.reveal,
      leaderboard: room.status === "finished" ? this.leaderboard(room) : undefined
    };
  }

  private leaderboard(room: RoomState): LeaderboardEntry[] {
    return [...room.participants.values()]
      .sort((a, b) => b.score - a.score || a.joinedAt - b.joinedAt)
      .map((participant, index) => ({
        participantId: participant.id,
        nickname: participant.nickname,
        score: participant.score,
        position: index + 1
      }));
  }

  private assertHost(socket: Socket, room: RoomState): void {
    if (room.hostSocketId !== socket.id || socket.data.role !== "host") {
      throw new RoomError("Apenas o professor conectado pode controlar esta sala.", 403);
    }
  }

  private expectRoom(pin: string): RoomState {
    const room = this.rooms.get(pin);

    if (!room) {
      throw new RoomError("Sala não encontrada. Confira o PIN e tente novamente.", 404);
    }

    return room;
  }

  private generatePin(): string {
    for (let attempt = 0; attempt < 30; attempt += 1) {
      const pin = String(randomInt(100000, 1000000));
      if (!this.rooms.has(pin)) {
        return pin;
      }
    }

    throw new RoomError("Não foi possível gerar um PIN único agora.", 503);
  }

  private emitRoom(room: RoomState): void {
    this.io.to(this.channel(room.pin)).emit("room:update", this.toSnapshot(room));
  }

  private channel(pin: string): string {
    return `room:${pin}`;
  }

  private clearQuestionTimer(room: RoomState): void {
    if (room.timeout) {
      clearTimeout(room.timeout);
      room.timeout = undefined;
    }
  }

  private cleanupRooms(): void {
    const now = Date.now();

    for (const [pin, room] of this.rooms.entries()) {
      const finishedExpired = room.finishedAt && now - room.finishedAt > ROOM_FINISHED_TTL_MS;
      const inactiveExpired = now - room.updatedAt > ROOM_INACTIVE_TTL_MS;

      if (finishedExpired || inactiveExpired) {
        this.clearQuestionTimer(room);
        this.rooms.delete(pin);
      }
    }
  }
}
