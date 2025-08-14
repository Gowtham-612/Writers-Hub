import React, { useState, useEffect, useContext, useRef } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../App';
import { 
  Search, 
  MessageCircle, 
  User,
  Plus,
  Clock,
  ArrowRight,
  X
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

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
      const response = await axios.get('/api/chat/conversations');
      setConversations(response.data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
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
      const response = await axios.get(`/api/users/search/${encodeURIComponent(searchQuery)}?limit=10&page=1`);
      setSearchResults(response.data || []);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error searching users:', error);
      toast.error('Failed to search users');
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };
  
  const handleSearchInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    // Clear any existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    if (value.trim() === '') {
      setSearchResults([]);
      setShowSuggestions(false);
      return;
    }
    
    // Set a new timeout to search after typing stops
    searchTimeoutRef.current = setTimeout(() => {
      handleSearch();
    }, 300); // 300ms delay
  };
  
  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowSuggestions(false);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };
  
  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchInputRef.current && !searchInputRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const formatTime = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-2">Messages</h1>
        <p className="text-text-secondary">
          Chat with other writers and collaborators
        </p>
      </div>

      {/* Search Bar */}
      <div className="card mb-6">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="flex-1 relative" ref={searchInputRef}>
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchInputChange}
              onFocus={() => searchQuery.trim() !== '' && setShowSuggestions(true)}
              placeholder="Search for users to message..."
              className="form-input pl-10 pr-10"
              ref={searchInputRef}
            />
            {searchQuery && (
              <button 
                type="button" 
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary hover:text-text-primary"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            
            {/* Suggestions Dropdown */}
            {showSuggestions && searchResults.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-background-color border border-border-color rounded-md shadow-lg">
                {searching ? (
                  <div className="p-3 text-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-color mx-auto"></div>
                  </div>
                ) : (
                  <div className="max-h-60 overflow-y-auto py-1">
                    {searchResults.map((user) => (
                      <Link 
                        key={user.id} 
                        to={`/chat/${user.id}`}
                        className="flex items-center gap-3 px-3 py-2 hover:bg-surface-color transition-colors"
                        onClick={() => setShowSuggestions(false)}
                      >
                        <img
                          src={user.profile_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.display_name || user.username)}&background=3b82f6&color=fff`}
                          alt={user.display_name || user.username}
                          className="w-8 h-8 rounded-full"
                        />
                        <div>
                          <div className="font-semibold text-text-primary">
                            {user.display_name || user.username}
                          </div>
                          <div className="text-xs text-text-secondary">@{user.username}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <button type="submit" className="btn btn-primary">
            {searching ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <>
                <Search className="w-4 h-4" />
                Search
              </>
            )}
          </button>
        </form>
      </div>

      {/* Search Results (Full Page) */}
      {searchResults.length > 0 && !showSuggestions && (
        <div className="card mb-6">
          <h3 className="text-lg font-semibold text-text-primary mb-4">People</h3>
          <div className="space-y-3">
            {searchResults.map((user) => (
              <div key={user.id} className="flex items-center gap-3">
                <img
                  src={user.profile_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.display_name || user.username)}&background=3b82f6&color=fff`}
                  alt={user.display_name || user.username}
                  className="w-10 h-10 rounded-full"
                />
                <div className="flex-1">
                  <div className="font-semibold text-text-primary">
                    {user.display_name || user.username}
                  </div>
                  <div className="text-sm text-text-secondary">@{user.username}</div>
                </div>
                <Link to={`/chat/${user.id}`} className="btn btn-primary">
                  <MessageCircle className="w-4 h-4" />
                  Message
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Conversations List */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-text-primary">Recent Conversations</h3>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-color mx-auto mb-4"></div>
            <p className="text-text-secondary">Loading conversations...</p>
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className="w-16 h-16 text-text-secondary mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-text-primary mb-2">No conversations yet</h3>
            <p className="text-text-secondary mb-6">
              Search for users above to start a new conversation
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((conversation) => (
              <Link 
                key={conversation.chat_id} 
                to={`/chat/${conversation.other_user_id}`}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-color transition-colors"
              >
                <div className="relative">
                  <img
                    src={conversation.other_profile_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(conversation.other_display_name || conversation.other_username)}&background=3b82f6&color=fff`}
                    alt={conversation.other_display_name || conversation.other_username}
                    className="w-12 h-12 rounded-full"
                  />
                  {conversation.unread_count > 0 && (
                    <div className="absolute -top-1 -right-1 bg-primary-color text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                      {conversation.unread_count}
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold text-text-primary truncate">
                      {conversation.other_display_name || conversation.other_username}
                    </h4>
                    <span className="text-xs text-text-secondary whitespace-nowrap">
                      {formatTime(conversation.last_message_time)}
                    </span>
                  </div>
                  <p className="text-sm text-text-secondary truncate">
                    {conversation.last_message || 'Start a conversation'}
                  </p>
                </div>
                
                <ArrowRight className="w-4 h-4 text-text-secondary" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatListPage;