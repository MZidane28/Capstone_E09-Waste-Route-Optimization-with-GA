import distanceData from '../data/distance_matrix.json' with { type: 'json' };

export function getSubMatrix(selectedBins) {

  const depotLabel = 'depot';
  const allLabels = [depotLabel, ...selectedBins];

  const binIndexes = allLabels.map(label => distanceData.bin_ids.indexOf(label));
  
  if (binIndexes.includes(-1)) {
    throw new Error('One or more selected bin IDs not found in distance_matrix.json');
  }
  
  return binIndexes.map(i =>
    binIndexes.map(j => distanceData.matrix[i][j])
  );
}