import React, { useState, useRef } from 'react';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';

function TrainingForm({ selectedDataset, onSubmit, account }) {
  const { width, height } = useWindowSize();
  const [showConfetti, setShowConfetti] = useState(false);
  const [showDownloadPrompt, setShowDownloadPrompt] = useState(false);
  const [responseData, setResponseData] = useState(null);
  const [csvData, setCsvData] = useState(null);
  const [config, setConfig] = useState({
    algorithm: 'decision_tree',
    epochs: 10,
    learningRate: 0.001,
    batchSize: 32,
    validationSplit: 0.2,
    max_depth: 5,
    min_samples_leaf: 1,
    min_samples_split: 2,
    use_entropy: false,
    accuracy: 0.85,
    validation_dataset: null
  });
  const [isLoading, setIsLoading] = useState(false);
  const downloadLinkRef = useRef(null);
  const fileInputRef = useRef(null);

  const algorithms = [
    { value: 'decision_tree', label: 'Decision Tree' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setConfig(prev => ({
      ...prev,
      [name]: name === 'epochs' || name === 'batchSize' ? parseInt(value) : 
              name === 'learningRate' || name === 'validationSplit' || name === 'accuracy' ? parseFloat(value) : 
              value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setConfig(prev => ({
        ...prev,
        validation_dataset: file
      }));
      
      // Read and display the CSV file
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target.result;
        setCsvData(text);
      };
      reader.readAsText(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    let endpoint = 'http://127.0.0.1:8080/train/dt';
    
    // Create FormData to handle file upload
    const formData = new FormData();
    
    // Create a params object and stringify it
    const params = {
      max_depth: parseInt(config.max_depth),
      min_samples_leaf: parseInt(config.min_samples_leaf),
      min_samples_split: parseInt(config.min_samples_split),
      use_entropy: Boolean(config.use_entropy),
      dataset_title: selectedDataset,
      accuracy: parseFloat(config.accuracy),
      wallet_address: account
    };
    
    console.log("Sending params:", params);
    console.log("Wallet address:", account);
    
    // Add params as a JSON string
    formData.append('params', JSON.stringify(params));
    
    // Add validation dataset file if it exists
    if (config.validation_dataset) {
      formData.append('validation_dataset', config.validation_dataset);
    }
    
    console.log(`Request data:`, Object.fromEntries(formData));
    
    console.log("Requesting to:", endpoint);
    fetch(endpoint, {
      method: 'POST',
      body: formData,
    })
    .then(response => {
      if (!response.ok) {
        return response.text().then(text => {
          throw new Error(`Server error: ${text}`);
        });
      }
      return response.json();
    })
    .then(data => {
      console.log('Training started successfully:', data);
      setIsLoading(false);
      setResponseData(data);
      
      setShowConfetti(true);
      setTimeout(() => {
        setShowConfetti(false);
        setShowDownloadPrompt(true);
      }, 3000);
      
      console.log("spolav data", data);
      onSubmit(data);
    })
    .catch(error => {
      console.error('Error starting training:', error);
      setIsLoading(false);
    });
  };

  const handleDownload = () => {
    if (!responseData) return;
    
    const jsonString = JSON.stringify(responseData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    
    const url = URL.createObjectURL(blob);
    
    downloadLinkRef.current.href = url;
    downloadLinkRef.current.download = `training-${config.algorithm}-${new Date().toISOString().slice(0, 10)}.json`;
    downloadLinkRef.current.click();
    
    URL.revokeObjectURL(url);
    
    setShowDownloadPrompt(false);
  };

  return (
    <div className="training-form">
      {showConfetti && <Confetti width={width} height={height} />}
      
      {showDownloadPrompt && (
        <div className="download-prompt-overlay">
          <div className="download-prompt">
            <h3>Training Request Submitted!</h3>
            <p>Your training job has been successfully submitted.</p>
            <p>Would you like to download the response data?</p>
            <div className="download-buttons">
              <button onClick={handleDownload} className="download-button">
                Download JSON
              </button>
              <button onClick={() => setShowDownloadPrompt(false)} className="cancel-button">
                Close
              </button>
            </div>
            <a ref={downloadLinkRef} style={{ display: 'none' }}></a>
          </div>
        </div>
      )}
      
      <h2>Training Configuration</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="algorithm">Algorithm:</label>
          <select 
            id="algorithm" 
            name="algorithm" 
            value={config.algorithm}
            onChange={handleChange}
            disabled={true}
          >
            {algorithms.map(algo => (
              <option key={algo.value} value={algo.value}>
                {algo.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="accuracy">Target Accuracy:</label>
          <input
            type="number"
            id="accuracy"
            name="accuracy"
            min="0"
            max="1"
            step="0.01"
            value={config.accuracy}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="max_depth">Max Depth:</label>
          <input
            type="number"
            id="max_depth"
            name="max_depth"
            min="1"
            max="20"
            value={config.max_depth}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="min_samples_leaf">Min Samples Leaf:</label>
          <input
            type="number"
            id="min_samples_leaf"
            name="min_samples_leaf"
            min="1"
            max="20"
            value={config.min_samples_leaf}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="min_samples_split">Min Samples Split:</label>
          <input
            type="number"
            id="min_samples_split"
            name="min_samples_split"
            min="2"
            max="20"
            value={config.min_samples_split}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="validation_dataset">Validation Dataset (CSV):</label>
          <input
            type="file"
            id="validation_dataset"
            name="validation_dataset"
            accept=".csv"
            onChange={handleFileChange}
            ref={fileInputRef}
          />
          {config.validation_dataset && (
            <p className="file-selected">
              File selected: {config.validation_dataset.name}
            </p>
          )}
        </div>

        {/* Display CSV data if available */}
        {csvData && (
          <div className="csv-preview">
            <h3>CSV Preview:</h3>
            <pre style={{ maxHeight: '200px', overflow: 'auto', border: '1px solid #ccc', padding: '10px' }}>
              {csvData}
            </pre>
          </div>
        )}

        <div className="form-group">
          <label htmlFor="use_entropy">Criterion:</label>
          <select
            id="use_entropy"
            name="use_entropy"
            value={config.use_entropy ? "true" : "false"}
            onChange={(e) => {
              setConfig(prev => ({
                ...prev,
                use_entropy: e.target.value === 'true'
              }));
            }}
          >
            <option value="false">Gini Impurity</option>
            <option value="true">Entropy</option>
          </select>
        </div>

        <button 
          type="submit" 
          disabled={!selectedDataset || isLoading || !account}
          className="submit-button"
        >
          {isLoading ? (
            <span className="loading-spinner">
              Training... <span className="spinner"></span>
            </span>
          ) : !account ? (
            "Connect Wallet to Train"
          ) : (
            "Start Training"
          )}
        </button>
      </form>
    </div>
  );
}

export default TrainingForm; 