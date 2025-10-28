import { getSubMatrix } from '../utils/distance-helper.js';

export const optimizeRoutes = async (req, res) => {
  try {
    const selectedBins = req.body.bins; // e.g. [{ id: "bin1" }, { id: "bin3" }]

    // Build submatrix
    const subMatrix = getSubMatrix(selectedBins.map(b => b.id));

    // 🚧 TODO: later connect to GA microservice here
    // Example:
    // const response = await fetch("http://localhost:8000/run_ga", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({
    //     distance_matrix: subMatrix,
    //     bins: selectedBins,
    //   })
    // });
    // const gaResult = await response.json();

    res.json({
      selectedBins: selectedBins.map(b => b.id),
      subMatrix: subMatrix
      // gaResult: gaResult, // add later
    });

  } catch (error) {
    console.error('Error optimizing routes:', error);
    res.status(500).json({ error: error.message });
  }
};