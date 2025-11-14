import express from 'express';
import {
  getAllTrucks,
  getTruckById,
  createTruckAssignment,
  checkIn,
  startRoute,
  completeRoute,
  deleteTruckAssignment,
  deleteAllTrucks
} from '../controllers/trackingController.js';

const router = express.Router();

// GET all trucks with their status
router.get('/trucks', getAllTrucks);

// GET specific truck by ID
router.get('/trucks/:truckId', getTruckById);

// POST create new truck assignment
router.post('/trucks', createTruckAssignment);

// POST check-in at a bin
router.post('/checkin', checkIn);

// POST start route for a truck
router.post('/trucks/:truckId/start', startRoute);

// POST complete route for a truck
router.post('/trucks/:truckId/complete', completeRoute);

// DELETE all truck assignments (must be before DELETE by truckId to match first)
router.delete('/trucks', deleteAllTrucks);

// DELETE truck assignment
router.delete('/trucks/:truckId', deleteTruckAssignment);

export default router;
