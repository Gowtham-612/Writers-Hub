import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../App';
import { 
  PenTool, 
  MessageCircle, 
  Brain,
  BookOpen,
  Feather,
  Users,
  Sparkles,
  Eye,
  Heart,
  Star,
  CheckCircle
} from 'lucide-react';
import './LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleGoogleSignUp = () => {
    const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
    window.location.href = `${backendUrl}/api/auth/google`;
  };

  const handleGoogleLogin = () => {
    const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
    window.location.href = `${backendUrl}/api/auth/google`;
  };

  const handleLogin = async (e) => {
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
    <div className="landing-page">
    <div className="container">
  {/* Left side branding */}
  <div className="brand-section">
    <h1>Writers Hub</h1>
    <div class="typewriter">
  <p class="line1">Welcome to Writers Hub — a place for every storyteller.</p>
  <p class="line2">Share your words, inspire minds, and leave a legacy.</p>
  <p class="line3">Write boldly. Read deeply. Connect endlessly.</p>
</div>

  </div>

  {/* Right side form */}
  <div className="form-section">
    <form onSubmit={handleLogin}>
      <label>Email</label>
      <input type="email" value={email} placeholder="Enter your email" onChange={(e) => setEmail(e.target.value)} required />

      <label>Password</label>
      <input type="password" value={password}  placeholder="Enter your password" onChange={(e) => setPassword(e.target.value)} required />

      <button type="submit" disabled={submitting}>
        {submitting ? 'Signing in…' : 'Sign in'}
      </button>
    </form>

    <div className="divider">
      <span></span>
      <p>OR</p>
      <span></span>
    </div>

    <button className="google-login" onClick={handleGoogleLogin}>
      Log in with Google
    </button>

    <div className="signup">
      <p>Don't have an account? <Link to="/register">Sign up</Link></p>
    </div>
  </div>
</div>
</div>
  );
};

export default LandingPage;
