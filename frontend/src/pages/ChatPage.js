import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AuthContext } from '../App';
import { 
  Send, 
  ArrowLeft, 
  User, 
  MessageCircle, 
  MoreVertical,
  Search,
  Clock
} from 'lucide-react';
import io from 'socket.io-client';
import axios from 'axios';
import toast from 'react-hot-toast';

const ChatPage = () => {
  const { userId } = useParams();
  const { user } = useContext(AuthContext);
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatId, setChatId] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    initializeChat();
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [userId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeChat = async () => {
    try {
      // Get or create chat
      const chatResponse = await axios.get(`/api/chat/with/${userId}`);
      setChatId(chatResponse.data.chat_id);

      // Get other user info
      const userResponse = await axios.get(`/api/users/profile/${userId}`);
      setOtherUser(userResponse.data);

      // Get chat messages
      const messagesResponse = await axios.get(`/api/chat/${chatResponse.data.chat_id}/messages`);
      setMessages(messagesResponse.data);

      // Initialize Socket.io
      const newSocket = io('http://localhost:5000');
      setSocket(newSocket);

      newSocket.on('connect', () => {
        console.log('Connected to chat server');
        newSocket.emit('authenticate', user.id);
      });

      newSocket.on('authenticated', (data) => {
        console.log('Authenticated with chat server');
        newSocket.emit('join_chat', chatResponse.data.chat_id);
      });

      newSocket.on('new_message', (data) => {
        if (data.chatId === chatResponse.data.chat_id) {
          setMessages(prev => [...prev, data.message]);
        }
      });

      newSocket.on('user_typing', (data) => {
        if (data.chatId === chatResponse.data.chat_id && data.userId !== user.id) {
          setIsTyping(true);
        }
      });

      newSocket.on('user_stopped_typing', (data) => {
        if (data.chatId === chatResponse.data.chat_id && data.userId !== user.id) {
          setIsTyping(false);
        }
      });

      newSocket.on('error', (error) => {
        console.error('Socket error:', error);
        toast.error('Connection error');
      });

    } catch (error) {
      console.error('Error initializing chat:', error);
      toast.error('Failed to load chat');
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !socket) return;

    try {
      setSending(true);
      
      // Emit message through socket
      socket.emit('send_message', {
        chatId: chatId,
        content: newMessage.trim()
      });

      setNewMessage('');
      
      // Clear typing indicator
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
      socket.emit('typing_stop', { chatId });
      
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    
    if (socket) {
      // Emit typing start
      socket.emit('typing_start', { chatId });
      
      // Clear existing timeout
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
      
      // Set new timeout to stop typing indicator
      const timeout = setTimeout(() => {
        socket.emit('typing_stop', { chatId });
      }, 1000);
      
      setTypingTimeout(timeout);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return 'Today';
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-color mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading chat...</p>
        </div>
      </div>
    );
  }

  if (!otherUser) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <User className="w-16 h-16 text-text-secondary mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-text-primary mb-4">User not found</h2>
          <p className="text-text-secondary mb-6">The user you're trying to chat with doesn't exist.</p>
          <Link to="/dashboard" className="btn btn-primary">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto h-screen flex flex-col">
      {/* Chat Header */}
      <div className="card mb-0 rounded-b-none border-b-0">
        <div className="flex items-center gap-4">
          <Link
            to="/dashboard"
            className="p-2 rounded-lg hover:bg-surface-color transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          
          <img
            src={otherUser.profile_image || `https://ui-avatars.com/api/?name=${otherUser.display_name}&background=3b82f6&color=fff`}
            alt={otherUser.display_name}
            className="w-10 h-10 rounded-full"
          />
          
          <div className="flex-1">
            <h2 className="font-semibold text-text-primary">
              {otherUser.display_name || otherUser.username}
            </h2>
            <p className="text-sm text-text-secondary">
              {isTyping ? 'typing...' : 'online'}
            </p>
          </div>
          
          <button className="p-2 rounded-lg hover:bg-surface-color transition-colors">
            <MoreVertical className="w-5 h-5 text-text-secondary" />
          </button>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto bg-surface-color p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className="w-16 h-16 text-text-secondary mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-text-primary mb-2">Start a conversation</h3>
            <p className="text-text-secondary">
              Send a message to begin chatting with {otherUser.display_name || otherUser.username}
            </p>
          </div>
        ) : (
          messages.map((message, index) => {
            const isOwnMessage = message.sender_id === user.id;
            const showDate = index === 0 || 
              formatDate(message.created_at) !== formatDate(messages[index - 1].created_at);

            return (
              <div key={message.id}>
                {/* Date Separator */}
                {showDate && (
                  <div className="flex justify-center my-4">
                    <div className="bg-background-color px-3 py-1 rounded-full text-xs text-text-secondary">
                      {formatDate(message.created_at)}
                    </div>
                  </div>
                )}

                {/* Message */}
                <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    isOwnMessage 
                      ? 'bg-primary-color text-white' 
                      : 'bg-background-color text-text-primary'
                  }`}>
                    <p className="text-sm">{message.content}</p>
                    <div className={`flex items-center gap-1 mt-1 text-xs ${
                      isOwnMessage ? 'text-blue-100' : 'text-text-secondary'
                    }`}>
                      <Clock className="w-3 h-3" />
                      {formatTime(message.created_at)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="card rounded-t-none border-t-0">
        <form onSubmit={handleSendMessage} className="flex items-end gap-3">
          <div className="flex-1">
            <textarea
              ref={inputRef}
              value={newMessage}
              onChange={handleTyping}
              placeholder="Type a message..."
              className="form-input form-textarea resize-none"
              rows={1}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
            />
          </div>
          <button
            type="submit"
            disabled={sending || !newMessage.trim()}
            className="btn btn-primary p-3"
          >
            {sending ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatPage;
