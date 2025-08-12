import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import { Bot, Sparkles, ArrowLeft, Play, Save, Trash2, Loader } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const AiAssistPage = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [samples, setSamples] = useState([]);
  const [selectedSamples, setSelectedSamples] = useState([]);
  const [plot, setPlot] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [ollamaStatus, setOllamaStatus] = useState('checking');
  const [savedSamples, setSavedSamples] = useState([]);

  useEffect(() => {
    fetchSamples();
    checkOllamaStatus();
  }, []);

  const checkOllamaStatus = async () => {
    try {
      const response = await axios.get('/api/ai/status');
      setOllamaStatus(response.data.status);
    } catch (error) {
      setOllamaStatus('disconnected');
    }
  };

  const fetchSamples = async () => {
    try {
      const [writingSamples, aiSamples] = await Promise.all([
        axios.get('/api/ai/samples'),
        axios.get('/api/ai/samples/all')
      ]);
      
      setSamples(writingSamples.data);
      setSavedSamples(aiSamples.data);
    } catch (error) {
      console.error('Error fetching samples:', error);
    }
  };

  const handleSampleToggle = (sample) => {
    if (selectedSamples.find(s => s.id === sample.id)) {
      setSelectedSamples(selectedSamples.filter(s => s.id !== sample.id));
    } else if (selectedSamples.length < 3) {
      setSelectedSamples([...selectedSamples, sample]);
    } else {
      toast.error('You can only select up to 3 samples');
    }
  };

  const handleGenerate = async () => {
    if (!plot.trim()) {
      toast.error('Please enter a plot or idea');
      return;
    }

    if (selectedSamples.length === 0) {
      toast.error('Please select at least one writing sample');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post('/api/ai/generate', {
        plot: plot.trim(),
        samples: selectedSamples
      });

      setGeneratedContent(response.data.content);
      toast.success(`Generated content using ${response.data.samples_used} samples`);
    } catch (error) {
      console.error('Error generating content:', error);
      if (error.response?.status === 503) {
        toast.error('Ollama service is not running. Please start Ollama and try again.');
      } else {
        toast.error('Failed to generate content');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSample = async () => {
    if (!generatedContent.trim()) {
      toast.error('No content to save');
      return;
    }

    try {
      await axios.post('/api/ai/samples', {
        title: `AI Generated - ${new Date().toLocaleDateString()}`,
        content: generatedContent
      });

      toast.success('Sample saved successfully');
      fetchSamples(); // Refresh the list
    } catch (error) {
      console.error('Error saving sample:', error);
      toast.error('Failed to save sample');
    }
  };

  const handleDeleteSample = async (sampleId) => {
    try {
      await axios.delete(`/api/ai/samples/${sampleId}`);
      toast.success('Sample deleted successfully');
      fetchSamples(); // Refresh the list
    } catch (error) {
      console.error('Error deleting sample:', error);
      toast.error('Failed to delete sample');
    }
  };

  const handlePublish = async () => {
    if (!generatedContent.trim()) {
      toast.error('No content to publish');
      return;
    }

    try {
      const response = await axios.post('/api/posts', {
        title: `AI Generated: ${plot.substring(0, 50)}...`,
        content: generatedContent,
        tags: ['ai-generated', 'writing-assistant'],
        is_published: true
      });

      toast.success('Post published successfully!');
      navigate(`/post/${response.data.id}`);
    } catch (error) {
      console.error('Error publishing post:', error);
      toast.error('Failed to publish post');
    }
  };

  const SampleCard = ({ sample, isSelected, onToggle, showDelete = false }) => (
    <div 
      className={`card cursor-pointer transition-all ${
        isSelected ? 'ring-2 ring-primary-color bg-primary-color bg-opacity-5' : 'hover:shadow-lg'
      }`}
      onClick={() => onToggle(sample)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="font-semibold text-text-primary mb-2">{sample.title}</h4>
          <p className="text-text-secondary text-sm line-clamp-3">
            {sample.content.length > 150 
              ? `${sample.content.substring(0, 150)}...` 
              : sample.content
            }
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-text-secondary">
              {new Date(sample.created_at).toLocaleDateString()}
            </span>
            {isSelected && (
              <span className="text-xs bg-primary-color text-white px-2 py-1 rounded-full">
                Selected
              </span>
            )}
          </div>
        </div>
        {showDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteSample(sample.id);
            }}
            className="p-1 text-error-color hover:bg-error-color hover:bg-opacity-10 rounded"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto">
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
            <h1 className="text-3xl font-bold text-text-primary">AI Writing Assistant</h1>
            <p className="text-text-secondary">
              Generate content in your unique writing style
            </p>
          </div>
        </div>

        {/* Ollama Status */}
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            ollamaStatus === 'connected' ? 'bg-success-color' : 'bg-error-color'
          }`}></div>
          <span className="text-sm text-text-secondary">
            Ollama: {ollamaStatus === 'connected' ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Input and Samples */}
        <div className="space-y-6">
          {/* Plot Input */}
          <div className="card">
            <h3 className="text-lg font-semibold text-text-primary mb-4">
              <Sparkles className="w-5 h-5 inline mr-2 text-primary-color" />
              Your Plot or Idea
            </h3>
            <textarea
              value={plot}
              onChange={(e) => setPlot(e.target.value)}
              placeholder="Describe your plot, idea, or writing prompt..."
              className="form-input form-textarea"
              rows={4}
            />
          </div>

          {/* Writing Samples */}
          <div className="card">
            <h3 className="text-lg font-semibold text-text-primary mb-4">
              Select Writing Samples ({selectedSamples.length}/3)
            </h3>
            <p className="text-text-secondary text-sm mb-4">
              Choose up to 3 of your past writings to help AI mimic your style
            </p>
            
            {samples.length === 0 ? (
              <div className="text-center py-8">
                <Bot className="w-12 h-12 text-text-secondary mx-auto mb-4" />
                <p className="text-text-secondary">
                  No writing samples found. Create some posts first to use AI assistance.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {samples.map((sample) => (
                  <SampleCard
                    key={sample.id}
                    sample={sample}
                    isSelected={selectedSamples.find(s => s.id === sample.id)}
                    onToggle={handleSampleToggle}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={loading || selectedSamples.length === 0 || !plot.trim() || ollamaStatus !== 'connected'}
            className="w-full btn btn-primary py-3"
          >
            {loading ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Generate Content
              </>
            )}
          </button>

          {/* Saved AI Samples */}
          {savedSamples.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-semibold text-text-primary mb-4">
                Saved AI Samples
              </h3>
              <div className="space-y-3">
                {savedSamples.map((sample) => (
                  <SampleCard
                    key={sample.id}
                    sample={sample}
                    showDelete={true}
                    onToggle={() => {}} // No toggle for saved samples
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Generated Content */}
        <div className="space-y-6">
          <div className="card">
            <h3 className="text-lg font-semibold text-text-primary mb-4">
              <Bot className="w-5 h-5 inline mr-2 text-primary-color" />
              Generated Content
            </h3>
            
            {generatedContent ? (
              <div className="space-y-4">
                <div className="bg-surface-color p-4 rounded-lg">
                  <div 
                    className="prose prose-sm max-w-none text-text-primary"
                    dangerouslySetInnerHTML={{ 
                      __html: generatedContent.replace(/\n/g, '<br>') 
                    }}
                  />
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={handleSaveSample}
                    className="btn btn-secondary"
                  >
                    <Save className="w-4 h-4" />
                    Save Sample
                  </button>
                  
                  <button
                    onClick={handlePublish}
                    className="btn btn-primary"
                  >
                    <Sparkles className="w-4 h-4" />
                    Publish Post
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Bot className="w-12 h-12 text-text-secondary mx-auto mb-4" />
                <p className="text-text-secondary">
                  Generated content will appear here
                </p>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="card">
            <h3 className="text-lg font-semibold text-text-primary mb-4">
              How It Works
            </h3>
            <div className="space-y-3 text-sm text-text-secondary">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary-color rounded-full flex items-center justify-center text-white text-xs font-bold">
                  1
                </div>
                <p>Select up to 3 of your past writings to establish your style</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary-color rounded-full flex items-center justify-center text-white text-xs font-bold">
                  2
                </div>
                <p>Describe your plot, idea, or writing prompt</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary-color rounded-full flex items-center justify-center text-white text-xs font-bold">
                  3
                </div>
                <p>AI generates content in your unique writing style</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary-color rounded-full flex items-center justify-center text-white text-xs font-bold">
                  4
                </div>
                <p>Edit, save, or publish the generated content</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiAssistPage;
