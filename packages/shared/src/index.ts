export type TrackId = "residuos" | "energia-limpa" | "consumo-consciente" | "agua";

export type Track = {
  id: TrackId;
  slug: string;
  name: string;
  description: string;
  icon: "recycle" | "zap" | "shopping-bag" | "droplets";
  ods: string[];
  accent: string;
  questionCount?: number;
};

export type QuizOption = {
  id: string;
  label: "A" | "B" | "C" | "D";
  text: string;
};

export type Question = {
  id: string;
  trackId: TrackId;
  prompt: string;
  options: QuizOption[];
  correctOptionId: string;
  explanation: string;
  ods: string;
  timeLimit: number;
};

export type PublicQuestion = Omit<Question, "correctOptionId" | "explanation">;

export type RoomStatus = "lobby" | "question" | "reveal" | "finished";

export type Participant = {
  id: string;
  nickname: string;
  score: number;
  connected: boolean;
};

export type AnswerStat = {
  optionId: string;
  label: QuizOption["label"];
  count: number;
};

export type QuestionReveal = {
  questionId: string;
  correctOptionId: string;
  explanation: string;
  ods: string;
  answerStats: AnswerStat[];
};

export type LeaderboardEntry = {
  participantId: string;
  nickname: string;
  score: number;
  position: number;
};

export type RoomSnapshot = {
  pin: string;
  track: Track;
  status: RoomStatus;
  participants: Participant[];
  activeParticipantCount: number;
  questionIndex: number;
  questionCount: number;
  currentQuestion?: PublicQuestion;
  questionEndsAt?: number;
  serverNow: number;
  answeredCount: number;
  reveal?: QuestionReveal;
  leaderboard?: LeaderboardEntry[];
};

export type ApiError = {
  message: string;
};
