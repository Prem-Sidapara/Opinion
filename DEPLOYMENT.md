# Deployment Guide (Free Tier)

We will deploy the **Backend** to **Render** and the **Frontend** to **Vercel**. Both are free.

## Prerequisites
1.  **GitHub Account**: You need to push your code to a GitHub repository.
2.  **MongoDB Atlas URI**: You already have this (`mongodb+srv://...`). Keep it safe.

---

## Step 1: Push to GitHub
1.  Create a new repository on [GitHub](https://github.com/new).
2.  Open your terminal in the project folder (`New Project`):
    ```bash
    git init
    git add .
    git commit -m "Initial commit"
    git branch -M main
    git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
    git push -u origin main
    ```

---

## Step 2: Deploy Backend (Render)
1.  Go to [Render Dashboard](https://dashboard.render.com/).
2.  Click **New +** -> **Web Service**.
3.  Connect your GitHub repository.
4.  **Settings**:
    *   **Root Directory**: `server`
    *   **Build Command**: `npm install`
    *   **Start Command**: `node index.js`
5.  **Environment Variables** (Scroll down to "Advanced"):
    *   Add `MONGO_URI`: `your_mongodb_connection_string`
    *   Add `JWT_SECRET`: `some_secure_random_string`
    *   Add `ADMIN_PASSWORD`: `your_admin_password` (if used)
6.  Click **Deploy Web Service**.
7.  **Wait**: Once deployed, copy the **onrender.com URL** (e.g., `https://my-api.onrender.com`). You will need this for the Frontend.

---

## Step 3: Deploy Frontend (Vercel)
1.  Go to [Vercel Dashboard](https://vercel.com/dashboard).
2.  Click **Add New...** -> **Project**.
3.  Import your GitHub repository.
4.  **Settings**:
    *   **Root Directory**: Click "Edit" and select `client`.
    *   **Framework Preset**: Vite (should detect automatically).
5.  **Environment Variables**:
    *   **Name**: `VITE_API_URL`
    *   **Value**: `https://YOUR-RENDER-URL.onrender.com/api` (Paste the URL from Step 2 **and add `/api` at the end**).
6.  Click **Deploy**.

---

## Step 4: Final Check
1.  Open your Vercel URL (e.g., `https://my-app.vercel.app`).
2.  Try looking at the feed (it might take a moment for Render to wake up).
3.  Try logging in.
4.  **Done!** Send the link to your friend.
