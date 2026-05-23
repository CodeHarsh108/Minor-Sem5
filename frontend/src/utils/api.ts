/// <reference types="vite/client" />
import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8002/api/v1",
  withCredentials: true,
});

export default API;
