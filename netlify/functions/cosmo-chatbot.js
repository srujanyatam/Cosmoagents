const fetch = require('node-fetch');

const CHATBOT_GEMINI_API_KEY = process.env.CHATBOT_GEMINI_API_KEY;

async function fetchWithRetry(body, maxRetries = 3) {
  let lastError = null;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${CHATBOT_GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        throw new Error('Invalid response from API');
      }
      
      const text = data.candidates[0].content.parts[0].text;
      if (text && text.trim().length > 0) {
        return { success: true, text };
      }
      lastError = 'AI did not return a result.';
    } catch (err) {
      lastError = err.message || 'AI chatbot failed';
    }
    // Wait 500ms before retrying
    await new Promise(res => setTimeout(res, 500));
  }
  return { success: false, error: lastError };
}

exports.handler = async function(event, context) {
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return { 
      statusCode: 405, 
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Method not allowed' }) 
    };
  }

  try {
    const { message, conversationHistory = [] } = JSON.parse(event.body);
    
    if (!message) {
      return { 
        statusCode: 400, 
        headers: {
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'Missing message' }) 
      };
    }

    if (!CHATBOT_GEMINI_API_KEY) {
      return { 
        statusCode: 500, 
        headers: {
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'CHATBOT_GEMINI_API_KEY not configured' }) 
      };
    }

    // Create conversation context from previous messages
    const conversationContext = conversationHistory
      .slice(-5) // Keep last 5 messages for context
      .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n');

    // Prepare the prompt
    const prompt = `You are Cosmo AI Assistant, an expert in database migration, SQL, Oracle, Sybase, and technical development.

${conversationContext ? `Previous conversation:\n${conversationContext}\n\n` : ''}User: ${message}

Please provide a helpful, accurate, and concise response. Focus on:
- Database migration (Oracle, Sybase, SQL)
- Code conversion and optimization
- Technical best practices
- Clear explanations with examples when helpful

Assistant:`;

    const body = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      }
    };

    const result = await fetchWithRetry(body, 3);
    
    if (result.success) {
      return { 
        statusCode: 200, 
        headers: {
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ 
          response: result.text,
          success: true 
        }) 
      };
    } else {
      return { 
        statusCode: 500, 
        headers: {
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ 
          error: result.error || 'AI chatbot failed',
          success: false 
        }) 
      };
    }
  } catch (error) {
    return { 
      statusCode: 500, 
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        error: error.message || 'Internal server error',
        success: false 
      }) 
    };
  }
}; 