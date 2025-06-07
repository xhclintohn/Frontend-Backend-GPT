const express = require('express');
const axios = require('axios');
const multer = require('multer');
const FormData = require('form-data');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(multer().single('image'));
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== `Bearer ${process.env.INTERNAL_API_KEY}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

const isCodePrompt = (query) => {
  const codeKeywords = ['javascript', 'python', 'code', 'function', 'class', 'def', 'let', 'const', 'var'];
  return codeKeywords.some(keyword => query.toLowerCase().includes(keyword));
};

const isImageGenerationPrompt = (query) => {
  return query.toLowerCase().includes('generate image') || query.toLowerCase().includes('create image');
};

app.post('/api/chat', authMiddleware, async (req, res) => {
  const { query } = req.body;
  const image = req.file;

  if (!query && !image) {
    return res.status(400).json({ error: 'Query or image is required' });
  }

  try {
    if (image) {
      const form = new FormData();
      form.append('image', image.buffer, image.originalname);

      const response = await axios.post('https://api.imagga.com/v2/tags', form, {
        headers: {
          Authorization: `Basic ${Buffer.from(`${process.env.IMAGGA_API_KEY}:${process.env.IMAGGA_API_SECRET}`).toString('base64')}`,
          ...form.getHeaders()
        }
      });

      const tags = response.data.result.tags.map(tag => tag.tag.en).join(', ');
      res.json({ status: true, creator: 'GiftedTech', msg: `Image analyzed. Tags: ${tags}` });
    } else if (isImageGenerationPrompt(query)) {
      const response = await axios.get('https://api.giftedtech.web.id/api/ai/fluximg', {
        params: {
          apikey: process.env.FLUX_API_KEY,
          prompt: query.replace(/generate image|create image/gi, '').trim()
        }
      });
      res.json(response.data);
    } else if (isCodePrompt(query)) {
      const response = await axios.get('https://api.shizo.top/ai/gpt', {
        params: {
          apikey: process.env.SHIZO_API_KEY,
          query: `Provide a brief text description of the code and include the code in a separate section. Query: ${query}`
        }
      });
      res.json(response.data);
    } else {
      const response = await axios.get('https://api.shizo.top/ai/gpt', {
        params: {
          apikey: process.env.SHIZO_API_KEY,
          query
        }
      });
      res.json(response.data);
    }
  } catch (error) {
    console.error('API Error:', error.message);
    res.status(500).json({ error: 'Failed to process request' });
  }
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

module.exports = app;