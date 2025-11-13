import { Router } from "express";
import { createBin, deleteBin, getAllBins, getBinById, updateBin } from "../controllers/binController.js";

const binRouter = Router();

binRouter.get('/', getAllBins);
binRouter.get('/:id', getBinById);
binRouter.post('/', createBin);
binRouter.put('/:id', updateBin);
binRouter.delete('/:id', deleteBin)

export default binRouter;