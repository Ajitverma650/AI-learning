import { Pinecone } from '@pinecone-database/pinecone';

let pineconeInstance = null;
let indexInstance = null;

const connectVectorDB = async () => {
  try {
    pineconeInstance = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY
    });
    
    // Use PINECONE_INDEX_NAME or PINECONE_INDEX
    const indexName = process.env.PINECONE_INDEX_NAME || process.env.PINECONE_INDEX;
    
    if (!indexName) {
      throw new Error('PINECONE_INDEX_NAME or PINECONE_INDEX must be set in environment variables');
    }
    
    indexInstance = pineconeInstance.index(indexName);
    console.log(`Vector DB Connected - Index: ${indexName}`);
    return indexInstance;
  } catch (error) {
    console.error('Error connecting to Pinecone:', error);
    throw error;
  }
};

export const getPineconeIndex = async () => {
  if (!indexInstance) {
    await connectVectorDB();
  }
  return indexInstance;
};

export const pinecone = pineconeInstance;

export default connectVectorDB;