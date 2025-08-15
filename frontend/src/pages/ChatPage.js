import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AuthContext } from '../App';
import { Send, ArrowLeft, User, MessageCircle, MoreVertical, Clock } from 'lucide-react';
import io from 'socket.io-client';
import axios from 'axios';
import toast from 'react-hot-toast';
import './ChatPage.css';

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
      if (socket) socket.disconnect();
    };
  }, [userId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeChat = async () => {
    try {
      const chatResponse = await axios.get(`/api/chat/with/${userId}`);
      setChatId(chatResponse.data.chat_id);

      const userResponse = await axios.get(`/api/users/profile/id/${userId}`);
      setOtherUser(userResponse.data);

      const messagesResponse = await axios.get(`/api/chat/${chatResponse.data.chat_id}/messages`);
      setMessages(messagesResponse.data);

      const newSocket = io('http://localhost:5000');
      setSocket(newSocket);

      newSocket.on('connect', () => {
        newSocket.emit('authenticate', user.id);
      });

      newSocket.on('authenticated', () => {
        newSocket.emit('join_chat', chatResponse.data.chat_id);
      });

      newSocket.on('new_message', (data) => {
        if (data.chatId === chatResponse.data.chat_id) {
          setMessages(prev => {
            const messageExists = prev.some(msg =>
              msg.id === data.message.id ||
              (msg.sender_id === data.message.sender_id &&
                msg.content === data.message.content &&
                Math.abs(new Date(msg.created_at) - new Date(data.message.created_at)) < 1000)
            );
            return messageExists ? prev : [...prev, data.message];
          });
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

    } catch (error) {
      toast.error('Failed to load chat');
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket) return;

    const messageContent = newMessage.trim();
    const tempMessage = {
      id: `temp-${Date.now()}`,
      chat_id: chatId,
      sender_id: user.id,
      content: messageContent,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempMessage]);

    socket.emit('send_message', { chatId, content: messageContent });
    setNewMessage('');

    if (typingTimeout) clearTimeout(typingTimeout);
    socket.emit('typing_stop', { chatId });
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    if (socket) {
      socket.emit('typing_start', { chatId });
      if (typingTimeout) clearTimeout(typingTimeout);
      setTypingTimeout(setTimeout(() => {
        socket.emit('typing_stop', { chatId });
      }, 1000));
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / 3600000);
    if (diffInHours < 24) return 'Today';
    if (diffInHours < 48) return 'Yesterday';
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="chat-page-loading">
        <div className="chat-page-spinner"></div>
        <p>Loading chat...</p>
      </div>
    );
  }

  if (!otherUser) {
    return (
      <div className="chat-page-empty">
        <User className="chat-page-empty-icon" />
        <h2>User not found</h2>
        <p>The user you’re trying to chat with doesn’t exist.</p>
        <Link to="/chat" className="chat-page-btn">Back to Chat</Link>
      </div>
    );
  }

  return (
    <div className="chat-page-container">
      {/* Header */}
      <div className="chat-page-header">
        <Link to="/chat" className="chat-page-back">
          <ArrowLeft />
        </Link>
        <img
          src={otherUser.profile_image || `https://ui-avatars.com/api/?name=${otherUser.display_name}&background=3b82f6&color=fff`}
          alt={otherUser.display_name}
          className="chat-page-avatar"
        />
        <div className="chat-page-user">
          <h2>{otherUser.display_name || otherUser.username}</h2>
          <span>{isTyping ? 'typing...' : 'online'}</span>
        </div>
        <MoreVertical className="chat-page-more" />
      </div>

      {/* Messages */}
      <div className="chat-page-messages">
        {messages.length === 0 ? (
          <div className="chat-page-no-messages">
            <MessageCircle />
            <h3>Start a conversation</h3>
            <p>Send a message to {otherUser.display_name || otherUser.username}</p>
          </div>
        ) : (
          messages.map((message, index) => {
            const isOwn = message.sender_id === user.id;
            const showDate = index === 0 || formatDate(message.created_at) !== formatDate(messages[index - 1].created_at);
            return (
              <div key={message.id}>
                {showDate && (
                  <div className="chat-page-date">{formatDate(message.created_at)}</div>
                )}
                <div className={`chat-page-bubble ${isOwn ? 'own' : ''}`}>
                  <p>{message.content}</p>
                  <span><Clock /> {formatTime(message.created_at)}</span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="chat-page-input">
        <textarea
          ref={inputRef}
          value={newMessage}
          onChange={handleTyping}
          placeholder="Type a message..."
        />
        <button type="submit" disabled={!newMessage.trim()}>
          <Send />
        </button>
      </form>
    </div>
  );
};

export default ChatPage;
