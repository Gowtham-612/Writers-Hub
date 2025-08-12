import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import { Save, Eye, EyeOff, Tag, ArrowLeft } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import axios from 'axios';
import toast from 'react-hot-toast';

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

  // Quill editor modules and formats
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'align': [] }],
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
        tags: tags,
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
        tags: tags,
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
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 rounded-lg hover:bg-surface-color transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-text-primary">
              {isPreview ? 'Preview' : 'Write Post'}
            </h1>
            <p className="text-text-secondary">
              Share your thoughts with the writing community
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsPreview(!isPreview)}
            className="btn btn-secondary"
          >
            {isPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {isPreview ? 'Edit' : 'Preview'}
          </button>
          
          <button
            onClick={handleSaveDraft}
            disabled={loading}
            className="btn btn-secondary"
          >
            <Save className="w-4 h-4" />
            Save Draft
          </button>
        </div>
      </div>

      {!isPreview ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="form-group">
            <label className="form-label">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter your post title..."
              className="form-input text-xl font-semibold"
              maxLength={200}
            />
          </div>

          {/* Tags */}
          <div className="form-group">
            <label className="form-label">Tags</label>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Add tags..."
                className="form-input flex-1"
                onKeyPress={(e) => e.key === 'Enter' && handleAddTag(e)}
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="btn btn-primary"
              >
                <Tag className="w-4 h-4" />
                Add
              </button>
            </div>
            
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, index) => (
                  <span
                    key={index}
                    className="flex items-center gap-1 px-3 py-1 bg-primary-color bg-opacity-10 text-primary-color rounded-full text-sm"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:text-error-color"
                    >
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
            <div className="border border-border-color rounded-lg">
              <ReactQuill
                theme="snow"
                value={content}
                onChange={setContent}
                modules={modules}
                formats={formats}
                placeholder="Start writing your post..."
                style={{ height: '400px' }}
              />
            </div>
          </div>

          {/* Publish Settings */}
          <div className="form-group">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="w-4 h-4 text-primary-color"
                />
                <span className="text-text-primary">Publish immediately</span>
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary px-8 py-3"
            >
              {loading ? 'Publishing...' : (isPublished ? 'Publish Post' : 'Save as Draft')}
            </button>
          </div>
        </form>
      ) : (
        /* Preview Mode */
        <div className="space-y-6">
          <div className="card">
            <h1 className="text-3xl font-bold text-text-primary mb-4">
              {title || 'Untitled Post'}
            </h1>
            
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-primary-color bg-opacity-10 text-primary-color text-xs rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
            
            <div 
              className="prose prose-lg max-w-none text-text-primary"
              dangerouslySetInnerHTML={{ __html: content }}
            />
            
            <div className="mt-6 pt-4 border-t border-border-color">
              <div className="flex items-center gap-3 text-text-secondary text-sm">
                <img
                  src={user.profile_image || `https://ui-avatars.com/api/?name=${user.display_name}&background=3b82f6&color=fff`}
                  alt={user.display_name}
                  className="w-6 h-6 rounded-full"
                />
                <span>{user.display_name || user.username}</span>
                <span>•</span>
                <span>{new Date().toLocaleDateString()}</span>
                {!isPublished && (
                  <>
                    <span>•</span>
                    <span className="text-warning-color">Draft</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WritePage;
