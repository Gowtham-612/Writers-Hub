import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../App';

function SetPasswordPage() {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');

    if (!password || password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    try {
      setSubmitting(true);
      const response = await axios.post('/api/auth/set-password', { password });
      if (response?.data?.user) {
        login(response.data.user);
      }
      navigate('/dashboard');
    } catch (error) {
      const apiMessage = error?.response?.data?.error || 'Failed to set password. Please try again.';
      setErrorMessage(apiMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-2">Set your password</h2>
          <p className="text-sm text-text-secondary">Create a password to enable email sign-in next time.</p>
        </div>

        <div className="card p-6">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium mb-1">New password</label>
              <input
                type="password"
                className="input w-full"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter a strong password"
                minLength={8}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Confirm password</label>
              <input
                type="password"
                className="input w-full"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                minLength={8}
                required
              />
            </div>

            {errorMessage && (
              <div className="text-sm text-red-500">{errorMessage}</div>
            )}

            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={submitting}
            >
              {submitting ? 'Saving...' : 'Save password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default SetPasswordPage;


