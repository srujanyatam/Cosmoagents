const fetch = require('node-fetch');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }
  const { code, prompt, language } = JSON.parse(event.body);
  if (!code || !prompt) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing code or prompt' }) };
  }
  try {
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
    console.log('Gemini API response:', JSON.stringify(data, null, 2));
    if (!response.ok) {
      return { statusCode: 500, body: JSON.stringify({ error: data.error?.message || 'Gemini API error' }) };
    }
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text
      || data.candidates?.[0]?.content?.text
      || data.candidates?.[0]?.content
      || '';
    return { statusCode: 200, body: JSON.stringify({ rewrittenCode: text }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message || 'AI rewrite failed' }) };
  }
}; 