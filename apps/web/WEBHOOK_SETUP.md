# Clerk Webhook Setup Guide

## Why Webhooks?

Webhooks ensure that user data is synchronized between Clerk and your database. When a user signs up, updates their profile, or deletes their account in Clerk, the webhook automatically updates your database.

## Setup Instructions

### 1. Deploy Your App First
The webhook endpoint needs to be publicly accessible. Deploy to Vercel or your preferred hosting provider.

### 2. Configure Webhook in Clerk Dashboard

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Select your application
3. Navigate to **Webhooks** in the left sidebar
4. Click **Add Endpoint**
5. Configure:
   - **Endpoint URL**: `https://your-domain.com/api/webhooks/clerk`
   - **Events to listen for**:
     - `user.created`
     - `user.updated`
     - `user.deleted`

### 3. Copy Webhook Secret

1. After creating the webhook, click on it
2. Copy the **Signing Secret** (starts with `whsec_`)
3. Add to your `.env` file:
   ```env
   CLERK_WEBHOOK_SECRET=whsec_your_secret_here
   ```

### 4. Test the Webhook

1. In Clerk Dashboard, use the **Test** tab
2. Send a test `user.created` event
3. Check your database to confirm the user was created

## How It Works

1. **User signs up** → Clerk sends `user.created` event
2. **Webhook receives event** → Verifies signature for security
3. **Creates database record** → User is added to your Postgres database
4. **User can now create habits** → All API calls will work

## Fallback Mechanism

The `getOrCreateUser()` function in `/lib/auth.ts` acts as a fallback:
- If webhook hasn't fired yet, it creates the user on first API call
- Ensures your app works even if webhooks are delayed

## Local Development

For local testing, you can use ngrok or similar tools:

```bash
# Install ngrok
npm install -g ngrok

# Expose your local server
ngrok http 3000

# Use the ngrok URL for your webhook endpoint
```

## Troubleshooting

1. **User not created in database**
   - Check webhook logs in Clerk Dashboard
   - Verify `CLERK_WEBHOOK_SECRET` is set correctly
   - Check server logs for errors

2. **Signature verification fails**
   - Ensure the webhook secret matches exactly
   - No extra spaces or quotes in `.env`

3. **Database connection errors**
   - Verify `DATABASE_URL` is set
   - Check Prisma client is generated