# AI Functionality Setup Guide

This guide explains how to set up the AI functionality for both the chatbot and code rewrite features.

## Environment Variables Required

### For Netlify Deployment

You need to set the following environment variables in your Netlify dashboard:

1. **GEMINI_API_KEY** - For code conversion and AI rewrite functionality
   - Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
   - This is used for the AI code rewrite feature in the dev review page

2. **OPENROUTER_API_KEY** - For the chatbot functionality
   - Get your API key from [OpenRouter](https://openrouter.ai/keys)
   - This is used for the CosmoChatbot feature

### For Local Development

Create a `.env` file in your project root with:

```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
OPENROUTER_API_KEY=your_openrouter_api_key_here
```

## How It Works

### Chatbot (CosmoChatbot)
- Uses OpenRouter API with the `qwen/qwen3-coder:free` model
- Endpoint: `/.netlify/functions/ai-rewrite`
- Purpose: General questions about SQL, Sybase, Oracle, etc.

### AI Code Rewrite
- Uses Google Gemini API with the `gemini-2.5-pro` model
- Endpoint: `/.netlify/functions/ai-code-rewrite`
- Purpose: Code conversion and optimization in the dev review page

## Troubleshooting

### If AI Rewrite is not working:
1. Check that `GEMINI_API_KEY` is set in your Netlify environment variables
2. Verify the API key is valid and has sufficient quota
3. Check the browser console for any error messages

### If Chatbot is not working:
1. Check that `OPENROUTER_API_KEY` is set in your Netlify environment variables
2. Verify the API key is valid and has sufficient quota
3. Check the browser console for any error messages

### Both systems can work simultaneously:
- They use different API keys and endpoints
- No conflicts between the two systems
- Each serves a different purpose in the application 