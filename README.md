# Writers Hub - Social Media Platform for Writers

A full-stack social media platform designed specifically for writers, featuring AI-powered writing assistance, real-time chat, and a vibrant community of authors.

## 🚀 Features

### Core Features
- **Google OAuth Authentication** - Secure login with Google accounts
- **Rich Text Editor** - Create beautiful posts with formatting, images, and more
- **Real-time Chat** - Connect with other writers through Socket.io

- **AI Writing Assistant** - Generate content in your unique style using OpenRouter
- **Dark/Light Theme** - Toggle between themes with user preference saving

### Social Features
- **Follow System** - Follow other writers and see their posts in your feed
- **Like & Comment** - Engage with posts through likes and comments
- **Tag System** - Categorize posts with tags for better discovery
- **User Profiles** - Complete profiles with bio, stats, and writing history
- **Search & Explore** - Discover posts by tags, authors, or content

### AI Integration
- **Chat Sessions** - Persistent conversation history
- **Writing Help** - Brainstorming, editing, and creative inspiration
- **Real-time Responses** - Instant AI assistance for writers

## 🛠️ Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **PostgreSQL** - Database
- **Passport.js** - Authentication
- **Socket.io** - Real-time communication

### Frontend
- **React** - UI library
- **React Router** - Client-side routing
- **React Quill** - Rich text editor
- **Socket.io Client** - Real-time features
- **Lucide React** - Icon library
- **React Hot Toast** - Notifications
- **Axios** - API client

### AI & External Services
- **openrouter** - Advanced language model for writing assistance
- **Google OAuth** - Authentication
- **UI Avatars** - Default profile images

## 📋 Prerequisites

Before running this application, make sure you have:

1. **Node.js** (v16 or higher)
2. **PostgreSQL** (v12 or higher)
3. **DeepSeek API Key** (for AI features)
4. **Google OAuth Credentials**

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd writers-hub
```

### 2. Install Dependencies
```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install

# Return to root
cd ..
```

### 3. Database Setup

#### Create PostgreSQL Database
```sql
CREATE DATABASE writers_hub;
```

#### Set up environment variables
```bash
# Copy the example environment file
cp backend/env.example backend/.env

# Edit the .env file with your configuration
```

#### Configure Environment Variables
Edit `backend/.env`:
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=writers_hub
DB_USER=postgres
DB_PASSWORD=your_password

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/auth/google/callback

# Session Configuration
SESSION_SECRET=your_session_secret_key

# JWT Configuration
JWT_SECRET=your_jwt_secret_key

# OpenRouter AI Configuration
OPENROUTER_API_KEY=your_openrouter_api_key_here


```

### 4. Set up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:5000/auth/google/callback`
6. Copy Client ID and Client Secret to your `.env` file

### 5. Set up  AI (Required for AI features)

1. Get a OPENROUTER API key 
2. Add your API key to the `.env` file:
```env
OPENROUTER_API_KEY=your_api_key_here
```

### 6. Initialize Database
```bash
cd backend
npm run db:setup
```

### 7. Start the Application

#### Development Mode
```bash
# Start both frontend and backend
npm run dev
```

#### Production Mode
```bash
# Build frontend
npm run build

# Start backend
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000




## 🎯 Usage Guide

### For Writers
1. **Sign up** using your Google account
2. **Create posts** using the rich text editor
3. **Create content** using the rich text editor
4. **Chat with AI** for writing help and inspiration
5. **Connect with other writers** through following and chat
6. **Explore content** by tags and search

### For Developers
1. **Set up the environment** following the prerequisites
2. **Configure Google OAuth** for authentication
3. **Set up openrouter API** for AI features
4. **Run the application** in development mode
5. **Customize and extend** the platform as needed

## 🔒 Security Features

- **Google OAuth** for secure authentication
- **Session management** with secure cookies
- **CORS protection** for API endpoints
- **Rate limiting** to prevent abuse


## 🚀 Deployment

### Backend Deployment
1. Set up a PostgreSQL database
2. Configure environment variables
3. Install dependencies: `npm install`
4. Run database setup: `npm run db:setup`
5. Start the server: `npm start`

### Frontend Deployment
1. Build the application: `npm run build`
2. Serve the `build` folder using a web server
3. Configure proxy to backend API


## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request



## 🆘 Support

If you encounter any issues:

1. Check the prerequisites and setup instructions
2. Verify your environment variables
3. Check the console for error messages
4. Ensure DeepSeek API key is configured for AI features
5. Create an issue with detailed information

## 🔮 Future Enhancements

- **Advanced AI models** support
- **Collaborative writing** features
- **Publishing tools** integration
- **Analytics dashboard** for writers
- **Mobile app** development
- **Advanced search** with filters
- **Writing challenges** and contests
- **Monetization** features

---

Built with ❤️ for the writing community
