import React, { useState, useEffect, createContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import axios from 'axios';

// Components
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import WritePage from './pages/WritePage';
import AiAssistPage from './pages/AiAssistPage';
import PostPage from './pages/PostPage';
import ProfilePage from './pages/ProfilePage';
import ChatPage from './pages/ChatPage';
import ChatListPage from './pages/ChatListPage';
import ExplorePage from './pages/ExplorePage';
import SettingsPage from './pages/SettingsPage';
import SetPasswordPage from './pages/SetPasswordPage';
import FollowersPage from './pages/FollowersPage';
import FollowingPage from './pages/FollowingPage';
import RegisterPage from './pages/RegisterPage';

// Context
export const AuthContext = createContext();
export const ThemeContext = createContext();

// Configure axios defaults
axios.defaults.withCredentials = true;
if (process.env.NODE_ENV === 'development') {
  axios.defaults.baseURL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    // Check authentication status on app load
    checkAuthStatus();
    
    // Load theme preference from localStorage
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await axios.get('/api/auth/status');
      if (response.data.authenticated) {
        setUser(response.data.user);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = (userData) => {
    setUser(userData);
  };

  const logout = async () => {
    try {
      await axios.get('/api/auth/logout');
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const ProtectedRoute = ({ children }) => {
    if (loading) {
      return <div className="loading">Loading...</div>;
    }
    return user ? children : <Navigate to="/login" />;
  };

  const PublicRoute = ({ children }) => {
    if (loading) {
      return <div className="loading">Loading...</div>;
    }
    return user ? <Navigate to="/dashboard" /> : children;
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      <ThemeContext.Provider value={{ theme, toggleTheme }}>
        <Router>
          <div className={`app ${theme}`}>
            {user && <Navbar />}
            <main className="main-content">
              <Routes>
                <Route path="/" element={
                  <PublicRoute>
                    <LandingPage />
                  </PublicRoute>
                } />
                <Route path="/login" element={
                  <PublicRoute>
                    <LoginPage />
                  </PublicRoute>
                } />
                <Route path="/register" element={
                  <PublicRoute>
                    <RegisterPage />
                  </PublicRoute>
                } />
                <Route path="/set-password" element={
                  <ProtectedRoute>
                    <SetPasswordPage />
                  </ProtectedRoute>
                } />
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                <Route path="/write" element={
                  <ProtectedRoute>
                    <WritePage />
                  </ProtectedRoute>
                } />
                <Route path="/ai-assist" element={
                  <ProtectedRoute>
                    <AiAssistPage />
                  </ProtectedRoute>
                } />
                <Route path="/post/:id" element={<PostPage />} />
                <Route path="/profile/:username" element={<ProfilePage />} />
                <Route path="/profile/:username/followers" element={<FollowersPage />} />
                <Route path="/profile/:username/following" element={<FollowingPage />} />
                <Route path="/chat" element={
                  <ProtectedRoute>
                    <ChatListPage />
                  </ProtectedRoute>
                } />
                <Route path="/chat/:userId" element={
                  <ProtectedRoute>
                    <ChatPage />
                  </ProtectedRoute>
                } />
                <Route path="/explore" element={<ExplorePage />} />
                <Route path="/settings" element={
                  <ProtectedRoute>
                    <SettingsPage />
                  </ProtectedRoute>
                } />
              </Routes>
            </main>
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: theme === 'dark' ? '#333' : '#fff',
                  color: theme === 'dark' ? '#fff' : '#333',
                },
              }}
            />
          </div>
        </Router>
      </ThemeContext.Provider>
    </AuthContext.Provider>
  );
}

export default App;
