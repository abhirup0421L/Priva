import axios from "axios";

const API = "http://localhost:8000";

export default API;

export const api = axios.create({
  baseURL: API,
});