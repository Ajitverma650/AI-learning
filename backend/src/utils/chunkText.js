export const chunkText = (text, chunkSize = 1000, overlap = 200) => {
  // Validate input
  if (!text || typeof text !== 'string') {
    console.error('Invalid text input to chunkText:', typeof text);
    return [];
  }

  const cleanText = text.trim();
  
  if (cleanText.length === 0) {
    console.warn('Empty text provided to chunkText');
    return [];
  }

  const chunks = [];
  let startIndex = 0;

  while (startIndex < cleanText.length) {
    const endIndex = Math.min(startIndex + chunkSize, cleanText.length);
    const chunk = cleanText.substring(startIndex, endIndex).trim();
    
    // Only add non-empty chunks
    if (chunk.length > 0) {
      chunks.push({
        text: chunk,
        startIndex,
        endIndex
      });
    }
    
    startIndex += chunkSize - overlap;
  }

  console.log(`Created ${chunks.length} chunks from ${cleanText.length} characters`);
  return chunks;
};

export default chunkText;