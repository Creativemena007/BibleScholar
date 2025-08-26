const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
const bibleService = require('./services/bibleService');
const vectorService = require('./services/vectorService');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// OpenAI configuration
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Theology Q&A endpoint
app.post('/api/ask', async (req, res) => {
  try {
    const { question } = req.body;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a knowledgeable biblical scholar and theologian. You provide accurate, thoughtful responses about the Bible, theology, and Christian doctrine. Always:
          - Cite specific Bible verses when relevant
          - Provide historical and cultural context
          - Acknowledge different theological perspectives when appropriate
          - Be respectful of various denominational views
          - Focus on biblical truth and sound doctrine`
        },
        {
          role: "user",
          content: question
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    res.json({
      answer: completion.choices[0].message.content,
      usage: completion.usage
    });
  } catch (error) {
    console.error('OpenAI API error:', error);
    res.status(500).json({ error: 'Failed to get AI response' });
  }
});

// Bible verse endpoint
app.get('/api/verse/:reference', async (req, res) => {
  try {
    const { reference } = req.params;
    const verse = await bibleService.getVerse(reference);
    res.json(verse);
  } catch (error) {
    console.error('Bible API error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Semantic search endpoint
app.post('/api/search', async (req, res) => {
  try {
    const { query, limit = 10 } = req.body;
    
    if (!query || query.trim().length === 0) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const results = await vectorService.searchSimilar(query, limit);
    
    res.json({
      query,
      results,
      count: results.length
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Failed to search verses' });
  }
});

// Initialize embeddings endpoint (for setup)
app.post('/api/init-embeddings', async (req, res) => {
  try {
    console.log('Initializing vector embeddings...');
    
    // Get sample verses for embedding
    const sampleVerses = await bibleService.getSampleVerses(50);
    
    if (sampleVerses.length === 0) {
      return res.status(400).json({ error: 'No verses found to embed' });
    }

    // Store verses with embeddings
    const results = await vectorService.batchStoreVerses(sampleVerses);
    const successCount = results.filter(r => r.success).length;
    
    res.json({
      message: 'Embeddings initialized successfully',
      processed: results.length,
      successful: successCount,
      failed: results.length - successCount,
      totalStored: vectorService.getStoredCount()
    });
  } catch (error) {
    console.error('Initialization error:', error);
    res.status(500).json({ error: 'Failed to initialize embeddings' });
  }
});

// Get embeddings status
app.get('/api/embeddings-status', (req, res) => {
  res.json({
    stored: vectorService.getStoredCount(),
    ready: vectorService.getStoredCount() > 0
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'LogosAI backend is running' });
});

// Initialize services
async function initializeServices() {
  try {
    await vectorService.initialize();
    console.log('All services initialized successfully');
  } catch (error) {
    console.error('Failed to initialize services:', error);
  }
}

app.listen(port, async () => {
  console.log(`LogosAI backend running on port ${port}`);
  await initializeServices();
});