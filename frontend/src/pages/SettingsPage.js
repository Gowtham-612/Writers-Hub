import React, { useState, useContext, useEffect } from 'react';
import { AuthContext, ThemeContext } from '../App';
import { 
  User, 
  Edit3, 
  Save, 
  Sun, 
  Moon, 
  Palette,
  Bell,
  Shield,
  Trash2,
  RefreshCw
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import '../Styling/SettingsPage.css';


const SettingsPage = () => {
  const { user, logout } = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    posts: 0,
    followers: 0,
    following: 0
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [formData, setFormData] = useState({
    display_name: user?.display_name || '',
    bio: user?.bio || '',
    theme_preference: user?.theme_preference || 'light'
  });

  useEffect(() => {
    if (user?.username) {
      fetchUserStats();
    }
    // eslint-disable-next-line
  }, [user?.username]);

  const fetchUserStats = async (showToast = false) => {
    try {
      setStatsLoading(true);
      const response = await axios.get(`/api/users/profile/${user.username}`);
      setStats({
        posts: response.data.posts_count || 0,
        followers: response.data.followers_count || 0,
        following: response.data.following_count || 0
      });
      if (showToast) {
        toast.success('Stats updated!');
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
      if (showToast) {
        toast.error('Failed to update stats');
      }
    } finally {
      setStatsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await axios.put('/api/users/profile', formData);
      if (formData.theme_preference !== theme) {
        toggleTheme();
      }
      await fetchUserStats();
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      try {
        await axios.delete('/api/users/profile');
        toast.success('Account deleted successfully');
        logout();
      } catch (error) {
        console.error('Error deleting account:', error);
        toast.error('Failed to delete account');
      }
    }
  };

  return (
    <div className="settings-container">
      {/* Header */}
      <header className="settings-header">
        <h1 className="settings-title">Settings</h1>
        <p className="settings-subtitle">Manage your profile and preferences</p>
      </header>

      <div className="settings-grid">
        {/* Main Settings */}
        <section className="settings-main">
          {/* Profile Settings */}
          <div className="settings-card">
            <div className="settings-section-header">
              <User className="icon-primary" />
              <h2 className="section-title">Profile Settings</h2>
            </div>

            <form onSubmit={handleSubmit} className="settings-form">
              <div className="profile-info-group">
                <img
                  src={
                    user?.profile_image ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.display_name || user?.username)}&background=3b82f6&color=fff&size=80`
                  }
                  alt={user?.display_name || user?.username}
                  className="profile-avatar"
                  onError={e => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.display_name || user?.username)}&background=3b82f6&color=fff&size=80`;
                  }}
                />
                <div className="profile-names">
                  <p className="profile-display-name">{user?.display_name || user?.username}</p>
                  <p className="profile-username">@{user?.username}</p>
                  <p className="profile-email">{user?.email}</p>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="display_name" className="form-label">Display Name</label>
                <input
                  type="text"
                  id="display_name"
                  name="display_name"
                  value={formData.display_name}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Enter your display name"
                  maxLength={50}
                />
              </div>

              <div className="form-group">
                <label htmlFor="bio" className="form-label">Bio</label>
                <textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  className="form-input form-textarea"
                  placeholder="Tell us about yourself..."
                  rows={4}
                  maxLength={500}
                />
                <p className="bio-char-count">{formData.bio.length}/500 characters</p>
              </div>

              <div className="form-submit">
                <button type="submit" disabled={loading} className="btn-primary">
                  {loading ? (
                    <>
                      <div className="spinner"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="icon-small" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Theme Settings */}
          <div className="settings-card">
            <div className="settings-section-header">
              <Palette className="icon-primary" />
              <h2 className="section-title">Appearance</h2>
            </div>

            <div className="theme-settings">
              <div className="theme-selection">
                <div>
                  <h3 className="theme-title">Theme</h3>
                  <p className="theme-description">Choose between light and dark themes</p>
                </div>
                <div className="theme-buttons">
                  <button
                    onClick={() => setFormData(prev => ({ ...prev, theme_preference: 'light' }))}
                    className={
                      "theme-btn " +
                      (formData.theme_preference === 'light' ? 'active' : 'inactive')
                    }
                    aria-label="Light theme"
                  >
                    <Sun className="icon-small" />
                  </button>
                  <button
                    onClick={() => setFormData(prev => ({ ...prev, theme_preference: 'dark' }))}
                    className={
                      "theme-btn " +
                      (formData.theme_preference === 'dark' ? 'active' : 'inactive')
                    }
                    aria-label="Dark theme"
                  >
                    <Moon className="icon-small" />
                  </button>
                </div>
              </div>

              <div className="form-submit form-submit-right">
                <button
                  onClick={() => {
                    toggleTheme();
                    setFormData(prev => ({ ...prev, theme_preference: theme === 'light' ? 'dark' : 'light' }));
                  }}
                  className="btn-secondary"
                >
                  <Palette className="icon-small" />
                  Apply Theme
                </button>
              </div>
            </div>
          </div>

          {/* Account Settings */}
          <div className="settings-card">
            <div className="settings-section-header">
              <Shield className="icon-primary" />
              <h2 className="section-title">Account</h2>
            </div>

            <div className="account-info-group">
              <div className="auth-info">
                <h3 className="account-subtitle">Authentication</h3>
                <p className="account-text">You're signed in with Google OAuth</p>
                <div className="connection-status">
                  <div className="status-dot"></div>
                  <span>Connected to Google</span>
                </div>
              </div>

              <div className="account-info">
                <h3 className="account-subtitle">Account Information</h3>
                <div className="account-detail">
                  <span className="account-label">Username:</span>
                  <span className="account-value">@{user?.username}</span>
                </div>
                <div className="account-detail">
                  <span className="account-label">Email:</span>
                  <span className="account-value">{user?.email}</span>
                </div>
                <div className="account-detail">
                  <span className="account-label">Member since:</span>
                  <span className="account-value">{new Date(user?.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="settings-card danger-zone">
            <div className="settings-section-header">
              <Trash2 className="icon-danger" />
              <h2 className="section-title danger-text">Danger Zone</h2>
            </div>

            <div className="danger-zone-content">
              <h3 className="danger-zone-title">Delete Account</h3>
              <p className="danger-zone-text">
                Once you delete your account, there is no going back. Please be certain.
              </p>
              <button onClick={handleDeleteAccount} className="btn-danger">
                <Trash2 className="icon-small" />
                Delete Account
              </button>
            </div>
          </div>
        </section>

        {/* Sidebar */}
        <aside className="settings-sidebar">
          {/* Quick Stats */}
          <div className="settings-card sidebar-card">
            <div className="sidebar-header">
              <h3 className="sidebar-title">Your Stats</h3>
              <button
                onClick={() => fetchUserStats(true)}
                disabled={statsLoading}
                className="icon-button"
                title="Refresh stats"
                aria-label="Refresh stats"
              >
                <RefreshCw className={"icon-small " + (statsLoading ? 'spin' : '')} />
              </button>
            </div>
            {statsLoading ? (
              <div className="stats-loading">
                <div className="stats-row">
                  <span>Posts</span>
                  <div className="stats-pulse-bar"></div>
                </div>
                <div className="stats-row">
                  <span>Followers</span>
                  <div className="stats-pulse-bar"></div>
                </div>
                <div className="stats-row">
                  <span>Following</span>
                  <div className="stats-pulse-bar"></div>
                </div>
              </div>
            ) : (
              <div className="stats-info">
                <div className="stats-row">
                  <span>Posts</span>
                  <span className="stats-value">{stats.posts}</span>
                </div>
                <div className="stats-row">
                  <span>Followers</span>
                  <span className="stats-value">{stats.followers}</span>
                </div>
                <div className="stats-row">
                  <span>Following</span>
                  <span className="stats-value">{stats.following}</span>
                </div>
              </div>
            )}
          </div>

          {/* Help & Support */}
          <div className="settings-card sidebar-card">
            <h3 className="sidebar-title">Help & Support</h3>
            <div className="help-links">
              <a href="#" className="help-link">
                <div className="help-icon bg-primary">
                  <Edit3 className="icon-small icon-white" />
                </div>
                <span>Writing Guide</span>
              </a>
              <a href="#" className="help-link">
                <div className="help-icon bg-warning">
                  <Bell className="icon-small icon-white" />
                </div>
                <span>AI Assistant Help</span>
              </a>
              <a href="#" className="help-link">
                <div className="help-icon bg-success">
                  <User className="icon-small icon-white" />
                </div>
                <span>Community Guidelines</span>
              </a>
            </div>
          </div>

          {/* Current Theme Preview */}
          <div className="settings-card sidebar-card">
            <h3 className="sidebar-title">Theme Preview</h3>
            <div className={"theme-preview " + (theme === 'dark' ? 'theme-dark' : 'theme-light')}>
              <div className="theme-preview-header">
                <div className="theme-preview-avatar"></div>
                <div className="theme-preview-text">
                  <div className="theme-preview-line short"></div>
                  <div className="theme-preview-line smaller"></div>
                </div>
              </div>
              <div className="theme-preview-lines">
                <div className="theme-preview-line"></div>
                <div className="theme-preview-line short"></div>
                <div className="theme-preview-line smaller"></div>
              </div>
            </div>
            <p className="theme-current-label">
              Current: {theme === 'dark' ? 'Dark' : 'Light'} theme
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default SettingsPage;
