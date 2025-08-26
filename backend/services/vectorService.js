const OpenAI = require('openai');
const { Pinecone } = require('@pinecone-database/pinecone');

class VectorService {
  constructor() {
    this.openai = null;
    this.pinecone = null;
    this.indexName = 'bible-verses';
    this.index = null;
  }

  initializeOpenAI() {
    if (!this.openai && process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }
    return this.openai;
  }

  async initialize() {
    try {
      // For now, we'll store embeddings in memory
      // In production, you'd want to use Pinecone or another vector DB
      this.vectorStore = new Map();
      console.log('Vector service initialized (in-memory mode)');
    } catch (error) {
      console.error('Error initializing vector service:', error);
      throw error;
    }
  }

  async createEmbedding(text) {
    try {
      const openai = this.initializeOpenAI();
      if (!openai) {
        throw new Error('OpenAI API key not configured');
      }

      const response = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: text,
      });
      
      return response.data[0].embedding;
    } catch (error) {
      console.error('Error creating embedding:', error);
      throw error;
    }
  }

  async storeVerse(verseId, text, metadata) {
    try {
      const embedding = await this.createEmbedding(text);
      
      this.vectorStore.set(verseId, {
        id: verseId,
        text,
        embedding,
        metadata
      });
      
      return { success: true, id: verseId };
    } catch (error) {
      console.error('Error storing verse:', error);
      throw error;
    }
  }

  cosineSimilarity(vecA, vecB) {
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }

  async searchSimilar(query, limit = 10, threshold = 0.5) {
    try {
      const queryEmbedding = await this.createEmbedding(query);
      const results = [];

      for (const [id, verse] of this.vectorStore) {
        const similarity = this.cosineSimilarity(queryEmbedding, verse.embedding);
        
        if (similarity >= threshold) {
          results.push({
            ...verse,
            similarity
          });
        }
      }

      // Sort by similarity (highest first) and limit results
      return results
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);
    } catch (error) {
      console.error('Error searching vectors:', error);
      throw error;
    }
  }

  async batchStoreVerses(verses) {
    const results = [];
    
    for (const verse of verses) {
      try {
        const result = await this.storeVerse(
          verse.id || `${verse.book}_${verse.chapter}_${verse.verse}`,
          verse.text,
          {
            book: verse.book,
            chapter: verse.chapter,
            verse: verse.verse,
            reference: verse.reference
          }
        );
        results.push(result);
      } catch (error) {
        console.error(`Error storing verse ${verse.id}:`, error);
        results.push({ success: false, id: verse.id, error: error.message });
      }
    }
    
    return results;
  }

  getStoredCount() {
    return this.vectorStore.size;
  }
}

module.exports = new VectorService();