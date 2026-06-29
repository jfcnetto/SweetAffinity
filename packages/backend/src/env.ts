import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// tenta backend/.env primeiro
dotenv.config({
  path: path.resolve(__dirname, "../.env"),
});

// fallback raiz
dotenv.config({
  path: path.resolve(__dirname, "../../.env"),
});