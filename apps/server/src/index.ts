import { createServer } from "node:http";
import cors from "cors";
import express from "express";
import { Server } from "socket.io";
import { z } from "zod";
import { ApiError, authorizeCreator, createCreator, createQuiz, deleteQuiz, getQuiz, listBank, listOds, listQuizzes, quizSchema, randomBank, updateQuiz } from "./quizService.js";
import { env } from "./env.js";
import { getTracks } from "./repositories.js";
import { RoomError, RoomManager } from "./roomManager.js";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: env.clientOrigins,
    methods: ["GET", "POST"]
  }
});

const roomManager = new RoomManager(io);

const createRoomSchema = z.object({
  trackId: z.string().min(1).max(150).optional(), quizId: z.string().uuid().optional()
}).refine(value => Boolean(value.trackId) !== Boolean(value.quizId));

const pinSchema = z.string().regex(/^\d{6}$/);

const sendError = (response: express.Response, error: unknown) => {
  if (error instanceof RoomError || error instanceof ApiError) {
    response.status(error.status).json({ message: error.message });
    return;
  }
  if (error instanceof z.ZodError) {
    response.status(400).json({ message: "Revise os campos indicados.", issues: error.issues });
    return;
  }

  console.error(error);
  response.status(500).json({ message: "Erro interno do servidor." });
};

app.use(
  cors({
    origin: env.clientOrigins
  })
);
app.use(express.json({ limit: "1mb" }));
app.disable("x-powered-by");
app.use((_req, res, next) => { res.setHeader("Cache-Control", "no-store"); next(); });

const route = (action: (request: express.Request, response: express.Response) => Promise<unknown>) =>
  (request: express.Request, response: express.Response) => { void action(request, response).catch(error => sendError(response, error)); };
const filterSchema = z.object({ odsIds: z.array(z.string().regex(/^ods-([1-9]|1[0-7])$/)).max(17).default([]), search: z.string().max(200).optional(), difficulty: z.enum(["easy", "medium", "hard"]).optional() });
app.post("/api/creators", route(async (_req, res) => { res.status(201).json(await createCreator()); }));
app.get("/api/ods", route(async (_req, res) => { res.json(await listOds()); }));
app.get("/api/questions", route(async (req, res) => {
  const filters = filterSchema.parse({ odsIds: typeof req.query.odsIds === "string" ? req.query.odsIds.split(",").filter(Boolean) : [], search: req.query.search, difficulty: req.query.difficulty });
  res.json(await listBank(filters));
}));
app.post("/api/questions/random", route(async (req, res) => {
  const input = filterSchema.extend({ count: z.number().int().min(1).max(100) }).parse(req.body);
  res.json(await randomBank(input.odsIds, input.count, input.difficulty));
}));
app.get("/api/quizzes", route(async (req, res) => { res.json(await listQuizzes(await authorizeCreator(req.headers.authorization))); }));
app.post("/api/quizzes", route(async (req, res) => { res.status(201).json(await createQuiz(await authorizeCreator(req.headers.authorization), quizSchema.parse(req.body))); }));
app.get("/api/quizzes/:id", route(async (req, res) => { res.json(await getQuiz(await authorizeCreator(req.headers.authorization), String(req.params.id))); }));
app.put("/api/quizzes/:id", route(async (req, res) => {
  const creatorId = await authorizeCreator(req.headers.authorization);
  await getQuiz(creatorId, String(req.params.id));
  const input = quizSchema.safeExtend({ revision: z.number().int().min(1) }).parse(req.body);
  res.json(await updateQuiz(creatorId, String(req.params.id), input, input.revision));
}));
app.delete("/api/quizzes/:id", route(async (req, res) => { await deleteQuiz(await authorizeCreator(req.headers.authorization), String(req.params.id)); res.json({ ok: true }); }));
app.post("/api/quizzes/:id/duplicate", route(async (req, res) => {
  const creatorId = await authorizeCreator(req.headers.authorization);
  const quiz = await getQuiz(creatorId, String(req.params.id));
  res.status(201).json(await createQuiz(creatorId, { ...quiz, title: `${quiz.title.slice(0, 110)} (cópia)` }));
}));

app.get("/health", (_request, response) => {
  response.json({ ok: true, service: "ecoquiz-server" });
});

app.get("/api/tracks", async (_request, response) => {
  try {
    response.json(await getTracks());
  } catch (error) {
    sendError(response, error);
  }
});

app.post("/api/rooms", async (request, response) => {
  const parsed = createRoomSchema.safeParse(request.body);

  if (!parsed.success) {
    response.status(400).json({ message: "Selecione um quiz ou uma trilha válida." });
    return;
  }

  try {
    const creatorId = parsed.data.quizId ? await authorizeCreator(request.headers.authorization) : undefined;
    const room = await roomManager.createRoom(parsed.data.trackId, parsed.data.quizId, creatorId);
    response.status(201).json(room);
  } catch (error) {
    sendError(response, error);
  }
});

app.get("/api/rooms/:pin", (request, response) => {
  const parsed = pinSchema.safeParse(request.params.pin);

  if (!parsed.success) {
    response.status(400).json({ message: "O PIN deve conter seis dígitos." });
    return;
  }

  try {
    response.json(roomManager.getRoomSnapshot(parsed.data));
  } catch (error) {
    sendError(response, error);
  }
});

type SocketAck<T = unknown> = (payload: { ok: true; data: T } | { ok: false; error: string }) => void;

const socketReply = <T>(reply: SocketAck<T> | undefined, action: () => T) => {
  const acknowledge = typeof reply === "function" ? reply : undefined;
  try {
    const data = action();
    acknowledge?.({ ok: true, data });
  } catch (error) {
    const message = error instanceof z.ZodError ? "Dados inválidos para esta ação." : error instanceof Error ? error.message : "Não foi possível concluir a ação.";
    acknowledge?.({ ok: false, error: message });
  }
};

io.on("connection", (socket) => {
  socket.on("host:join", (payload: unknown, reply?: SocketAck) => {
    socketReply(reply, () => { const input = z.object({ pin: pinSchema, hostToken: z.string().length(64) }).parse(payload); return roomManager.attachHost(socket, input.pin, input.hostToken); });
  });

  socket.on("participant:join", (payload: unknown, reply?: SocketAck) => {
    socketReply(reply, () => { const input = z.object({ pin: pinSchema, nickname: z.string().min(2).max(20), resumeToken: z.string().regex(/^[a-f0-9]{64}$/).optional() }).parse(payload); return roomManager.joinParticipant(socket, input.pin, input.nickname, input.resumeToken); });
  });

  socket.on("host:start", (payload: { pin: string }, reply?: SocketAck) => {
    socketReply(reply, () => roomManager.startGame(socket, z.object({ pin: pinSchema }).parse(payload).pin));
  });

  socket.on("host:next", (payload: { pin: string }, reply?: SocketAck) => {
    socketReply(reply, () => roomManager.advanceQuestion(socket, z.object({ pin: pinSchema }).parse(payload).pin));
  });

  socket.on("host:restart", (payload: { pin: string }, reply?: SocketAck) => {
    socketReply(reply, () => roomManager.restartRoom(socket, z.object({ pin: pinSchema }).parse(payload).pin));
  });

  socket.on("participant:answer", (payload: unknown, reply?: SocketAck) => {
    socketReply(reply, () => { const input = z.object({ pin: pinSchema, optionId: z.string().uuid(), questionId: z.string().uuid() }).parse(payload); return roomManager.submitAnswer(socket, input.pin, input.optionId, input.questionId); });
  });

  socket.on("disconnect", () => {
    roomManager.handleDisconnect(socket);
  });
});

httpServer.listen(env.port, () => {
  console.log(`ECOQUIZ server running on http://localhost:${env.port}`);
});
