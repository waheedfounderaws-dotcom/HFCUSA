// Centralized API Base URL helper for Development and Hostinger / Production Deployments
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export default API_BASE_URL;
