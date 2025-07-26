const fetch = require('node-fetch');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const SYSTEM_PROMPT =
  'You are Cosmo Agents, an expert assistant. Only answer questions about SQL, GitHub, Sybase, Oracle, or Supabase. If the question is not about these, politely say you can only answer questions related to SQL, GitHub, Sybase, Oracle, or Supabase. Keep your answers short, precise, and accurate.';

async function fetchWithRetry(body, maxRetries = 3) {
  let lastError = null;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      if (text && text.trim().length > 0) {
        return { success: true, text: text.trim() };
      }
      lastError = data.error?.message || 'AI did not return a result.';
    } catch (err) {
      lastError = err.message || 'AI rewrite failed';
    }
    // Wait 500ms before retrying
    await new Promise(res => setTimeout(res, 500));
  }
  return { success: false, error: lastError };
}

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }
  
  console.log('Chatbot function called');
  console.log('GEMINI_API_KEY present:', !!GEMINI_API_KEY);
  
  if (!GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY not found in environment variables');
    return { 
      statusCode: 200, 
      body: JSON.stringify({ 
        rewrittenCode: "Hi! I'm Cosmo Agents. I'm currently being configured. Please set up the GEMINI_API_KEY environment variable in your Netlify dashboard to enable AI chat functionality. You can get a free API key from https://makersuite.google.com/app/apikey",
        success: true 
      }) 
    };
  }
  
  const { code, prompt } = JSON.parse(event.body);
  if ((!code || code.trim() === '') && (!prompt || prompt.trim() === '')) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing code or prompt' }) };
  }
  
  const body = {
    contents: [{
      parts: [{
        text: `${SYSTEM_PROMPT}\n\nUser question: ${prompt || code}`
      }]
    }]
  };
  
  const result = await fetchWithRetry(body, 3);
  if (result.success) {
    return { statusCode: 200, body: JSON.stringify({ rewrittenCode: result.text }) };
  } else {
    return { statusCode: 500, body: JSON.stringify({ error: result.error || 'AI rewrite failed' }) };
  }
}; 