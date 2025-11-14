import { Router } from 'express';
import { optimizeRoutes } from '../controllers/optimizeController.js';

const optimizeRouter = Router();

// POST /api/v1/optimize - Optimize routes using Genetic Algorithm
optimizeRouter.post('/', optimizeRoutes);

export default optimizeRouter;
