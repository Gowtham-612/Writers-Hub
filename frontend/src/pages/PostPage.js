// PostPage.js
import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AuthContext } from '../App';
import { Heart, MessageCircle, Share2, MoreVertical, ArrowLeft, Send, Clock } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import '../Styling/PostPage.css';

const PostPage = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    fetchPost();
    fetchComments();
  }, [id]);

  const fetchPost = async () => {
    try {
      const response = await axios.get(`/api/posts/${id}`);
      setPost(response.data);
    } catch (error) {
      toast.error('Failed to load post');
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await axios.get(`/api/posts/${id}/comments`);
      setComments(response.data);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleLike = async () => {
    if (!user) {
      toast.error('Please log in to like posts');
      return;
    }

    try {
      if (post.is_liked) {
        await axios.delete(`/api/posts/${id}/like`);
        setPost(prev => ({
          ...prev,
          is_liked: false,
          likes_count: prev.likes_count - 1
        }));
      } else {
        await axios.post(`/api/posts/${id}/like`);
        setPost(prev => ({
          ...prev,
          is_liked: true,
          likes_count: prev.likes_count + 1
        }));
      }
    } catch {
      toast.error('Failed to update like');
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please log in to comment');
      return;
    }
    if (!newComment.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    try {
      setSubmittingComment(true);
      const response = await axios.post(`/api/posts/${id}/comments`, {
        content: newComment.trim()
      });
      setComments(prev => [response.data, ...prev]);
      setNewComment('');
      toast.success('Comment added');
    } catch {
      toast.error('Failed to add comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="post-container">
        <div className="loading-section">
          <div className="loader"></div>
          <p>Loading post...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="post-container">
        <div className="not-found">
          <h2>Post not found</h2>
          <p>The post you’re looking for doesn’t exist.</p>
          <Link to="/dashboard" className="btn btn-primary">
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="post-container">
      {/* Back Button */}
      <div className="back-btn">
        <Link to="/dashboard">
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
      </div>

      {/* Post Card */}
      <div className="post-card">
        {/* Header */}
        <div className="post-header">
          <img
            src={
              post.profile_image ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(post.display_name || post.username)}&background=3b82f6&color=fff&size=80`
            }
            alt={post.display_name || post.username}
            className="user-avatar"
          />
          <div className="header-info">
            <Link to={`/profile/${post.username}`} className="author-name">
              {post.display_name || post.username}
            </Link>
            <div className="post-meta">
              <Clock size={14} /> {formatDate(post.created_at)}
            </div>
          </div>
          <button className="more-btn">
            <MoreVertical size={18} />
          </button>
        </div>

        {/* Title */}
        <h1 className="post-title">{post.title}</h1>

        {/* Tags */}
        {post.tags && (
          <div className="tags">
            {post.tags.map((tag, i) => (
              <span key={i}>#{tag}</span>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="post-content" dangerouslySetInnerHTML={{ __html: post.content }} />

        {/* Actions */}
        <div className="post-actions">
          <button onClick={handleLike} className={`like-btn ${post.is_liked ? 'liked' : ''}`}>
            <Heart size={20} />
            {post.likes_count}
          </button>
          <div className="comment-count">
            <MessageCircle size={20} /> {post.comments_count}
          </div>
          <button className="share-btn">
            <Share2 size={20} /> Share
          </button>
        </div>
      </div>

      {/* Comments */}
      <div className="comments-card">
        <h3>Comments ({post.comments_count})</h3>

        {user && (
          <form onSubmit={handleComment} className="comment-form">
            <img
              src={
                user.profile_image ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(user.display_name || user.username)}&background=3b82f6&color=fff&size=80`
              }
              alt={user.display_name || user.username}
              className="user-avatar"
            />
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              rows={3}
            />
            <button type="submit" disabled={submittingComment || !newComment.trim()} className="btn btn-primary">
              {submittingComment ? 'Posting...' : <><Send size={16} /> Post</>}
            </button>
          </form>
        )}

        {/* Comments List */}
        <div className="comments-list">
          {comments.length === 0 ? (
            <div className="empty-comments">
              <MessageCircle size={40} />
              <p>No comments yet</p>
            </div>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="comment-item">
                <img
                  src={c.profile_image || `https://ui-avatars.com/api/?name=${c.display_name}&background=3b82f6&color=fff`}
                  alt={c.display_name}
                  className="user-avatar"
                />
                <div className="comment-body">
                  <div className="comment-header">
                    <Link to={`/profile/${c.username}`} className="comment-author">
                      {c.display_name || c.username}
                    </Link>
                    <span className="comment-date">{formatDate(c.created_at)}</span>
                  </div>
                  <p>{c.content}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default PostPage;
