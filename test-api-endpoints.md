# API Endpoint Testing Guide

Use this guide to test that both API endpoints are working correctly with their respective API keys.

## Test 1: Chatbot (Gemini API)

**Endpoint**: `/.netlify/functions/ai-rewrite`
**API Key**: `GEMINI_API_KEY`

### Test Request:
```bash
curl -X POST https://your-site.netlify.app/.netlify/functions/ai-rewrite \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "What is the difference between Sybase and Oracle?"
  }'
```

### Expected Response:
- Should return a helpful answer about Sybase vs Oracle
- Should NOT show the restricted chatbot message about only answering SQL/GitHub questions
- Should use Gemini's conversational style

## Test 2: AI Code Rewrite (OpenRouter Qwen 3)

**Endpoint**: `/.netlify/functions/ai-code-rewrite`
**API Key**: `OPENROUTER_API_KEY`

### Test Request:
```bash
curl -X POST https://your-site.netlify.app/.netlify/functions/ai-code-rewrite \
  -H "Content-Type: application/json" \
  -d '{
    "code": "CREATE TABLE employees (id INT, name VARCHAR(50))",
    "originalCode": "CREATE TABLE employees (id INT, name VARCHAR(50))",
    "prompt": "Convert this Sybase table to Oracle syntax"
  }'
```

### Expected Response:
- Should return Oracle-compatible SQL code
- Should focus on code conversion, not general conversation
- Should use Qwen 3's code analysis capabilities

## Environment Variables to Set in Netlify

1. **GEMINI_API_KEY** - For chatbot
2. **OPENROUTER_API_KEY** - For code rewrite

## Troubleshooting

### If both endpoints return the same response:
- Check that environment variables are set correctly
- Verify API keys are valid
- Check Netlify function logs for errors

### If endpoints return errors:
- Check API key quotas
- Verify API key permissions
- Check Netlify function deployment status 