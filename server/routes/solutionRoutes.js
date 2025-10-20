import { Router } from "express";
import {
    getAllSolutions,
    getSolutionById
} from "../controllers/solutionController.js";

const solutionRouter = Router();

solutionRouter.get('/', getAllSolutions);
solutionRouter.get('/:id', getSolutionById);

export default solutionRouter;