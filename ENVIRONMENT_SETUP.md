# Environment Variables Setup Guide

## Quick Setup for Netlify

### Step 1: Get Your API Keys

1. **Gemini API Key** (for Chatbot):
   - Go to: https://makersuite.google.com/app/apikey
   - Click "Create API Key"
   - Copy the key (starts with `AIzaSyC...`)

2. **OpenRouter API Key** (for AI Code Rewrite):
   - Go to: https://openrouter.ai/keys
   - Click "Create Key"
   - Copy the key

### Step 2: Set Environment Variables in Netlify

1. Go to your Netlify dashboard
2. Select your site
3. Go to **Site settings** → **Environment variables**
4. Add these variables:

| Key | Value | Description |
|-----|-------|-------------|
| `GEMINI_API_KEY` | `AIzaSyC...` | For chatbot functionality |
| `OPENROUTER_API_KEY` | `sk-or-v1-...` | For AI code rewrite |

### Step 3: Deploy

1. Commit and push your changes
2. Netlify will automatically deploy
3. The functions will now work with proper API keys

## Testing

After deployment, test both endpoints:

### Chatbot Test
- Open your site
- Click the chatbot icon
- Ask: "What is the difference between Sybase and Oracle?"
- Should get a helpful response

### AI Code Rewrite Test
- Go to dev review page
- Try the AI rewrite functionality
- Should work with code conversion

## Troubleshooting

### If you see "service not configured properly":
- Check that environment variables are set in Netlify
- Verify API keys are valid
- Check Netlify function logs

### If API calls fail:
- Check API key quotas
- Verify API key permissions
- Check Netlify function deployment status 