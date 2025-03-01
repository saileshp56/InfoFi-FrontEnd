import React, { useState, useEffect } from 'react';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { useSDK } from '@metamask/sdk-react';

function DatasetUploadForm() {
  const { width, height } = useWindowSize();
  const { chainId } = useSDK();
  const [showConfetti, setShowConfetti] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [datasetInfo, setDatasetInfo] = useState({
    title: '',
    description: '',
    format: '',
    categories: '',
    file: null
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setDatasetInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    setDatasetInfo(prev => ({
      ...prev,
      file: e.target.files[0]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Convert categories string to array
    const categoriesArray = datasetInfo.categories
      .split(',')
      .map(cat => cat.trim());

    // Create FormData object
    const formData = new FormData();
    formData.append('file', datasetInfo.file);
    
    // Convert chainId from hex to decimal if it exists
    let numericChainId = null;
    if (chainId) {
      numericChainId = parseInt(chainId, 16);
    }
    
    // Add dataset metadata
    const datasetMetadata = {
      title: datasetInfo.title,
      description: datasetInfo.description,
      format: datasetInfo.format,
      categories: categoriesArray,
      size: `${(datasetInfo.file.size / (1024 * 1024)).toFixed(2)}MB`,
      chain_id: numericChainId
    };

    console.log(`spolav datasetMetadata`, datasetMetadata);
    
    formData.append('metadata', JSON.stringify(datasetMetadata));

    try {
      const response = await fetch('http://localhost:8080/datasets', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Upload successful:', result);

      // Clear form
      setDatasetInfo({
        title: '',
        description: '',
        format: '',
        categories: '',
        file: null
      });
      
      // Reset file input
      const fileInput = document.getElementById('file');
      if (fileInput) {
        fileInput.value = '';
      }

      // Show confetti
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000); // Hide confetti after 3 seconds
      
      // Set loading to false after successful upload
      setIsLoading(false);
    } catch (error) {
      console.error('Error uploading dataset:', error);
      alert('Error uploading dataset. Please try again.');
      setIsLoading(false); // Set loading to false on error
    }
  };

  return (
    <div className="upload-form">
      {showConfetti && <Confetti width={width} height={height} />}
      <h2>Upload New Dataset</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Dataset Title:</label>
          <input
            type="text"
            id="title"
            name="title"
            value={datasetInfo.title}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description:</label>
          <textarea
            id="description"
            name="description"
            value={datasetInfo.description}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="format">Format (e.g., "CSV"):</label>
          <input
            type="text"
            id="format"
            name="format"
            value={datasetInfo.format}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="categories">Categories (comma-separated):</label>
          <input
            type="text"
            id="categories"
            name="categories"
            value={datasetInfo.categories}
            onChange={handleInputChange}
            placeholder="e.g., NLP, Classification"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="file">Dataset File:</label>
          <input
            type="file"
            id="file"
            onChange={handleFileChange}
            accept=".csv"
            required
          />
        </div>

        <div className="form-group">
          <label>Network:</label>
          <p className="network-info">
            {chainId ? 
              `Connected to chain ID: ${parseInt(chainId, 16)} (${chainId})` : 
              'Not connected to any network'}
          </p>
        </div>

        <button type="submit" className="submit-button" disabled={isLoading}>
          {isLoading ? (
            <span className="loading-spinner">
              Uploading... <span className="spinner"></span>
            </span>
          ) : (
            "Upload Dataset"
          )}
        </button>
      </form>
    </div>
  );
}

export default DatasetUploadForm; 