import React, { useState, useContext, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../App';
import '../Styling/LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const homeRef = useRef(null);
  const aboutRef = useRef(null);
  const joinRef = useRef(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const scrollToSection = (ref) => {
    ref.current.scrollIntoView({ behavior: 'smooth' });
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
      {/* Navbar */}
      <nav className="navbar2">
        <div className="nav-logo">Writers Hub</div>
        <div className="nav-links">
          <button onClick={() => scrollToSection(homeRef)}>Home</button>
          <button onClick={() => scrollToSection(aboutRef)}>About</button>
          <button onClick={() => scrollToSection(joinRef)}>Join Us</button>
        </div>
      </nav>

      {/* Home Section */}
      <section ref={homeRef} className="home-section">
        <div className="container">
          <div className="brand-section">
            <h1>Writers Hub</h1>
            <div className="typewriter">
              <p className="line1">Welcome to Writers Hub — a place for every storyteller.</p>
              <p className="line2">Share your words, inspire minds, and leave a legacy.</p>
              <p className="line3">Write boldly. Read deeply. Connect endlessly.</p>
            </div>
          </div>

          <div className="form-section">
            <form onSubmit={handleLogin}>
              <label>Email</label>
              <input type="email" value={email} placeholder="Enter your email" onChange={(e) => setEmail(e.target.value)} required />

              <label>Password</label>
              <input type="password" value={password} placeholder="Enter your password" onChange={(e) => setPassword(e.target.value)} required />

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
      </section>

      {/* About Section */}
      <section ref={aboutRef} className="about-section">
        <h2>About Writers Hub</h2>
        <p>
          Writers Hub is your creative home — a place where authors, poets, and storytellers from all walks of life can share their work,
          collaborate, and connect. Whether you write to inspire, entertain, or provoke thought, we give your words the space they deserve.
        </p>
      </section>

      {/* Join Us Section */}
      <section ref={joinRef} className="join-section">
        <h2>Join Our Community</h2>
        <p>Become part of a growing network of passionate writers and readers.</p>
        <button onClick={() => navigate('/register')} className="join-btn">
          Join Us
        </button>
      </section>
    </div>
  );
};

export default LandingPage;
