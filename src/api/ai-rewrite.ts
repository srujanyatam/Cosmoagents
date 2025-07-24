// Simple API route for /api/ai-rewrite
import type { NextApiRequest, NextApiResponse } from 'next';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

async function callGeminiAI({ code, prompt, language }: { code: string; prompt: string; language: string }) {
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + GEMINI_API_KEY;

  const messages = [
    { role: 'user', parts: [{ text: `Rewrite this ${language} code:\n${code}\n\nInstruction: ${prompt}` }] }
  ];

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: messages }),
  });

  const data = await response.json();
  console.log('Gemini API response:', JSON.stringify(data, null, 2)); // <-- Add this for debugging

  if (!response.ok) {
    throw new Error(data.error?.message || 'Gemini API error');
  }

  // Try to extract both code and explanation
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
    || data.candidates?.[0]?.content?.text
    || data.candidates?.[0]?.content
    || '';

  return text;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const { code, prompt, language } = req.body;
  if (!code || !prompt) {
    res.status(400).json({ error: 'Missing code or prompt' });
    return;
  }
  try {
    const rewrittenCode = await callGeminiAI({ code, prompt, language });
    res.status(200).json({ rewrittenCode });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'AI rewrite failed' });
  }
} 