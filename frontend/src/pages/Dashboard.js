import React, { useState, useEffect, useContext, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import { Edit3, Heart, MessageCircle, Share2, MoreVertical, Sparkles, BookOpen, Search } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import DOMPurify from 'dompurify';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1); // combined load count
  const [hasMore, setHasMore] = useState(true);
  const navigate = useNavigate();

  // Track pagination and seen IDs to avoid duplicates
  const myPostsPageRef = useRef(1);
  const feedPageRef = useRef(1);
  const globalPageRef = useRef(1);
  const hasMoreMyPostsRef = useRef(true);
  const hasMoreFeedRef = useRef(true);
  const hasMoreGlobalRef = useRef(true);
  const seenIdsRef = useRef(new Set());

  useEffect(() => {
    console.log('[DASHBOARD] User context:', user);
    if (user && user.id) {
      loadInitialPosts();
    } else {
      console.log('[DASHBOARD] No user found, loading global posts only');
      // If no user, just load global posts
      loadGlobalPostsOnly();
    }
  }, [user]);

  const loadGlobalPostsOnly = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/posts?page=1&limit=10`);
      console.log('[DASHBOARD] Global posts only:', res.data.length, 'posts');
      setPosts(res.data);
      setHasMore(res.data.length === 10);
    } catch (error) {
      console.error('Error loading global posts:', error);
      toast.error('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const appendUnique = (currentList, candidates) => {
    const result = [];
    for (const p of candidates) {
      if (!seenIdsRef.current.has(p.id)) {
        seenIdsRef.current.add(p.id);
        result.push(p);
      }
    }
    return currentList.concat(result);
  };

  const loadInitialPosts = async () => {
    try {
      setLoading(true);
      seenIdsRef.current = new Set();
      myPostsPageRef.current = 1;
      feedPageRef.current = 1;
      globalPageRef.current = 1;

      // Debug: Check database stats
      try {
        const debugRes = await axios.get('/api/posts/debug/count');
        console.log('[DASHBOARD] Database stats:', debugRes.data);
      } catch (e) {
        console.error('[DASHBOARD] Error fetching debug info:', e);
      }

      let combined = [];

      // 1. Fetch user's own posts first
      try {
        const myPostsRes = await axios.get(`/api/posts/my-posts?page=1&limit=5`);
        console.log('[DASHBOARD] My posts response:', myPostsRes.data.length, 'posts');
        combined = appendUnique([], myPostsRes.data);
        hasMoreMyPostsRef.current = myPostsRes.data.length === 5;
      } catch (e) {
        console.error('[DASHBOARD] Error fetching my posts:', e);
        hasMoreMyPostsRef.current = false;
      }

      // 2. Add followed users' posts
      try {
        const feedRes = await axios.get(`/api/posts/feed?page=1&limit=5`);
        console.log('[DASHBOARD] Feed response:', feedRes.data.length, 'posts');
        combined = appendUnique(combined, feedRes.data);
        hasMoreFeedRef.current = feedRes.data.length === 5;
      } catch (e) {
        console.error('[DASHBOARD] Error fetching feed:', e);
        hasMoreFeedRef.current = false;
      }

      // 3. Fill with global posts to ensure minimum 5 posts
      const remainingSlots = Math.max(0, 5 - combined.length);
      if (remainingSlots > 0) {
        try {
          const globalRes = await axios.get(`/api/posts?page=1&limit=${remainingSlots + 5}`);
          console.log('[DASHBOARD] Global posts response:', globalRes.data.length, 'posts');
          combined = appendUnique(combined, globalRes.data);
          hasMoreGlobalRef.current = globalRes.data.length === (remainingSlots + 5);
        } catch (e) {
          console.error('[DASHBOARD] Error fetching global posts:', e);
          hasMoreGlobalRef.current = false;
        }
      } else {
        hasMoreGlobalRef.current = true; // not fetched yet
      }

      console.log('[DASHBOARD] Final combined posts:', combined.length, 'posts');
      
      // If we still don't have any posts, fetch global posts as fallback
      if (combined.length === 0) {
        try {
          const fallbackRes = await axios.get(`/api/posts?page=1&limit=10`);
          console.log('[DASHBOARD] Fallback global posts:', fallbackRes.data.length, 'posts');
          combined = fallbackRes.data;
          hasMoreGlobalRef.current = fallbackRes.data.length === 10;
        } catch (e) {
          console.error('[DASHBOARD] Error fetching fallback posts:', e);
        }
      }
      
      setPosts(combined);
      setPage(1);
      setHasMore(hasMoreMyPostsRef.current || hasMoreFeedRef.current || hasMoreGlobalRef.current);
    } catch (error) {
      console.error('Error loading dashboard posts:', error);
      toast.error('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const fetchMoreCombined = async () => {
    try {
      const newPosts = [];

      // 1. Try next user's posts page first
      if (hasMoreMyPostsRef.current) {
        try {
          const nextMyPostsPage = myPostsPageRef.current + 1;
          const myPostsRes = await axios.get(`/api/posts/my-posts?page=${nextMyPostsPage}&limit=5`);
          hasMoreMyPostsRef.current = myPostsRes.data.length === 5;
          myPostsPageRef.current = nextMyPostsPage;
          for (const p of myPostsRes.data) {
            if (!seenIdsRef.current.has(p.id)) {
              seenIdsRef.current.add(p.id);
              newPosts.push(p);
            }
          }
        } catch (e) {
          hasMoreMyPostsRef.current = false;
        }
      }

      // 2. Try next feed page
      if (hasMoreFeedRef.current) {
        try {
          const nextFeedPage = feedPageRef.current + 1;
          const feedRes = await axios.get(`/api/posts/feed?page=${nextFeedPage}&limit=5`);
          hasMoreFeedRef.current = feedRes.data.length === 5;
          feedPageRef.current = nextFeedPage;
          for (const p of feedRes.data) {
            if (!seenIdsRef.current.has(p.id)) {
              seenIdsRef.current.add(p.id);
              newPosts.push(p);
            }
          }
        } catch (e) {
          hasMoreFeedRef.current = false;
        }
      }

      // 3. Then add next global page
      if (hasMoreGlobalRef.current) {
        try {
          const nextGlobalPage = globalPageRef.current + 1;
          const globalRes = await axios.get(`/api/posts?page=${nextGlobalPage}&limit=5`);
          hasMoreGlobalRef.current = globalRes.data.length === 5;
          globalPageRef.current = nextGlobalPage;
          for (const p of globalRes.data) {
            if (!seenIdsRef.current.has(p.id)) {
              seenIdsRef.current.add(p.id);
              newPosts.push(p);
            }
          }
        } catch (e) {
          hasMoreGlobalRef.current = false;
        }
      }

      if (newPosts.length === 0) {
        setHasMore(false);
        return;
      }

      setPosts(prev => prev.concat(newPosts));
      setPage(prev => prev + 1);
      setHasMore(hasMoreMyPostsRef.current || hasMoreFeedRef.current || hasMoreGlobalRef.current);
    } catch (error) {
      toast.error('Failed to load more posts');
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
            ? { ...post, is_liked: !isLiked, likes_count: isLiked ? (Number(post.likes_count) || 0) - 1 : (Number(post.likes_count) || 0) + 1 }
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
    <PostCardInner post={post} />
  );

  const PostCardInner = ({ post }) => {
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
        if (nextPage === 1) {
          setComments(newComments);
        } else {
          setComments(prev => [...prev, ...newComments]);
        }
        setCommentsHasMore(newComments.length === limit);
        setCommentsPage(nextPage);
      } catch (e) {
        console.error('Failed to load comments', e);
        toast.error('Failed to load comments');
      } finally {
        setCommentsLoading(false);
      }
    };

    const toggleComments = () => {
      setShowCommentBox(prev => {
        const opening = !prev;
        if (opening && comments.length === 0) {
          fetchComments(1);
        }
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
        setPosts(prev => prev.map(p => (
          p.id === post.id ? { ...p, comments_count: (Number(p.comments_count) || 0) + 1 } : p
        )));
        toast.success('Comment added');
        // Reload first page of comments to include the new one
        fetchComments(1);
      } catch (error) {
        console.error('Failed to add comment', error);
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

        {isExpanded ? (
          <div
            className={`post-content expanded`}
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
              <span key={i}>#{tag}</span>
            ))}
          </div>
        )}

        <div className="post-actions">
          <button
            onClick={() => handleLike(post.id, post.is_liked)}
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
                <button
                  className="btn-primary"
                  onClick={submitComment}
                  disabled={isSubmittingComment || commentText.trim().length === 0}
                >
                  {isSubmittingComment ? 'Posting...' : 'Post Comment'}
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => setShowCommentBox(false)}
                  disabled={isSubmittingComment}
                >
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
                <button
                  className="btn-secondary load-more-comments"
                  onClick={() => fetchComments(commentsPage + 1)}
                >
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
                <button onClick={fetchMoreCombined} className="btn-secondary">Load More</button>
              )}
            </>
          )}
        </main>

        <aside className="sidebar">
          <div className="card">
            <h3>Quick Actions</h3>
            <Link to="/write">✏️ Write</Link>
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
