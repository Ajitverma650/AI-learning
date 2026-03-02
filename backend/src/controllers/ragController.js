import { upsertDocument, searchSimilar } from '../models/vectorOperations.js';
import { chunkText } from '../utils/chunkText.js';
import { generateAnswer } from '../utils/openai.js';
import pdfParse from 'pdf-parse';

export const uploadDocument = async (req, res) => {
  try {
    console.log('Upload request received');
    
    // Check if file exists
    if (!req.file) {
      console.error('No file in request');
      return res.status(400).json({ error: "No file uploaded" });
    }

    console.log(`File received: ${req.file.originalname}, type: ${req.file.mimetype}, size: ${req.file.size} bytes`);

    let text = '';
    
    // Extract text based on file type
    if (req.file.mimetype === 'application/pdf') {
      console.log('Parsing PDF...');
      const pdfData = await pdfParse(req.file.buffer);
      text = pdfData.text;
      console.log(`Extracted ${text.length} characters from PDF`);
    } else {
      // For text files
      text = req.file.buffer.toString('utf-8');
      console.log(`Extracted ${text.length} characters from text file`);
    }

    // Validate text content
    if (!text || text.trim().length === 0) {
      console.error('File is empty');
      return res.status(400).json({ error: "File is empty or could not be read" });
    }

    console.log('Creating chunks...');
    const chunks = chunkText(text);
    
    if (!chunks || chunks.length === 0) {
      console.error('No chunks created');
      return res.status(400).json({ error: "Could not create text chunks" });
    }

    const documentId = `doc_${Date.now()}_${req.file.originalname}`;
    console.log(`Uploading ${chunks.length} chunks with ID: ${documentId}`);
    
    const result = await upsertDocument(documentId, chunks);
    console.log('Upload successful:', result);
    
    res.json({ 
      message: "Document uploaded successfully", 
      documentId,
      filename: req.file.originalname,
      chunks: chunks.length,
      vectorsUploaded: result.vectorCount
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const queryRAG = async (req, res) => {
  try {
    console.log('Query request received:', req.body);
    
    // Accept both 'query' and 'question' from frontend
    const query = req.body.query || req.body.question;
    
    // Validate query
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({ 
        error: "Query/question is required and must be a non-empty string" 
      });
    }
    
    console.log(`Searching for: "${query}"`);
    
    const relevantChunks = await searchSimilar(query, 5);
    console.log(`Found ${relevantChunks.length} relevant chunks`);
    
    if (relevantChunks.length === 0) {
      return res.json({ 
        answer: "I don't have any documents uploaded yet to answer your question.",
        sources: [] 
      });
    }
    
    const answer = await generateAnswer(query, relevantChunks);
    
    res.json({ answer, sources: relevantChunks });
  } catch (error) {
    console.error('Query error:', error);
    res.status(500).json({ error: error.message });
  }
};