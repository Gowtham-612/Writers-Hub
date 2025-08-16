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
import DOMPurify from 'dompurify';
import '../Styling/ExplorePage.css';

const ExplorePage = () => {
  const { user } = useContext(AuthContext);
  const [posts, setPosts] = useState([]);
  const [popularTags, setPopularTags] = useState([]);
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState('all'); // 'all' | 'title' | 'author'
  const [selectedTag, setSelectedTag] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchPosts();
    fetchPopularTags();
    if (searchQuery) {
      fetchUsers();
    } else {
      setUsers([]);
    }
  }, [searchQuery, selectedTag]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page,
        limit: 10
      });

      if (searchQuery) {
        if (searchMode === 'title') params.append('title', searchQuery);
        else if (searchMode === 'author') params.append('author', searchQuery);
        else params.append('search', searchQuery);
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
      setPosts(prev => prev.map(post => {
        if (post.id !== postId) return post;
        const current = Number(post.likes_count) || 0;
        return {
          ...post,
          is_liked: !isLiked,
          likes_count: isLiked ? current - 1 : current + 1
        };
      }));
    } catch (error) {
      console.error('Error handling like:', error);
      toast.error('Failed to update like');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchPosts();
    if (searchQuery) fetchUsers();
  };

  const handleTagClick = (tag) => {
    setSelectedTag(selectedTag === tag ? '' : tag);
    setPage(1);
  };

  const handleLoadMore = () => {
    setPage(prev => prev + 1);
    fetchPosts();
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`/api/users/search/${encodeURIComponent(searchQuery)}?limit=10&page=1`);
      setUsers(res.data || []);
    } catch (e) {
      setUsers([]);
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

  const FeedPost = ({ post, onLike, onCommentAdded }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isTruncatable, setIsTruncatable] = useState(false);
    const [plainText, setPlainText] = useState('');
    const [showCommentBox, setShowCommentBox] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);
    const [comments, setComments] = useState([]);
    const [commentsPage, setCommentsPage] = useState(1);
    const [commentsHasMore, setCommentsHasMore] = useState(true);
    const [commentsLoading, setCommentsLoading] = useState(false);

    useEffect(() => {
      const div = document.createElement('div');
      div.innerHTML = post.content || '';
      const text = (div.textContent || div.innerText || '').trim();
      setPlainText(text);
      setIsTruncatable(text.length > 250);
    }, [post.content]);

    const fetchComments = async (nextPage = 1) => {
      try {
        setCommentsLoading(true);
        const limit = 10;
        const res = await axios.get(`/api/posts/${post.id}/comments?page=${nextPage}&limit=${limit}`);
        const newComments = res.data || [];
        setComments(nextPage === 1 ? newComments : [...comments, ...newComments]);
        setCommentsHasMore(newComments.length === limit);
        setCommentsPage(nextPage);
      } catch (e) {
        toast.error('Failed to load comments');
      } finally {
        setCommentsLoading(false);
      }
    };

    const toggleComments = () => {
      setShowCommentBox(prev => {
        const opening = !prev;
        if (opening && comments.length === 0) fetchComments(1);
        return opening;
      });
    };

    const submitComment = async () => {
      const content = commentText.trim();
      if (!content) return;
      try {
        setIsSubmittingComment(true);
        await axios.post(`/api/posts/${post.id}/comments`, { content });
        setCommentText('');
        setShowCommentBox(false);
        onCommentAdded(post.id);
        fetchComments(1);
        toast.success('Comment added');
      } catch (e) {
        toast.error('Failed to add comment');
      } finally {
        setIsSubmittingComment(false);
      }
    };

    return (
      <article className="post">
        <div className="post-header">
          <Link to={`/profile/${post.username}`}>
            <img
                src={
                  post.profile_image ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(post.display_name || post.username)}&background=3b82f6&color=fff&size=80`
                }
                alt={post.display_name || post.username}
                className="user-avatar"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(post.display_name || post.username)}&background=3b82f6&color=fff&size=80`;
                }}
              />
          </Link>
          <div className="post-user-info">
            <Link to={`/profile/${post.username}`} className="post-username">
              {post.display_name || post.username}
            </Link>
            <span className="post-time">{formatDate(post.created_at)}</span>
          </div>
          <button className="post-options">
            <Share2 size={16} />
          </button>
        </div>

        <Link to={`/post/${post.id}`}>
          <h3 className="post-title">{post.title}</h3>
        </Link>

        {isExpanded ? (
          <div
            className="post-content expanded"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content || '') }}
          />
        ) : (
          <div className="post-content">
            {plainText.length > 250 ? `${plainText.slice(0, 250)}…` : plainText}
          </div>
        )}

        {isTruncatable && (
          <button
            className="view-more-btn"
            onClick={() => setIsExpanded(prev => !prev)}
            aria-expanded={isExpanded}
          >
            {isExpanded ? 'Show less' : 'View more'}
          </button>
        )}

        {post.tags?.length > 0 && (
          <div className="post-tags">
            {post.tags.map((tag, i) => (
              <button key={i} onClick={() => handleTagClick(tag)}>#{tag}</button>
            ))}
          </div>
        )}

        <div className="post-actions">
          <button
            onClick={() => onLike(post.id, post.is_liked)}
            className={post.is_liked ? 'liked' : ''}
          >
            <Heart size={18} /> {Number(post.likes_count) || 0}
          </button>
          <button onClick={toggleComments}>
            <MessageCircle size={18} /> {Number(post.comments_count) || 0}
          </button>
          <button>
            <Share2 size={18} /> Share
          </button>
        </div>

        {showCommentBox && (
          <>
            <div className="comment-form">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a comment..."
                rows={3}
              />
              <div className="comment-actions">
                <button className="btn-primary" onClick={submitComment} disabled={isSubmittingComment || commentText.trim().length === 0}>
                  {isSubmittingComment ? 'Posting...' : 'Post Comment'}
                </button>
                <button className="btn-secondary" onClick={() => setShowCommentBox(false)} disabled={isSubmittingComment}>
                  Cancel
                </button>
              </div>
            </div>

            <div className="comments-list">
              {comments.map((c) => (
                <div key={c.id} className="comment-item">
                  <img
                    className="comment-avatar"
                    src={c.profile_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.display_name || c.username)}&background=6366f1&color=fff&size=64`}
                    alt={c.display_name || c.username}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(c.display_name || c.username)}&background=6366f1&color=fff&size=64`;
                    }}
                  />
                  <div className="comment-body">
                    <div className="comment-meta">
                      <span className="comment-author">{c.display_name || c.username}</span>
                      <span className="comment-time">{formatDate(c.created_at)}</span>
                    </div>
                    <div className="comment-text">{c.content}</div>
                  </div>
                </div>
              ))}
              {commentsLoading && <div className="comments-loading">Loading comments...</div>}
              {!commentsLoading && commentsHasMore && (
                <button className="btn-secondary load-more-comments" onClick={() => fetchComments(commentsPage + 1)}>
                  Load more comments
                </button>
              )}
            </div>
          </>
        )}
      </article>
    );
  };

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
            <form onSubmit={handleSearch} className="flex gap-3 flex-wrap">
              <div className="flex-1 min-w-[220px] relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-secondary" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search posts, authors, or content..."
                  className="form-input pl-10"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm">Search by:</label>
                <select value={searchMode} onChange={(e) => setSearchMode(e.target.value)} className="form-input">
                  <option value="all">All</option>
                  <option value="title">Title</option>
                  <option value="author">Author</option>
                </select>
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

          {/* People (authors) results when searching */}
          {searchQuery && users.length > 0 && (
            <div className="card mb-6">
              <h3 className="text-lg font-semibold text-text-primary mb-4">People</h3>
              <div className="space-y-3">
                {users.map((u) => (
                  <div key={u.id} className="flex items-center gap-3">
                    <img
                src={
                  u.profile_image ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(u.display_name || u.username)}&background=3b82f6&color=fff&size=80`
                }
                alt={u.display_name || u.username}
                className="user-avatar"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(u.display_name || u.username)}&background=3b82f6&color=fff&size=80`;
                }}
              />
                    <div className="flex-1">
                      <Link to={`/profile/${u.username}`} className="font-semibold hover:text-primary-color">
                        {u.display_name || u.username}
                      </Link>
                      <div className="text-sm text-text-secondary">@{u.username}</div>
                      {u.bio && <div className="text-sm text-text-secondary">{u.bio}</div>}
                    </div>
                    <Link to={`/profile/${u.username}`} className="btn btn-secondary">View</Link>
                  </div>
                ))}
              </div>
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
                <FeedPost
                  key={post.id}
                  post={post}
                  onLike={(postId, isLiked) => {
                    handleLike(postId, isLiked);
                  }}
                  onCommentAdded={(postId) => {
                    setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments_count: (Number(p.comments_count) || 0) + 1 } : p));
                  }}
                />
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
