import React, { useState, useEffect, useContext, useRef } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../App';
import { Search, MessageCircle, User, ArrowRight, X } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import './ChatListPage.css';

const ChatListPage = () => {
  const { user } = useContext(AuthContext);
  const [conversations, setConversations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchTimeoutRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/chat/conversations');
      setConversations(res.data);
    } catch (err) {
      toast.error('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowSuggestions(false);
      return;
    }

    try {
      setSearching(true);
      const res = await axios.get(`/api/users/search/${encodeURIComponent(searchQuery)}?limit=10&page=1`);
      setSearchResults(res.data || []);
      setShowSuggestions(true);
    } catch (err) {
      toast.error('Failed to search users');
    } finally {
      setSearching(false);
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (!value.trim()) {
      setSearchResults([]);
      setShowSuggestions(false);
      return;
    }

    searchTimeoutRef.current = setTimeout(() => {
      handleSearch();
    }, 300);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowSuggestions(false);
    if (searchInputRef.current) searchInputRef.current.focus();
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / 3600000);
    if (diffInHours < 24) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diffInHours < 48) return 'Yesterday';
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="chatlist-container">
      {/* Header */}
      <div className="chatlist-header">
        <h1>Messages</h1>
        <p>Chat with other writers and collaborators</p>
      </div>

      {/* Search Bar */}
      <div className="chatlist-search-card">
        <form onSubmit={handleSearch} className="chatlist-search-form">
          <div className="chatlist-search-input-wrap" ref={searchInputRef}>
            <Search className="chatlist-search-icon" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => searchQuery.trim() && setShowSuggestions(true)}
              placeholder="Search for users..."
              className="chatlist-search-input"
              ref={searchInputRef}
            />
            {searchQuery && (
              <button type="button" onClick={handleClearSearch} className="chatlist-clear-btn">
                <X size={16} />
              </button>
            )}

            {/* Suggestions */}
            {showSuggestions && searchResults.length > 0 && (
              <div className="chatlist-suggestions">
                {searching ? (
                  <div className="chatlist-loading-spinner"></div>
                ) : (
                  searchResults.map((u) => (
                    <Link
                      key={u.id}
                      to={`/chat/${u.id}`}
                      className="chatlist-suggestion-item"
                      onClick={() => setShowSuggestions(false)}
                    >
                      <img
                        src={u.profile_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.display_name || u.username)}&background=3b82f6&color=fff`}
                        alt={u.display_name || u.username}
                        className="chatlist-suggestion-avatar"
                      />
                      <div>
                        <div className="chatlist-suggestion-name">{u.display_name || u.username}</div>
                        <div className="chatlist-suggestion-username">@{u.username}</div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            )}
          </div>
          <button type="submit" className="chatlist-search-btn">
            <Search size={16} /> Search
          </button>
        </form>
      </div>

      {/* Conversations */}
      <div className="chatlist-card">
        <h3>Recent Conversations</h3>
        {loading ? (
          <div className="chatlist-loading">Loading...</div>
        ) : conversations.length === 0 ? (
          <div className="chatlist-empty">
            <MessageCircle size={40} />
            <p>No conversations yet</p>
          </div>
        ) : (
          conversations.map((c) => (
            <Link
              key={c.chat_id}
              to={`/chat/${c.other_user_id}`}
              className="chatlist-item"
            >
              <div className="chatlist-avatar-wrap">
                <img
                  src={c.other_profile_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.other_display_name || c.other_username)}&background=3b82f6&color=fff`}
                  alt={c.other_display_name || c.other_username}
                  className="chatlist-avatar"
                />
                {c.unread_count > 0 && (
                  <span className="chatlist-unread">{c.unread_count}</span>
                )}
              </div>
              <div className="chatlist-info">
                <div className="chatlist-info-top">
                  <span className="chatlist-name">{c.other_display_name || c.other_username}</span>
                  <span className="chatlist-time">{formatTime(c.last_message_time)}</span>
                </div>
                <p className="chatlist-lastmsg">{c.last_message || 'Start a conversation'}</p>
              </div>
              <ArrowRight className="chatlist-arrow" />
            </Link>
          ))
        )}
      </div>
    </div>
  );
};

export default ChatListPage;
