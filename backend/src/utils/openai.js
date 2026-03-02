import OpenAI from "openai";

let openaiInstance = null;

const getOpenAI = () => {
  if (!openaiInstance) {
    openaiInstance = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiInstance;
};

export const generateEmbedding = async (text) => {
  try {
    if (!text || typeof text !== 'string') {
      throw new Error('Invalid text input for embedding');
    }
    
    const openai = getOpenAI();
    
    console.log(`Calling OpenAI API for embedding, text length: ${text.length}`);
    
    // Use text-embedding-3-small with 1024 dimensions to match Pinecone index
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
      dimensions: 1024 // Match your Pinecone index dimension
    });
    
    const embedding = response.data[0].embedding;
    console.log(`Received embedding with dimension: ${embedding.length}`);
    
    return embedding;
  } catch (error) {
    console.error('Error generating embedding:', error.message);
    if (error.response) {
      console.error('OpenAI API error details:', error.response.data);
    }
    throw error;
  }
};

export const generateAnswer = async (query, relevantChunks) => {
  try {
    const openai = getOpenAI();
    
    if (!relevantChunks || relevantChunks.length === 0) {
      return "I don't have any documents to answer your question. Please upload a document first.";
    }
    
    const context = relevantChunks
      .map((chunk, idx) => `[Context ${idx + 1}]:\n${chunk.text}`)
      .join('\n\n---\n\n');
    
    const prompt = `You are an AI assistant helping users understand document content. Use the context provided below to answer the user's question accurately and comprehensively.

Context from the document:
${context}

User Question: ${query}

Instructions:
- Answer the question using information from the context above
- Be specific and cite relevant details from the context
- If multiple pieces of context are relevant, synthesize them into a coherent answer
- Only say you can't answer if the context is truly unrelated to the question
- Be conversational and helpful in your response

Answer:`;
    
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful AI assistant that answers questions based on document content. You should use the provided context to give accurate, detailed answers. Be confident in using the information provided."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });
    
    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error generating answer:', error);
    throw error;
  }
};

export default getOpenAI;