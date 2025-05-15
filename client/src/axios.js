// src/axios.js   (new file)
import axios from "axios";

axios.defaults.baseURL = "http://localhost:8000";

// attach Bearer token on every request (per-tab via sessionStorage)
axios.interceptors.request.use((cfg) => {
  const t = sessionStorage.getItem("token");
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

export default axios;
