const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'LogosAI backend is running' });
});

app.listen(port, () => {
  console.log(`LogosAI backend running on port ${port}`);
});