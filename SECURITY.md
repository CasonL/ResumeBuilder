# Security Setup

## API Key Configuration

### 1. Create `.env.local` file

Copy `env.example` to `.env.local`:
```bash
cp env.example .env.local
```

### 2. Add your OpenAI API key

Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)

Edit `.env.local`:
```
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxx
```

### 3. Security guarantees

✅ `.env.local` is gitignored (never committed)  
✅ API keys only accessible server-side (Next.js API routes)  
✅ No API keys exposed to client/browser  
✅ Environment variables validated at runtime  

### Important: Never commit `.env.local`

The `.gitignore` file already excludes all `.env*` files from git.

### How it works

- **Server-only**: API routes run on the server (not in browser)
- **Environment vars**: Only accessible via `process.env` on server
- **Client isolation**: Frontend never sees the API key
- **Secure by default**: Next.js API routes are backend endpoints

## Usage

Once configured, the resume generator will:
1. Accept job description from user (frontend)
2. Send request to `/api/generate-resume` (server)
3. Server calls OpenAI with your API key (never exposed)
4. Returns generated resume data to frontend
