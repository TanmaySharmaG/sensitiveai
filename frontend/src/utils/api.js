import axios from "axios";

const BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

const api = axios.create({ baseURL: `${BASE}/api`, timeout: 60000 });

export const uploadFile = (file, onProgress) => {
  const form = new FormData();
  form.append("file", file);
  return api.post("/upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (e) => onProgress && onProgress(Math.round((e.loaded * 100) / e.total)),
  });
};

export const scanFile = (scanId, filename) =>
  api.post("/scan", { scan_id: scanId, filename });

export const predictText = (text) =>
  api.post("/predict", { text });

export const compareDocuments = (scanIdA, filenameA, scanIdB, filenameB) =>
  api.post("/compare", { scan_id_a: scanIdA, filename_a: filenameA, scan_id_b: scanIdB, filename_b: filenameB });

export const downloadReport = async (scanId, format) => {
  const res = await api.post("/report", { scan_id: scanId, format }, { responseType: "blob" });
  const url = window.URL.createObjectURL(new Blob([res.data]));
  const a = document.createElement("a");
  a.href = url;
  a.download = `sensitiveai_report_${scanId.slice(0, 8)}.${format}`;
  a.click();
  window.URL.revokeObjectURL(url);
};

export const getHistory = (limit = 50) =>
  api.get("/history", { params: { limit } });

export const deleteScan = (scanId) =>
  api.delete(`/history/${scanId}`);

export const getSettings = () =>
  api.get("/settings");

export const getHealth = () =>
  api.get("/health");

export default api;
