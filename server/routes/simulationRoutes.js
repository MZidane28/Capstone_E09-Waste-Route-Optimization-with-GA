import { Router } from "express";
import { clearHistory, getStatus, initialize, runStep, testSimulation } from "../controllers/simulationController.js";

const simulationRouter = Router();

simulationRouter.post('/test', testSimulation);

simulationRouter.get('/status', getStatus);
simulationRouter.post('/initialize', initialize);
simulationRouter.post('/run', runStep);
simulationRouter.delete('/clear', clearHistory);

export default simulationRouter;