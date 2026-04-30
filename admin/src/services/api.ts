import axios from "axios";

const API = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    "http://192.168.1.10:3000/api",
    headers: {
    'Content-Type': 'application/json', // Check if this is missing
  }
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");



  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  console.log("👉 HEADERS AFTER:", config.headers);

  return config;
}); 

export default API;