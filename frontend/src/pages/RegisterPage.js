import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../App';
import '../Styling/RegisterPage.css'; // Uncomment after creating your CSS file!

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
    <div className="register-root">
      <div className="register-card-container">
        <div className="register-title-group">
          <h2 className="register-title">Create your account</h2>
          <p className="register-subtitle">Sign up with your email or continue with Google.</p>
        </div>

        <div className="register-card">
          <div className="register-divider">
            <div className="register-line" />
            <span className="register-divider-label">Create with email</span>
            <div className="register-line" />
          </div>

          <form className="register-form" onSubmit={handleRegister}>
            <div className="register-input-group">
              <label className="register-label">Email</label>
              <input
                type="email"
                className="register-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="register-input-group">
              <label className="register-label">Password</label>
              <input
                type="password"
                className="register-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                minLength={8}
                required
              />
            </div>

            {errorMessage && (
              <div className="register-error">{errorMessage}</div>
            )}

            <button type="submit" className="register-btn-secondary" disabled={submitting}>
              {submitting ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <div className="register-divider register-or">
            <div className="register-line" />
            <span className="register-divider-label">or</span>
            <div className="register-line" />
          </div>
          <button
            onClick={handleGoogleRegister}
            className="register-btn-primary"
          >
            Sign up with Google
          </button>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
