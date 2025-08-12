import React, { useState, useContext } from 'react';
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
  ArrowLeft
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const SettingsPage = () => {
  const { user, logout } = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    display_name: user?.display_name || '',
    bio: user?.bio || '',
    theme_preference: user?.theme_preference || 'light'
  });

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
      const response = await axios.put('/api/users/profile', formData);
      
      // Update theme if changed
      if (formData.theme_preference !== theme) {
        toggleTheme();
      }
      
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
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-2">Settings</h1>
        <p className="text-text-secondary">
          Manage your profile and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Settings */}
          <div className="card">
            <div className="flex items-center gap-2 mb-6">
              <User className="w-5 h-5 text-primary-color" />
              <h2 className="text-xl font-semibold text-text-primary">Profile Settings</h2>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center gap-4 mb-6">
                <img
                  src={user?.profile_image || `https://ui-avatars.com/api/?name=${user?.display_name}&background=3b82f6&color=fff&size=80`}
                  alt={user?.display_name}
                  className="w-20 h-20 rounded-full"
                />
                <div>
                  <p className="text-text-primary font-medium">{user?.display_name || user?.username}</p>
                  <p className="text-text-secondary text-sm">@{user?.username}</p>
                  <p className="text-text-secondary text-sm">{user?.email}</p>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Display Name</label>
                <input
                  type="text"
                  name="display_name"
                  value={formData.display_name}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Enter your display name"
                  maxLength={50}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Bio</label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  className="form-input form-textarea"
                  placeholder="Tell us about yourself..."
                  rows={4}
                  maxLength={500}
                />
                <p className="text-text-secondary text-sm mt-1">
                  {formData.bio.length}/500 characters
                </p>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Theme Settings */}
          <div className="card">
            <div className="flex items-center gap-2 mb-6">
              <Palette className="w-5 h-5 text-primary-color" />
              <h2 className="text-xl font-semibold text-text-primary">Appearance</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-surface-color rounded-lg">
                <div>
                  <h3 className="font-medium text-text-primary">Theme</h3>
                  <p className="text-text-secondary text-sm">
                    Choose between light and dark themes
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setFormData(prev => ({ ...prev, theme_preference: 'light' }))}
                    className={`p-2 rounded-lg transition-colors ${
                      formData.theme_preference === 'light'
                        ? 'bg-primary-color text-white'
                        : 'bg-background-color text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    <Sun className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setFormData(prev => ({ ...prev, theme_preference: 'dark' }))}
                    className={`p-2 rounded-lg transition-colors ${
                      formData.theme_preference === 'dark'
                        ? 'bg-primary-color text-white'
                        : 'bg-background-color text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    <Moon className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => {
                    toggleTheme();
                    setFormData(prev => ({ 
                      ...prev, 
                      theme_preference: theme === 'light' ? 'dark' : 'light' 
                    }));
                  }}
                  className="btn btn-secondary"
                >
                  <Palette className="w-4 h-4" />
                  Apply Theme
                </button>
              </div>
            </div>
          </div>

          {/* Account Settings */}
          <div className="card">
            <div className="flex items-center gap-2 mb-6">
              <Shield className="w-5 h-5 text-primary-color" />
              <h2 className="text-xl font-semibold text-text-primary">Account</h2>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-surface-color rounded-lg">
                <h3 className="font-medium text-text-primary mb-2">Authentication</h3>
                <p className="text-text-secondary text-sm mb-3">
                  You're signed in with Google OAuth
                </p>
                <div className="flex items-center gap-2 text-sm text-text-secondary">
                  <div className="w-2 h-2 bg-success-color rounded-full"></div>
                  <span>Connected to Google</span>
                </div>
              </div>

              <div className="p-4 bg-surface-color rounded-lg">
                <h3 className="font-medium text-text-primary mb-2">Account Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Username:</span>
                    <span className="text-text-primary">@{user?.username}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Email:</span>
                    <span className="text-text-primary">{user?.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Member since:</span>
                    <span className="text-text-primary">
                      {new Date(user?.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="card border-error-color border-2">
            <div className="flex items-center gap-2 mb-6">
              <Trash2 className="w-5 h-5 text-error-color" />
              <h2 className="text-xl font-semibold text-error-color">Danger Zone</h2>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-error-color bg-opacity-10 rounded-lg">
                <h3 className="font-medium text-text-primary mb-2">Delete Account</h3>
                <p className="text-text-secondary text-sm mb-4">
                  Once you delete your account, there is no going back. Please be certain.
                </p>
                <button
                  onClick={handleDeleteAccount}
                  className="btn btn-danger"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="card">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Your Stats</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">Posts</span>
                <span className="font-semibold text-text-primary">0</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">Followers</span>
                <span className="font-semibold text-text-primary">0</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">Following</span>
                <span className="font-semibold text-text-primary">0</span>
              </div>
            </div>
          </div>

          {/* Help & Support */}
          <div className="card">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Help & Support</h3>
            <div className="space-y-3">
              <a
                href="#"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-color transition-colors"
              >
                <div className="w-8 h-8 bg-primary-color rounded-lg flex items-center justify-center">
                  <Edit3 className="w-4 h-4 text-white" />
                </div>
                <span className="text-text-primary">Writing Guide</span>
              </a>
              
              <a
                href="#"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-color transition-colors"
              >
                <div className="w-8 h-8 bg-warning-color rounded-lg flex items-center justify-center">
                  <Bell className="w-4 h-4 text-white" />
                </div>
                <span className="text-text-primary">AI Assistant Help</span>
              </a>
              
              <a
                href="#"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-color transition-colors"
              >
                <div className="w-8 h-8 bg-success-color rounded-lg flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <span className="text-text-primary">Community Guidelines</span>
              </a>
            </div>
          </div>

          {/* Current Theme Preview */}
          <div className="card">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Theme Preview</h3>
            <div className={`p-4 rounded-lg border ${
              theme === 'dark' 
                ? 'bg-gray-800 border-gray-600' 
                : 'bg-gray-100 border-gray-200'
            }`}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-primary-color rounded-full"></div>
                <div>
                  <div className="h-3 bg-text-primary rounded w-20 mb-1"></div>
                  <div className="h-2 bg-text-secondary rounded w-16"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-2 bg-text-primary rounded"></div>
                <div className="h-2 bg-text-secondary rounded w-3/4"></div>
                <div className="h-2 bg-text-secondary rounded w-1/2"></div>
              </div>
            </div>
            <p className="text-text-secondary text-sm mt-2 text-center">
              Current: {theme === 'dark' ? 'Dark' : 'Light'} theme
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
