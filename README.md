# Writers Hub - Social Media Platform for Writers

A full-stack social media platform designed specifically for writers, featuring AI-powered writing assistance, real-time chat, file uploads, and a vibrant community of authors.

## 🚀 Features

### Core Features
- **Google OAuth Authentication** - Secure login with Google accounts
- **Rich Text Editor** - Create beautiful posts with formatting, images, and more
- **Real-time Chat** - Connect with other writers through Socket.io
- **File Import** - Upload PDF, DOCX, and TXT files with content extraction
- **AI Writing Assistant** - Generate content in your unique style using Ollama
- **Dark/Light Theme** - Toggle between themes with user preference saving

### Social Features
- **Follow System** - Follow other writers and see their posts in your feed
- **Like & Comment** - Engage with posts through likes and comments
- **Tag System** - Categorize posts with tags for better discovery
- **User Profiles** - Complete profiles with bio, stats, and writing history
- **Search & Explore** - Discover posts by tags, authors, or content

### AI Integration
- **Style Mimicry** - AI learns your writing style from past posts
- **Content Generation** - Generate new content based on your plot ideas
- **Few-shot Learning** - Uses 2-3 of your past writings as examples
- **Local AI** - Powered by Ollama for privacy and customization

## 🛠️ Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **PostgreSQL** - Database
- **Passport.js** - Authentication
- **Socket.io** - Real-time communication
- **Multer** - File upload handling
- **pdf-parse & mammoth** - File content extraction
- **Axios** - HTTP client for Ollama integration

### Frontend
- **React** - UI library
- **React Router** - Client-side routing
- **React Quill** - Rich text editor
- **Socket.io Client** - Real-time features
- **Lucide React** - Icon library
- **React Hot Toast** - Notifications
- **Axios** - API client

### AI & External Services
- **Ollama** - Local AI inference
- **Google OAuth** - Authentication
- **UI Avatars** - Default profile images

## 📋 Prerequisites

Before running this application, make sure you have:

1. **Node.js** (v16 or higher)
2. **PostgreSQL** (v12 or higher)
3. **Ollama** (for AI features)
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

# Ollama Configuration
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3

# File Upload Configuration
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760
```

### 4. Set up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:5000/auth/google/callback`
6. Copy Client ID and Client Secret to your `.env` file

### 5. Set up Ollama (Optional for AI features)

1. Install Ollama from [ollama.ai](https://ollama.ai/)
2. Pull a model:
```bash
ollama pull llama3
# or
ollama pull mistral
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

## 📁 Project Structure

```
writers-hub/
├── backend/
│   ├── config/
│   │   ├── database.js
│   │   └── passport.js
│   ├── middleware/
│   │   └── auth.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── posts.js
│   │   ├── chat.js
│   │   ├── ai.js
│   │   └── upload.js
│   ├── socket/
│   │   └── socketHandlers.js
│   ├── scripts/
│   │   └── setupDatabase.js
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── Navbar.js
│   │   ├── pages/
│   │   │   ├── LandingPage.js
│   │   │   ├── LoginPage.js
│   │   │   ├── Dashboard.js
│   │   │   ├── WritePage.js
│   │   │   ├── UploadPage.js
│   │   │   ├── AiAssistPage.js
│   │   │   ├── PostPage.js
│   │   │   ├── ProfilePage.js
│   │   │   ├── ChatPage.js
│   │   │   ├── ExplorePage.js
│   │   │   └── SettingsPage.js
│   │   ├── App.js
│   │   └── index.css
│   └── package.json
├── package.json
└── README.md
```

## 🔧 API Endpoints

### Authentication
- `GET /api/auth/google` - Google OAuth login
- `GET /api/auth/google/callback` - OAuth callback
- `GET /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user
- `GET /api/auth/status` - Check auth status

### Users
- `GET /api/users/profile/:username` - Get user profile
- `PUT /api/users/profile` - Update profile
- `POST /api/users/follow/:userId` - Follow user
- `DELETE /api/users/follow/:userId` - Unfollow user
- `GET /api/users/:username/posts` - Get user posts
- `GET /api/users/:username/followers` - Get followers
- `GET /api/users/:username/following` - Get following
- `GET /api/users/search/:query` - Search users

### Posts
- `GET /api/posts` - Get all posts
- `GET /api/posts/feed` - Get feed (followed users)
- `POST /api/posts` - Create post
- `GET /api/posts/:id` - Get single post
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post
- `POST /api/posts/:id/like` - Like post
- `DELETE /api/posts/:id/like` - Unlike post
- `GET /api/posts/:id/comments` - Get comments
- `POST /api/posts/:id/comments` - Add comment
- `GET /api/posts/tags/popular` - Get popular tags

### Chat
- `GET /api/chat/conversations` - Get conversations
- `GET /api/chat/with/:userId` - Get/create chat
- `GET /api/chat/:chatId/messages` - Get messages
- `POST /api/chat/:chatId/messages` - Send message
- `PUT /api/chat/:chatId/read` - Mark as read
- `GET /api/chat/unread/count` - Get unread count

### AI
- `GET /api/ai/samples` - Get writing samples
- `POST /api/ai/generate` - Generate content
- `POST /api/ai/samples` - Save AI sample
- `GET /api/ai/samples/all` - Get all AI samples
- `DELETE /api/ai/samples/:id` - Delete AI sample
- `GET /api/ai/status` - Check Ollama status

### Upload
- `POST /api/upload` - Upload file
- `GET /api/upload/supported-types` - Get supported types

## 🎯 Usage Guide

### For Writers
1. **Sign up** using your Google account
2. **Create posts** using the rich text editor
3. **Import existing work** from PDF, DOCX, or TXT files
4. **Use AI assistance** to generate content in your style
5. **Connect with other writers** through following and chat
6. **Explore content** by tags and search

### For Developers
1. **Set up the environment** following the prerequisites
2. **Configure Google OAuth** for authentication
3. **Set up Ollama** for AI features (optional)
4. **Run the application** in development mode
5. **Customize and extend** the platform as needed

## 🔒 Security Features

- **Google OAuth** for secure authentication
- **Session management** with secure cookies
- **CORS protection** for API endpoints
- **Rate limiting** to prevent abuse
- **Input validation** and sanitization
- **File upload restrictions** and validation

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

### Docker Deployment (Optional)
```dockerfile
# Backend Dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

If you encounter any issues:

1. Check the prerequisites and setup instructions
2. Verify your environment variables
3. Check the console for error messages
4. Ensure Ollama is running for AI features
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
