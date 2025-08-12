import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../App';
import { 
  Search, 
  Filter, 
  TrendingUp, 
  Heart, 
  MessageCircle, 
  Share2,
  User,
  Tag,
  Clock
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const ExplorePage = () => {
  const { user } = useContext(AuthContext);
  const [posts, setPosts] = useState([]);
  const [popularTags, setPopularTags] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchPosts();
    fetchPopularTags();
  }, [searchQuery, selectedTag]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page,
        limit: 10
      });

      if (searchQuery) {
        params.append('search', searchQuery);
      }

      if (selectedTag) {
        params.append('tag', selectedTag);
      }

      const response = await axios.get(`/api/posts?${params}`);
      
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

  const fetchPopularTags = async () => {
    try {
      const response = await axios.get('/api/posts/tags/popular');
      setPopularTags(response.data);
    } catch (error) {
      console.error('Error fetching popular tags:', error);
    }
  };

  const handleLike = async (postId, isLiked) => {
    if (!user) {
      toast.error('Please log in to like posts');
      return;
    }

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

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchPosts();
  };

  const handleTagClick = (tag) => {
    setSelectedTag(selectedTag === tag ? '' : tag);
    setPage(1);
  };

  const handleLoadMore = () => {
    setPage(prev => prev + 1);
    fetchPosts();
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
    <div className="card">
      <div className="flex items-start gap-3 mb-4">
        <img
          src={post.profile_image || `https://ui-avatars.com/api/?name=${post.display_name}&background=3b82f6&color=fff`}
          alt={post.display_name}
          className="w-10 h-10 rounded-full"
        />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <Link 
                to={`/profile/${post.username}`}
                className="font-semibold text-text-primary hover:text-primary-color"
              >
                {post.display_name || post.username}
              </Link>
              <span className="text-text-secondary text-sm ml-2">
                {formatDate(post.created_at)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <Link to={`/post/${post.id}`}>
        <h3 className="text-xl font-semibold text-text-primary mb-3 hover:text-primary-color">
          {post.title}
        </h3>
      </Link>

      <div className="text-text-secondary mb-4 line-clamp-3">
        {post.content.length > 200 
          ? `${post.content.substring(0, 200)}...` 
          : post.content
        }
      </div>

      {post.tags && post.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {post.tags.map((tag, index) => (
            <button
              key={index}
              onClick={() => handleTagClick(tag)}
              className="px-2 py-1 bg-primary-color bg-opacity-10 text-primary-color text-xs rounded-full hover:bg-opacity-20 transition-colors"
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button
            onClick={() => handleLike(post.id, post.is_liked)}
            className={`flex items-center gap-2 px-3 py-1 rounded-full transition-colors ${
              post.is_liked 
                ? 'text-error-color bg-error-color bg-opacity-10' 
                : 'text-text-secondary hover:text-error-color hover:bg-error-color hover:bg-opacity-10'
            }`}
          >
            <Heart className={`w-4 h-4 ${post.is_liked ? 'fill-current' : ''}`} />
            <span className="text-sm">{post.likes_count}</span>
          </button>

          <Link
            to={`/post/${post.id}`}
            className="flex items-center gap-2 px-3 py-1 rounded-full text-text-secondary hover:text-primary-color hover:bg-primary-color hover:bg-opacity-10 transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            <span className="text-sm">{post.comments_count}</span>
          </Link>

          <button className="flex items-center gap-2 px-3 py-1 rounded-full text-text-secondary hover:text-primary-color hover:bg-primary-color hover:bg-opacity-10 transition-colors">
            <Share2 className="w-4 h-4" />
            <span className="text-sm">Share</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-2">Explore</h1>
        <p className="text-text-secondary">
          Discover amazing content from the writing community
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-3">
          {/* Search Bar */}
          <div className="card mb-6">
            <form onSubmit={handleSearch} className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-secondary" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search posts, authors, or content..."
                  className="form-input pl-10"
                />
              </div>
              <button type="submit" className="btn btn-primary">
                <Search className="w-4 h-4" />
                Search
              </button>
            </form>
          </div>

          {/* Active Filters */}
          {(searchQuery || selectedTag) && (
            <div className="flex items-center gap-2 mb-6">
              <Filter className="w-4 h-4 text-text-secondary" />
              <span className="text-text-secondary">Filters:</span>
              {searchQuery && (
                <span className="px-2 py-1 bg-primary-color bg-opacity-10 text-primary-color text-sm rounded">
                  Search: "{searchQuery}"
                </span>
              )}
              {selectedTag && (
                <span className="px-2 py-1 bg-primary-color bg-opacity-10 text-primary-color text-sm rounded">
                  Tag: #{selectedTag}
                </span>
              )}
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedTag('');
                }}
                className="text-text-secondary hover:text-text-primary text-sm"
              >
                Clear all
              </button>
            </div>
          )}

          {/* Posts */}
          {loading && posts.length === 0 ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-color mx-auto mb-4"></div>
              <p className="text-text-secondary">Loading posts...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12">
              <Search className="w-16 h-16 text-text-secondary mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-text-primary mb-2">No posts found</h3>
              <p className="text-text-secondary mb-6">
                {searchQuery || selectedTag 
                  ? 'Try adjusting your search or filters'
                  : 'No posts have been published yet'
                }
              </p>
              {searchQuery || selectedTag ? (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedTag('');
                  }}
                  className="btn btn-primary"
                >
                  Clear Filters
                </button>
              ) : (
                <Link to="/write" className="btn btn-primary">
                  Write First Post
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
              
              {hasMore && (
                <div className="text-center mt-8">
                  <button
                    onClick={handleLoadMore}
                    className="btn btn-secondary"
                  >
                    Load More
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Popular Tags */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-primary-color" />
              <h3 className="text-lg font-semibold text-text-primary">
                Popular Tags
              </h3>
            </div>
            <div className="space-y-2">
              {popularTags.map((tag) => (
                <button
                  key={tag.tag}
                  onClick={() => handleTagClick(tag.tag)}
                  className={`flex items-center justify-between w-full p-2 rounded-lg transition-colors ${
                    selectedTag === tag.tag
                      ? 'bg-primary-color text-white'
                      : 'hover:bg-surface-color text-text-primary'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    #{tag.tag}
                  </span>
                  <span className="text-sm opacity-75">{tag.count}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <h3 className="text-lg font-semibold text-text-primary mb-4">
              Quick Actions
            </h3>
            <div className="space-y-3">
              <Link
                to="/write"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-color transition-colors"
              >
                <div className="w-8 h-8 bg-primary-color rounded-lg flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <span className="text-text-primary">Write New Post</span>
              </Link>
              
              <Link
                to="/ai-assist"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-color transition-colors"
              >
                <div className="w-8 h-8 bg-warning-color rounded-lg flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <span className="text-text-primary">AI Assistant</span>
              </Link>
              
              <Link
                to="/upload"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-color transition-colors"
              >
                <div className="w-8 h-8 bg-success-color rounded-lg flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <span className="text-text-primary">Import File</span>
              </Link>
            </div>
          </div>

          {/* Search Tips */}
          <div className="card">
            <h3 className="text-lg font-semibold text-text-primary mb-4">
              Search Tips
            </h3>
            <div className="space-y-3 text-sm text-text-secondary">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-primary-color rounded-full mt-2"></div>
                <p>Use quotes for exact phrases</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-primary-color rounded-full mt-2"></div>
                <p>Click on tags to filter by topic</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-primary-color rounded-full mt-2"></div>
                <p>Search by author name or content</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExplorePage;
