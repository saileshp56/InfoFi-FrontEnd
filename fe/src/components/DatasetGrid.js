import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import DatasetCard from './DatasetCard';

const DatasetGrid = forwardRef(({ selectedDataset, onToggleSelect }, ref) => {
  const [datasets, setDatasets] = useState([]);
  const [error, setError] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [selectedNetwork, setSelectedNetwork] = useState(null);
  const [provider, setProvider] = useState(null);

  // Function to fetch datasets
  const fetchDatasets = async () => {
    try {
      const response = await fetch('http://localhost:8080/datasets');
      if (!response.ok) {
        throw new Error('Failed to fetch datasets');
      }
      const data = await response.json();

      console.log(`datasets:`, data.datasets);
      setDatasets(data.datasets);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching datasets:', err);
    }
  };

  // Function to load datasets
  const loadDatasets = () => {
    console.log("Reloading datasets...");
    // Your existing code to fetch datasets
    fetch('http://127.0.0.1:8080/datasets')
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        console.log('Fetched datasets:', data);
        setDatasets(data);
        setError(null);
      })
      .catch(error => {
        console.error('Error fetching datasets:', error);
        setError(error.message);
      });
  };

  // Expose the loadDatasets method to parent components
  useImperativeHandle(ref, () => ({
    loadDatasets
  }));

  // Initial fetch of datasets
  useEffect(() => {
    fetchDatasets();
  }, []);

  // Listen for chain changes from window.ethereum
  useEffect(() => {
    const handleChainChanged = (newChainId) => {
      console.log('Chain changed to:', newChainId);
      setChainId(newChainId);
      // Refresh datasets when chain changes
      fetchDatasets();
    };

    // Set up event listener for chain changes
    if (window.ethereum) {
      window.ethereum.on('chainChanged', handleChainChanged);
      
      // Get initial chain ID
      window.ethereum.request({ method: 'eth_chainId' })
        .then(id => setChainId(id))
        .catch(err => console.error('Error getting chain ID:', err));
    }

    // Clean up event listener
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, []);

  // Handle network change requests
  useEffect(() => {
    if (chainId !== selectedNetwork && selectedNetwork) {
      changeNetwork(selectedNetwork);
    }
  }, [chainId, selectedNetwork]);

  const changeNetwork = async (networkId) => {
    console.debug(`switching to network chainId=${networkId}`);
    try {
      const response = await provider?.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: networkId }],
      });
      console.debug(`response`, response);
    } catch (err) {
      console.error(err);
    }
  };

  if (error) {
    return (
      <div className="network-prompt">
        <h3>Choose a network to get started</h3>
        <p>Select one of the networks from the dropdown in the navigation bar</p>
      </div>
    );
  }

  return (
    <div className="dataset-grid">
      {datasets.map(dataset => (
        <DatasetCard 
          key={dataset.title} 
          dataset={dataset}
          isSelected={selectedDataset === dataset.title}
          onToggleSelect={() => onToggleSelect(dataset.title, dataset.bonding_curve.address)}
          chainId={chainId}
        />
      ))}
    </div>
  );
});

export default DatasetGrid; 