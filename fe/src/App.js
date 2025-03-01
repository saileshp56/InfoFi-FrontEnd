import logo from './logo.svg';
import './App.css';
import { useState, useEffect, useRef } from 'react';
import { useSDK } from '@metamask/sdk-react';
import datasets from './data/datasets';
import DatasetGrid from './components/DatasetGrid';
import TrainingForm from './components/TrainingForm';
import DatasetUploadForm from './components/DatasetUploadForm';
import { ethers } from 'ethers';
import curveAbi from './abi/curve_abi.json';

const NETWORKS = {
  SEPOLIA: {
    id: "0xAA36A7",
    name: "Sepolia"
  },
  AENEID: {
    id: "0x523",
    name: "Story-Aeneid"
  },
  HEDERA: {
    id: "0x128",
    name: "Hedera"
  },
  ZIRCUIT: {
    id: "0xBF02",
    name: "Zircuit"
  },
  ZKSYNC: {
    id: "0x12c",
    name: "ZKsync"
  },

  

};

function App() {
  const { sdk, connected, connecting, provider, chainId, account, balance } = useSDK();
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [selectedDatasetAddress, setSelectedDatasetAddress] = useState(null);
  const [testMessage, setTestMessage] = useState('');
  const [currentPage, setCurrentPage] = useState('browse'); // 'browse' or 'upload'
  const [selectedNetwork, setSelectedNetwork] = useState(NETWORKS.AENEID.id);

  // Add a reference to the DatasetGrid component
  const datasetGridRef = useRef(null);

  const connect = async () => {
    try {
      await sdk?.connect();

    } catch (err) {
      console.warn(`failed to connect..`, err);
    }
  };


  useEffect(() => {
    if (chainId !== selectedNetwork) {
      changeNetwork(selectedNetwork);
    }
  }, [chainId, selectedNetwork]);

  const terminate = () => {
    sdk?.terminate();
  };

  const changeNetwork = async (networkId) => {
    console.debug(`switching to network chainId=${networkId}`);
    
    // First, try to add the network if it's not already in MetaMask
    try {
      // Check which network we're trying to switch to and add it if needed
      if (networkId === NETWORKS.SEPOLIA.id) {
        try {
          await provider?.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: NETWORKS.SEPOLIA.id,
                chainName: 'Sepolia Testnet',
                nativeCurrency: {
                  name: 'ETH',
                  symbol: 'ETH',
                  decimals: 18
                },
                rpcUrls: ['https://sepolia.drpc.org'],
                blockExplorerUrls: ['https://sepolia.etherscan.io']
              }
            ],
          });
          console.log("Added Sepolia network to MetaMask");
        } catch (addError) {
          // Ignore error if network already exists
          console.log("Sepolia network might already exist or couldn't be added:", addError);
        }
      } else if (networkId === NETWORKS.AENEID.id) {
        try {
          await provider?.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: NETWORKS.AENEID.id,
                chainName: 'Story-Aeneid',
                nativeCurrency: {
                  name: 'ETH',
                  symbol: 'ETH',
                  decimals: 18
                },
                rpcUrls: ['https://evm-rpc-story.josephtran.xyz'],
                blockExplorerUrls: ['https://explorer.story.tech']
              }
            ],
          });
          console.log("Added Story-Aeneid network to MetaMask");
        } catch (addError) {
          // Ignore error if network already exists
          console.log("Story-Aeneid network might already exist or couldn't be added:", addError);
        }
      } else if (networkId === NETWORKS.HEDERA.id) {
        try {
          await provider?.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: NETWORKS.HEDERA.id,
                chainName: 'Hedera',
                nativeCurrency: {
                  name: 'HBAR',
                  symbol: 'HBAR',
                  decimals: 18
                },
                rpcUrls: ['https://testnet.hashio.io/api'],
                blockExplorerUrls: ['https://hashscan.io/mainnet']
              }
            ],
          });
          console.log("Added Hedera network to MetaMask");
        } catch (addError) {
          console.log("Hedera network might already exist or couldn't be added:", addError);
        }
      } else if (networkId === NETWORKS.ZIRCUIT.id) {
        try {
          await provider?.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: NETWORKS.ZIRCUIT.id,
                chainName: 'Zircuit',
                nativeCurrency: {
                  name: 'ETH',
                  symbol: 'ETH',
                  decimals: 18
                },
                rpcUrls: ['https://zircuit1-testnet.p2pify.com'],
                blockExplorerUrls: ['https://explorer.zircuit.com']
              }
            ],
          });
          console.log("Added Zircuit network to MetaMask");
        } catch (addError) {
          console.log("Zircuit network might already exist or couldn't be added:", addError);
        }
      } else if (networkId === NETWORKS.ZKSYNC.id) {
        try {
          await provider?.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: NETWORKS.ZKSYNC.id,
                chainName: 'ZKsync',
                nativeCurrency: {
                  name: 'ETH',
                  symbol: 'ETH',
                  decimals: 18
                },
                rpcUrls: ['https://sepolia.era.zksync.dev'],
                blockExplorerUrls: ['https://explorer.zksync.io']
              }
            ],
          });
          console.log("Added ZKsync network to MetaMask");
        } catch (addError) {
          console.log("ZKsync network might already exist or couldn't be added:", addError);
        }
      }
      
      // Now try to switch to the network
      const response = await provider?.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: networkId }],
      });
      console.debug(`Successfully switched to network:`, response);
    } catch (err) {
      console.error('Error switching network:', err);
    }
  };

  const handleToggleSelect = (datasetTitle, datasetAddress) => {
    console.log('Dataset Title:', datasetTitle);
    console.log('Dataset Address:', datasetAddress);
    setSelectedDataset(prev => prev === datasetTitle ? null : datasetTitle);
    // Store the address if needed
    if (selectedDataset !== datasetTitle) {
      setSelectedDatasetAddress(datasetAddress);
    } else {
      setSelectedDatasetAddress(null);
    }
  };

  const handleTrainingSubmit = (data, shouldReloadDatasets) => {
    console.log('Training submitted:', data);
    
    // If shouldReloadDatasets is true, trigger a reload of the dataset grid
    if (shouldReloadDatasets && datasetGridRef.current) {
      datasetGridRef.current.loadDatasets();
    }
    
    // Any other handling you want to do with the training data
  };

  // Auto-test the connection whenever the form configuration changes
  useEffect(() => {
    if (selectedDataset) {
      handleTrainingSubmit({
        algorithm: 'random_forest',
        epochs: 10,
        learningRate: 0.001,
        batchSize: 32,
        validationSplit: 0.2,
      }, false);
    }
  }, [selectedDataset]);

  return (
    <div className="App">
      <nav className="navbar">
        <div className="nav-left">
          <h1>InfoFi</h1>
          <div className="nav-links">
            <button 
              onClick={() => setCurrentPage('browse')}
              className={currentPage === 'browse' ? 'active' : ''}
            >
              Browse Datasets
            </button>
            <button 
              onClick={() => setCurrentPage('upload')}
              className={currentPage === 'upload' ? 'active' : ''}
            >
              Upload Dataset
            </button>
          </div>
        </div>
        <div className="nav-right">
          <select 
            value={selectedNetwork}
            onChange={(e) => {console.log(`switching to network ${e.target.value}`); setSelectedNetwork(e.target.value)}}
            className="network-selector"
          >
            {Object.values(NETWORKS).map(network => (
              <option key={network.id} value={network.id}>
                {network.name}
              </option>
            ))}
          </select>
          <button 
            onClick={connected ? terminate : connect}
            className={connected ? 'connected' : ''}
          >
            {connected ? 'Disconnect' : 'Connect Wallet'}
          </button>
        </div>
      </nav>
      
      {testMessage && (
        <div className={`test-message ${testMessage.includes('Error') ? 'error' : 'success'}`}>
          {testMessage}
        </div>
      )}
      
      {currentPage === 'browse' ? (
        <>
          <DatasetGrid 
            ref={datasetGridRef}
            selectedDataset={selectedDataset}
            onToggleSelect={handleToggleSelect}
          />
          <TrainingForm 
            selectedDataset={selectedDataset}
            onSubmit={handleTrainingSubmit}
            account={account}
          />
        </>
      ) : (
        <DatasetUploadForm />
      )}
    </div>
  );
}

export default App;
