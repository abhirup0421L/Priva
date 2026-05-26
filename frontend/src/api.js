import axios from "axios";

const API = "https://YOUR_RENDER_BACKEND_URL.onrender.com";

export default API;

export const api = axios.create({
  baseURL: API,
});
