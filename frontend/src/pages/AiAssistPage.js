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
  }, []);

  useEffect(() => {
    if (currentSession) {
      fetchMessages(currentSession.id);
    }
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
      
      // If no current session and we have sessions, select the most recent one
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
      
      // Remove the user message if it failed
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

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const MessageBubble = ({ message }) => (
    <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[70%] ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
        <div className={`flex items-start gap-2 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
            message.role === 'user' 
              ? 'bg-primary-color text-white' 
              : 'bg-surface-color text-text-primary'
          }`}>
            {message.role === 'user' ? (
              <User className="w-4 h-4" />
            ) : (
              <Bot className="w-4 h-4" />
            )}
          </div>
          <div className={`rounded-lg px-4 py-3 ${
            message.role === 'user'
              ? 'bg-primary-color text-white'
              : 'bg-surface-color text-text-primary'
          }`}>
            <div className="whitespace-pre-wrap leading-relaxed">
              {message.role === 'assistant' ? (
                <div className="prose prose-sm max-w-none">
                  {message.content.split('\n').map((line, index) => {
                    // Handle different types of content formatting
                    if (line.trim().startsWith('**') && line.trim().endsWith('**')) {
                      // Bold text
                      return (
                        <p key={index} className="font-semibold text-base mb-2">
                          {line.trim().replace(/\*\*/g, '')}
                        </p>
                      );
                    } else if (line.trim().startsWith('#')) {
                      // Headers
                      const level = line.match(/^#+/)[0].length;
                      const text = line.replace(/^#+\s*/, '');
                      const Tag = `h${Math.min(level, 6)}`;
                      return (
                        <Tag key={index} className={`font-bold mb-2 ${
                          level === 1 ? 'text-lg' : 
                          level === 2 ? 'text-base' : 'text-sm'
                        }`}>
                          {text}
                        </Tag>
                      );
                    } else if (line.trim().startsWith('- ') || line.trim().startsWith('• ')) {
                      // Bullet points
                      return (
                        <div key={index} className="flex items-start mb-1">
                          <span className="mr-2 text-text-secondary">•</span>
                          <span>{line.trim().replace(/^[-•]\s*/, '')}</span>
                        </div>
                      );
                    } else if (line.trim().startsWith('1. ') || line.trim().startsWith('2. ') || line.trim().startsWith('3. ')) {
                      // Numbered lists
                      return (
                        <div key={index} className="flex items-start mb-1">
                          <span className="mr-2 text-text-secondary font-mono text-sm">
                            {line.match(/^\d+\./)[0]}
                          </span>
                          <span>{line.trim().replace(/^\d+\.\s*/, '')}</span>
                        </div>
                      );
                    } else if (line.trim() === '') {
                      // Empty lines for spacing
                      return <div key={index} className="h-2"></div>;
                    } else if (line.trim().startsWith('>')) {
                      // Blockquotes
                      return (
                        <blockquote key={index} className="border-l-4 border-primary-color pl-3 italic text-text-secondary mb-2">
                          {line.trim().replace(/^>\s*/, '')}
                        </blockquote>
                      );
                    } else if (line.trim().startsWith('```')) {
                      // Code blocks (simple handling)
                      return (
                        <div key={index} className="bg-gray-100 dark:bg-gray-800 rounded p-2 font-mono text-sm mb-2">
                          {line.trim().replace(/^```/, '')}
                        </div>
                      );
                    } else {
                      // Regular paragraphs
                      return (
                        <p key={index} className="mb-2 last:mb-0">
                          {line}
                        </p>
                      );
                    }
                  })}
                </div>
              ) : (
                // User messages remain simple
                <div>{message.content}</div>
              )}
            </div>
            <div className={`text-xs mt-2 ${
              message.role === 'user' ? 'text-white/70' : 'text-text-secondary'
            }`}>
              {formatTime(message.created_at)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-border-color">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 rounded-lg hover:bg-surface-color transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">AI Writing Assistant</h1>
            <p className="text-text-secondary">
              Chat with DeepSeek AI via OpenRouter for writing help and inspiration
            </p>
          </div>
        </div>

        {/* API Status */}
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            apiStatus === 'connected' ? 'bg-success-color' : 'bg-error-color'
          }`}></div>
          <span className="text-sm text-text-secondary">
            OpenRouter: {apiStatus === 'connected' ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Chat Sessions */}
        <div className="w-80 border-r border-border-color flex flex-col">
          <div className="p-4 border-b border-border-color">
            <button
              onClick={startNewSession}
              disabled={loading || apiStatus !== 'connected'}
              className="w-full btn btn-primary"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  New Chat
                </>
              )}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {sessions.length === 0 ? (
              <div className="p-4 text-center">
                <MessageCircle className="w-12 h-12 text-text-secondary mx-auto mb-4" />
                <p className="text-text-secondary">No chat sessions yet</p>
                <p className="text-text-secondary text-sm">Start a new conversation to begin</p>
              </div>
            ) : (
              <div className="p-2">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors mb-2 ${
                      currentSession?.id === session.id
                        ? 'bg-primary-color text-white'
                        : 'hover:bg-surface-color text-text-primary'
                    }`}
                    onClick={() => setCurrentSession(session)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium truncate ${
                          currentSession?.id === session.id ? 'text-white' : 'text-text-primary'
                        }`}>
                          {session.first_message || 'New conversation'}
                        </p>
                        <p className={`text-xs ${
                          currentSession?.id === session.id ? 'text-white/70' : 'text-text-secondary'
                        }`}>
                          {formatDate(session.created_at)}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSession(session.id);
                        }}
                        className={`p-1 rounded hover:bg-opacity-20 ${
                          currentSession?.id === session.id 
                            ? 'hover:bg-white text-white' 
                            : 'hover:bg-error-color text-text-secondary'
                        }`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {currentSession ? (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6">
                {messages.length === 0 ? (
                  <div className="text-center py-12">
                    <Bot className="w-16 h-16 text-text-secondary mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-text-primary mb-2">
                      Welcome to your AI Writing Assistant!
                    </h3>
                    <p className="text-text-secondary mb-6">
                      Ask me anything about writing, brainstorming, editing, or creative inspiration.
                    </p>
                    <div className="space-y-2 text-sm text-text-secondary">
                      <p>💡 "Help me brainstorm ideas for a sci-fi story"</p>
                      <p>✍️ "Review this paragraph and suggest improvements"</p>
                      <p>🎭 "Create a character profile for a detective"</p>
                      <p>📝 "Help me write a compelling opening scene"</p>
                    </div>
                  </div>
                ) : (
                  <div>
                    {messages.map((message) => (
                      <MessageBubble key={message.id} message={message} />
                    ))}
                    {sending && (
                      <div className="flex justify-start mb-4">
                        <div className="flex items-start gap-2">
                          <div className="w-8 h-8 rounded-full bg-surface-color flex items-center justify-center">
                            <Bot className="w-4 h-4 text-text-primary" />
                          </div>
                          <div className="bg-surface-color rounded-lg px-4 py-2">
                            <div className="flex items-center gap-2">
                              <Loader className="w-4 h-4 animate-spin text-text-secondary" />
                              <span className="text-text-secondary">AI is thinking...</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Input Area */}
              <div className="p-6 border-t border-border-color">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    placeholder="Type your message..."
                    className="flex-1 form-input"
                    disabled={sending || apiStatus !== 'connected'}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!inputMessage.trim() || sending || apiStatus !== 'connected'}
                    className="btn btn-primary"
                  >
                    {sending ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {apiStatus !== 'connected' && (
                  <div className="mt-2 p-3 bg-error-color/10 border border-error-color/20 rounded-lg">
                    <p className="text-error-color text-sm">
                      OpenRouter API is not connected. Please check your backend configuration.
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 text-text-secondary mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-text-primary mb-2">
                  Select a chat session
                </h3>
                <p className="text-text-secondary">
                  Choose an existing conversation or start a new one
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AiAssistPage;
