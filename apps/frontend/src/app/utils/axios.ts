import axios from "axios";

const api = axios.create({
  baseURL: process.env.BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
