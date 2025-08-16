import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import { Save, Eye, EyeOff, Tag, ArrowLeft } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import axios from 'axios';
import toast from 'react-hot-toast';
import '../Styling/WritePage.css';


const WritePage = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [isPreview, setIsPreview] = useState(false);
  const [loading, setLoading] = useState(false);

  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ color: [] }, { background: [] }],
      [{ align: [] }],
      ['link', 'blockquote', 'code-block'],
      ['clean']
    ],
  };

  const formats = [
    'header', 'bold', 'italic', 'underline', 'strike',
    'list', 'bullet', 'color', 'background', 'align',
    'link', 'blockquote', 'code-block'
  ];

  const handleAddTag = (e) => {
    e.preventDefault();
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }
    if (!content.trim()) {
      toast.error('Please enter some content');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post('/api/posts', {
        title: title.trim(),
        content: content.trim(),
        tags,
        is_published: isPublished
      });

      toast.success(isPublished ? 'Post published successfully!' : 'Post saved as draft!');
      navigate(`/post/${response.data.id}`);
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!title.trim() && !content.trim()) {
      toast.error('Please enter some content to save');
      return;
    }

    try {
      setLoading(true);
      await axios.post('/api/posts', {
        title: title.trim() || 'Untitled',
        content: content.trim() || 'No content yet...',
        tags,
        is_published: false
      });

      toast.success('Draft saved successfully!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error saving draft:', error);
      toast.error('Failed to save draft');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="writepage-container">
      {/* Header */}
      <header className="writepage-header">
        <div className="writepage-back-button-group">
          <button
            onClick={() => navigate('/dashboard')}
            className="btn-icon"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="icon" />
          </button>
          <div className="writepage-title-group">
            <h1 className="writepage-title">{isPreview ? 'Preview' : 'Write Post'}</h1>
            <p className="writepage-subtitle">Share your thoughts with the writing community</p>
          </div>
        </div>

        <div className="writepage-action-buttons">
          <button onClick={() => setIsPreview(!isPreview)} className="btn-secondary btn-with-icon">
            {isPreview ? <EyeOff className="icon-small" /> : <Eye className="icon-small" />}
            {isPreview ? 'Edit' : 'Preview'}
          </button>
          <button onClick={handleSaveDraft} disabled={loading} className="btn-secondary btn-with-icon">
            <Save className="icon-small" />
            Save Draft
          </button>
        </div>
      </header>

      {!isPreview ? (
        <form onSubmit={handleSubmit} className="writepage-form">
          {/* Title */}
          <div className="form-group">
            <label htmlFor="post-title" className="form-label">Title</label>
            <input
              id="post-title"
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Enter your post title..."
              className="form-input form-input-title"
              maxLength={200}
              autoComplete="off"
            />
          </div>

          {/* Tags */}
          <div className="form-group">
            <label className="form-label">Tags</label>
            <div className="tag-input-group">
              <input
                type="text"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                placeholder="Add tags..."
                className="form-input tag-input"
                onKeyPress={e => e.key === 'Enter' && handleAddTag(e)}
                autoComplete="off"
              />
              <button type="button" onClick={handleAddTag} className="btn-primary btn-with-icon">
                <Tag className="icon-small" />
                Add
              </button>
            </div>
            {tags.length > 0 && (
              <div className="tag-list">
                {tags.map((tag, idx) => (
                  <span key={idx} className="tag">
                    #{tag}
                    <button type="button" onClick={() => handleRemoveTag(tag)} className="tag-remove-btn" aria-label={`Remove tag ${tag}`}>
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Content Editor */}
          <div className="form-group">
            <label className="form-label">Content</label>
            <div className="quill-wrapper">
              <ReactQuill
                theme="snow"
                value={content}
                onChange={setContent}
                modules={modules}
                formats={formats}
                placeholder="Start writing your post..."
              />
            </div>
          </div>

          {/* Publish Checkbox */}
          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={e => setIsPublished(e.target.checked)}
                className="checkbox-input"
              />
              <span className="checkbox-text">Publish immediately</span>
            </label>
          </div>

          {/* Submit Button */}
          <div className="form-submit">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary btn-submit"
            >
              {loading ? 'Publishing...' : (isPublished ? 'Publish Post' : 'Save as Draft')}
            </button>
          </div>
        </form>
      ) : (
        /* Preview Mode */
        <div className="post-preview">
          <div className="card post-preview-card">
            <h1 className="post-preview-title">{title || 'Untitled Post'}</h1>
            {tags.length > 0 && (
              <div className="tag-list post-preview-tags">
                {tags.map((tag, idx) => (
                  <span key={idx} className="tag post-preview-tag">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
            <div
              className="post-preview-content"
              dangerouslySetInnerHTML={{ __html: content }}
            />
            <footer className="post-preview-footer">
              <div className="author-info">
                <img
                  src={user.profile_image || `https://ui-avatars.com/api/?name=${user.display_name}&background=3b82f6&color=fff`}
                  alt={user.display_name}
                  className="author-avatar"
                />
                <span className="author-name">{user.display_name || user.username}</span>
                <span className="post-separator">•</span>
                <span className="post-date">{new Date().toLocaleDateString()}</span>
                {!isPublished && (
                  <>
                    <span className="post-separator">•</span>
                    <span className="draft-label">Draft</span>
                  </>
                )}
              </div>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
};

export default WritePage;
