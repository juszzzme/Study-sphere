import React, { useState, useEffect, useRef } from 'react';

const FileViewer = ({ fileUrl, fileType, theme, title }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [content, setContent] = useState(null);
  const viewerRef = useRef(null);

  // Helper function to determine content type
  const getContentType = (fileType) => {
    const type = fileType.toLowerCase();
    switch (type) {
      case 'pdf':
        return 'application/pdf';
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'gif':
        return 'image/gif';
      case 'svg':
        return 'image/svg+xml';
      case 'txt':
      case 'md':
        return 'text/plain';
      case 'html':
      case 'htm':
        return 'text/html';
      default:
        return 'application/octet-stream';
    }
  };

  // Handle zoom level changes
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 10, 200));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 10, 50));
  };

  const handleZoomReset = () => {
    setZoomLevel(100);
  };

  // Fetch content for text files
  useEffect(() => {
    const fetchContent = async () => {
      if (!fileUrl) return;

      setIsLoading(true);
      setError(null);

      try {
        const type = fileType.toLowerCase();
        if (['txt', 'md', 'html', 'htm'].includes(type)) {
          const response = await fetch(fileUrl);
          if (!response.ok) throw new Error('Failed to fetch file content');
          const data = await response.json();
          setContent(data.content);
        }
      } catch (err) {
        console.error('Error fetching content:', err);
        setError('Failed to load file content. Please try downloading instead.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchContent();
  }, [fileUrl, fileType]);

  // Handle errors
  const handleLoadError = (e) => {
    console.error('File loading error:', e);
    setIsLoading(false);
    setError('Failed to load the file. Please try downloading it instead.');
  };

  // Render loading state
  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center',
        height: '400px',
        color: theme.lightText || theme.text
      }}>
        <div style={{ fontSize: '24px', marginBottom: '16px' }}>⏳</div>
        <div>Loading file preview...</div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center',
        height: '400px',
        color: theme.accent,
        backgroundColor: theme.card,
        border: `1px solid ${theme.border}`,
        borderRadius: '8px',
        padding: '20px'
      }}>
        <div style={{ fontSize: '24px', marginBottom: '16px' }}>⚠️</div>
        <div style={{ marginBottom: '16px', textAlign: 'center' }}>{error}</div>
        <a
          href={fileUrl}
          download
          style={{
            backgroundColor: theme.accent,
            color: theme.buttonText || 'white',
            padding: '10px 20px',
            borderRadius: '6px',
            textDecoration: 'none',
            display: 'inline-block',
            fontWeight: '600',
            fontSize: '14px'
          }}
        >
          Download Instead
        </a>
      </div>
    );
  }

  // Render different viewers based on file type
  const type = fileType.toLowerCase();

  // Handle images
  if (['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(type)) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px',
        padding: '16px',
        backgroundColor: theme.background,
        borderRadius: '8px',
        overflow: 'hidden'
      }}>
        <div style={{
          display: 'flex',
          gap: '8px',
          alignItems: 'center'
        }}>
          <button onClick={handleZoomOut} style={buttonStyle(theme)}>-</button>
          <span style={{ color: theme.text }}>{zoomLevel}%</span>
          <button onClick={handleZoomIn} style={buttonStyle(theme)}>+</button>
          <button onClick={handleZoomReset} style={buttonStyle(theme)}>Reset</button>
        </div>
        <div style={{
          width: '100%',
          overflow: 'auto',
          textAlign: 'center'
        }}>
          <img
            src={fileUrl}
            alt={title}
            style={{
              maxWidth: '100%',
              transform: `scale(${zoomLevel / 100})`,
              transformOrigin: 'center top',
              transition: 'transform 0.2s ease'
            }}
            onError={handleLoadError}
          />
        </div>
      </div>
    );
  }

  // Handle PDFs
  if (type === 'pdf') {
    return (
      <div style={{
        width: '100%',
        height: '600px',
        overflow: 'hidden',
        borderRadius: '8px'
      }}>
        <iframe
          src={fileUrl}
          title={title}
          width="100%"
          height="100%"
          style={{ border: 'none' }}
          onError={handleLoadError}
        />
      </div>
    );
  }

  // Handle text files
  if (['txt', 'md', 'html', 'htm'].includes(type)) {
    return (
      <div style={{
        width: '100%',
        padding: '16px',
        backgroundColor: theme.card,
        borderRadius: '8px',
        border: `1px solid ${theme.border}`,
        overflow: 'auto'
      }}>
        <pre style={{
          margin: 0,
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word',
          color: theme.text,
          fontFamily: 'monospace'
        }}>
          {content}
        </pre>
      </div>
    );
  }

  // For unsupported file types
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center',
      height: '400px',
      color: theme.text,
      backgroundColor: theme.card,
      border: `1px solid ${theme.border}`,
      borderRadius: '8px',
      padding: '20px'
    }}>
      <div style={{ fontSize: '24px', marginBottom: '16px' }}>📄</div>
      <div style={{ marginBottom: '16px', textAlign: 'center' }}>
        This file type cannot be previewed. Please download it to view.
      </div>
      <a
        href={fileUrl}
        download
        style={{
          backgroundColor: theme.accent,
          color: theme.buttonText || 'white',
          padding: '10px 20px',
          borderRadius: '6px',
          textDecoration: 'none',
          display: 'inline-block',
          fontWeight: '600',
          fontSize: '14px'
        }}
      >
        Download File
      </a>
    </div>
  );
};

// Button style helper
const buttonStyle = (theme) => ({
  padding: '4px 12px',
  backgroundColor: theme.card,
  color: theme.text,
  border: `1px solid ${theme.border}`,
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '14px'
});

export default FileViewer;