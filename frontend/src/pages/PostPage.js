import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AuthContext } from '../App';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  MoreVertical, 
  ArrowLeft,
  Send,
  User,
  Clock
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

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
      console.error('Error fetching post:', error);
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
    } catch (error) {
      console.error('Error handling like:', error);
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
      toast.success('Comment added successfully');
    } catch (error) {
      console.error('Error adding comment:', error);
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
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-color mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading post...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-text-primary mb-4">Post not found</h2>
          <p className="text-text-secondary mb-6">The post you're looking for doesn't exist or has been removed.</p>
          <Link to="/dashboard" className="btn btn-primary">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back Button */}
      <div className="mb-6">
        <Link
          to="/dashboard"
          className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </div>

      {/* Post Content */}
      <div className="card mb-8">
        {/* Post Header */}
        <div className="flex items-start gap-3 mb-6">
          <img
            src={post.profile_image || `https://ui-avatars.com/api/?name=${post.display_name}&background=3b82f6&color=fff`}
            alt={post.display_name}
            className="w-12 h-12 rounded-full"
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
                <div className="flex items-center gap-2 text-text-secondary text-sm">
                  <Clock className="w-3 h-3" />
                  {formatDate(post.created_at)}
                </div>
              </div>
              <button className="p-2 rounded-full hover:bg-background-color">
                <MoreVertical className="w-4 h-4 text-text-secondary" />
              </button>
            </div>
          </div>
        </div>

        {/* Post Title */}
        <h1 className="text-3xl font-bold text-text-primary mb-4">
          {post.title}
        </h1>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {post.tags.map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-primary-color bg-opacity-10 text-primary-color text-sm rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Post Content */}
        <div 
          className="prose prose-lg max-w-none text-text-primary mb-6"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Post Actions */}
        <div className="flex items-center justify-between pt-6 border-t border-border-color">
          <div className="flex items-center gap-6">
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${
                post.is_liked 
                  ? 'text-error-color bg-error-color bg-opacity-10' 
                  : 'text-text-secondary hover:text-error-color hover:bg-error-color hover:bg-opacity-10'
              }`}
            >
              <Heart className={`w-5 h-5 ${post.is_liked ? 'fill-current' : ''}`} />
              <span className="font-medium">{post.likes_count}</span>
            </button>

            <div className="flex items-center gap-2 px-4 py-2 rounded-full text-text-secondary">
              <MessageCircle className="w-5 h-5" />
              <span className="font-medium">{post.comments_count}</span>
            </div>

            <button className="flex items-center gap-2 px-4 py-2 rounded-full text-text-secondary hover:text-primary-color hover:bg-primary-color hover:bg-opacity-10 transition-colors">
              <Share2 className="w-5 h-5" />
              <span className="font-medium">Share</span>
            </button>
          </div>
        </div>
      </div>

      {/* Comments Section */}
      <div className="card">
        <h3 className="text-xl font-semibold text-text-primary mb-6">
          Comments ({post.comments_count})
        </h3>

        {/* Add Comment */}
        {user && (
          <form onSubmit={handleComment} className="mb-6">
            <div className="flex items-start gap-3">
              <img
                src={user.profile_image || `https://ui-avatars.com/api/?name=${user.display_name}&background=3b82f6&color=fff`}
                alt={user.display_name}
                className="w-8 h-8 rounded-full"
              />
              <div className="flex-1">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  className="form-input form-textarea"
                  rows={3}
                />
                <div className="flex justify-end mt-2">
                  <button
                    type="submit"
                    disabled={submittingComment || !newComment.trim()}
                    className="btn btn-primary"
                  >
                    {submittingComment ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Posting...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Post Comment
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </form>
        )}

        {/* Comments List */}
        <div className="space-y-4">
          {comments.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="w-12 h-12 text-text-secondary mx-auto mb-4" />
              <p className="text-text-secondary">No comments yet. Be the first to comment!</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex items-start gap-3 p-4 bg-surface-color rounded-lg">
                <img
                  src={comment.profile_image || `https://ui-avatars.com/api/?name=${comment.display_name}&background=3b82f6&color=fff`}
                  alt={comment.display_name}
                  className="w-8 h-8 rounded-full"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Link 
                      to={`/profile/${comment.username}`}
                      className="font-semibold text-text-primary hover:text-primary-color"
                    >
                      {comment.display_name || comment.username}
                    </Link>
                    <span className="text-text-secondary text-sm">
                      {formatDate(comment.created_at)}
                    </span>
                  </div>
                  <p className="text-text-primary">{comment.content}</p>
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
