# Reddit API Setup Guide

This application now uses Reddit's official OAuth API for reliable, compliant access to Reddit data. Follow these steps to set up your API credentials.

## Step 1: Create a Reddit Application

1. Go to https://www.reddit.com/prefs/apps
2. Scroll down and click **"create another app..."** or **"create app"**
3. Fill in the application details:
   - **Name**: Choose any name (e.g., "Reddit Converter")
   - **App type**: Select **"script"** 
     - ✅ **Use "script" for public web apps** where users don't need to log in
     - ✅ This allows read-only access without user authentication
     - ✅ Perfect for tools that fetch public Reddit data for any visitor
     - ❌ "Web app" is only needed if users must authenticate with their Reddit accounts
   - **Description**: Optional description
   - **About URL**: Leave blank or add your website URL
   - **Redirect URI**: For script apps, you can use `http://localhost` (this won't be used for read-only access)
4. Click **"create app"**

**Note**: Even though you're building a web app for everyone, "script" type is correct because:
- Your server makes API calls on behalf of all users
- Users don't need to log in with Reddit
- You're accessing public data only
- The credentials are stored server-side (secure)

## Step 2: Get Your Credentials

After creating the app, you'll see:
- **Client ID**: This is the string under your app name (looks like: `abc123def456ghi789`)
- **Client Secret**: This is the "secret" field (looks like: `xyz789secret123key456`)

**Important**: The Client ID is the text shown directly under your app's name, NOT the "personal use script" text.

## Step 3: Set Environment Variables

### For Vercel Deployment:

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables:

   ```
   REDDIT_CLIENT_ID=your_client_id_here
   REDDIT_CLIENT_SECRET=your_client_secret_here
   REDDIT_USER_AGENT=YourAppName/1.0 by YourRedditUsername
   ```

   **Note**: Replace:
   - `your_client_id_here` with your actual Client ID
   - `your_client_secret_here` with your actual Client Secret
   - `YourAppName` with your app name
   - `YourRedditUsername` with your Reddit username

### For Local Development:

Create a `.env.local` file in your project root (or use your platform's environment variable system):

```env
REDDIT_CLIENT_ID=your_client_id_here
REDDIT_CLIENT_SECRET=your_client_secret_here
REDDIT_USER_AGENT=YourAppName/1.0 by YourRedditUsername
```

**Important**: Never commit `.env.local` to version control! Add it to `.gitignore`.

### For Render Deployment:

1. Go to your Render dashboard
2. Select your service
3. Go to **Environment** tab
4. Add the environment variables as shown above

## Step 4: Verify Setup

After setting the environment variables:

1. **Redeploy** your application (Vercel/Render will pick up new environment variables)
2. Test the application with a Reddit post URL
3. If you see an error about missing credentials, double-check that:
   - Variable names are exactly: `REDDIT_CLIENT_ID`, `REDDIT_CLIENT_SECRET`, `REDDIT_USER_AGENT`
   - Values don't have extra spaces or quotes
   - You've redeployed after adding the variables

## Troubleshooting

### "Reddit API credentials not configured"
- Make sure all three environment variables are set
- Check for typos in variable names
- Ensure you've redeployed after adding variables

### "Access denied" or 403 errors
- Verify your Client ID and Secret are correct
- Make sure your app type is set to "script" (not "web app" or "installed app")
- Check that your User-Agent follows the format: `AppName/Version by Username`

### "Post not found" errors
- Verify the Reddit URL is correct and the post is publicly accessible
- Some private or restricted subreddits may not be accessible via API

## Rate Limits

Reddit's API has rate limits:
- **60 requests per minute** for OAuth-authenticated requests
- The application automatically handles rate limiting with appropriate delays

## Benefits of Using the Official API

✅ **Reliable**: No more 403 errors or bot detection  
✅ **Compliant**: Follows Reddit's Terms of Service  
✅ **Stable**: Official API is maintained by Reddit  
✅ **Rate Limits**: Clear, documented rate limits  
✅ **Future-proof**: Won't break if Reddit changes their website structure

## Need Help?

- Reddit API Documentation: https://www.reddit.com/dev/api/
- Reddit OAuth Guide: https://github.com/reddit-archive/reddit/wiki/OAuth2

