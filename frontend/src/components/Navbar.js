import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext, ThemeContext } from '../App';
import { 
  Home, Edit3, Bot, Search, MessageCircle, 
  Settings, LogOut, User, Sun, Moon, Menu, X, Bell, Sparkles
} from 'lucide-react';
import axios from 'axios';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };
  
  // Fetch unread message count
  const fetchUnreadCount = async () => {
    try {
      const response = await axios.get('/api/chat/unread/count');
      setUnreadCount(response.data.unread_count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };
  
  // Fetch recent conversations with unread messages
  const fetchNotifications = async () => {
    try {
      const response = await axios.get('/api/chat/conversations');
      // Filter conversations with unread messages
      const unreadConversations = response.data.filter(conv => conv.unread_count > 0);
      setNotifications(unreadConversations);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };
  
  // Handle notification click
  const handleNotificationClick = () => {
    setIsNotificationOpen(!isNotificationOpen);
    if (!isNotificationOpen) {
      fetchNotifications();
    }
  };
  
  // Handle notification item click
  const handleNotificationItemClick = (userId) => {
    setIsNotificationOpen(false);
    navigate(`/chat/${userId}`);
  };
  
  // Clear notifications when navigating to chat
  const clearNotifications = () => {
    setIsNotificationOpen(false);
  };
  
  // Fetch unread count on component mount and set interval
  useEffect(() => {
    fetchUnreadCount();
    
    // Set interval to fetch unread count every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const container = document.querySelector('.notification-container');
      if (container && !container.contains(event.target)) {
        setIsNotificationOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const navItems = [
    { icon: Home, label: 'Dashboard', path: '/dashboard' },
    { icon: Edit3, label: 'Write', path: '/write' },
    { icon: Bot, label: 'AI Assist', path: '/ai-assist' },
    { icon: Search, label: 'Explore', path: '/explore' },
    { icon: MessageCircle, label: 'Chat', path: '/chat' },
  ];

  return (
    <nav className="navbar">
      <div className="navbar-container">
        
        {/* Logo */}
        <Link to="/chat" className="navbar-logo">
          <div className="logo-icon">
            <Sparkles className="logo-spark" />
          </div>
          <span className="logo-text">Writers Hub</span>
        </Link>

        {/* Desktop Navigation */}
        <div className={`nav-links ${isMenuOpen ? 'open' : ''}`}>
          {navItems.map((item) => (
            <Link key={item.path} to={item.path} className="nav-link">
              <item.icon className="nav-icon" />
              <span>{item.label}</span>
            </Link>
          ))}
        </div>

        {/* Right Actions */}
        <div className="navbar-actions">
          {/* Notifications */}
          <div className="notification-container">
            <button 
              className="icon-btn notification-btn" 
              onClick={handleNotificationClick}
            >
              <Bell />
              {unreadCount > 0 && (
                <span className="notification-badge">{unreadCount}</span>
              )}
            </button>
            
            {isNotificationOpen && (
              <div className="notification-dropdown">
                <div className="notification-header">
                  <h3>Messages</h3>
                  <Link to="/chat" onClick={clearNotifications}>View All</Link>
                </div>
                
                {notifications.length > 0 ? (
                  <div className="notification-list">
                    {notifications.map((notification) => (
                      <div 
                        key={notification.chat_id} 
                        className="notification-item"
                        onClick={() => handleNotificationItemClick(notification.other_user_id)}
                      >
                        <img 
                          src={notification.other_profile_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(notification.other_display_name || notification.other_username)}&background=3b82f6&color=fff`}
                          alt={notification.other_display_name || notification.other_username}
                          className="notification-avatar"
                        />
                        <div className="notification-content">
                          <div className="notification-name">
                            {notification.other_display_name || notification.other_username}
                          </div>
                          <div className="notification-message">
                            {notification.last_message ? (
                              notification.last_message.length > 30 ? 
                                `${notification.last_message.substring(0, 30)}...` : 
                                notification.last_message
                            ) : 'New message'}
                          </div>
                        </div>
                        <div className="notification-badge">{notification.unread_count}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="notification-empty">
                    <p>No new messages</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Theme Toggle */}
          <button className="icon-btn" onClick={toggleTheme}>
            {theme === 'light' ? <Moon /> : <Sun />}
          </button>

          {/* User Menu */}
          <div className="user-menu">
            <button className="user-btn" onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}>
              <img
                src={
                  user.profile_image ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(user.display_name || user.username)}&background=3b82f6&color=fff&size=80`
                }
                alt={user.display_name || user.username}
                className="user-avatar"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.display_name || user.username)}&background=3b82f6&color=fff&size=80`;
                }}
              />
              <span className="username">{user.display_name || user.username}</span>
            </button>

            {isUserMenuOpen && (
              <div className="dropdown">
                <div className="dropdown-header">
                  <p className="dropdown-name">{user.display_name || user.username}</p>
                  <p className="dropdown-username">@{user.username}</p>
                </div>
                <Link to={`/profile/${user.username}`} className="dropdown-item">
                  <User /> Profile
                </Link>
                <Link to="/settings" className="dropdown-item">
                  <Settings /> Settings
                </Link>
                <button onClick={handleLogout} className="dropdown-item logout">
                  <LogOut /> Logout
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button className="icon-btn mobile-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
