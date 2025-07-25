import type { ViteDevServer } from 'vite';
import type { IncomingMessage, ServerResponse } from 'http';

const OPENROUTER_API_KEY = process.env.VITE_OPENROUTER_API_KEY;
if (!OPENROUTER_API_KEY) throw new Error('Missing VITE_OPENROUTER_API_KEY in environment');

export async function aiExplainHandler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  let body = '';
  req.on('data', chunk => {
    body += chunk;
  });
  req.on('end', async () => {
    try {
      const { code, language } = JSON.parse(body);
      if (!code) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Missing code' }));
        return;
      }
      const prompt = `Explain what the following code does in plain English. Include the code in your explanation, but do not use markdown or code fences.\n\nCode:\n${code}`;
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
              content: prompt,
            },
          ],
        }),
      });
      if (!apiRes.ok) {
        throw new Error('OpenRouter API error');
      }
      const data = await apiRes.json();
      const explanation = data.choices?.[0]?.message?.content || '';
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ explanation }));
    } catch (err) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'AI explanation failed' }));
    }
  });
}

export function aiExplainApiPlugin() {
  return {
    name: 'vite-plugin-ai-explain-api',
    configureServer(server: ViteDevServer) {
      server.middlewares.use('/api/ai-explain', (req, res, next) => {
        if (req.method === 'POST') {
          aiExplainHandler(req, res);
        } else {
          next();
        }
      });
    },
  };
} 