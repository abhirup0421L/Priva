import axios from "axios";

const API = "https://priva-backend.onrender.com";

export default API;

export const api = axios.create({
  baseURL: API,
});
