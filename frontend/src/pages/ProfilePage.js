import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AuthContext } from '../App';
import { 
  User, Edit3, Heart, MessageCircle, Users, Calendar,
  Plus, Minus, BookOpen
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import DOMPurify from 'dompurify';
import '../Styling/ProfilePage.css'; // Uncomment after creating your CSS file!

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
    <article className="feedpost">
      <div className="feedpost-header">
        <Link to={`/profile/${post.username}`}>
          <img
            src={
              post.profile_image ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(post.display_name || post.username)}&background=3b82f6&color=fff&size=80`
            }
            alt={post.display_name || post.username}
            className="feedpost-avatar"
          />
        </Link>
        <div className="feedpost-userinfo">
          <Link to={`/profile/${post.username}`} className="feedpost-username">
            {post.display_name || post.username}
          </Link>
          <span className="feedpost-time">{formatDate(post.created_at)}</span>
        </div>
      </div>
      <Link to={`/post/${post.id}`}>
        <h3 className="feedpost-title">{post.title}</h3>
      </Link>
      {isExpanded ? (
        <div className="feedpost-content expanded" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content || '') }} />
      ) : (
        <div className="feedpost-content">
          {plainText.length > 250 ? `${plainText.slice(0, 250)}…` : plainText}
        </div>
      )}
      {isTruncatable && (
        <button className="feedpost-viewmore" onClick={() => setIsExpanded(prev => !prev)} aria-expanded={isExpanded}>
          {isExpanded ? 'Show less' : 'View more'}
        </button>
      )}
      {post.tags?.length > 0 && (
        <div className="feedpost-tags">
          {post.tags.map((tag, i) => (
            <span key={i} className="feedpost-tag">#{tag}</span>
          ))}
        </div>
      )}
      <div className="feedpost-actions">
        <button
          onClick={() => onLike(post.id, post.is_liked)}
          className={`feedpost-likebtn ${post.is_liked ? 'liked' : ''}`}>
          <Heart size={18} /> {Number(post.likes_count) || 0}
        </button>
        <button onClick={toggleComments} className="feedpost-commentbtn">
          <MessageCircle size={18} /> {Number(post.comments_count) || 0}
        </button>
      </div>
      {showCommentBox && (
        <div className="feedpost-comments">
          <div className="feedpost-commentform">
            <textarea
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              placeholder="Write a comment..."
              rows={3}
              className="feedpost-commentinput"
            />
            <div className="feedpost-commentactions">
              <button
                className="btn-primary"
                onClick={submitComment}
                disabled={isSubmittingComment || commentText.trim().length === 0}>
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
          <div className="feedpost-commentslist">
            {comments.map((c) => (
              <div key={c.id} className="feedpost-commentitem">
                <img
                  className="feedpost-commentavatar"
                  src={c.profile_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.display_name || c.username)}&background=6366f1&color=fff&size=64`}
                  alt={c.display_name || c.username}
                />
                <div className="feedpost-commentbody">
                  <div className="feedpost-commentmeta">
                    <span className="feedpost-commentauthor">{c.display_name || c.username}</span>
                    <span className="feedpost-commenttime">{formatDate(c.created_at)}</span>
                  </div>
                  <div className="feedpost-commenttext">{c.content}</div>
                </div>
              </div>
            ))}
            {commentsLoading && <div className="feedpost-commentsloading">Loading comments...</div>}
            {!commentsLoading && commentsHasMore && (
              <button className="btn-secondary feedpost-loadmorebtn" onClick={() => fetchComments(commentsPage + 1)}>
                Load more comments
              </button>
            )}
          </div>
        </div>
      )}
    </article>
  );
};

const FollowersTab = ({ userId }) => {
  const [followers, setFollowers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFollowers();
    // eslint-disable-next-line
  }, [userId]);

  const fetchFollowers = async () => {
    try {
      const response = await axios.get(`/api/users/${userId}/followers`);
      setFollowers(response.data);
    } catch (error) {
      // Handle error if needed
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="followers-loading">
        <div className="spinner"></div>
        <p>Loading followers...</p>
      </div>
    );
  }

  return (
    <div className="followers-list">
      {followers.length === 0 ? (
        <div className="followers-empty">
          <Users className="icon" />
          <p>No followers yet</p>
        </div>
      ) : (
        followers.map((follower) => (
          <div key={follower.id} className="followers-item">
            <img
              src={follower.profile_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(follower.display_name || follower.username)}&background=3b82f6&color=fff`}
              alt={follower.display_name || follower.username}
              className="followers-avatar"
            />
            <div className="followers-userinfo">
              <Link to={`/profile/${follower.username}`} className="followers-link">
                {follower.display_name || follower.username}
              </Link>
              {follower.bio && (
                <p className="followers-bio">{follower.bio}</p>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

const FollowingTab = ({ userId }) => {
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFollowing();
    // eslint-disable-next-line
  }, [userId]);

  const fetchFollowing = async () => {
    try {
      const response = await axios.get(`/api/users/${userId}/following`);
      setFollowing(response.data);
    } catch (error) {
      // Handle error if needed
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="following-loading">
        <div className="spinner"></div>
        <p>Loading following...</p>
      </div>
    );
  }

  return (
    <div className="following-list">
      {following.length === 0 ? (
        <div className="following-empty">
          <Users className="icon" />
          <p>Not following anyone yet</p>
        </div>
      ) : (
        following.map((followed) => (
          <div key={followed.id} className="following-item">
            <img
              src={followed.profile_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(followed.display_name || followed.username)}&background=3b82f6&color=fff`}
              alt={followed.display_name || followed.username}
              className="following-avatar"
            />
            <div className="following-userinfo">
              <Link to={`/profile/${followed.username}`} className="following-link">
                {followed.display_name || followed.username}
              </Link>
              {followed.bio && (
                <p className="following-bio">{followed.bio}</p>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

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

  const isOwnProfile = currentUser && currentUser.username === username;

  useEffect(() => {
    fetchProfile();
    fetchPosts();
    if (isOwnProfile) fetchDrafts();
    // eslint-disable-next-line
  }, [username]);

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`/api/users/profile/${username}`);
      setProfile(response.data);
    } catch (error) {
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
      // error handling
    }
  };

  const fetchDrafts = async () => {
    try {
      setDraftsLoading(true);
      const res = await axios.get(`/api/users/${username}/drafts`);
      setDrafts(res.data);
    } catch (e) {
      // error handling
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
      toast.error('Failed to follow user');
    } finally {
      setFollowLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="profile-container">
        <div className="profile-loading">
          <div className="spinner"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile-container">
        <div className="profile-not-found">
          <User className="icon" />
          <h2>User not found</h2>
          <p>The user you’re looking for doesn’t exist.</p>
          <Link to="/dashboard" className="btn-primary">Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      {/* Profile Header */}
      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar-wrapper">
            <img
              src={
                profile.profile_image ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.display_name || profile.username)}&background=3b82f6&color=fff&size=80`
              }
              alt={profile.display_name || profile.username}
              className="profile-avatar"
            />
            {isOwnProfile && (
              <Link to="/settings" className="edit-profile-btn">
                <Edit3 />
              </Link>
            )}
          </div>
          <div className="profile-info">
            <h1>{profile.display_name || profile.username}</h1>
            <p className="username">@{profile.username}</p>
            {profile.bio && <p className="bio">{profile.bio}</p>}

            {!isOwnProfile && currentUser && (
              <button onClick={handleFollow} disabled={followLoading}
                className={`btn ${profile.is_following ? 'btn-secondary' : 'btn-primary'}`}>
                {followLoading ? '...' : profile.is_following ? (<><Minus /> Unfollow</>) : (<><Plus /> Follow</>)}
              </button>
            )}

            <div className="profile-stats">
              <span><b>{profile.posts_count}</b> Posts</span>
              <Link to={`/profile/${username}/followers`}><b>{profile.followers_count}</b> Followers</Link>
              <Link to={`/profile/${username}/following`}><b>{profile.following_count}</b> Following</Link>
            </div>

            <div className="joined-date">
              <Calendar /> Joined {formatDate(profile.created_at)}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="profile-tabs">
        <button className={activeTab === 'posts' ? 'active' : ''} onClick={() => setActiveTab('posts')}>
          <BookOpen /> Posts
        </button>
        {isOwnProfile && (
          <button className={activeTab === 'drafts' ? 'active' : ''} onClick={() => setActiveTab('drafts')}>
            <Edit3 /> Drafts
          </button>
        )}
      </div>

      {/* Posts / Drafts */}
      <div className="tab-content">
        {activeTab === 'posts' ? (
          posts.length === 0 ? (
            <div className="empty-state">
              <BookOpen className="icon" />
              <p>No posts yet</p>
              {isOwnProfile && <Link to="/write" className="btn-primary">Write your first post</Link>}
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
          )
        ) : (
          draftsLoading ? (
            <div className="loading-text">Loading drafts...</div>
          ) : drafts.length === 0 ? (
            <div className="empty-state">
              <p>No drafts yet</p>
              <Link to="/write" className="btn-primary">Create Draft</Link>
            </div>
          ) : (
            drafts.map((d) => (
              <div key={d.id} className="draft-card">
                <div>
                  <h3>{d.title || 'Untitled'}</h3>
                  <p>Last edited {formatDate(d.updated_at || d.created_at)}</p>
                </div>
                <div className="draft-actions">
                  <Link to={`/write?draftId=${d.id}`} className="btn-secondary">Edit</Link>
                  <button className="btn-primary"
                    onClick={async () => {
                      try {
                        await axios.post(`/api/posts/${d.id}/publish`);
                        toast.success('Draft published');
                        setDrafts(prev => prev.filter(x => x.id !== d.id));
                        fetchPosts();
                        setActiveTab('posts');
                        try { window.history.replaceState(null, '', `/profile/${username}`); } catch {}
                      } catch (e) {
                        toast.error('Failed to publish draft');
                      }
                    }}
                  >
                    Publish
                  </button>
                </div>
              </div>
            ))
          )
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
