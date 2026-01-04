# Deploying to Render

## Quick Setup (5 minutes)

1. **Push your code to GitHub** (if not already):
   ```bash
   git add .
   git commit -m "Ready for Render deployment"
   git push
   ```

2. **Go to Render.com**:
   - Sign up/login at https://render.com
   - Click "New +" → "Web Service"
   - Connect your GitHub account
   - Select your repository

3. **Configure the service**:
   - **Name**: linksearch (or any name)
   - **Environment**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app`
   - **Plan**: Free (or choose a paid plan)

4. **Deploy**:
   - Click "Create Web Service"
   - Render will automatically build and deploy
   - Your site will be live at: `https://your-app-name.onrender.com`

## Notes:
- Free tier spins down after 15 minutes of inactivity (takes ~30 seconds to wake up)
- First deployment may take 5-10 minutes
- Auto-deploys on every push to main branch

## Alternative: Railway

1. Go to https://railway.app
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Railway auto-detects Python and deploys!

## Alternative: PythonAnywhere

1. Go to https://www.pythonanywhere.com
2. Sign up (free tier available)
3. Upload your files or connect GitHub
4. Configure WSGI file to point to `app:app`
5. Reload web app

