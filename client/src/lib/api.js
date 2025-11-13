import axios from "axios";

const API = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

export const getTrashBins = () => API.get("/bins"); 
export const getOptimizedRoute = () => API.get("/route"); 