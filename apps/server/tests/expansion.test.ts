import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import { createServer } from "node:net";
import { randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { io, type Socket } from "socket.io-client";
import { bankQuestions, odsCategories } from "../src/data/odsContent.js";
import { questionSchema } from "../src/quizService.js";
import type { EditableQuestion, Quiz, QuizInput, RoomSnapshot } from "@ecoquiz/shared";

const serverDir = resolve(import.meta.dirname, "..");
const directory = mkdtempSync(join(tmpdir(), "ecoquiz-test-"));
const dbPath = join(directory, "test.db");
let server: ChildProcess; let base: string; let token: string; let otherToken: string; let mathQuiz: Quiz;
const sockets: Socket[] = []; let serverOutput = "";
const environment = { ...process.env, DATABASE_URL: `file:${dbPath.replaceAll("\\", "/")}` };
const run = (file: string, args: string[] = []) => {
  const result = spawnSync(process.execPath, [file, ...args], { cwd: serverDir, env: environment, encoding: "utf8" });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
};
const request = async (path: string, method = "GET", body?: unknown, credential?: string) => {
  const response = await fetch(`${base}${path}`, { method, headers: { "Content-Type": "application/json", ...(credential ? { Authorization: `Bearer ${credential}` } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
  return { status: response.status, data: await response.json() };
};
const connect = async () => {
  const socket = io(base, { transports: ["websocket"], reconnection: false }); sockets.push(socket);
  await new Promise<void>((ok, fail) => { socket.once("connect", ok); socket.once("connect_error", fail); }); return socket;
};
const emit = <T = RoomSnapshot>(socket: Socket, event: string, payload: unknown) => new Promise<{ ok: boolean; data: T; error?: string }>((ok, fail) => {
  socket.timeout(3000).emit(event, payload, (error: Error | null, reply: { ok: boolean; data: T; error?: string }) => error ? fail(error) : ok(reply));
});
const mathQuestion = (index: number): EditableQuestion => {
  const a = randomUUID(); const b = randomUUID();
  return { id: randomUUID(), prompt: `Quanto é ${index + 2} + 3?`, options: [{ id: a, label: "A", text: String(index + 5) }, { id: b, label: "B", text: String(index + 6) }], correctOptionId: a, explanation: "Somamos as duas parcelas.", difficulty: "easy", timeLimit: 10, origin: "custom" };
};
const input = (title: string, questions: EditableQuestion[]): QuizInput => ({ title, description: "Atividade de revisão", category: "Matemática", odsIds: [], defaultTimeLimit: 10, randomOrder: false, questions });
const startServer = async () => {
  const port = Number(new URL(base).port);
  server = spawn(process.execPath, ["node_modules/tsx/dist/cli.mjs", "src/index.ts"], { cwd: serverDir, env: { ...environment, PORT: String(port) }, stdio: ["ignore", "pipe", "pipe"] });
  server.stdout?.on("data", data => { serverOutput += data; }); server.stderr?.on("data", data => { serverOutput += data; });
  for (let i = 0; i < 100; i++) {
    if (server.exitCode !== null) throw new Error(serverOutput);
    try { if ((await fetch(`${base}/health`)).ok) return; } catch {}
    await new Promise(ok => setTimeout(ok, 100));
  }
  throw new Error(`Servidor não iniciou: ${serverOutput}`);
};
const stopServer = async () => { if (server && server.exitCode === null) { const stopped = new Promise(ok => server.once("exit", ok)); server.kill(); await stopped; } };

before(async () => {
  const db = new DatabaseSync(dbPath);
  db.exec(readFileSync(join(serverDir, "prisma/migrations/202610130001_baseline/migration.sql"), "utf8"));
  db.exec(`INSERT INTO Track VALUES ('preserved','preserved','Anterior','Descrição','recycle','[]','#fff',1);
    INSERT INTO Question (id,trackId,sortOrder,prompt,explanation,ods,timeLimit,correctOptionId) VALUES ('preserved-q','preserved',1,'Pergunta anterior','Explicação','',20,'preserved-a');
    INSERT INTO Option VALUES ('preserved-a','preserved-q','A','Sim');`);
  db.close();
  run("scripts/prepare-db.mjs", ["--migrate-only"]); run("node_modules/tsx/dist/cli.mjs", ["prisma/seed.ts"]);
  const listener = createServer(); await new Promise<void>(ok => listener.listen(0, "127.0.0.1", ok));
  const address = listener.address(); assert.ok(address && typeof address !== "string"); base = `http://127.0.0.1:${address.port}`;
  await new Promise<void>(ok => listener.close(() => ok())); await startServer();
  token = (await request("/api/creators", "POST")).data.token; otherToken = (await request("/api/creators", "POST")).data.token;
});
after(async () => { sockets.forEach(socket => socket.disconnect()); await stopServer(); rmSync(directory, { recursive: true, force: true }); });

test("conteúdo: 17 ODS, 85 questões distintas e níveis variados", () => {
  assert.equal(odsCategories.length, 17); assert.equal(bankQuestions.length, 85);
  assert.equal(new Set(bankQuestions.map(q => q.id)).size, 85); assert.equal(new Set(bankQuestions.map(q => q.prompt)).size, 85);
  assert.equal(new Set(bankQuestions.flatMap(q => q.options.map(o => o.id))).size, 340);
  for (const ods of odsCategories) {
    const questions = bankQuestions.filter(q => q.odsId === ods.id); assert.equal(questions.length, 5);
    assert.equal(new Set(questions.map(q => q.difficulty)).size, 3);
    questions.forEach(q => { assert.ok(questionSchema.safeParse({ ...q, origin: "ods" }).success); assert.ok(q.explanation.length > 30); assert.match(q.sourceUrl, /^https:\/\/sdgs\.un\.org\/goals\/goal\d+/); });
  }
});
test("banco: pesquisa, filtros, aleatoriedade sem repetição e quantidade insuficiente", async () => {
  const ods = await request("/api/ods"); assert.equal(ods.data.length, 17); assert.ok(ods.data.every((o: { questionCount: number }) => o.questionCount === 5));
  const filtered = await request("/api/questions?odsIds=ods-4,ods-6&difficulty=hard"); assert.equal(filtered.data.length, 2);
  const search = await request(`/api/questions?search=${encodeURIComponent("água")}`); assert.ok(search.data.length > 0 && search.data.length < 85);
  const random = await request("/api/questions/random", "POST", { odsIds: ["ods-4","ods-6","ods-12"], count: 15 });
  assert.equal(random.status, 200); assert.equal(new Set(random.data.map((q: EditableQuestion) => q.id)).size, 15);
  assert.equal(new Set(random.data.map((q: EditableQuestion) => q.odsId)).size, 3);
  const insufficient = await request("/api/questions/random", "POST", { odsIds: ["ods-4"], count: 6 }); assert.equal(insufficient.status, 400); assert.match(insufficient.data.message, /5/);
});
test("CRUD: cinco questões próprias, autorização, validações e controle de revisão", async () => {
  const created = await request("/api/quizzes", "POST", input("Teste de Matemática", Array.from({ length: 5 }, (_, i) => mathQuestion(i))), token);
  assert.equal(created.status, 201); mathQuiz = created.data; assert.equal(mathQuiz.questions.length, 5); assert.deepEqual(mathQuiz.odsIds, []);
  assert.equal((await request(`/api/quizzes/${mathQuiz.id}`)).status, 401);
  for (const method of ["GET","PUT","DELETE"]) assert.equal((await request(`/api/quizzes/${mathQuiz.id}`, method, method === "PUT" ? mathQuiz : undefined, otherToken)).status, 404);
  assert.equal((await request(`/api/quizzes/${mathQuiz.id}/duplicate`, "POST", undefined, otherToken)).status, 404);
  const invalid = { ...mathQuiz, questions: [{ ...mathQuiz.questions[0], options: [{ id: "a", label: "A", text: "" }] }] };
  assert.equal((await request(`/api/quizzes/${mathQuiz.id}`, "PUT", invalid, token)).status, 400);
  assert.equal((await request(`/api/quizzes/${mathQuiz.id}`, "PUT", { ...mathQuiz, questions: [{ ...mathQuiz.questions[0], timeLimit: 0 }] }, token)).status, 400);
  const edited = { ...mathQuiz, questions: mathQuiz.questions.map((q,i) => i === 0 ? { ...q, prompt: "Enunciado editado" } : q) };
  const update = await request(`/api/quizzes/${mathQuiz.id}`, "PUT", edited, token); assert.equal(update.status, 200);
  assert.equal(update.data.questions[0].id,mathQuiz.questions[0].id); assert.equal(update.data.questions[0].createdAt,mathQuiz.questions[0].createdAt);
  assert.equal((await request(`/api/quizzes/${mathQuiz.id}`, "PUT", edited, token)).status, 409);
  mathQuiz = (await request(`/api/quizzes/${mathQuiz.id}`, "GET", undefined, token)).data; assert.equal(mathQuiz.questions[0].prompt, "Enunciado editado");
  const duplicate = await request(`/api/quizzes/${mathQuiz.id}/duplicate`, "POST", undefined, token); assert.equal(duplicate.status, 201); assert.notEqual(duplicate.data.id, mathQuiz.id);
  assert.equal((await request(`/api/quizzes/${duplicate.data.id}`, "DELETE", undefined, token)).status, 200);
  const empty = await request("/api/quizzes", "POST", input("Rascunho", []), token); assert.equal(empty.status, 201);
  assert.equal((await request("/api/rooms", "POST", { quizId: empty.data.id }, token)).status, 400);
});
test("quiz misto: cópias editáveis, ordem, banco preservado e snapshots imutáveis", async () => {
  const bank = (await request("/api/questions?odsIds=ods-4,ods-6,ods-12")).data as EditableQuestion[];
  const chosen = [bank.find(q => q.odsId === "ods-4")!, bank.find(q => q.odsId === "ods-6")!, bank.find(q => q.odsId === "ods-12")!];
  const original = chosen[0].prompt;
  const mixed = (await request("/api/quizzes", "POST", input("Quiz misto", [...chosen,mathQuestion(0)]), token)).data as Quiz;
  const room = (await request("/api/rooms", "POST", { quizId: mixed.id }, token)).data;
  const changed = { ...mixed, questions: [...mixed.questions].reverse().map(q => ({ ...q, prompt: "Cópia alterada" })) };
  assert.equal((await request(`/api/quizzes/${mixed.id}`, "PUT", changed, token)).status, 200);
  assert.equal((await request("/api/questions?odsIds=ods-4")).data.find((q: EditableQuestion) => q.id === chosen[0].id).prompt, original);
  const host = await connect(); const student = await connect();
  assert.ok((await emit(host,"host:join",{ pin: room.pin, hostToken: room.hostToken })).ok);
  assert.ok((await emit(student,"participant:join",{ pin: room.pin, nickname: "Misto" })).ok);
  const opened = await emit(host,"host:start",{ pin: room.pin }); assert.equal(opened.data.currentQuestion?.prompt, original);
  assert.equal((await request(`/api/quizzes/${mixed.id}`, "DELETE", undefined, token)).status, 200);
  assert.equal((await request(`/api/rooms/${room.pin}`)).data.currentQuestion.prompt, original);
  let snapshot = opened.data;
  for (let i = 0; i < mixed.questions.length; i++) {
    assert.equal(snapshot.currentQuestion!.prompt, mixed.questions[i].prompt);
    const correctIndex = mixed.questions[i].options.findIndex(o => o.id === mixed.questions[i].correctOptionId);
    const answered = await emit(student,"participant:answer",{ pin: room.pin, questionId: snapshot.currentQuestion!.id, optionId: snapshot.currentQuestion!.options[correctIndex].id });
    assert.equal(answered.data.status,"reveal"); snapshot = (await emit(host,"host:next",{ pin: room.pin })).data;
  }
  assert.equal(snapshot.status,"finished");
  host.disconnect(); student.disconnect();
});
test("partida: PIN privado do host, gabarito oculto, duplicatas, pontuação, ranking e reutilização", async () => {
  const room = (await request("/api/rooms", "POST", { quizId: mathQuiz.id }, token)).data;
  assert.match(room.pin, /^\d{6}$/); assert.ok(!("hostToken" in (await request(`/api/rooms/${room.pin}`)).data));
  const host = await connect(); const s1 = await connect(); const s2 = await connect(); const intruder = await connect();
  intruder.emit("host:start", null, "invalid-ack");
  assert.equal((await emit(intruder,"host:join",{ pin: room.pin, hostToken: "0".repeat(64) })).ok, false);
  assert.equal((await emit(intruder,"host:start",{ pin: room.pin })).ok, false);
  await emit(host,"host:join",{ pin: room.pin, hostToken: room.hostToken });
  await emit(s1,"participant:join",{ pin: room.pin, nickname: "Ana" }); await emit(s2,"participant:join",{ pin: room.pin, nickname: "Beto" });
  let snapshot = (await emit(host,"host:start",{ pin: room.pin })).data;
  for (let i = 0; i < 5; i++) {
    const q = snapshot.currentQuestion!; assert.ok(!("correctOptionId" in q)); assert.ok(!("explanation" in q)); assert.ok(!snapshot.reveal);
    assert.ok(!mathQuiz.questions.some(original => original.id === q.id));
    assert.equal((await emit(s1,"participant:answer",{ pin: room.pin, questionId: randomUUID(), optionId: q.options[0].id })).ok, false);
    assert.equal((await emit(s1,"participant:answer",{ pin: room.pin, questionId: q.id, optionId: randomUUID() })).ok, false);
    const answer = { pin: room.pin, questionId: q.id, optionId: q.options[0].id };
    assert.ok((await emit(s1,"participant:answer",answer)).ok); assert.equal((await emit(s1,"participant:answer",answer)).ok, false);
    const result = await emit(s2,"participant:answer",{ ...answer, optionId: q.options[1].id }); assert.equal(result.data.status, "reveal"); assert.ok(result.data.reveal?.correctOptionId);
    snapshot = (await emit(host,"host:next",{ pin: room.pin })).data;
  }
  assert.equal(snapshot.status,"finished"); assert.equal(snapshot.leaderboard?.[0].nickname,"Ana");
  assert.ok(snapshot.leaderboard![0].score >= 4500 && snapshot.leaderboard![0].score <= 5000); assert.equal(snapshot.leaderboard![1].score,0);
  const restarted = (await emit(host,"host:restart",{ pin: room.pin })).data; assert.ok(restarted.participants.every(p => p.score === 0));
  const second = await request("/api/rooms", "POST", { quizId: mathQuiz.id }, token); assert.equal(second.status,201); assert.notEqual(second.data.pin,room.pin);
  assert.equal((await request(`/api/quizzes/${mathQuiz.id}`, "GET", undefined, token)).data.questions.length,5);
  [host,s1,s2,intruder].forEach(s => s.disconnect());
});
test("cronômetro: expiração no servidor rejeita respostas tardias", async () => {
  const quiz = (await request("/api/quizzes", "POST", input("Tempo", [mathQuestion(0)]), token)).data;
  const room = (await request("/api/rooms", "POST", { quizId: quiz.id }, token)).data;
  const host = await connect(); const student = await connect(); await emit(host,"host:join",{ pin: room.pin, hostToken: room.hostToken }); await emit(student,"participant:join",{ pin: room.pin, nickname: "Tempo" });
  const snapshot = (await emit(host,"host:start",{ pin: room.pin })).data;
  const revealed = await new Promise<RoomSnapshot>((ok,fail) => { const timeout = setTimeout(() => fail(new Error("Cronômetro não encerrou a pergunta")), 12000); student.on("room:update", state => { if (state.status === "reveal") { clearTimeout(timeout); ok(state); } }); });
  assert.equal(revealed.status,"reveal"); assert.equal(revealed.participants[0].score,0);
  assert.equal((await emit(student,"participant:answer",{ pin: room.pin, questionId: snapshot.currentQuestion!.id, optionId: snapshot.currentQuestion!.options[0].id })).ok,false);
  host.disconnect(); student.disconnect();
});
test("reconexão: credencial privada preserva participante e bloqueia uso de token inválido", async () => {
  const quiz = (await request("/api/quizzes", "POST", input("Reconexão", [mathQuestion(0)]), token)).data;
  const room = (await request("/api/rooms", "POST", { quizId: quiz.id }, token)).data;
  const host = await connect(); const first = await connect(); await emit(host,"host:join",{ pin: room.pin, hostToken: room.hostToken });
  const joined = await emit<RoomSnapshot & { participantToken: string; participantId: string }>(first,"participant:join",{ pin: room.pin, nickname: "Conectado" });
  const opened = (await emit(host,"host:start",{ pin: room.pin })).data; first.disconnect();
  const reconnected = await connect();
  assert.equal((await emit(reconnected,"participant:join",{ pin: room.pin, nickname: "Conectado", resumeToken: "f".repeat(64) })).ok,false);
  const resumed = await emit<RoomSnapshot & { participantToken: string; participantId: string }>(reconnected,"participant:join",{ pin: room.pin, nickname: "Conectado", resumeToken: joined.data.participantToken });
  assert.ok(resumed.ok); assert.equal(resumed.data.participantId,joined.data.participantId); assert.equal(resumed.data.participants.length,1);
  assert.ok(!JSON.stringify((await request(`/api/rooms/${room.pin}`)).data).includes(joined.data.participantToken));
  await emit(reconnected,"participant:answer",{ pin: room.pin, questionId: opened.currentQuestion!.id, optionId: opened.currentQuestion!.options[0].id });
  await emit(host,"host:next",{ pin: room.pin }); await emit(host,"host:restart",{ pin: room.pin });
  const next = (await emit(host,"host:start",{ pin: room.pin })).data;
  assert.notEqual(next.currentQuestion!.id,opened.currentQuestion!.id);
  assert.equal((await emit(reconnected,"participant:answer",{ pin: room.pin, questionId: opened.currentQuestion!.id, optionId: opened.currentQuestion!.options[0].id })).ok,false);
  host.disconnect(); reconnected.disconnect();
});
test("seed e migrations idempotentes preservam quizzes e questões anteriores", async () => {
  const countBefore = (await request("/api/quizzes", "GET", undefined, token)).data.length;
  run("scripts/prepare-db.mjs", ["--migrate-only"]); run("node_modules/tsx/dist/cli.mjs", ["prisma/seed.ts"]);
  assert.equal((await request("/api/questions")).data.length,85); assert.equal((await request("/api/ods")).data.length,17);
  assert.equal((await request("/api/quizzes", "GET", undefined, token)).data.length,countBefore);
  const db = new DatabaseSync(dbPath); assert.equal(db.prepare("SELECT prompt FROM Question WHERE id = 'preserved-q'").get()?.prompt,"Pergunta anterior"); assert.equal(db.prepare("PRAGMA foreign_key_check").all().length,0); db.close();
});
test("reinício do backend mantém biblioteca, credencial e perguntas salvas", async () => {
  await stopServer(); await startServer();
  const quiz = await request(`/api/quizzes/${mathQuiz.id}`, "GET", undefined, token); assert.equal(quiz.status,200); assert.equal(quiz.data.questions[0].prompt,"Enunciado editado");
  assert.equal((await request("/api/questions")).data.length,85);
});
