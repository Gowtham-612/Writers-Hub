import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import { Upload, FileText, File, FileImage, ArrowLeft, Edit3, X } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const UploadPage = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [extractedContent, setExtractedContent] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');

  const supportedTypes = ['.pdf', '.docx', '.txt'];
  const maxFileSize = 10 * 1024 * 1024; // 10MB

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    
    if (!selectedFile) return;

    // Check file type
    const fileExtension = selectedFile.name.toLowerCase().substring(selectedFile.name.lastIndexOf('.'));
    if (!supportedTypes.includes(fileExtension)) {
      toast.error('Please select a PDF, DOCX, or TXT file');
      return;
    }

    // Check file size
    if (selectedFile.size > maxFileSize) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setFile(selectedFile);
    setTitle(selectedFile.name.replace(/\.[^/.]+$/, '')); // Remove extension for title
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file');
      return;
    }

    try {
      setUploading(true);
      
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setExtractedContent(response.data);
      setTitle(response.data.title);
      setContent(response.data.content);
      
      toast.success('File uploaded and content extracted successfully!');
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error(error.response?.data?.error || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

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

  const handlePublish = async () => {
    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    if (!content.trim()) {
      toast.error('Please enter some content');
      return;
    }

    try {
      const response = await axios.post('/api/posts', {
        title: title.trim(),
        content: content.trim(),
        tags: tags,
        is_published: true
      });

      toast.success('Post published successfully!');
      navigate(`/post/${response.data.id}`);
    } catch (error) {
      console.error('Error publishing post:', error);
      toast.error('Failed to publish post');
    }
  };

  const getFileIcon = (fileName) => {
    const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
    switch (extension) {
      case '.pdf':
        return <FileText className="w-8 h-8 text-error-color" />;
      case '.docx':
        return <File className="w-8 h-8 text-primary-color" />;
      case '.txt':
        return <FileText className="w-8 h-8 text-success-color" />;
      default:
        return <File className="w-8 h-8 text-text-secondary" />;
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
            <h1 className="text-3xl font-bold text-text-primary">Import File</h1>
            <p className="text-text-secondary">
              Upload your existing work and convert it to a post
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload Section */}
        <div className="space-y-6">
          <div className="card">
            <h3 className="text-lg font-semibold text-text-primary mb-4">
              Upload File
            </h3>
            
            <div className="space-y-4">
              {/* File Drop Zone */}
              <div className="border-2 border-dashed border-border-color rounded-lg p-8 text-center hover:border-primary-color transition-colors">
                <input
                  type="file"
                  accept=".pdf,.docx,.txt"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-input"
                />
                <label htmlFor="file-input" className="cursor-pointer">
                  <Upload className="w-12 h-12 text-text-secondary mx-auto mb-4" />
                  <p className="text-text-primary font-medium mb-2">
                    Click to select a file
                  </p>
                  <p className="text-text-secondary text-sm">
                    Supports PDF, DOCX, and TXT files (max 10MB)
                  </p>
                </label>
              </div>

              {/* Selected File */}
              {file && (
                <div className="flex items-center gap-3 p-3 bg-surface-color rounded-lg">
                  {getFileIcon(file.name)}
                  <div className="flex-1">
                    <p className="text-text-primary font-medium">{file.name}</p>
                    <p className="text-text-secondary text-sm">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                  <button
                    onClick={() => setFile(null)}
                    className="p-1 rounded-full hover:bg-background-color"
                  >
                    <X className="w-4 h-4 text-text-secondary" />
                  </button>
                </div>
              )}

              {/* Upload Button */}
              {file && (
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="w-full btn btn-primary"
                >
                  {uploading ? 'Uploading...' : 'Extract Content'}
                </button>
              )}
            </div>
          </div>

          {/* Supported Formats */}
          <div className="card">
            <h3 className="text-lg font-semibold text-text-primary mb-4">
              Supported Formats
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-error-color" />
                <span className="text-text-primary">PDF files</span>
              </div>
              <div className="flex items-center gap-3">
                <File className="w-5 h-5 text-primary-color" />
                <span className="text-text-primary">DOCX files</span>
              </div>
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-success-color" />
                <span className="text-text-primary">TXT files</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Preview & Edit */}
        {extractedContent && (
          <div className="space-y-6">
            <div className="card">
              <h3 className="text-lg font-semibold text-text-primary mb-4">
                Edit Content
              </h3>
              
              <div className="space-y-4">
                {/* Title */}
                <div className="form-group">
                  <label className="form-label">Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="form-input"
                    placeholder="Enter post title..."
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
                      Add
                    </button>
                  </div>
                  
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag, index) => (
                        <span
                          key={index}
                          className="flex items-center gap-1 px-2 py-1 bg-primary-color bg-opacity-10 text-primary-color text-xs rounded-full"
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

                {/* Content */}
                <div className="form-group">
                  <label className="form-label">Content</label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="form-input form-textarea"
                    rows={15}
                    placeholder="Edit the extracted content..."
                  />
                </div>

                {/* Publish Button */}
                <button
                  onClick={handlePublish}
                  className="w-full btn btn-primary"
                >
                  <Edit3 className="w-4 h-4" />
                  Publish Post
                </button>
              </div>
            </div>

            {/* Original File Info */}
            <div className="card">
              <h3 className="text-lg font-semibold text-text-primary mb-4">
                Original File
              </h3>
              <div className="flex items-center gap-3">
                {getFileIcon(file.name)}
                <div>
                  <p className="text-text-primary font-medium">{file.name}</p>
                  <p className="text-text-secondary text-sm">
                    {formatFileSize(file.size)} • {extractedContent.original_filename}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadPage;
