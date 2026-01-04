# Deploying to Vercel

This guide will help you deploy the Reddit to ChatGPT Converter to Vercel.

## Prerequisites

1. A GitHub account
2. A Vercel account (sign up at https://vercel.com)

## Deployment Steps

### Option 1: Deploy via Vercel CLI (Recommended)

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel
   ```
   
   Follow the prompts:
   - Set up and deploy? **Yes**
   - Which scope? (Select your account)
   - Link to existing project? **No**
   - Project name? (Press Enter for default or enter a custom name)
   - Directory? (Press Enter for current directory)
   - Override settings? **No**

4. **Deploy to production**:
   ```bash
   vercel --prod
   ```

### Option 2: Deploy via GitHub

1. **Push your code to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Import to Vercel**:
   - Go to https://vercel.com/new
   - Click "Import Git Repository"
   - Select your GitHub repository
   - Vercel will automatically detect the configuration
   - Click "Deploy"

3. **Wait for deployment** - Vercel will build and deploy your app automatically

## Project Structure

The project is structured for Vercel:
- `index.html` - Main frontend page (served as static file)
- `api/convert.py` - Serverless function for the conversion API
- `reddit_converter.py` - Core conversion logic
- `vercel.json` - Vercel configuration
- `requirements.txt` - Python dependencies

## Important Notes

- The app will be available at `https://your-project-name.vercel.app`
- Vercel automatically handles Python serverless functions
- The API endpoint will be at `/api/convert`
- All dependencies from `requirements.txt` will be installed automatically

## Troubleshooting

If you encounter issues:

1. **Check Vercel logs**: Go to your project dashboard → Deployments → Click on a deployment → View Function Logs

2. **Verify Python version**: Vercel uses Python 3.9 by default. If you need a different version, add a `runtime.txt` file:
   ```
   python-3.11
   ```

3. **Check function timeout**: Vercel has a 10-second timeout on the Hobby plan. For longer processing, consider upgrading or optimizing the code.

4. **CORS issues**: The function already includes CORS headers, but if you encounter issues, check the headers in `api/convert.py`

## Updating Your Deployment

After making changes:

1. **Via CLI**:
   ```bash
   vercel --prod
   ```

2. **Via GitHub**: Just push to your main branch and Vercel will auto-deploy

