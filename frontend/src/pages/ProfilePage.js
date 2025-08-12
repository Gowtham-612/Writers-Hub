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
  BookOpen
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const ProfilePage = () => {
  const { username } = useParams();
  const { user: currentUser } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [activeTab, setActiveTab] = useState('posts');
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchPosts();
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
              <div className="text-center">
                <div className="text-2xl font-bold text-text-primary">{profile.followers_count}</div>
                <div className="text-sm text-text-secondary">Followers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-text-primary">{profile.following_count}</div>
                <div className="text-sm text-text-secondary">Following</div>
              </div>
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
        <button
          onClick={() => setActiveTab('followers')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'followers'
              ? 'text-primary-color border-b-2 border-primary-color'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <Users className="w-4 h-4 inline mr-2" />
          Followers ({profile.followers_count})
        </button>
        <button
          onClick={() => setActiveTab('following')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'following'
              ? 'text-primary-color border-b-2 border-primary-color'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <Users className="w-4 h-4 inline mr-2" />
          Following ({profile.following_count})
        </button>
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
              <PostCard key={post.id} post={post} />
            ))
          )}
        </div>
      )}

      {activeTab === 'followers' && (
        <FollowersTab userId={profile.id} />
      )}

      {activeTab === 'following' && (
        <FollowingTab userId={profile.id} />
      )}
    </div>
  );
};

// Post Card Component
const PostCard = ({ post }) => {
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
            <span
              key={index}
              className="px-2 py-1 bg-primary-color bg-opacity-10 text-primary-color text-xs rounded-full"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 text-text-secondary">
          <Heart className="w-4 h-4" />
          <span className="text-sm">{post.likes_count}</span>
        </div>
        <div className="flex items-center gap-2 text-text-secondary">
          <MessageCircle className="w-4 h-4" />
          <span className="text-sm">{post.comments_count}</span>
        </div>
      </div>
    </div>
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
