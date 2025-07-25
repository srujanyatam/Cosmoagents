const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }
  const OPENROUTER_API_KEY = process.env.VITE_OPENROUTER_API_KEY;
  if (!OPENROUTER_API_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Missing VITE_OPENROUTER_API_KEY in environment' }),
    };
  }
  try {
    const { code, prompt, language } = JSON.parse(event.body);
    if (!code || !prompt) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing code or prompt' }),
      };
    }
    const apiRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'qwen/qwen3-coder:free',
        messages: [
          {
            role: 'user',
            content: `Rewrite this ${language || 'code'}:\n${code}\n\nInstruction: ${prompt}`,
          },
        ],
      }),
    });
    if (!apiRes.ok) {
      throw new Error('OpenRouter API error');
    }
    const data = await apiRes.json();
    const rewrittenCode = data.choices?.[0]?.message?.content || '';
    return {
      statusCode: 200,
      body: JSON.stringify({ rewrittenCode }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'AI rewrite failed' }),
    };
  }
}; 