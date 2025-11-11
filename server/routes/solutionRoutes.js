import { Router } from "express";
import { compareSolutions, getSolutions, getSummary } from "../controllers/solutionController.js";

const solutionRouter = Router();

solutionRouter.get('/', getSolutions);
solutionRouter.get('/compare', compareSolutions);
solutionRouter.get('/summary', getSummary);

export default solutionRouter;