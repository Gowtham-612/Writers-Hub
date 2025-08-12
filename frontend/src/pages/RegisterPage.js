import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../App';

function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleRegister = async (event) => {
    event.preventDefault();
    setErrorMessage('');

    if (!email || !password) {
      setErrorMessage('Email and password are required');
      return;
    }
    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters');
      return;
    }

    try {
      setSubmitting(true);
      const response = await axios.post('/api/auth/register', { email, password });
      if (response?.data?.user) {
        login(response.data.user);
        navigate('/dashboard');
      }
    } catch (error) {
      const apiMessage = error?.response?.data?.error || 'Registration failed. Please try again.';
      setErrorMessage(apiMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleRegister = () => {
    const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
    window.location.href = `${backendUrl}/api/auth/google`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-2">Create your account</h2>
          <p className="text-sm text-text-secondary">Sign up with your email or continue with Google.</p>
        </div>

        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border-color" />
            <span className="text-xs text-text-secondary">Create with email</span>
            <div className="flex-1 h-px bg-border-color" />
          </div>

          <form className="space-y-4" onSubmit={handleRegister}>
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
                placeholder="At least 8 characters"
                minLength={8}
                required
              />
            </div>

            {errorMessage && (
              <div className="text-sm text-error-color">{errorMessage}</div>
            )}

            <button type="submit" className="btn btn-secondary w-full" disabled={submitting}>
              {submitting ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <div className="flex items-center gap-3 mt-6">
            <div className="flex-1 h-px bg-border-color" />
            <span className="text-xs text-text-secondary">or</span>
            <div className="flex-1 h-px bg-border-color" />
          </div>
          <button
            onClick={handleGoogleRegister}
            className="btn btn-primary w-full"
          >
            Sign up with Google
          </button>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;


