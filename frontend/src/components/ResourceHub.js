import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import axios from '../axiosConfig';
import FileViewer from './FileViewer';

const ResourceHub = () => {
  // WCAG AA Compliant Color System - ResourceHub
  const colors = {
    light: {
      // Primary Colors from Reference Image
      creamWhite: '#faf5f5',      // Background
      warmIvory: '#f5f3f0',       // Secondary background
      parchment: '#e6e3dd',       // Borders and dividers
      antiqueGold: '#c9a96e',     // Accent color
      agedBrass: '#6b7355',       // Secondary accent
      forestGreen: '#4a5d4a',     // Success/positive
      charcoal: '#2c2c2c',        // Primary text (WCAG AA: 12.6:1 contrast)

      // UI Application
      text: '#2c2c2c',            // High contrast text
      lightText: '#4a5d4a',       // Secondary text (WCAG AA: 7.8:1 contrast)
      background: '#faf5f5',      // Main background
      backgroundAlt: '#f5f3f0',   // Alternative background
      card: '#ffffff',            // Card background
      border: '#e6e3dd',          // Borders
      buttonText: '#ffffff',      // Button text
      success: '#4a5d4a',         // Success color
      hover: '#f5f3f0',           // Hover state
      shadow: 'rgba(44, 44, 44, 0.08)',

      // Brand Colors
      primary: '#4a5d4a',         // Forest Green
      accent: '#c9a96e',          // Antique Gold
      highlight: '#c9a96e',       // Highlight color
      richRed: '#c9a96e'          // Special elements
    },
    dark: {
      // Dark Colors from Reference Image
      deepBlack: '#1a1a1a',       // Background
      richCharcoal: '#252525',    // Secondary background
      slateGray: '#404040',       // Borders and dividers
      wornLeather: '#6d5a47',     // Accent color
      antiqueGoldDark: '#c9a96e', // Accent (same as light)
      mutedSage: '#5a6b5a',       // Success/positive
      softCream: '#e6e3dd',       // Primary text (WCAG AA: 11.8:1 contrast)

      // UI Application
      text: '#e6e3dd',            // High contrast text
      lightText: '#c9a96e',       // Secondary text (WCAG AA: 6.2:1 contrast)
      background: '#1a1a1a',      // Main background
      backgroundAlt: '#252525',   // Alternative background
      card: '#252525',            // Card background
      border: '#404040',          // Borders
      buttonText: '#e6e3dd',      // Button text
      success: '#5a6b5a',         // Success color
      hover: '#252525',           // Hover state
      shadow: 'rgba(0, 0, 0, 0.3)',

      // Brand Colors
      primary: '#5a6b5a',         // Muted Sage
      accent: '#c9a96e',          // Antique Gold
      highlight: '#c9a96e',       // Highlight color
      richRed: '#c9a96e'          // Special elements
    }
  };

  // State management
  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('darkMode');
    return savedTheme ? savedTheme === 'true' : false;
  });
  const [activeTab, setActiveTab] = useState('notes'); // 'notes' or 'papers'
  const [selectedSemester, setSelectedSemester] = useState(1);
  const [resources, setResources] = useState({
    notes: [],
    papers: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    type: 'notes',
    semester: 1,
    file: null
  });
  const [isUploading, setIsUploading] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [noteContent, setNoteContent] = useState('');
  const [paperContent, setPaperContent] = useState('');
  const [contentLoading, setContentLoading] = useState(false);
  const [contentError, setContentError] = useState(null);
  const [showUploadArea, setShowUploadArea] = useState(false);
  const [showFiles, setShowFiles] = useState(true); // Controls file list visibility
  const [viewMode, setViewMode] = useState('split'); // 'split', 'files', or 'preview'
  const [searchTerm, setSearchTerm] = useState(''); // For resource searching
  const [sortBy, setSortBy] = useState('date'); // 'date', 'name', 'downloads'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' or 'desc'
  const [notification, setNotification] = useState(null); // For showing notifications
  const [dualViewMode, setDualViewMode] = useState(false); // For viewing both notes and papers simultaneously
// Removed duplicate loading state - using isLoading instead

  // Current color scheme based on mode
  const theme = darkMode ? colors.dark : colors.light;
  
  // API base URL - use this to create full URLs for files
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5005';

  // Fetch resources from API
  useEffect(() => {
    const fetchResources = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Add token to request headers
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Not authenticated');
        }

        const tokenData = JSON.parse(token);
        if (Date.now() > tokenData.expiresAt) {
          throw new Error('Token expired');
          // Use mock data when API fails
          setResources({
            notes: [
              { _id: 'mock1', title: 'Sample Note 1', description: 'Sample description', semester: 1, type: 'notes', uploadDate: new Date().toISOString(), downloadCount: 5 },
              { _id: 'mock2', title: 'Sample Note 2', description: 'Another sample', semester: 1, type: 'notes', uploadDate: new Date().toISOString(), downloadCount: 3 }
            ],
            papers: [
              { _id: 'mock3', title: 'Sample Paper 1', description: 'A sample paper', semester: 1, type: 'papers', uploadDate: new Date().toISOString(), downloadCount: 2 },
              { _id: 'mock4', title: 'Sample Paper 2', description: 'Another paper', semester: 1, type: 'papers', uploadDate: new Date().toISOString(), downloadCount: 7 }
            ]
          });
        }
      } catch (err) {
        console.error('Error fetching resources:', err);
        setError('Failed to load resources. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
  
    fetchResources();
  }, []);
  
  // Handle search functionality
  useEffect(() => {
    const searchResources = async () => {
      // Only search if there's a search term
      if (!searchTerm || searchTerm.trim() === '') {
        // If search term is cleared, fetch all resources
        const fetchAllResources = async () => {
          try {
            setIsLoading(true);
            const response = await axios.get('/api/resources');
            if (response && response.data) {
              // Ensure we have a proper structure with notes and papers arrays
              const responseData = {
                notes: Array.isArray(response.data.notes) ? response.data.notes : [],
                papers: Array.isArray(response.data.papers) ? response.data.papers : []
              };
              setResources(responseData);
            } else {
              setResources({ notes: [], papers: [] });
            }
          } catch (err) {
            console.error('Error fetching resources:', err);
            setError('Failed to load resources. Please try again later.');
          } finally {
            setIsLoading(false);
          }
        };
        fetchAllResources();
        return;
      }
      
      // Debounce search to avoid too many requests
      const timeoutId = setTimeout(async () => {
        try {
          setIsLoading(true);
          const response = await axios.get(`/api/resources/search?query=${encodeURIComponent(searchTerm)}`);
          if (response && response.data) {
            // Ensure we have a proper structure with notes and papers arrays
            const responseData = {
              notes: Array.isArray(response.data.notes) ? response.data.notes : [],
              papers: Array.isArray(response.data.papers) ? response.data.papers : []
            };
            setResources(responseData);
          } else {
            setResources({ notes: [], papers: [] });
          }
        } catch (err) {
          console.error('Error searching resources:', err);
          setError('Failed to search resources. Please try again.');
        } finally {
          setIsLoading(false);
        }
      }, 500); // 500ms debounce
      
      return () => clearTimeout(timeoutId);
    };
    
    searchResources();
  }, [searchTerm]); // Re-run when searchTerm changes

  // Handle file upload
  const handleFileChange = (e) => {
    setUploadForm({
      ...uploadForm,
      file: e.target.files[0]
    });
  };

  // Validate filename format based on resource type
  const validateFilename = (file, type, semester) => {
    // No longer enforcing strict filename format
    // Just check if file exists and has a valid extension
    
    const fileName = file.name;
    const extension = fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase();
    
    // Check if file has a valid extension
    const allowedExtensions = ['pdf', 'doc', 'docx', 'txt', 'jpg', 'jpeg', 'png'];
    
    if (!allowedExtensions.includes(extension)) {
      return {
        isValid: false,
        message: `File type not supported. Please upload a file with one of these extensions: ${allowedExtensions.join(', ')}`
      };
    }
    
    return { isValid: true };
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!uploadForm.file) {
      setError('Please select a file to upload');
      return;
    }
    
    // Validate filename format
    const validation = validateFilename(uploadForm.file, uploadForm.type, uploadForm.semester);
    if (!validation.isValid) {
      setError(validation.message);
      return;
    }

    setIsUploading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('title', uploadForm.title);
      formData.append('description', uploadForm.description || '');
      formData.append('type', uploadForm.type);
      formData.append('semester', uploadForm.semester.toString());
      formData.append('file', uploadForm.file);

      console.log('Uploading file:', uploadForm.file.name);
      
      const response = await axios.post('/api/resources/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log(`Upload progress: ${percentCompleted}%`);
        }
      });

      console.log('Upload response:', response.data);

      // Show success notification
      setNotification({
        type: 'success',
        title: 'Upload Successful',
        message: `"${uploadForm.title}" has been successfully uploaded.`
      });
      
      // Clear notification after 3 seconds
      setTimeout(() => setNotification(null), 3000);

      // Refresh resources
      const resourceResponse = await axios.get('/api/resources');
      setResources(resourceResponse.data);
      setShowUploadModal(false);
      setUploadForm({
        title: '',
        description: '',
        type: 'notes',
        semester: 1,
        file: null
      });
    } catch (err) {
      console.error('Error uploading resource:', err);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Failed to upload resource. Please try again.');
      }
    } finally {
      setIsUploading(false);
    }
  };

  // Filter resources by semester
  const filteredResources = useMemo(() => ({
    notes: resources.notes.filter(note => note.semester === selectedSemester),
    papers: resources.papers.filter(paper => paper.semester === selectedSemester)
  }), [resources, selectedSemester]);

  // Dark mode toggle
  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', newMode.toString());
  };

  // Toggle menu function
  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  // Fetch content for selected note with improved error handling
  const fetchNoteContent = async (note) => {
    try {
      setContentLoading(true);
      setContentError(null);
      
      // Check if we have a valid note ID
      if (!note || !note._id) {
        throw new Error('Invalid note selected');
      }
      
      const response = await axios.get(`/api/resources/${note._id}/content`);
      
      if (!response.data || !response.data.content) {
        throw new Error('No content received from server');
      }
      
      setNoteContent(response.data.content);
    } catch (err) {
      console.error('Error fetching note content:', err);
      setNoteContent('');
      
      // Provide more specific error message based on the error
      if (err.response && err.response.status === 404) {
        setContentError('The requested file could not be found. It may have been moved or deleted.');
      } else if (err.message === 'Network Error') {
        setContentError('Network error. Please check your connection and try again.');
      } else {
        setContentError(`Failed to load content: ${err.message || 'Unknown error'}. Please try again or download the file instead.`);
      }
    } finally {
      setContentLoading(false);
    }
  };

  // Fetch content for selected paper with improved error handling
  const fetchPaperContent = async (paper) => {
    try {
      setContentLoading(true);
      setContentError(null);
      
      // Check if we have a valid paper ID
      if (!paper || !paper._id) {
        throw new Error('Invalid paper selected');
      }
      
      const response = await axios.get(`/api/resources/${paper._id}/content`);
      
      if (!response.data || !response.data.content) {
        throw new Error('No content received from server');
      }
      
      setPaperContent(response.data.content);
    } catch (err) {
      console.error('Error fetching paper content:', err);
      setPaperContent('');
      
      // Provide more specific error message based on the error
      if (err.response && err.response.status === 404) {
        setContentError('The requested file could not be found. It may have been moved or deleted.');
      } else if (err.message === 'Network Error') {
        setContentError('Network error. Please check your connection and try again.');
      } else {
        setContentError(`Failed to load content: ${err.message || 'Unknown error'}. Please try again or download the file instead.`);
      }
    } finally {
      setContentLoading(false);
    }
  };

  // Get file type from URL
  const getFileType = (fileUrl) => {
    if (!fileUrl) return '';
    return fileUrl.split('.').pop().toLowerCase();
  };

  // Check if file can be viewed in browser
  const canViewInBrowser = (fileUrl) => {
    if (!fileUrl) return false;
    const fileType = getFileType(fileUrl);
    const viewableTypes = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'txt', 'html', 'htm', 'md', 'svg'];
    return viewableTypes.includes(fileType);
  };

  // Get file icon based on file type
  const getFileIcon = (fileType) => {
    if (!fileType) return '📄';
    
    const type = fileType.toLowerCase();
    switch (type) {
      case 'pdf': return '📕';
      case 'doc': 
      case 'docx': return '📘';
      case 'txt': return '📝';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'svg': return '🖼️';
      case 'ppt':
      case 'pptx': return '📊';
      case 'xls':
      case 'xlsx': return '📈';
      case 'zip':
      case 'rar': return '🗜️';
      default: return '📄';
    }
  };

  // Get complete URL for file - improved function with better error handling
  const getCompleteFileUrl = (fileUrl, resourceId) => {
    if (!resourceId) return null;
    
    // Ensure we're using the right API base URL
    const baseUrl = process.env.REACT_APP_API_URL || '';
    
    // Fix the download URL path to match the server's endpoint structure
    // The server might be expecting a different URL structure, try the correct path
    return `/api/resources/${resourceId}/download`;
  };

  // Handle resource deletion
  const handleDelete = async (resource, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!window.confirm(`Are you sure you want to delete "${resource.title}"?`)) {
      return;
    }
    
    try {
      // Validate resource ID
      if (!resource || !resource._id) {
        throw new Error('Invalid resource selected for deletion');
      }
      
      // Get the token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required. Please log in again.');
      }
      
      // Make the delete request with proper error handling and x-auth-token header
      const response = await axios.delete(`/api/resources/${resource._id}`, {
        headers: {
          'x-auth-token': token
        }
      });
      
      if (response.status !== 200) {
        throw new Error(`Server returned status ${response.status}`);
      }
      
      // Remove the resource from the state
      const updatedResources = {
        notes: resources.notes.filter(note => note._id !== resource._id),
        papers: resources.papers.filter(paper => paper._id !== resource._id)
      };
      
      setResources(updatedResources);
      
      // If the deleted resource was selected, clear the selection
      if (selectedNote && selectedNote._id === resource._id) {
        setSelectedNote(null);
        setNoteContent('');
      }
      
      if (selectedPaper && selectedPaper._id === resource._id) {
        setSelectedPaper(null);
        setPaperContent('');
      }
      
      // Show success notification
      setNotification({
        type: 'success',
        title: 'Resource Deleted',
        message: `"${resource.title}" has been successfully deleted.`
      });
      
      // Clear notification after 3 seconds
      setTimeout(() => setNotification(null), 3000);
    } catch (err) {
      console.error('Error deleting resource:', err);
      
      // Show error notification with more detailed error message
      setNotification({
        type: 'error',
        title: 'Delete Failed',
        message: err.response?.data?.message || err.message || 'Failed to delete resource. Please try again.'
      });
      
      // Clear notification after 5 seconds
      setTimeout(() => setNotification(null), 5000);
    }
  };
  
  // Handle resource selection
  const handleResourceSelect = (resource) => {
    const fileUrl = getCompleteFileUrl(resource.fileUrl, resource._id);
    const fileType = getFileType(resource.fileUrl);
    
    if (resource.type === 'notes') {
      const selectedResource = {
        ...resource,
        fileUrl,
        fileType
      };
      setSelectedNote(selectedResource);
      setSelectedPaper(null);
      
      // Fetch content for the selected note
      fetchNoteContent(selectedResource);
      
      // If in files-only mode, switch to preview or split mode
      if (viewMode === 'files') {
        setViewMode('split');
      }
    } else {
      const selectedResource = {
        ...resource,
        fileUrl,
        fileType
      };
      setSelectedPaper(selectedResource);
      setSelectedNote(null);
      
      // Fetch content for the selected paper
      fetchPaperContent(selectedResource);
      
      // If in files-only mode, switch to preview or split mode
      if (viewMode === 'files') {
        setViewMode('split');
      }
    }
  };

  // Handle file download - completely revised for reliability
  const handleDownload = async (resource) => {
    try {
      setNotification({
        type: 'info',
        message: 'Starting download...',
        duration: 3000
      });

      // Create a temporary anchor element
      const link = document.createElement('a');
      link.href = `/api/resources/download/${resource._id}`;
      link.download = `${resource.title}${resource.fileType ? `.${resource.fileType}` : ''}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setNotification({
        type: 'success',
        message: 'Download started successfully',
        duration: 3000
      });
    } catch (error) {
      console.error('Download error:', error);
      setNotification({
        type: 'error',
        message: 'Failed to start download. Please try again.',
        duration: 3000
      });
    }
  };

  return (
    <div style={{
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      background: theme.background,
      color: theme.text,
      minHeight: '100vh',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      position: 'relative',
    }}>
      {/* mymind-style advanced animations */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .resource-card {
          animation: fadeInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .resource-card:hover {
          transform: translateY(-4px) scale(1.02);
          box-shadow: 0 20px 40px rgba(0,0,0,0.12);
        }

        .search-input {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .search-input:focus {
          transform: scale(1.02);
        }
      `}</style>

      {/* mymind-style minimal header */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '2rem 3rem',
        borderBottom: `1px solid ${theme.border}`,
        background: 'transparent',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backdropFilter: 'blur(20px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <Link to="/dashboard" style={{
            color: theme.lightText,
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            fontSize: '0.9rem',
            fontWeight: '500',
            padding: '0.5rem',
            borderRadius: '8px',
            transition: 'all 0.2s ease'
          }}>
            <span style={{ marginRight: '0.5rem' }}>←</span> Dashboard
          </Link>
          <div style={{
            fontWeight: '600',
            fontSize: '1.5rem',
            color: theme.text,
            letterSpacing: '-0.5px',
            fontFamily: '"Inter", sans-serif'
          }}>
            Resource Hub
          </div>
        </div>

        {/* Error notification for global errors */}
        {error && (
          <div style={{
            position: 'absolute',
            top: '80px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: darkMode ? 'rgba(231, 76, 60, 0.15)' : '#ffebee',
            borderLeft: '4px solid #e74c3c',
            color: darkMode ? '#e74c3c' : '#c0392b',
            padding: '1rem 1.5rem',
            margin: '0.5rem 1rem',
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            zIndex: 1000,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            maxWidth: '90%',
            width: '400px'
          }}>
            <p style={{ marginBottom: '1rem', fontWeight: 500 }}>{error}</p>
            <button
              onClick={() => window.location.reload()}
              style={{
                backgroundColor: '#e74c3c',
                color: 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 600,
                transition: 'background-color 0.2s ease',
              }}
            >
              Try Again
            </button>
          </div>
        )}

        {/* mymind-style enhanced search */}
        <div className="search-input" style={{
          display: 'flex',
          alignItems: 'center',
          background: theme.card,
          borderRadius: '12px',
          padding: '0.75rem 1rem',
          border: `1px solid ${theme.border}`,
          minWidth: '400px',
          boxShadow: `0 2px 8px ${theme.shadow}`,
          position: 'relative'
        }}>
          <span style={{
            fontSize: '1rem',
            marginRight: '0.75rem',
            color: theme.lightText,
            transition: 'all 0.2s ease'
          }}>🔍</span>
          <input
            type="text"
            placeholder="Search your resources..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: theme.text,
              width: '100%',
              fontSize: '0.95rem',
              fontFamily: '"Inter", sans-serif',
              transition: 'all 0.2s ease'
            }}
            onFocus={(e) => {
              e.target.parentElement.style.border = `1px solid ${theme.text}`;
              e.target.parentElement.style.boxShadow = `0 4px 20px ${theme.shadow}`;
              e.target.previousElementSibling.style.color = theme.text;
            }}
            onBlur={(e) => {
              e.target.parentElement.style.border = `1px solid ${theme.border}`;
              e.target.parentElement.style.boxShadow = `0 2px 8px ${theme.shadow}`;
              e.target.previousElementSibling.style.color = theme.lightText;
            }}
          />
          {/* Search suggestions indicator */}
          <div style={{
            position: 'absolute',
            right: '1rem',
            fontSize: '0.75rem',
            color: theme.lightText,
            opacity: 0.6
          }}>⌘K</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* mymind-style view mode toggle */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: theme.card,
            borderRadius: '8px',
            padding: '0.25rem',
            border: `1px solid ${theme.border}`,
            boxShadow: `0 2px 8px ${theme.shadow}`
          }}>
            <button
              onClick={() => setViewMode('files')}
              style={{
                background: viewMode === 'files' ? theme.deepNavy : 'transparent',
                color: viewMode === 'files' ? theme.pureWhite : theme.lightText,
                border: 'none',
                borderRadius: '6px',
                padding: '0.5rem 0.75rem',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s ease',
                fontFamily: '"Inter", sans-serif'
              }}
            >
              📋 Files
            </button>
            <button
              onClick={() => {
                setViewMode('split');
                setDualViewMode(false);
              }}
              style={{
                background: viewMode === 'split' && !dualViewMode ? theme.deepNavy : 'transparent',
                color: viewMode === 'split' && !dualViewMode ? theme.pureWhite : theme.lightText,
                border: 'none',
                borderRadius: '6px',
                padding: '0.5rem 0.75rem',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s ease',
                fontFamily: '"Inter", sans-serif'
              }}
            >
              ⚡ Split
            </button>
            <button
              onClick={() => {
                setViewMode('split');
                setDualViewMode(true);
              }}
              style={{
                background: dualViewMode ? theme.deepNavy : 'transparent',
                color: dualViewMode ? theme.pureWhite : theme.lightText,
                border: 'none',
                borderRadius: '6px',
                padding: '0.5rem 0.75rem',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s ease',
                fontFamily: '"Inter", sans-serif'
              }}
            >
              🔄 Dual
            </button>
            <button
              onClick={() => {
                setViewMode('preview');
                setDualViewMode(false);
              }}
              style={{
                backgroundColor: viewMode === 'preview' ? theme.accent : 'transparent',
                color: viewMode === 'preview' ? theme.buttonText : theme.text,
                border: 'none',
                borderRadius: '4px',
                padding: '6px 12px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span>👁️</span> Preview
            </button>
          </div>

          <button
            onClick={() => setShowUploadArea(!showUploadArea)}
            style={{
              backgroundColor: showUploadArea ? theme.secondary : theme.accent,
              color: theme.buttonText,
              border: 'none',
              borderRadius: '6px',
              padding: '8px 16px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
          >
            <span>📤</span> {showUploadArea ? 'Hide Upload' : 'Upload Resource'}
          </button>

          <button
            onClick={toggleDarkMode}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '20px',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              backgroundColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
              transition: 'all 0.2s ease',
            }}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>

          <button
            onClick={toggleMenu}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: theme.accent,
              color: theme.buttonText,
              border: 'none',
              cursor: 'pointer',
              fontSize: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              transition: 'all 0.2s ease',
            }}
          >
            👤
          </button>
        </div>
      </header>

      {/* Upload Area */}
      {showUploadArea && (
        <div style={{
          backgroundColor: theme.card,
          padding: '24px',
          margin: '16px 24px',
          borderRadius: '12px',
          marginBottom: '20px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          border: `1px solid ${theme.border}`,
          transition: 'all 0.3s ease',
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            marginBottom: '20px',
            borderBottom: `1px solid ${theme.border}`,
            paddingBottom: '16px'
          }}>
            <div style={{ 
              fontSize: '22px', 
              fontWeight: '700', 
              color: theme.accent,
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <span>📤</span> Upload New Resource
            </div>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
              gap: '20px',
              marginBottom: '20px'
            }}>
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontSize: '14px',
                  fontWeight: '600',
                  color: theme.text,
                }}>
                  Title <span style={{ color: theme.accent }}>*</span>
                </label>
                <input 
                  type="text"
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                  required
                  placeholder="Enter resource title"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: `1px solid ${theme.border}`,
                    borderRadius: '8px',
                    backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                    color: theme.text,
                    fontSize: '15px',
                    outline: 'none',
                    transition: 'border-color 0.2s ease',
                    ':focus': {
                      borderColor: theme.accent
                    }
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '20px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontSize: '14px',
                    fontWeight: '600',
                    color: theme.text,
                  }}>
                    Type <span style={{ color: theme.accent }}>*</span>
                  </label>
                  <select
                    value={uploadForm.type}
                    onChange={(e) => setUploadForm({ ...uploadForm, type: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: `1px solid ${theme.border}`,
                      borderRadius: '8px',
                      backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                      color: theme.text,
                      fontSize: '15px',
                      outline: 'none',
                      appearance: 'none',
                      backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23131313%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")'
                    }}
                  >
                    <option value="notes">Class Notes</option>
                    <option value="papers">Question Paper</option>
                  </select>
                </div>

                <div style={{ flex: 1 }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontSize: '14px',
                    fontWeight: '600',
                    color: theme.text,
                  }}>
                    Semester <span style={{ color: theme.accent }}>*</span>
                  </label>
                  <select
                    value={uploadForm.semester}
                    onChange={(e) => setUploadForm({ ...uploadForm, semester: parseInt(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: `1px solid ${theme.border}`,
                      borderRadius: '8px',
                      backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                      color: theme.text,
                      fontSize: '15px',
                      outline: 'none',
                      appearance: 'none',
                      backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23131313%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")',
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 12px center',
                      backgroundSize: '12px'
                    }}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                      <option key={sem} value={sem}>Semester {sem}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '30px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontSize: '14px',
                fontWeight: '600',
                color: theme.text,
              }}>
                File <span style={{ color: theme.accent }}>*</span>
              </label>
              <div style={{
                border: `2px dashed ${theme.border}`,
                borderRadius: '8px',
                padding: '20px',
                textAlign: 'center',
                backgroundColor: darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}>
                <input 
                  type="file"
                  id="file-upload"
                  onChange={handleFileChange}
                  required
                  style={{
                    display: 'none',
                  }}
                />
                <label htmlFor="file-upload" style={{
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '10px',
                }}>
                  <div style={{
                    fontSize: '36px',
                    marginBottom: '10px',
                  }}>
                    {uploadForm.file ? '📄' : '📁'}
                  </div>
                  <div style={{
                    fontWeight: '600',
                    color: theme.text,
                    marginBottom: '5px',
                  }}>
                    {uploadForm.file ? uploadForm.file.name : 'Click to select a file'}
                  </div>
                  <div style={{
                    fontSize: '14px',
                    color: theme.lightText,
                  }}>
                    {uploadForm.file ? `${(uploadForm.file.size / (1024 * 1024)).toFixed(2)} MB` : 'PDF, DOC, TXT, JPG, PNG files accepted'}
                  </div>
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '15px' }}>
              <button
                type="button"
                onClick={() => setShowUploadArea(false)}
                style={{
                  flex: '1',
                  backgroundColor: 'transparent',
                  color: theme.text,
                  border: `1px solid ${theme.border}`,
                  borderRadius: '8px',
                  padding: '12px',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUploading}
                style={{
                  flex: '2',
                  backgroundColor: theme.accent,
                  color: theme.buttonText,
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  opacity: isUploading ? '0.7' : '1',
                  pointerEvents: isUploading ? 'none' : 'auto',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                }}
              >
                {isUploading ? 'Uploading...' : 'Upload Resource'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main Content */}
      <div style={{
        padding: '16px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        flex: 1,
        minHeight: 'calc(100vh - 80px)', // Adjust for header height
      }}>
        {/* Semester Selection and Sorting Controls */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '16px',
          backgroundColor: theme.card,
          borderRadius: '12px',
          padding: '16px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        }}>
          <div style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
            flex: 2,
          }}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
              <button
                key={sem}
                onClick={() => setSelectedSemester(sem)}
                style={{
                  backgroundColor: selectedSemester === sem ? theme.accent : 'transparent',
                  color: selectedSemester === sem ? theme.buttonText : theme.text,
                  border: `1px solid ${selectedSemester === sem ? theme.accent : theme.border}`,
                  borderRadius: '8px',
                  padding: '8px 16px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '14px',
                  transition: 'all 0.2s ease',
                  boxShadow: selectedSemester === sem ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                Semester {sem}
              </button>
            ))}
          </div>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            flex: 1,
            justifyContent: 'flex-end',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <label style={{
                fontSize: '14px',
                fontWeight: '500',
                color: theme.lightText,
              }}>
                Sort by:
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: `1px solid ${theme.border}`,
                  backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                  color: theme.text,
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                <option value="date">Date</option>
                <option value="name">Name</option>
                <option value="downloads">Downloads</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '4px',
                }}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>
        </div>

        {/* Resource Content Area - Adapts to viewMode */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: viewMode === 'split' ? '1fr 1fr' : '1fr',
          gap: '20px',
          flex: 1,
          minHeight: '500px',
          overflow: 'hidden',
        }}>
          {/* Notes Section */}
          {(viewMode === 'split' || viewMode === 'files' || (viewMode === 'preview' && selectedNote) || (dualViewMode && (activeTab === 'notes' || !activeTab))) && (
            <div style={{
              backgroundColor: theme.card,
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              overflow: 'hidden',
              border: `1px solid ${theme.border}`,
              transition: 'all 0.3s ease',
            }}>
              <div style={{ 
                borderBottom: `1px solid ${theme.border}`,
                padding: '16px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <h2 style={{ 
                  margin: 0,
                  color: theme.primary,
                  fontSize: '18px',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  <span style={{ fontSize: '20px' }}>📝</span> Class Notes
                </h2>
                {viewMode === 'preview' && (
                  <button
                    onClick={() => setViewMode('split')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: theme.accent,
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600',
                    }}
                  >
                    Back to Split View
                  </button>
                )}
              </div>
              
              <div style={{ height: 'calc(100% - 53px)', display: 'flex', flexDirection: 'column' }}>
                {(viewMode === 'files' || viewMode === 'split') && (
                  <div style={{ 
                    flex: viewMode === 'split' ? '0 0 40%' : 1,
                    padding: '16px 20px',
                    overflowY: 'auto',
                    borderBottom: viewMode === 'split' ? `1px solid ${theme.border}` : 'none',
                  }}>
                    {isLoading ? (
                      <div style={{ 
                        textAlign: 'center', 
                        padding: '20px',
                        color: theme.lightText,
                      }}>
                        <div style={{ fontSize: '24px', marginBottom: '8px' }}>⏳</div>
                        Loading notes...
                      </div>
                    ) : error ? (
                      <div style={{ 
                        color: theme.accent, 
                        textAlign: 'center',
                        padding: '20px',
                        backgroundColor: darkMode ? 'rgba(231,76,60,0.1)' : 'rgba(231,76,60,0.05)',
                        borderRadius: '8px',
                      }}>
                        <div style={{ fontSize: '24px', marginBottom: '8px' }}>⚠️</div>
                        {error}
                      </div>
                    ) : filteredResources.notes.length === 0 ? (
                      <div style={{ 
                        textAlign: 'center', 
                        padding: '30px 20px',
                        color: theme.lightText,
                        backgroundColor: darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                        borderRadius: '8px',
                        border: `1px dashed ${theme.border}`,
                      }}>
                        <div style={{ fontSize: '32px', marginBottom: '16px' }}>📋</div>
                        <div style={{ fontWeight: '600', marginBottom: '8px' }}>No notes available</div>
                        <div style={{ fontSize: '14px' }}>Upload some notes for Semester {selectedSemester}</div>
                      </div>
                    ) : (
                      <div style={{
                        display: 'grid',
                        gap: '12px',
                      }}>
                        {filteredResources.notes
                          .filter(note => searchTerm ? note.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                                       note.description.toLowerCase().includes(searchTerm.toLowerCase()) : true)
                          .map((note, index) => (
                          <div
                            key={index}
                            style={{
                              backgroundColor: selectedNote && selectedNote._id === note._id ? 
                                (darkMode ? 'rgba(231,76,60,0.15)' : 'rgba(231,76,60,0.05)') : 
                                (darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.01)'),
                              borderRadius: '10px',
                              padding: '16px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '16px',
                              cursor: 'pointer',
                              border: `1px solid ${selectedNote && selectedNote._id === note._id ? 
                                theme.accent + '50' : theme.border}`,
                              transition: 'all 0.2s ease',
                              ':hover': {
                                backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                              }
                            }}
                            onClick={async () => {
                              setSelectedNote(note);
                              await fetchNoteContent(note);
                              if (viewMode === 'files') {
                                setViewMode('preview');
                              }
                            }}
                          >
                            <div style={{ 
                              width: '44px',
                              height: '44px',
                              borderRadius: '8px',
                              backgroundColor: `${theme.accent}15`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '22px',
                              color: theme.accent,
                            }}>
                              {getFileIcon(getFileType(note.fileUrl))}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ 
                                fontWeight: '600', 
                                color: theme.text,
                                marginBottom: '4px',
                              }}>
                                {note.title}
                              </div>
                              <div style={{ 
                                fontSize: '13px', 
                                color: theme.lightText,
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}>
                                {note.description}
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              {canViewInBrowser(note.fileUrl) && (
                                <button
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: theme.secondary,
                                    textDecoration: 'none',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    padding: '6px 10px',
                                    borderRadius: '6px',
                                    backgroundColor: darkMode ? 'rgba(52,152,219,0.1)' : 'rgba(52,152,219,0.05)',
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation(); // Prevent parent click
                                    setSelectedNote(note);
                                    setContentLoading(true);
                                    if (viewMode === 'files') {
                                      setViewMode('preview');
                                    }
                                  }}
                                >
                                  View
                                </button>
                              )}
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: theme.accent,
                                    textDecoration: 'none',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    padding: '6px 10px',
                                    borderRadius: '6px',
                                    backgroundColor: darkMode ? 'rgba(231,76,60,0.1)' : 'rgba(231,76,60,0.05)',
                                  }}
                                  onClick={(e) => handleDownload(note, e)}
                                >
                                  Download
                                </button>
                                <button
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: theme.richRed,
                                    textDecoration: 'none',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    padding: '6px 10px',
                                    borderRadius: '6px',
                                    backgroundColor: darkMode ? 'rgba(216,30,91,0.1)' : 'rgba(216,30,91,0.05)',
                                  }}
                                  onClick={(e) => handleDelete(note, e)}
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                
                {(viewMode === 'split' || viewMode === 'preview') && (
                  <div style={{ 
                    flex: 1,
                    padding: '20px', 
                    overflowY: 'auto',
                    backgroundColor: darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                    borderRadius: viewMode === 'preview' ? '0' : '0 0 12px 12px',
                  }}>
                    {selectedNote ? (
                      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ 
                          marginBottom: '16px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <h3 style={{ 
                            color: theme.text, 
                            margin: 0,
                            fontWeight: '700',
                            fontSize: '18px'
                          }}>
                            {selectedNote.title}
                          </h3>
                          <button
                            onClick={() => handleDownload(selectedNote)}
                            style={{
                              backgroundColor: theme.accent,
                              color: theme.buttonText,
                              border: 'none',
                              borderRadius: '6px',
                              padding: '8px 16px',
                              cursor: 'pointer',
                              fontWeight: '600',
                              fontSize: '14px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                            }}
                          >
                            <span>⬇️</span> Download
                          </button>
                        </div>
                        
                        {contentLoading ? (
                          <div style={{ 
                            textAlign: 'center', 
                            padding: '40px 20px',
                            color: theme.lightText,
                          }}>
                            <div style={{ fontSize: '24px', marginBottom: '16px' }}>⏳</div>
                            Loading content...
                          </div>
                        ) : contentError ? (
                          <div style={{ 
                            color: theme.accent, 
                            textAlign: 'center',
                            padding: '30px 20px',
                            backgroundColor: darkMode ? 'rgba(231,76,60,0.1)' : 'rgba(231,76,60,0.05)',
                            borderRadius: '8px',
                            margin: '20px 0',
                          }}>
                            <div style={{ fontSize: '24px', marginBottom: '8px' }}>⚠️</div>
                            {contentError}
                          </div>
                        ) : canViewInBrowser(selectedNote.fileUrl) ? (
                          <FileViewer
                            fileUrl={getCompleteFileUrl(selectedNote.fileUrl, selectedNote._id)}
                            fileType={getFileType(selectedNote.fileUrl)}
                            theme={theme}
                            title={selectedNote.title}
                            style={{
                              width: '100%',
                              flex: 1,
                              border: `1px solid ${theme.border}`,
                              borderRadius: '8px',
                              minHeight: '400px'
                            }}
                          />
                        ) : (
                          <div style={{
                            padding: '30px 20px',
                            textAlign: 'center',
                            backgroundColor: darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                            borderRadius: '8px',
                            border: `1px dashed ${theme.border}`,
                          }}>
                            <div style={{ fontSize: '32px', marginBottom: '16px' }}>📁</div>
                            <div style={{ fontWeight: '600', marginBottom: '8px' }}>This file cannot be previewed</div>
                            <div style={{ fontSize: '14px', marginBottom: '20px' }}>Please download to view this file</div>
                            <button
                              onClick={() => handleDownload(selectedNote)}
                              style={{
                                backgroundColor: theme.accent,
                                color: theme.buttonText,
                                border: 'none',
                                borderRadius: '6px',
                                padding: '10px 20px',
                                cursor: 'pointer',
                                fontWeight: '600',
                                fontSize: '14px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                              }}
                            >
                              <span>⬇️</span> Download File
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ 
                        textAlign: 'center', 
                        padding: '40px 20px',
                        color: theme.lightText,
                        backgroundColor: darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                        borderRadius: '8px',
                        border: `1px dashed ${theme.border}`,
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
                        <div style={{ fontWeight: '600', marginBottom: '8px', fontSize: '18px' }}>No note selected</div>
                        <div style={{ fontSize: '14px' }}>Select a note from the list to view its content</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Papers Section */}
          {(dualViewMode || (viewMode === 'preview' && selectedPaper)) && (
            <div style={{
              backgroundColor: theme.card,
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              overflow: 'hidden',
              border: `1px solid ${theme.border}`,
              transition: 'all 0.3s ease',
            }}>
              <div style={{ 
                borderBottom: `1px solid ${theme.border}`,
                padding: '16px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <h2 style={{ 
                  margin: 0,
                  color: theme.primary,
                  fontSize: '18px',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  <span style={{ fontSize: '20px' }}>📄</span> Question Papers
                </h2>
                {viewMode === 'preview' && (
                  <button
                    onClick={() => setViewMode('split')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: theme.accent,
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600',
                    }}
                  >
                    Back to Split View
                  </button>
                )}
              </div>
              
              <div style={{ height: 'calc(100% - 53px)', display: 'flex', flexDirection: 'column' }}>
                {(dualViewMode || viewMode === 'files' || viewMode === 'split') && (
                  <div style={{ 
                    flex: viewMode === 'split' ? '0 0 40%' : 1,
                    padding: '16px 20px',
                    overflowY: 'auto',
                    borderBottom: viewMode === 'split' ? `1px solid ${theme.border}` : 'none',
                  }}>
                    {isLoading ? (
                      <div style={{ 
                        textAlign: 'center', 
                        padding: '20px',
                        color: theme.lightText,
                      }}>
                        <div style={{ fontSize: '24px', marginBottom: '8px' }}>⏳</div>
                        Loading papers...
                      </div>
                    ) : error ? (
                      <div style={{ 
                        color: theme.accent, 
                        textAlign: 'center',
                        padding: '20px',
                        backgroundColor: darkMode ? 'rgba(231,76,60,0.1)' : 'rgba(231,76,60,0.05)',
                        borderRadius: '8px',
                      }}>
                        <div style={{ fontSize: '24px', marginBottom: '8px' }}>⚠️</div>
                        {error}
                      </div>
                    ) : filteredResources.papers.length === 0 ? (
                      <div style={{ 
                        textAlign: 'center', 
                        padding: '30px 20px',
                        color: theme.lightText,
                        backgroundColor: darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                        borderRadius: '8px',
                        border: `1px dashed ${theme.border}`,
                      }}>
                        <div style={{ fontSize: '32px', marginBottom: '16px' }}>📋</div>
                        <div style={{ fontWeight: '600', marginBottom: '8px' }}>No papers available</div>
                        <div style={{ fontSize: '14px' }}>Upload some papers for Semester {selectedSemester}</div>
                      </div>
                    ) : (
                      <div style={{
                        display: 'grid',
                        gap: '12px',
                      }}>
                        {filteredResources.papers
                          .filter(paper => searchTerm ? paper.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                                       paper.description.toLowerCase().includes(searchTerm.toLowerCase()) : true)
                          .map((paper, index) => (
                          <div
                            key={index}
                            style={{
                              backgroundColor: selectedPaper && selectedPaper._id === paper._id ? 
                                (darkMode ? 'rgba(231,76,60,0.15)' : 'rgba(231,76,60,0.05)') : 
                                (darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.01)'),
                              borderRadius: '10px',
                              padding: '16px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '16px',
                              cursor: 'pointer',
                              border: `1px solid ${selectedPaper && selectedPaper._id === paper._id ? 
                                theme.accent + '50' : theme.border}`,
                              transition: 'all 0.2s ease',
                              ':hover': {
                                backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                              }
                            }}
                            onClick={async () => {
                              setSelectedPaper(paper);
                              await fetchPaperContent(paper);
                              if (viewMode === 'files') {
                                setViewMode('preview');
                              }
                            }}
                          >
                            <div style={{ 
                              width: '44px',
                              height: '44px',
                              borderRadius: '8px',
                              backgroundColor: `${theme.accent}15`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '22px',
                              color: theme.accent,
                            }}>
                              {getFileIcon(getFileType(paper.fileUrl))}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ 
                                fontWeight: '600', 
                                color: theme.text,
                                marginBottom: '4px',
                              }}>
                                {paper.title}
                              </div>
                              <div style={{ 
                                fontSize: '13px', 
                                color: theme.lightText,
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}>
                                {paper.description}
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              {canViewInBrowser(paper.fileUrl) && (
                                <button
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: theme.secondary,
                                    textDecoration: 'none',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    padding: '6px 10px',
                                    borderRadius: '6px',
                                    backgroundColor: darkMode ? 'rgba(52,152,219,0.1)' : 'rgba(52,152,219,0.05)',
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation(); // Prevent parent click
                                    setSelectedPaper(paper);
                                    setContentLoading(true);
                                    if (viewMode === 'files') {
                                      setViewMode('preview');
                                    }
                                  }}
                                >
                                  View
                                </button>
                              )}
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: theme.accent,
                                    textDecoration: 'none',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    padding: '6px 10px',
                                    borderRadius: '6px',
                                    backgroundColor: darkMode ? 'rgba(231,76,60,0.1)' : 'rgba(231,76,60,0.05)',
                                  }}
                                  onClick={(e) => handleDownload(paper, e)}
                                >
                                  Download
                                </button>
                                <button
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: theme.richRed,
                                    textDecoration: 'none',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    padding: '6px 10px',
                                    borderRadius: '6px',
                                    backgroundColor: darkMode ? 'rgba(216,30,91,0.1)' : 'rgba(216,30,91,0.05)',
                                  }}
                                  onClick={(e) => handleDelete(paper, e)}
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                
                {(dualViewMode || viewMode === 'split' || viewMode === 'preview') && (
                  <div style={{ 
                    flex: 1,
                    padding: '20px', 
                    overflowY: 'auto',
                    backgroundColor: darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                    borderRadius: viewMode === 'preview' ? '0' : '0 0 12px 12px',
                  }}>
                    {selectedPaper ? (
                      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ 
                          marginBottom: '16px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <h3 style={{ 
                            color: theme.text, 
                            margin: 0,
                            fontWeight: '700',
                            fontSize: '18px'
                          }}>
                            {selectedPaper.title}
                          </h3>
                          <button
                            onClick={() => handleDownload(selectedPaper)}
                            style={{
                              backgroundColor: theme.accent,
                              color: theme.buttonText,
                              border: 'none',
                              borderRadius: '6px',
                              padding: '8px 16px',
                              cursor: 'pointer',
                              fontWeight: '600',
                              fontSize: '14px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                            }}
                          >
                            <span>⬇️</span> Download
                          </button>
                        </div>
                        
                        {contentLoading ? (
                          <div style={{ 
                            textAlign: 'center', 
                            padding: '40px 20px',
                            color: theme.lightText,
                          }}>
                            <div style={{ fontSize: '24px', marginBottom: '16px' }}>⏳</div>
                            Loading content...
                          </div>
                        ) : contentError ? (
                          <div style={{ 
                            color: theme.accent, 
                            textAlign: 'center',
                            padding: '30px 20px',
                            backgroundColor: darkMode ? 'rgba(231,76,60,0.1)' : 'rgba(231,76,60,0.05)',
                            borderRadius: '8px',
                            margin: '20px 0',
                          }}>
                            <div style={{ fontSize: '24px', marginBottom: '8px' }}>⚠️</div>
                            {contentError}
                          </div>
                        ) : canViewInBrowser(selectedPaper.fileUrl) ? (
                          <FileViewer
                            fileUrl={getCompleteFileUrl(selectedPaper.fileUrl, selectedPaper._id)}
                            fileType={getFileType(selectedPaper.fileUrl)}
                            theme={theme}
                            title={selectedPaper.title}
                            style={{
                              width: '100%',
                              flex: 1,
                              border: `1px solid ${theme.border}`,
                              borderRadius: '8px',
                              minHeight: '400px'
                            }}
                          />
                        ) : (
                          <div style={{
                            padding: '30px 20px',
                            textAlign: 'center',
                            backgroundColor: darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                            borderRadius: '8px',
                            border: `1px dashed ${theme.border}`,
                          }}>
                            <div style={{ fontSize: '32px', marginBottom: '16px' }}>📁</div>
                            <div style={{ fontWeight: '600', marginBottom: '8px' }}>This file cannot be previewed</div>
                            <div style={{ fontSize: '14px', marginBottom: '20px' }}>Please download to view this file</div>
                            <button
                              onClick={() => handleDownload(selectedPaper)}
                              style={{
                                backgroundColor: theme.accent,
                                color: theme.buttonText,
                                border: 'none',
                                borderRadius: '6px',
                                padding: '10px 20px',
                                cursor: 'pointer',
                                fontWeight: '600',
                                fontSize: '14px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                              }}
                            >
                              <span>⬇️</span> Download File
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ 
                        textAlign: 'center', 
                        padding: '40px 20px',
                        color: theme.lightText,
                        backgroundColor: darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                        borderRadius: '8px',
                        border: `1px dashed ${theme.border}`,
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
                        <div style={{ fontWeight: '600', marginBottom: '8px', fontSize: '18px' }}>No paper selected</div>
                        <div style={{ fontSize: '14px' }}>Select a paper from the list to view its content</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notification System */}
          {notification && (
            <div style={{
              position: 'fixed',
              top: '20px',
              right: '20px',
              backgroundColor: notification.type === 'success' ? theme.success : theme.accent,
              color: theme.buttonText,
              padding: '12px 20px',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              maxWidth: '350px',
              animation: 'slideIn 0.3s ease-out',
            }}>
              <div style={{ fontSize: '20px' }}>
                {notification.type === 'success' ? '✅' : '⚠️'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                  {notification.title}
                </div>
                <div style={{ fontSize: '14px', opacity: 0.9 }}>
                  {notification.message}
                </div>
              </div>
              <button 
                onClick={() => setNotification(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: theme.buttonText,
                  fontSize: '18px',
                  cursor: 'pointer',
                  opacity: 0.7,
                  padding: '4px',
                }}
              >
                ×
              </button>
            </div>
          )}

          {/* Chat widget functionality is available through individual page implementations */}
        </div>
      </div>
    </div>
  );
}

export default ResourceHub;