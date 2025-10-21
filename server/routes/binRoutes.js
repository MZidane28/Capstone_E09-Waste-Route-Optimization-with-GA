import { Router } from "express";
import {
  getAllBins,
  getBinById,
  createBin,
  updateBin,
  deleteBin,
  getRandomBins
} from "../controllers/binController.js";

const binRouter = Router();

binRouter.get('/', getAllBins);
binRouter.get('/:id',getBinById);
binRouter.post('/', createBin);
binRouter.put('/:id', updateBin);
binRouter.delete('/:id', deleteBin);
binRouter.post("/random", getRandomBins);

export default binRouter;