// Simple API route for /api/ai-rewrite
import type { NextApiRequest, NextApiResponse } from 'next';

const fetch = require('node-fetch');

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const { code, prompt } = req.body;
  if (!code || !prompt) {
    res.status(400).json({ error: 'Missing code or prompt' });
    return;
  }
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'qwen/qwen3-coder:free',
        messages: [
          { role: 'system', content: 'You are a helpful AI assistant for code rewriting and explanation.' },
          { role: 'user', content: `${prompt}\n\n${code}` }
        ]
      })
    });
    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';
    res.status(200).json({ rewrittenCode: text });
  } catch (err) {
    res.status(500).json({ error: err.message || 'AI rewrite failed' });
  }
} 