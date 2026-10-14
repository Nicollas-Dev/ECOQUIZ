export type TrackId = string;

export type Difficulty = "easy" | "medium" | "hard";
export type Ods = { id: string; number: number; name: string; description: string; color: string; icon: string; questionCount: number };
export type EditableQuestion = {
  id: string; prompt: string; options: QuizOption[]; correctOptionId: string;
  explanation: string; difficulty: Difficulty; timeLimit: number;
  origin: "ods" | "custom" | "legacy"; odsId?: string | null;
  sourceQuestionId?: string | null; sourceUrl?: string | null;
  createdAt?: string; updatedAt?: string;
};
export type QuizInput = {
  title: string; description: string; category: string; odsIds: string[];
  defaultTimeLimit: number; randomOrder: boolean; questions: EditableQuestion[];
};
export type Quiz = QuizInput & { id: string; createdAt: string; updatedAt: string; revision: number };
export type QuizSummary = Omit<Quiz, "questions"> & { questionCount: number };
export type CreatedRoom = RoomSnapshot & { hostToken: string };
export const QUIZ_LIMITS = { questions: 100, title: 120, prompt: 1000, option: 300, explanation: 2000, minTime: 10, maxTime: 120 } as const;

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
  trackId?: TrackId | null;
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
