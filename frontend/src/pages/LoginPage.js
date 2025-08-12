import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import { Edit3, Chrome } from 'lucide-react';
import axios from 'axios';

const LoginPage = () => {
  const { user, login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // Check if user is already logged in
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleGoogleLogin = () => {
    try {
      // Redirect to backend Google OAuth endpoint
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
      console.log('Redirecting to Google OAuth:', `${backendUrl}/api/auth/google`);
      window.location.href = `${backendUrl}/api/auth/google`;
    } catch (error) {
      console.error('Google login error:', error);
      alert('Failed to initiate Google login. Please try again.');
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    try {
      setSubmitting(true);
      const response = await axios.post('/api/auth/login', { email, password });
      if (response?.data?.user) {
        login(response.data.user);
        navigate('/dashboard');
      }
    } catch (error) {
      const apiMessage = error?.response?.data?.error || 'Login failed. Please try again.';
      setErrorMessage(apiMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-color flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-primary-color rounded-2xl flex items-center justify-center">
              <Edit3 className="w-8 h-8 text-white" />
            </div>
          </div>
          
          <h2 className="text-3xl font-bold text-text-primary mb-2">
            Welcome to Writers Hub
          </h2>
          <p className="text-text-secondary">
            Sign in to start sharing your stories with the world
          </p>
        </div>

        <div className="card">
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-text-primary mb-4 text-center">
                Sign in to your account
              </h3>
            </div>

            <button
              onClick={handleGoogleLogin}
              className="w-full btn btn-primary py-3 text-base font-medium"
            >
              <Chrome className="w-5 h-5" />
              Continue with Google
            </button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border-color" />
              <span className="text-xs text-text-secondary">or</span>
              <div className="flex-1 h-px bg-border-color" />
            </div>

            <form className="space-y-4" onSubmit={handleEmailLogin}>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  className="input w-full"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Password</label>
                <input
                  type="password"
                  className="input w-full"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  required
                />
              </div>

              {errorMessage && (
                <div className="text-sm text-error-color">{errorMessage}</div>
              )}

              <button type="submit" className="btn btn-secondary w-full" disabled={submitting}>
                {submitting ? 'Signing in...' : 'Sign in'}
              </button>
            </form>

            <div className="text-center">
              <p className="text-sm text-text-secondary">
                By signing in, you agree to our{' '}
                <a href="#" className="text-primary-color hover:underline">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="text-primary-color hover:underline">
                  Privacy Policy
                </a>
              </p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <p className="text-text-secondary">
            Don't have an account?{' '}
            <button
              onClick={handleGoogleLogin}
              className="text-primary-color hover:underline font-medium"
            >
              Sign up with Google
            </button>
          </p>
        </div>

        {/* Features preview */}
        <div className="mt-12">
          <h3 className="text-lg font-semibold text-text-primary mb-4 text-center">
            What you'll get access to:
          </h3>
          <div className="grid grid-cols-1 gap-3">
            <div className="flex items-center gap-3 text-sm text-text-secondary">
              <div className="w-2 h-2 bg-primary-color rounded-full"></div>
              Rich text editor for creating beautiful posts
            </div>
            <div className="flex items-center gap-3 text-sm text-text-secondary">
              <div className="w-2 h-2 bg-primary-color rounded-full"></div>
              AI-powered writing assistant
            </div>
            <div className="flex items-center gap-3 text-sm text-text-secondary">
              <div className="w-2 h-2 bg-primary-color rounded-full"></div>
              Real-time chat with other writers
            </div>
            <div className="flex items-center gap-3 text-sm text-text-secondary">
              <div className="w-2 h-2 bg-primary-color rounded-full"></div>
              File import from PDF, DOCX, and TXT
            </div>
            <div className="flex items-center gap-3 text-sm text-text-secondary">
              <div className="w-2 h-2 bg-primary-color rounded-full"></div>
              Connect with a community of writers
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
