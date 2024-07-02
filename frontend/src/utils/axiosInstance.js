import axios from "axios";
import { BASE_URL } from "./constants";

// create an axios instance
const axiosInstance = axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
    headers: {
        "Content-Type": "application/json",
    },
});

// add the axios request interceptor to attach the auth token to every request
axiosInstance.interceptors.request.use(
    (config) => { 
        const accessToken = localStorage.getItem("token");
        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
    }
)

// export the configured axios instance 
export default axiosInstance;