import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import curveAbi from '../abi/curve_abi.json';

function DatasetCard({ dataset, isSelected, onToggleSelect }) {
  const [purchaseAmount, setPurchaseAmount] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPurchaseAmount = async () => {
      if (!dataset.bonding_curve) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Get the provider from MetaMask
        const provider = new ethers.BrowserProvider(window.ethereum);
        
        // Create a contract instance
        const contract = new ethers.Contract(dataset.bonding_curve.address, curveAbi, provider);
        console.log(`spolav contract`, dataset.bonding_curve.address);
        
        // Call the calculatePurchaseAmount function with 100 as the parameter
        const amount = await contract.calculatePaymentRequired(100);
        
        // Convert from WEI to ETH for display
        const amountInEth = ethers.formatEther(amount);
        
        console.log('Purchase amount for 100 tokens:', amount, "WEI");
        setPurchaseAmount(amountInEth);
      } catch (error) {
        console.error('Error calling smart contract:', error);
        setError('This dataset is on a different chain!');
      } finally {
        setLoading(false);
      }
    };

    fetchPurchaseAmount();
  }, [dataset.bonding_curve]);

  const handleCardClick = () => {
    onToggleSelect();
  };

  return (
    <div 
      className={`dataset-card ${isSelected ? 'selected' : ''}`}
      onClick={handleCardClick}
    >
      <h2>{dataset.title}</h2>
      <p>{dataset.description}</p>
      <p>Size: {dataset.size}</p>
      <p>Format: {dataset.format}</p>
      
      {dataset.bonding_curve && (
        <div className="bonding-curve-info">
          <p className="address">Contract: {dataset.bonding_curve.address.substring(0, 8)}...{dataset.bonding_curve.address.substring(dataset.bonding_curve.address.length - 6)}</p>
          
          {loading && <p className="loading">Loading price data...</p>}
          
          {error && <p className="error">{error}</p>}
          
          {purchaseAmount && !loading && !error && (
            <p className="purchase-amount">Price: {purchaseAmount * 1e18} WEI</p>
          )}
        </div>
      )}
      
      <div className="categories">
        {dataset.categories.map((category, index) => (
          <span key={index} className="category-tag">{category}</span>
        ))}
      </div>
    </div>
  );
}

export default DatasetCard; 