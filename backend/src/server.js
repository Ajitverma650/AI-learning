import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import express from "express";
import cors from "cors";
import connectVectorDB from "./config/db.js";
import ragRoutes from "./routes/ragRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, "..", ".env") });

await connectVectorDB();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/rag", ragRoutes);

app.listen(5000, () => {
  console.log("Server running on port 5000");
});