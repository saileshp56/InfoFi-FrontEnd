import datasetsData from './datasets.json';

const datasets = datasetsData.datasets;

export const addDataset = async (newDataset) => {
  // Generate new ID
  const maxId = Math.max(...datasets.map(d => d.id), 0);
  newDataset.id = maxId + 1;
  
  // Add to datasets array
  datasets.push(newDataset);
  
  // In a real application, this would be an API call
  // For now, we'll just log it
  console.log('New dataset added:', newDataset);
  console.log('Updated datasets:', datasets);
  
  return newDataset;
};

export default datasets; 