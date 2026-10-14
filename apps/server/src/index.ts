import { createServer } from "node:http";
import cors from "cors";
import express from "express";
import { Server } from "socket.io";
import { z } from "zod";
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
  trackId: z.string().min(1)
});

const pinSchema = z.string().regex(/^\d{6}$/);

const sendError = (response: express.Response, error: unknown) => {
  if (error instanceof RoomError) {
    response.status(error.status).json({ message: error.message });
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
app.use(express.json());

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
    response.status(400).json({ message: "Selecione uma trilha válida." });
    return;
  }

  try {
    const room = await roomManager.createRoom(parsed.data.trackId);
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
  try {
    reply?.({ ok: true, data: action() });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível concluir a ação.";
    reply?.({ ok: false, error: message });
  }
};

io.on("connection", (socket) => {
  socket.on("host:join", (payload: { pin: string }, reply?: SocketAck) => {
    socketReply(reply, () => roomManager.attachHost(socket, payload.pin));
  });

  socket.on("participant:join", (payload: { pin: string; nickname: string }, reply?: SocketAck) => {
    socketReply(reply, () => roomManager.joinParticipant(socket, payload.pin, payload.nickname));
  });

  socket.on("host:start", (payload: { pin: string }, reply?: SocketAck) => {
    socketReply(reply, () => roomManager.startGame(socket, payload.pin));
  });

  socket.on("host:next", (payload: { pin: string }, reply?: SocketAck) => {
    socketReply(reply, () => roomManager.advanceQuestion(socket, payload.pin));
  });

  socket.on("host:restart", (payload: { pin: string }, reply?: SocketAck) => {
    socketReply(reply, () => roomManager.restartRoom(socket, payload.pin));
  });

  socket.on("participant:answer", (payload: { pin: string; optionId: string }, reply?: SocketAck) => {
    socketReply(reply, () => roomManager.submitAnswer(socket, payload.pin, payload.optionId));
  });

  socket.on("disconnect", () => {
    roomManager.handleDisconnect(socket);
  });
});

httpServer.listen(env.port, () => {
  console.log(`ECOQUIZ server running on http://localhost:${env.port}`);
});
