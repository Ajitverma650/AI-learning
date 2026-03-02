import { getPineconeIndex } from '../config/db.js';
import { generateEmbedding } from '../utils/openai.js';

export const upsertDocument = async (documentId, chunks) => {
  try {
    // Validate inputs
    if (!chunks || !Array.isArray(chunks) || chunks.length === 0) {
      throw new Error('Chunks array is empty or invalid');
    }

    console.log(`Processing ${chunks.length} chunks for document ${documentId}`);
    
    const index = await getPineconeIndex();
    
    const vectors = [];
    
    for (let idx = 0; idx < chunks.length; idx++) {
      const chunk = chunks[idx];
      const text = chunk.text || chunk;
      
      // Validate text content
      if (!text || typeof text !== 'string' || text.trim().length === 0) {
        console.warn(`Skipping empty chunk at index ${idx}`);
        continue;
      }
      
      console.log(`Generating embedding for chunk ${idx}, text length: ${text.length}`);
      
      try {
        const embedding = await generateEmbedding(text);
        
        if (!embedding || !Array.isArray(embedding) || embedding.length === 0) {
          console.error(`Invalid embedding for chunk ${idx}:`, embedding);
          continue;
        }
        
        console.log(`Generated embedding for chunk ${idx}, dimension: ${embedding.length}`);
        
        vectors.push({
          id: `${documentId}_chunk_${idx}`,
          values: embedding,
          metadata: {
            documentId,
            text: text.substring(0, 40000), // Pinecone metadata limit
            chunkIndex: idx,
            timestamp: new Date().toISOString()
          }
        });
      } catch (embeddingError) {
        console.error(`Error generating embedding for chunk ${idx}:`, embeddingError.message);
        continue;
      }
    }
    
    if (vectors.length === 0) {
      throw new Error('No valid vectors to upsert - all embeddings failed');
    }
    
    console.log(`Upserting ${vectors.length} vectors to Pinecone`);
    console.log('First vector structure:', {
      id: vectors[0].id,
      valuesLength: vectors[0].values.length,
      metadataKeys: Object.keys(vectors[0].metadata)
    });
    
    // Pinecone SDK v3 expects just the array of vectors directly
    const result = await index.upsert(vectors);
    console.log('Upsert successful:', result);
    
    return { success: true, vectorCount: vectors.length };
  } catch (error) {
    console.error('Error upserting document:', error);
    throw error;
  }
};

export const searchSimilar = async (query, topK = 5) => {
  try {
    const index = await getPineconeIndex();
    const queryEmbedding = await generateEmbedding(query);
    
    // Pinecone v3 API - pass query config directly
    const results = await index.query({
      vector: queryEmbedding,
      topK,
      includeMetadata: true
    });
    
    if (!results.matches || results.matches.length === 0) {
      return [];
    }
    
    return results.matches.map(match => ({
      text: match.metadata?.text || '',
      score: match.score,
      documentId: match.metadata?.documentId
    }));
  } catch (error) {
    console.error('Error searching similar:', error);
    throw error;
  }
};

export const deleteDocument = async (documentId) => {
  try {
    const index = await getPineconeIndex();
    
    // Pinecone v3: Use deleteMany with filter
    await index.delete1({
      filter: { 
        documentId: { '$eq': documentId } 
      },
      deleteAll: false
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting document:', error);
    throw error;
  }
};
