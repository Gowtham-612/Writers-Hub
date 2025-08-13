import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext, ThemeContext } from '../App';
import { 
  Home, Edit3, Upload, Bot, Search, MessageCircle, 
  Settings, LogOut, User, Sun, Moon, Menu, X, Bell, Sparkles
} from 'lucide-react';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const navItems = [
    { icon: Home, label: 'Dashboard', path: '/dashboard' },
    { icon: Edit3, label: 'Write', path: '/write' },
    { icon: Upload, label: 'Upload', path: '/upload' },
    { icon: Bot, label: 'AI Assist', path: '/ai-assist' },
    { icon: Search, label: 'Explore', path: '/explore' },
    { icon: MessageCircle, label: 'Chat', path: '/chat' },
  ];

  return (
    <nav className="navbar">
      <div className="navbar-container">
        
        {/* Logo */}
        <Link to="/dashboard" className="navbar-logo">
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
          <button className="icon-btn notification-btn">
            <Bell />
            <span className="notification-badge">3</span>
          </button>

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
