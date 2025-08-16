import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import {
  Bot,
  Sparkles,
  ArrowLeft,
  Send,
  Plus,
  Trash2,
  Loader,
  MessageCircle,
  Clock,
  User
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import '../Styling/AiAssistPage.css';


const AiAssistPage = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [apiStatus, setApiStatus] = useState('checking');

  useEffect(() => {
    checkApiStatus();
    fetchSessions();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (currentSession) {
      fetchMessages(currentSession.id);
    }
    // eslint-disable-next-line
  }, [currentSession]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const checkApiStatus = async () => {
    try {
      const response = await axios.get('/api/ai/status');
      setApiStatus(response.data.status);
    } catch (error) {
      setApiStatus('disconnected');
    }
  };

  const fetchSessions = async () => {
    try {
      const response = await axios.get('/api/ai/chat/sessions');
      setSessions(response.data);
      if (!currentSession && response.data.length > 0) {
        setCurrentSession(response.data[0]);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  const fetchMessages = async (sessionId) => {
    try {
      const response = await axios.get(`/api/ai/chat/history/${sessionId}`);
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const startNewSession = async () => {
    try {
      setLoading(true);
      const response = await axios.post('/api/ai/chat/start');
      const newSession = {
        id: response.data.session_id,
        created_at: new Date().toISOString(),
        first_message: 'New conversation'
      };
      setSessions([newSession, ...sessions]);
      setCurrentSession(newSession);
      setMessages([]);
      toast.success('New chat session started!');
    } catch (error) {
      console.error('Error starting new session:', error);
      toast.error('Failed to start new session');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !currentSession) return;
    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: inputMessage.trim(),
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setSending(true);

    try {
      const response = await axios.post('/api/ai/chat/message', {
        message: userMessage.content,
        session_id: currentSession.id
      });
      const aiMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: response.data.message,
        created_at: response.data.timestamp
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error(error.response?.data?.error || 'Failed to send message');
      setMessages(prev => prev.filter(msg => msg.id !== userMessage.id));
    } finally {
      setSending(false);
    }
  };

  const deleteSession = async (sessionId) => {
    try {
      await axios.delete(`/api/ai/chat/session/${sessionId}`);
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      if (currentSession?.id === sessionId) {
        setCurrentSession(null);
        setMessages([]);
      }
      toast.success('Chat session deleted');
    } catch (error) {
      console.error('Error deleting session:', error);
      toast.error('Failed to delete session');
    }
  };

  const formatTime = (timestamp) =>
    new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString();
  };

  const MessageBubble = ({ message }) => (
    <div className={`ai-assist-message-row ${message.role === 'user' ? 'user' : 'assistant'}`}>
      <div className={`ai-assist-message-bubble ${message.role}`}>
        <div className="ai-assist-message-content">{message.content}</div>
        <div className="ai-assist-message-time">{formatTime(message.created_at)}</div>
      </div>
    </div>
  );

  return (
    <div className="ai-assist-container">
      {/* Header */}
      <header className="ai-assist-header">
        <div className="ai-assist-header-left">
          <button onClick={() => navigate('/dashboard')} className="btn-icon" aria-label="Back to dashboard">
            <ArrowLeft className="icon" />
          </button>
          <div className="ai-assist-header-text">
            <h1>AI Writing Assistant</h1>
            <p>Chat with DeepSeek AI via OpenRouter for writing help and inspiration</p>
          </div>
        </div>
        <div className="ai-assist-status">
          <span className={`ai-assist-status-dot ${apiStatus === 'connected' ? 'connected' : 'disconnected'}`}></span>
          <span className="ai-assist-status-text">
            OpenRouter: {apiStatus === 'connected' ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </header>

      <main className="ai-assist-main">
        {/* Sidebar */}
        <aside className="ai-assist-sidebar">
          <div className="ai-assist-sidebar-header">
            <button
              onClick={startNewSession}
              disabled={loading || apiStatus !== 'connected'}
              className="ai-assist-sidebar-btn"
            >
              {loading ? <Loader className="icon-spin" /> : <Plus className="icon" />}
              {loading ? 'Starting...' : 'New Chat'}
            </button>
          </div>
          <div className="ai-assist-sessions">
            {sessions.length === 0 ? (
              <div className="ai-assist-empty-state">
                <MessageCircle className="empty-icon" />
                <p>No chat sessions yet</p>
                <p className="empty-subtext">Start a new conversation to begin</p>
              </div>
            ) : (
              sessions.map(session => (
                <div
                  key={session.id}
                  className={`ai-assist-session ${currentSession?.id === session.id ? 'active' : ''}`}
                  onClick={() => setCurrentSession(session)}
                >
                  <div className="session-info">
                    <p className="ai-assist-session-title">{session.first_message || 'New conversation'}</p>
                    <p className="ai-assist-session-date">{formatDate(session.created_at)}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSession(session.id);
                    }}
                    className="btn-delete-session"
                    aria-label="Delete session"
                    title="Delete session"
                  >
                    <Trash2 className="icon-small" />
                  </button>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* Chat */}
        <section className="ai-assist-chat">
          {currentSession ? (
            <>
              <div className="ai-assist-messages">
                {messages.map(message => (
                  <MessageBubble key={message.id} message={message} />
                ))}
                {sending && (
                  <div className="ai-assist-message-row assistant">
                    <div className="ai-assist-message-bubble assistant loading">
                      <Loader className="icon-spin" />
                      <span>AI is thinking...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              <div className="ai-assist-input-bar">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={e => setInputMessage(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  placeholder="Type your message..."
                  className="ai-assist-input"
                  disabled={sending || apiStatus !== 'connected'}
                />
                <button
                  onClick={sendMessage}
                  disabled={!inputMessage.trim() || sending || apiStatus !== 'connected'}
                  className="ai-assist-send-btn"
                  aria-label="Send message"
                >
                  {sending ? <Loader className="icon-spin" /> : <Send className="icon" />}
                </button>
              </div>
            </>
          ) : (
            <div className="ai-assist-empty-state chat-empty">
              <MessageCircle className="empty-icon" />
              <h3>Select a chat session</h3>
              <p>Choose an existing conversation or start a new one</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default AiAssistPage;
