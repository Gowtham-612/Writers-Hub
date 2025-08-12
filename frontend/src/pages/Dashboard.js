import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../App';
import { Edit3, Heart, MessageCircle, Share2, MoreVertical, TrendingUp, Sparkles, BookOpen, PenTool, Bot, Search } from 'lucide-react';
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
      console.error('Error fetching posts:', error);
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
      
      // Update the post in the state
      setPosts(prev => prev.map(post => 
        post.id === postId 
          ? { ...post, is_liked: !isLiked, likes_count: isLiked ? post.likes_count - 1 : post.likes_count + 1 }
          : post
      ));
    } catch (error) {
      console.error('Error handling like:', error);
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
    <article className="post-card group">
      <div className="flex items-start gap-4 mb-6">
        <Link to={`/profile/${post.username}`} className="flex-shrink-0">
          <img
            src={post.profile_image || `https://ui-avatars.com/api/?name=${post.display_name}&background=6366f1&color=fff`}
            alt={post.display_name}
            className="w-12 h-12 rounded-full avatar avatar-ring hover:scale-110 transition-transform duration-300"
          />
        </Link>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <div>
              <Link 
                to={`/profile/${post.username}`}
                className="font-bold text-text-primary hover:text-primary-color transition-colors duration-200"
              >
                {post.display_name || post.username}
              </Link>
              <span className="text-text-muted text-sm ml-3">
                {formatDate(post.created_at)}
              </span>
            </div>
            <button className="p-2 rounded-full hover:bg-surface-hover transition-colors duration-200 opacity-0 group-hover:opacity-100">
              <MoreVertical className="w-4 h-4 text-text-secondary" />
            </button>
          </div>
        </div>
      </div>

      <Link to={`/post/${post.id}`} className="block">
        <h3 className="text-2xl font-bold text-text-primary mb-4 hover:text-primary-color transition-colors duration-200 group-hover:scale-[1.02] transform origin-left">
          {post.title}
        </h3>
      </Link>

      <div className="text-text-secondary mb-6 leading-relaxed text-lg">
        {post.content.length > 200 
          ? `${post.content.substring(0, 200)}...` 
          : post.content
        }
      </div>

      {post.tags && post.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {post.tags.map((tag, index) => (
            <span
              key={index}
              className="tag hover:scale-105 transition-transform duration-200"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-border-color">
        <div className="flex items-center gap-6">
          <button
            onClick={() => handleLike(post.id, post.is_liked)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 hover:scale-105 ${
              post.is_liked 
                ? 'text-error-color bg-error-color bg-opacity-10' 
                : 'text-text-secondary hover:text-error-color hover:bg-error-color hover:bg-opacity-10'
            }`}
          >
            <Heart className={`w-5 h-5 ${post.is_liked ? 'fill-current' : ''} transition-transform duration-200 hover:scale-110`} />
            <span className="text-sm font-semibold">{post.likes_count}</span>
          </button>

          <Link
            to={`/post/${post.id}`}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-text-secondary hover:text-primary-color hover:bg-primary-color hover:bg-opacity-10 transition-all duration-300 hover:scale-105"
          >
            <MessageCircle className="w-5 h-5 transition-transform duration-200 hover:scale-110" />
            <span className="text-sm font-semibold">{post.comments_count}</span>
          </Link>

          <button className="flex items-center gap-2 px-4 py-2 rounded-full text-text-secondary hover:text-primary-color hover:bg-primary-color hover:bg-opacity-10 transition-all duration-300 hover:scale-105">
            <Share2 className="w-5 h-5 transition-transform duration-200 hover:scale-110" />
            <span className="text-sm font-semibold">Share</span>
          </button>
        </div>
      </div>
    </article>
  );

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-icon">
          <Sparkles size={28} color="#fff" />
        </div>
        <h1 className="header-title">
          Welcome back, {user.display_name || user.username}!
        </h1>
        <p className="header-subtitle">
          Here's what's happening in your writing community. Discover amazing stories and connect with fellow writers.
        </p>
      </div>

      {/* Main Content */}
      <div className="dashboard-layout">
        <div className="main-feed">
          {/* Write Post CTA */}
          <div className="write-post-card">
            <div>
              <h3>Share Your Story</h3>
              <p>Inspire others with your creativity</p>
            </div>
            <Link to="/write" className="btn-primary">
              <Edit3 size={18} /> Write Post
            </Link>
          </div>

          {loading && posts.length === 0 ? (
            <p className="loading-text">Loading posts...</p>
          ) : posts.length === 0 ? (
            <div className="empty-state">
              <BookOpen size={48} />
              <h3>No posts yet</h3>
              <p>Follow other writers or share your first story!</p>
              <div className="empty-actions">
                <Link to="/explore" className="btn-primary">
                  <Search size={18} /> Explore Writers
                </Link>
                <Link to="/write" className="btn-secondary">
                  <Edit3 size={18} /> Write First Post
                </Link>
              </div>
            </div>
          ) : (
            <>
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
              {hasMore && (
                <div className="load-more">
                  <button
                    onClick={() => {
                      setPage((prev) => prev + 1);
                      fetchPosts();
                    }}
                    className="btn-secondary"
                  >
                    Load More Posts
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Sidebar */}
        <div className="sidebar">
          {/* Quick Actions */}
          <div className="card">
            <h3>Quick Actions</h3>
            <Link to="/write" className="sidebar-link">
              <Edit3 /> Write New Post
            </Link>
            <Link to="/upload" className="sidebar-link">
              <PenTool /> Import File
            </Link>
            <Link to="/ai-assist" className="sidebar-link">
              <Bot /> AI Assistant
            </Link>
          </div>

          {/* Trending Tags */}
          <div className="card">
            <h3>Trending Tags</h3>
            {["fiction", "poetry", "writing", "creative", "story"].map((tag) => (
              <Link key={tag} to={`/explore?tag=${tag}`} className="tag-link">
                #{tag}
              </Link>
            ))}
          </div>

          {/* Community Stats */}
          <div className="card stats-card">
            <h3>Community Stats</h3>
            <p>Total Writers: 1,247</p>
            <p>Posts Today: 89</p>
            <p>Active Now: 156</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;


