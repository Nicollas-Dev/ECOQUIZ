import dotenv from "dotenv";

dotenv.config();

process.env.DATABASE_URL ??= "file:./dev.db";

export const env = {
  port: Number(process.env.PORT ?? 3333),
  clientOrigins: (process.env.CLIENT_ORIGIN ?? "http://localhost:5173,http://127.0.0.1:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
};
