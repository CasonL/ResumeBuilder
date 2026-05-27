# Multi-Tenant Resume Builder - Setup Guide

This guide will help you set up the multi-tenant version of the Resume Builder with Supabase authentication, encrypted profile storage, and a credits system.

## Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier works)
- OpenAI API key

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Fill in:
   - **Name**: Resume Builder (or your preferred name)
   - **Database Password**: Generate a strong password (save this!)
   - **Region**: Choose closest to your users
4. Click "Create new project" and wait for setup to complete (~2 minutes)

## Step 2: Run Database Schema

1. In your Supabase project, go to the **SQL Editor** (left sidebar)
2. Click "New query"
3. Copy the entire contents of `supabase/schema.sql` from this project
4. Paste it into the SQL editor
5. Click "Run" to execute the schema
6. You should see "Success. No rows returned" - this is correct!

This creates:
- `users` table (with credits and admin flag)
- `profiles` table (encrypted master data)
- `resumes` table (encrypted resume data)
- `credit_transactions` table (transaction history)
- Row-level security policies
- Auto-signup trigger (gives 3 free credits)

## Step 3: Get Supabase Credentials

1. In your Supabase project, go to **Settings** > **API**
2. Copy these values:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **anon public** key (under "Project API keys")

## Step 4: Configure Environment Variables

1. In the `web` folder, create a file named `.env.local`
2. Add the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# Encryption Key (generate a random 32+ character string)
ENCRYPTION_KEY=your_random_encryption_key_here_make_it_long_and_secure

# OpenAI API Key
OPENAI_API_KEY=your_openai_api_key_here
```

**Important**: 
- Replace all placeholder values with your actual credentials
- For `ENCRYPTION_KEY`, generate a strong random string (32+ characters)
- Never commit `.env.local` to git (it's already in `.gitignore`)

### Generating a Secure Encryption Key

You can generate a secure encryption key using:

**Node.js:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Online:** Use a password generator to create a 64-character random string

## Step 5: Install Dependencies

```bash
cd web
npm install
```

## Step 6: Start Development Server

```bash
npm run dev
```

The app should now be running at `http://localhost:3000`

## Step 7: Create Your Admin Account

1. Go to `http://localhost:3000/signup`
2. Create an account with your email
3. Go to your Supabase project > **Table Editor** > **users**
4. Find your user record and set `is_admin` to `true`
5. Refresh the app - you now have unlimited credits!

## Features Overview

### Authentication
- Email/password signup and login via Supabase Auth
- Secure session management with HTTP-only cookies
- Protected routes via middleware

### Credits System
- New users get 3 free credits on signup
- Resume generation costs 1 credit
- Admins have unlimited credits (bypass credit checks)
- Credit transactions are logged for audit trail

### Data Encryption
- All profile data is encrypted at rest using AES encryption
- Resume data is also encrypted
- Encryption key is stored in environment variables (never in database)

### Admin Privileges
- Set `is_admin = true` in the `users` table
- Admins can generate unlimited resumes without using credits
- Future: Admin panel for managing users and granting credits

## Database Tables

### `users`
- Extends Supabase auth.users
- Stores credits balance and admin flag
- Auto-created on signup (trigger)

### `profiles`
- One per user
- Stores encrypted master profile data (experiences, skills, etc.)
- Encrypted with AES using ENCRYPTION_KEY

### `resumes`
- Multiple per user
- Stores encrypted resume data
- Links to job description and preferences

### `credit_transactions`
- Audit log of all credit changes
- Tracks purchases, usage, refunds, admin grants

## Row-Level Security (RLS)

All tables have RLS enabled:
- Users can only access their own data
- Admins don't get special database access (handled in application layer)
- Prevents data leaks even if API is compromised

## Next Steps

### Add Payment Integration
To allow users to purchase credits, integrate a payment provider:
- Stripe (recommended)
- PayPal
- Paddle

### Email Verification
Enable email verification in Supabase:
1. Go to **Authentication** > **Settings**
2. Enable "Enable email confirmations"
3. Configure email templates

### Custom Domain
Set up a custom domain in Supabase:
1. Go to **Settings** > **Custom Domains**
2. Follow the DNS configuration steps

## Troubleshooting

### "Invalid API key" error
- Check that `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct
- Make sure you're using the **anon public** key, not the service role key

### "ENCRYPTION_KEY not configured" error
- Add `ENCRYPTION_KEY` to your `.env.local` file
- Restart the dev server after adding environment variables

### Users can't sign up
- Check that the database schema was run successfully
- Verify the `handle_new_user()` trigger exists in Supabase SQL Editor

### Credits not deducting
- Check that the user is not an admin (`is_admin = false`)
- Verify the credits system is being called in the API route

## Security Best Practices

1. **Never commit `.env.local`** - It contains sensitive keys
2. **Use strong encryption keys** - 32+ characters, random
3. **Rotate keys periodically** - Update ENCRYPTION_KEY every 6-12 months
4. **Enable email verification** - Prevents fake signups
5. **Monitor credit usage** - Watch for abuse patterns
6. **Keep Supabase updated** - Check for security updates regularly

## Support

For issues or questions:
- Check Supabase docs: https://supabase.com/docs
- Review the code in `src/lib/supabase/` and `src/lib/credits.ts`
- Check the database schema in `supabase/schema.sql`
