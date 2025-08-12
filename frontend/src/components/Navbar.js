import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext, ThemeContext } from '../App';
import { 
  Home, 
  Edit3, 
  Upload, 
  Bot, 
  Search, 
  MessageCircle, 
  Settings, 
  LogOut, 
  User,
  Sun,
  Moon,
  Menu,
  X,
  Bell,
  Sparkles
} from 'lucide-react';

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
    <nav
      className="bg-surface-color border-b border-border-color z-50 backdrop-blur-md bg-opacity-95 shadow-sm w-full"
      style={{ position: 'sticky', top: 0, width: '100%' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 min-h-[4rem]">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-color to-secondary-color rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-extrabold gradient-text">Writers Hub</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-all duration-300 hover:scale-105 group"
              >
                <item.icon className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                <span className="text-sm font-semibold">{item.label}</span>
              </Link>
            ))}
          </div>

          {/* Right side - Theme toggle, notifications, and user menu */}
          <div className="flex items-center gap-3">
            {/* Notifications */}
            <button className="relative p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-all duration-300 hover:scale-105">
              <Bell className="w-5 h-5" />
              <span className="notification-badge">3</span>
            </button>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-all duration-300 hover:scale-105 hover:rotate-12"
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-3 p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-all duration-300 hover:scale-105"
              >
                {user.profile_image ? (
                  <img
                    src={user.profile_image}
                    alt={user.display_name}
                    className="w-9 h-9 rounded-full avatar avatar-ring hover:scale-110 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-9 h-9 bg-gradient-to-br from-primary-color to-secondary-color rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-300">
                    <User className="w-5 h-5 text-white" />
                  </div>
                )}
                <span className="hidden sm:block text-sm font-semibold">
                  {user.display_name || user.username}
                </span>
              </button>

              {/* User dropdown */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-3 w-56 bg-surface-color border border-border-color rounded-2xl shadow-2xl py-2 z-50 animate-fade-in">
                  <div className="px-4 py-3 border-b border-border-color">
                    <p className="text-sm font-semibold text-text-primary">
                      {user.display_name || user.username}
                    </p>
                    <p className="text-xs text-text-secondary">@{user.username}</p>
                  </div>
                  
                  <Link
                    to={`/profile/${user.username}`}
                    className="flex items-center gap-3 px-4 py-3 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors duration-200"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <User className="w-4 h-4" />
                    <span className="font-medium">Profile</span>
                  </Link>
                  
                  <Link
                    to="/settings"
                    className="flex items-center gap-3 px-4 py-3 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors duration-200"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <Settings className="w-4 h-4" />
                    <span className="font-medium">Settings</span>
                  </Link>
                  
                  <hr className="my-2 border-border-color" />
                  
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsUserMenuOpen(false);
                    }}
                    className="flex items-center gap-3 px-4 py-3 text-sm text-error-color hover:bg-error-color hover:bg-opacity-10 w-full text-left transition-colors duration-200"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="font-medium">Logout</span>
                  </button>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-all duration-300 hover:scale-105"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-border-color py-4 animate-slide-up">
            <div className="flex flex-col gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-all duration-300 hover:scale-105"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="text-sm font-semibold">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Click outside to close dropdowns */}
      {(isUserMenuOpen || isMenuOpen) && (
        <div
          className="fixed left-0 right-0 bottom-0 z-40"
          style={{ top: '4rem' }}
          onClick={() => {
            setIsUserMenuOpen(false);
            setIsMenuOpen(false);
          }}
          aria-hidden="true"
        />
      )}
    </nav>
  );
};

export default Navbar;
