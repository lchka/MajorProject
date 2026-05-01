import axios from "axios";
// create an axios instance with the base URL for the API, and set up an interceptor to include the token from localStorage in the Authorization header of each request
const API = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    "http://192.168.1.10:3000/api",
    headers: {
    'Content-Type': 'application/json', 
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