# Writers Hub - Social Media Platform for Writers

A full-stack social media platform designed specifically for writers, featuring AI-powered writing assistance, real-time chat, and a vibrant community of authors.

## 🚀 Features

### Core Features
- **Google OAuth Authentication** - Secure login with Google accounts
- **Rich Text Editor** - Create beautiful posts with formatting, images, and more
- **Real-time Chat** - Connect with other writers through Socket.io

- **AI Writing Assistant** - Generate content in your unique style using DeepSeek AI
- **Dark/Light Theme** - Toggle between themes with user preference saving

### Social Features
- **Follow System** - Follow other writers and see their posts in your feed
- **Like & Comment** - Engage with posts through likes and comments
- **Tag System** - Categorize posts with tags for better discovery
- **User Profiles** - Complete profiles with bio, stats, and writing history
- **Search & Explore** - Discover posts by tags, authors, or content

### AI Integration
- **DeepSeek Chatbot** - Interactive AI writing assistant
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

- **Axios** - HTTP client for DeepSeek AI integration

### Frontend
- **React** - UI library
- **React Router** - Client-side routing
- **React Quill** - Rich text editor
- **Socket.io Client** - Real-time features
- **Lucide React** - Icon library
- **React Hot Toast** - Notifications
- **Axios** - API client

### AI & External Services
- **DeepSeek AI** - Advanced language model for writing assistance
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

# DeepSeek AI Configuration
DEEPSEEK_API_KEY=your_deepseek_api_key_here


```

### 4. Set up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:5000/auth/google/callback`
6. Copy Client ID and Client Secret to your `.env` file

### 5. Set up DeepSeek AI (Required for AI features)

1. Get a DeepSeek API key from [DeepSeek Console](https://platform.deepseek.com/)
2. Add your API key to the `.env` file:
```env
DEEPSEEK_API_KEY=your_api_key_here
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
│   │   └── ai.js
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

### AI Chat
- `POST /api/ai/chat/start` - Start new chat session
- `POST /api/ai/chat/message` - Send message to AI
- `GET /api/ai/chat/history/:sessionId` - Get chat history
- `GET /api/ai/chat/sessions` - Get user's chat sessions
- `DELETE /api/ai/chat/session/:sessionId` - Delete chat session
- `GET /api/ai/status` - Check DeepSeek API status



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
3. **Set up DeepSeek API** for AI features
4. **Run the application** in development mode
5. **Customize and extend** the platform as needed

## 🔒 Security Features

- **Google OAuth** for secure authentication
- **Session management** with secure cookies
- **CORS protection** for API endpoints
- **Rate limiting** to prevent abuse
- **Input validation** and sanitization


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
