# FutureAtoms Website

A cutting-edge portfolio website showcasing the FutureAtoms technology ecosystem with interactive 3D visualizations powered by Three.js.

## 🚀 Features

- **Interactive 3D Atomic Structure** - Represents each venture as an animated atom
- **Unique Three.js Effects** - Different visualization for each page
- **Responsive Design** - Works seamlessly on all devices
- **Glass Morphism UI** - Modern, translucent design elements
- **Custom Cursor Glow** - Invisible glow effect following cursor
- **Smooth Animations** - GSAP-powered scroll animations

## 📁 Project Structure

```
futureatoms-website/
├── public/                 # All website files
│   ├── index.html         # Main homepage
│   ├── blog.html          # Blog page with particle text
│   ├── news.html          # News page with globe
│   ├── bevybeats.html     # BevyBeats app page
│   └── ...                # Other app pages
├── firebase.json          # Firebase hosting config
├── .firebaserc            # Firebase project config
├── package.json           # Node dependencies
└── README.md              # This file
```

## 🔥 Firebase Setup & Deployment

### Prerequisites
- Node.js installed (v14 or higher)
- Firebase CLI installed
- GitHub account
- Firebase account

### Step 1: Install Firebase Tools
```bash
npm install -g firebase-tools
```

### Step 2: Clone This Repository
```bash
git clone https://github.com/yourusername/futureatoms-website.git
cd futureatoms-website
```

### Step 3: Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Create a project"
3. Name it: `futureatoms-project`
4. Disable Google Analytics (optional)
5. Click "Create project"

### Step 4: Initialize Firebase Hosting
```bash
# Login to Firebase
firebase login

# Initialize the project
firebase init hosting

# When prompted:
# - Choose "Use an existing project"
# - Select "futureatoms-project"
# - Set public directory to: public
# - Configure as single-page app: No
# - Set up automatic builds with GitHub: Yes (optional)
# - Don't overwrite existing files
```

### Step 5: Update Firebase Configuration
Edit `.firebaserc` and replace with your project ID:
```json
{
  "projects": {
    "default": "your-actual-project-id"
  }
}
```

### Step 6: Deploy to Firebase
```bash
# Test locally first
firebase serve

# Deploy to Firebase Hosting
firebase deploy --only hosting
```

Your site will be available at:
- `https://your-project-id.web.app`
- `https://your-project-id.firebaseapp.com`

## 🔗 GitHub Integration for Auto-Deploy

### Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/futureatoms-website.git
git push -u origin main
```

### Step 2: Get Firebase CI Token
```bash
firebase login:ci
# Copy the token that appears
```

### Step 3: Add Secret to GitHub
1. Go to your GitHub repository
2. Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Name: `FIREBASE_TOKEN`
5. Value: Paste the token from step 2

### Step 4: Enable GitHub Actions
The workflow file is already included. Just push to main branch and it will auto-deploy!

## 🎨 Customization

### Update Firebase Config in HTML Files
In each HTML file that needs Firebase, add your config:
```javascript
const firebaseConfig = {
    apiKey: "your-api-key",
    authDomain: "your-project-id.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "your-sender-id",
    appId: "your-app-id"
};
firebase.initializeApp(firebaseConfig);
```

### Custom Domain (Optional)
1. In Firebase Console → Hosting → Add custom domain
2. Follow the DNS verification steps
3. Add the provided DNS records to your domain

## 🛠️ Local Development

```bash
# Install dependencies
npm install

# Run local server
npm start
# or
firebase serve

# Deploy to production
npm run deploy
```

## 📱 Apps Included

- **BevyBeats** - AI Music Generation Platform
- **Savitri** - AI Therapy Application
- **Zaphy** - LinkedIn Automation Chrome Extension
- **Agentic Control** - CLI Tool with MCP Server
- **Yuj** - Yoga & Workout App
- **AdaptiveVision** - Object Detection Technology
- **Incoder** - Semiconductor Design OS
- **SystemVerilogGPT** - Hardware Description AI

## 🏗️ Technologies Used

- **Three.js** - 3D Graphics and animations
- **GSAP** - Scroll animations
- **Firebase Hosting** - Static site hosting
- **GitHub Actions** - CI/CD pipeline
- **Glass Morphism** - Modern UI design

## 👨‍💻 Author

**Abhilash Chadhar**
- Creator of FutureAtoms
- Building tomorrow's technology, one atom at a time

## 📄 License

© 2024 FutureAtoms. All rights reserved.

## 🤝 Support

For issues or questions:
1. Check [Firebase Hosting Docs](https://firebase.google.com/docs/hosting)
2. Open an issue on GitHub
3. Contact support@futureatoms.com

---

**Ready to deploy?** Follow the steps above and your site will be live in minutes! 🚀