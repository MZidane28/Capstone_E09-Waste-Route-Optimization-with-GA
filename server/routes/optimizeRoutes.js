import { Router } from "express";
import { optimizeRoutes } from "../controllers/optimizeController.js";

const optimizeRouter = Router();

optimizeRouter.post('/', optimizeRoutes);

export default optimizeRouter;