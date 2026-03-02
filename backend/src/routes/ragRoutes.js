import express from "express";
import upload from "../middleware/upload.js";
import { uploadDocument, queryRAG } from "../controllers/ragController.js";

const router = express.Router();

router.post("/upload", upload.single("file"), uploadDocument);
router.post("/ask", queryRAG);

export default router;