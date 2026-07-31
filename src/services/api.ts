import axios from 'axios';

// Leave empty to use the current origin, requests will be proxied by Vite (in dev) or Nginx (in prod)
const BASE_URL = '';
const STORAGE_KEY = 'ccc_admin_api_key';

const api = axios.create({
  baseURL: BASE_URL,
});

api.interceptors.request.use((config) => {
  const apiKey = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('gdg_admin_api_key');
  if (apiKey) {
    config.headers['x-api-key'] = apiKey;
    config.headers['x-admin-key'] = apiKey;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem('gdg_admin_api_key');
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

export const setApiKey = (key: string) => {
  localStorage.setItem(STORAGE_KEY, key);
  localStorage.setItem('gdg_admin_api_key', key);
};

export const getApiKey = () => localStorage.getItem(STORAGE_KEY) || localStorage.getItem('gdg_admin_api_key');

export const clearApiKey = () => {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem('gdg_admin_api_key');
};

export const validateApiKey = async (key: string) => {
  const res = await axios.get(`${BASE_URL}/api/v1/admin/users?limit=1`, {
    headers: { 'x-api-key': key, 'x-admin-key': key },
  });
  return res.status === 200;
};

export interface Registration {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  phone?: string;
  studentNumber: string;
  college?: string;
  year?: string;
  department?: string;
  branch?: string;
  residence?: string;
  transactionId?: string;
  isVerified?: boolean;
  day1Present?: boolean;
  day2Present?: boolean;
  isPresentDay1?: boolean;
  isPresentDay2?: boolean;
  registeredAt?: string;
  createdAt?: string;
  qrCode?: string;
  [key: string]: unknown;
}

export const fetchRegistrations = async (): Promise<Registration[]> => {
  const res = await api.get('/api/v1/admin/users?limit=all');
  return res.data.data?.students || res.data.data || [];
};

export const markAttendance = async (studentNumber: string, day: 1 | 2) => {
  const res = await api.post('/api/v1/admin/mark-attendance', { qrData: studentNumber, day });
  return res.data;
};

export const fetchStats = async () => {
  const res = await api.get('/api/v1/admin/stats');
  return res.data.data || res.data;
};

export const fetchBlockedIPs = async () => {
  const res = await api.get('/api/v1/admin/blocked-ips');
  return res.data.data || res.data;
};

export const blockIP = async (ip: string, reason: string) => {
  const res = await api.post('/api/v1/admin/block-ip', { ipAddress: ip, reason });
  return res.data;
};

export const unblockIP = async (ip: string) => {
  const res = await api.post('/api/v1/admin/unblock-ip', { ipAddress: ip });
  return res.data;
};

export const verifyPayment = async (id: string) => {
  const res = await api.patch(`/api/v1/verify-payment/${id}`);
  return res.data;
};

export const resendConfirmationMail = async (id: string) => {
  const res = await api.post(`/api/v1/admin/resend-mail/${id}`);
  return res.data;
};

export const bulkResendMails = async () => {
  const res = await api.post('/api/v1/admin/bulk-resend');
  return res.data;
};

export const sendSingleReminder = async (id: string) => {
  const res = await api.post(`/api/v1/admin/send-reminder/${id}`);
  return res.data;
};

export const sendBulkReminders = async () => {
  const res = await api.post('/api/v1/admin/bulk-reminder');
  return res.data;
};

export default api;
