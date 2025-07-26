const fetch = require('node-fetch');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

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
      lastError = err.message || 'AI code rewrite failed';
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
  
  console.log('AI Code Rewrite function called');
  
  if (!GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY not found in environment variables');
    return { 
      statusCode: 500, 
      body: JSON.stringify({ 
        error: 'AI service not configured properly',
        success: false 
      }) 
    };
  }
  
  const { code, prompt, originalCode, issue } = JSON.parse(event.body);
  
  if (!code || code.trim() === '') {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing code' }) };
  }

  // Build the prompt for code rewriting
  let systemPrompt = 'You are an expert SQL code converter specializing in Sybase to Oracle migrations. ';
  
  if (issue) {
    systemPrompt += `Fix the following issue: ${issue}. `;
  }
  
  if (prompt) {
    systemPrompt += `${prompt} `;
  }
  
  systemPrompt += 'Provide only the corrected Oracle PL/SQL code without explanations or markdown formatting.';

  const body = {
    contents: [{
      parts: [{
        text: `${systemPrompt}\n\nOriginal Sybase code:\n${originalCode || ''}\n\nCurrent Oracle code:\n${code}`
      }]
    }]
  };

  const result = await fetchWithRetry(body, 3);
  
  if (result.success) {
    return { 
      statusCode: 200, 
      body: JSON.stringify({ 
        rewrittenCode: result.text,
        success: true 
      }) 
    };
  } else {
    return { 
      statusCode: 500, 
      body: JSON.stringify({ 
        error: result.error || 'AI code rewrite failed',
        success: false 
      }) 
    };
  }
}; 