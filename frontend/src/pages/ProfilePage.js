import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AuthContext } from '../App';
import { 
  User, 
  Edit3, 
  Heart, 
  MessageCircle, 
  Users, 
  Calendar,
  MapPin,
  Link as LinkIcon,
  Plus,
  Minus,
  BookOpen,
  X
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import DOMPurify from 'dompurify';
import './Dashboard.css';

const ProfilePage = () => {
  const { username } = useParams();
  const { user: currentUser } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const location = window.location;
  const params = new URLSearchParams(location.search);
  const initialTab = params.get('tab') === 'drafts' ? 'drafts' : 'posts';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [drafts, setDrafts] = useState([]);
  const [draftsLoading, setDraftsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchPosts();
    if (currentUser && currentUser.username === username) {
      fetchDrafts();
    }
  }, [username]);

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`/api/users/profile/${username}`);
      setProfile(response.data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async () => {
    try {
      const response = await axios.get(`/api/users/${username}/posts`);
      setPosts(response.data);
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };

  const fetchDrafts = async () => {
    try {
      setDraftsLoading(true);
      const res = await axios.get(`/api/users/${username}/drafts`);
      setDrafts(res.data);
    } catch (e) {
      console.error('Error fetching drafts:', e);
    } finally {
      setDraftsLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!currentUser) {
      toast.error('Please log in to follow users');
      return;
    }

    try {
      setFollowLoading(true);
      if (profile.is_following) {
        await axios.delete(`/api/users/follow/${profile.id}`);
        setProfile(prev => ({
          ...prev,
          is_following: false,
          followers_count: prev.followers_count - 1
        }));
        toast.success('Unfollowed successfully');
      } else {
        await axios.post(`/api/users/follow/${profile.id}`);
        setProfile(prev => ({
          ...prev,
          is_following: true,
          followers_count: prev.followers_count + 1
        }));
        toast.success('Followed successfully');
      }
    } catch (error) {
      console.error('Error following user:', error);
      toast.error('Failed to follow user');
    } finally {
      setFollowLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-color mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <User className="w-16 h-16 text-text-secondary mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-text-primary mb-4">User not found</h2>
          <p className="text-text-secondary mb-6">The user you're looking for doesn't exist.</p>
          <Link to="/dashboard" className="btn btn-primary">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser && currentUser.username === username;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Profile Header */}
      <div className="card mb-8">
        <div className="flex items-start gap-6">
          {/* Profile Image */}
          <div className="relative">
            <img
              src={profile.profile_image || `https://ui-avatars.com/api/?name=${profile.display_name}&background=3b82f6&color=fff&size=120`}
              alt={profile.display_name}
              className="w-24 h-24 rounded-full"
            />
            {isOwnProfile && (
              <Link
                to="/settings"
                className="absolute bottom-0 right-0 w-8 h-8 bg-primary-color rounded-full flex items-center justify-center hover:bg-primary-hover transition-colors"
              >
                <Edit3 className="w-4 h-4 text-white" />
              </Link>
            )}
          </div>

          {/* Profile Info */}
          <div className="flex-1">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-text-primary mb-2">
                  {profile.display_name || profile.username}
                </h1>
                <p className="text-text-secondary mb-2">@{profile.username}</p>
                {profile.bio && (
                  <p className="text-text-primary mb-4">{profile.bio}</p>
                )}
              </div>

              {/* Follow Button */}
              {!isOwnProfile && currentUser && (
                <button
                  onClick={handleFollow}
                  disabled={followLoading}
                  className={`btn ${profile.is_following ? 'btn-secondary' : 'btn-primary'}`}
                >
                  {followLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : profile.is_following ? (
                    <>
                      <Minus className="w-4 h-4" />
                      Unfollow
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Follow
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-text-primary">{profile.posts_count}</div>
                <div className="text-sm text-text-secondary">Posts</div>
              </div>
              <Link to={`/profile/${username}/followers`} className="text-center">
                <div className="text-2xl font-bold text-text-primary">{profile.followers_count}</div>
                <div className="text-sm text-text-secondary">Followers</div>
              </Link>
              <Link to={`/profile/${username}/following`} className="text-center">
                <div className="text-2xl font-bold text-text-primary">{profile.following_count}</div>
                <div className="text-sm text-text-secondary">Following</div>
              </Link>
            </div>

            {/* Join Date */}
            <div className="flex items-center gap-2 text-text-secondary text-sm">
              <Calendar className="w-4 h-4" />
              <span>Joined {formatDate(profile.created_at)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border-color mb-6">
        <button
          onClick={() => setActiveTab('posts')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'posts'
              ? 'text-primary-color border-b-2 border-primary-color'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <BookOpen className="w-4 h-4 inline mr-2" />
          Posts ({profile.posts_count})
        </button>
        {isOwnProfile && (
          <button
            onClick={() => setActiveTab('drafts')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'drafts'
                ? 'text-primary-color border-b-2 border-primary-color'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Edit3 className="w-4 h-4 inline mr-2" />
            Drafts ({drafts.length})
          </button>
        )}
      </div>

      {/* Tab Content */}
      {activeTab === 'posts' && (
        <div className="space-y-6">
          {posts.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-text-secondary mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-text-primary mb-2">No posts yet</h3>
              <p className="text-text-secondary">
                {isOwnProfile 
                  ? "Start writing your first post!" 
                  : `${profile.display_name || profile.username} hasn't published any posts yet.`
                }
              </p>
              {isOwnProfile && (
                <Link to="/write" className="btn btn-primary mt-4">
                  <Edit3 className="w-4 h-4" />
                  Write Your First Post
                </Link>
              )}
            </div>
          ) : (
            posts.map((post) => (
              <FeedPost
                key={post.id}
                post={post}
                onLike={async (postId, isLiked) => {
                  try {
                    if (isLiked) await axios.delete(`/api/posts/${postId}/like`);
                    else await axios.post(`/api/posts/${postId}/like`);
                    setPosts(prev => prev.map(p => p.id === postId ? { ...p, is_liked: !isLiked, likes_count: isLiked ? (Number(p.likes_count)||0)-1 : (Number(p.likes_count)||0)+1 } : p));
                  } catch {
                    toast.error('Failed to update like');
                  }
                }}
                onCommentAdded={(postId) => setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments_count: (Number(p.comments_count)||0)+1 } : p))}
              />
            ))
          )}
        </div>
      )}

      {activeTab === 'drafts' && isOwnProfile && (
        <div className="space-y-4">
          {draftsLoading ? (
            <div className="text-center py-8">Loading drafts...</div>
          ) : drafts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-text-secondary">No drafts yet</p>
              <Link to="/write" className="btn btn-primary mt-4">Create Draft</Link>
            </div>
          ) : (
            drafts.map((d) => (
              <div key={d.id} className="card">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{d.title || 'Untitled'}</h3>
                    <p className="text-text-secondary text-sm">Last edited {formatDate(d.updated_at || d.created_at)}</p>
                  </div>
                  <div className="flex gap-2">
                    <Link to={`/write?draftId=${d.id}`} className="btn btn-secondary">Edit Draft</Link>
                    <button
                      className="btn btn-primary"
                      onClick={async () => {
                        try {
                          const res = await axios.post(`/api/posts/${d.id}/publish`);
                          toast.success('Draft published');
                          // Remove from drafts and refresh posts
                          setDrafts(prev => prev.filter(x => x.id !== d.id));
                          fetchPosts();
                          // Switch to Posts tab and update URL
                          setActiveTab('posts');
                          try {
                            const newUrl = `/profile/${username}`;
                            window.history.replaceState(null, '', newUrl);
                          } catch {}
                        } catch (e) {
                          toast.error('Failed to publish draft');
                        }
                      }}
                    >
                      Publish
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Full-page routes will handle followers/following lists */}
    </div>
  );
};

// Dashboard-like FeedPost reused
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
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
      </div>

      <Link to={`/post/${post.id}`}>
        <h3 className="post-title">{post.title}</h3>
      </Link>

      {isExpanded ? (
        <div className="post-content expanded" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content || '') }} />
      ) : (
        <div className="post-content">{plainText.length > 250 ? `${plainText.slice(0, 250)}…` : plainText}</div>
      )}

      {isTruncatable && (
        <button className="view-more-btn" onClick={() => setIsExpanded(prev => !prev)} aria-expanded={isExpanded}>
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
        <button onClick={() => onLike(post.id, post.is_liked)} className={post.is_liked ? 'liked' : ''}>
          <Heart size={18} /> {Number(post.likes_count) || 0}
        </button>
        <button onClick={toggleComments}>
          <MessageCircle size={18} /> {Number(post.comments_count) || 0}
        </button>
      </div>

      {showCommentBox && (
        <>
          <div className="comment-form">
            <textarea value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Write a comment..." rows={3} />
            <div className="comment-actions">
              <button className="btn-primary" onClick={submitComment} disabled={isSubmittingComment || commentText.trim().length === 0}>{isSubmittingComment ? 'Posting...' : 'Post Comment'}</button>
              <button className="btn-secondary" onClick={() => setShowCommentBox(false)} disabled={isSubmittingComment}>Cancel</button>
            </div>
          </div>

          <div className="comments-list">
            {comments.map((c) => (
              <div key={c.id} className="comment-item">
                <img className="comment-avatar" src={c.profile_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.display_name || c.username)}&background=6366f1&color=fff&size=64`} alt={c.display_name || c.username} onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(c.display_name || c.username)}&background=6366f1&color=fff&size=64`; }} />
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
              <button className="btn-secondary load-more-comments" onClick={() => fetchComments(commentsPage + 1)}>Load more comments</button>
            )}
          </div>
        </>
      )}
    </article>
  );
};

// Followers Tab Component
const FollowersTab = ({ userId }) => {
  const [followers, setFollowers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFollowers();
  }, [userId]);

  const fetchFollowers = async () => {
    try {
      const response = await axios.get(`/api/users/${userId}/followers`);
      setFollowers(response.data);
    } catch (error) {
      console.error('Error fetching followers:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-color mx-auto mb-4"></div>
        <p className="text-text-secondary">Loading followers...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {followers.length === 0 ? (
        <div className="text-center py-8">
          <Users className="w-16 h-16 text-text-secondary mx-auto mb-4" />
          <p className="text-text-secondary">No followers yet</p>
        </div>
      ) : (
        followers.map((follower) => (
          <div key={follower.id} className="flex items-center gap-3 p-4 bg-surface-color rounded-lg">
            <img
              src={follower.profile_image || `https://ui-avatars.com/api/?name=${follower.display_name}&background=3b82f6&color=fff`}
              alt={follower.display_name}
              className="w-10 h-10 rounded-full"
            />
            <div className="flex-1">
              <Link 
                to={`/profile/${follower.username}`}
                className="font-semibold text-text-primary hover:text-primary-color"
              >
                {follower.display_name || follower.username}
              </Link>
              {follower.bio && (
                <p className="text-text-secondary text-sm mt-1">{follower.bio}</p>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

// Following Tab Component
const FollowingTab = ({ userId }) => {
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFollowing();
  }, [userId]);

  const fetchFollowing = async () => {
    try {
      const response = await axios.get(`/api/users/${userId}/following`);
      setFollowing(response.data);
    } catch (error) {
      console.error('Error fetching following:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-color mx-auto mb-4"></div>
        <p className="text-text-secondary">Loading following...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {following.length === 0 ? (
        <div className="text-center py-8">
          <Users className="w-16 h-16 text-text-secondary mx-auto mb-4" />
          <p className="text-text-secondary">Not following anyone yet</p>
        </div>
      ) : (
        following.map((followed) => (
          <div key={followed.id} className="flex items-center gap-3 p-4 bg-surface-color rounded-lg">
            <img
              src={followed.profile_image || `https://ui-avatars.com/api/?name=${followed.display_name}&background=3b82f6&color=fff`}
              alt={followed.display_name}
              className="w-10 h-10 rounded-full"
            />
            <div className="flex-1">
              <Link 
                to={`/profile/${followed.username}`}
                className="font-semibold text-text-primary hover:text-primary-color"
              >
                {followed.display_name || followed.username}
              </Link>
              {followed.bio && (
                <p className="text-text-secondary text-sm mt-1">{followed.bio}</p>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default ProfilePage;
