import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../App';
import { Edit3, Heart, MessageCircle, Share2, MoreVertical, Sparkles, BookOpen, Search } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/posts/feed?page=${page}&limit=10`);
      if (page === 1) {
        setPosts(response.data);
      } else {
        setPosts(prev => [...prev, ...response.data]);
      }
      setHasMore(response.data.length === 10);
    } catch (error) {
      toast.error('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId, isLiked) => {
    try {
      if (isLiked) {
        await axios.delete(`/api/posts/${postId}/like`);
      } else {
        await axios.post(`/api/posts/${postId}/like`);
      }
      setPosts(prev =>
        prev.map(post =>
          post.id === postId
            ? { ...post, is_liked: !isLiked, likes_count: isLiked ? post.likes_count - 1 : post.likes_count + 1 }
            : post
        )
      );
    } catch {
      toast.error('Failed to update like');
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

  const PostCard = ({ post }) => (
    <article className="post">
      <div className="post-header">
        <Link to={`/profile/${post.username}`}>
          <img
            src={post.profile_image || `https://ui-avatars.com/api/?name=${post.display_name}&background=6366f1&color=fff`}
            alt={post.display_name}
            className="post-avatar"
          />
        </Link>
        <div className="post-user-info">
          <Link to={`/profile/${post.username}`} className="post-username">
            {post.display_name || post.username}
          </Link>
          <span className="post-time">{formatDate(post.created_at)}</span>
        </div>
        <button className="post-options">
          <MoreVertical size={16} />
        </button>
      </div>

      <Link to={`/post/${post.id}`}>
        <h3 className="post-title">{post.title}</h3>
      </Link>

      <p className="post-content">
        {post.content.length > 200 ? `${post.content.substring(0, 200)}...` : post.content}
      </p>

      {post.tags?.length > 0 && (
        <div className="post-tags">
          {post.tags.map((tag, i) => (
            <span key={i}>#{tag}</span>
          ))}
        </div>
      )}

      <div className="post-actions">
        <button
          onClick={() => handleLike(post.id, post.is_liked)}
          className={post.is_liked ? 'liked' : ''}
        >
          <Heart size={18} /> {post.likes_count}
        </button>
        <Link to={`/post/${post.id}`}>
          <MessageCircle size={18} /> {post.comments_count}
        </Link>
        <button>
          <Share2 size={18} /> Share
        </button>
      </div>
    </article>
  );

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <Sparkles size={28} />
        <h1>Welcome back, {user.display_name || user.username}!</h1>
        <p>Here's what's happening in your writing community.</p>
      </header>

      <div className="dashboard-main">
        <main className="feed">
          <div className="create-post-card">
            <h3>Share Your Story</h3>
            <Link to="/write" className="btn-primary">
              <Edit3 size={18} /> Write Post
            </Link>
          </div>

          {loading && posts.length === 0 ? (
            <p>Loading posts...</p>
          ) : posts.length === 0 ? (
            <div className="empty-state">
              <BookOpen size={48} />
              <h3>No posts yet</h3>
              <p>Follow other writers or share your first story!</p>
              <Link to="/explore" className="btn-primary">
                <Search size={18} /> Explore Writers
              </Link>
            </div>
          ) : (
            <>
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
              {hasMore && (
                <button
                  onClick={() => {
                    setPage(prev => prev + 1);
                    fetchPosts();
                  }}
                  className="btn-secondary"
                >
                  Load More
                </button>
              )}
            </>
          )}
        </main>

        <aside className="sidebar">
          <div className="card">
            <h3>Quick Actions</h3>
            <Link to="/write">✏️ Write</Link>
            <Link to="/upload">📄 Import File</Link>
            <Link to="/ai-assist">🤖 AI Assistant</Link>
          </div>
          <div className="card">
            <h3>Trending Tags</h3>
            {["fiction", "poetry", "writing", "creative", "story"].map(tag => (
              <Link key={tag} to={`/explore?tag=${tag}`}>#{tag}</Link>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Dashboard;
