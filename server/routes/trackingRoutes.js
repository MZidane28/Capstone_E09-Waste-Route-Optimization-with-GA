import express from 'express';
import {
  getAllTrucks,
  getTruckById,
  createTruck,
  updateTruckStatus,
  addCheckIn,
  assignRoute,
  resetTruck,
  deleteTruck
} from '../controllers/trackingController.js';

const router = express.Router();

// GET all trucks
router.get('/trucks', getAllTrucks);

// GET single truck by ID
router.get('/trucks/:id', getTruckById);

// POST create new truck
router.post('/trucks', createTruck);

// PUT update truck status
router.put('/trucks/:id/status', updateTruckStatus);

// POST add check-in to truck
router.post('/trucks/:id/checkin', addCheckIn);

// PUT assign route to truck
router.put('/trucks/:id/route', assignRoute);

// PUT reset truck
router.put('/trucks/:id/reset', resetTruck);

// DELETE truck
router.delete('/trucks/:id', deleteTruck);

export default router;
