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
    const { code, language } = JSON.parse(event.body);
    if (!code) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing code' }),
      };
    }
    const prompt = `Explain what the following code does in plain English. Include the code in your explanation, but do not use markdown or code fences.\n\nCode:\n${code}`;
    async function callOpenRouter(prompt, model) {
      const apiRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      if (!apiRes.ok) throw new Error(`OpenRouter API error: ${apiRes.status}`);
      const data = await apiRes.json();
      return data.choices?.[0]?.message?.content || '';
    }
    let explanation = '';
    let error = null;
    try {
      explanation = await callOpenRouter(prompt, 'qwen/qwen3-coder:free');
      if (!explanation) {
        explanation = await callOpenRouter(prompt, 'qwen/qwen3-coder:free');
      }
    } catch (e) {
      error = e;
    }
    if (!explanation) {
      try {
        explanation = await callOpenRouter(prompt, 'gpt-3.5-turbo');
      } catch (e2) {
        error = e2;
      }
    }
    if (!explanation) {
      return {
        statusCode: 200,
        body: JSON.stringify({ explanation: 'AI service returned no explanation. Please try again later.' }),
      };
    }
    return {
      statusCode: 200,
      body: JSON.stringify({ explanation }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'AI explanation failed', details: err?.message || err }),
    };
  }
}; 