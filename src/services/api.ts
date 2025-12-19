import axios, { AxiosInstance, AxiosError } from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add token
    this.api.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          this.clearAuth();
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Token management
  private getToken(): string | null {
    return localStorage.getItem('memolink_token');
  }

  private setToken(token: string): void {
    localStorage.setItem('memolink_token', token);
  }

  private clearAuth(): void {
    localStorage.removeItem('memolink_token');
    localStorage.removeItem('memolink_current_user');
  }

  // Auth endpoints
  async register(name: string, email: string, password: string) {
    const response = await this.api.post('/auth/register', { name, email, password });
    this.setToken(response.data.access_token);
    const userData = {
      ...response.data.user,
      createdAt: response.data.user.created_at || response.data.user.createdAt
    };
    localStorage.setItem('memolink_current_user', JSON.stringify(userData));
    return response.data;
  }

  async login(email: string, password: string) {
    const response = await this.api.post('/auth/login', { email, password });
    this.setToken(response.data.access_token);
    const userData = {
      ...response.data.user,
      createdAt: response.data.user.created_at || response.data.user.createdAt
    };
    localStorage.setItem('memolink_current_user', JSON.stringify(userData));
    return response.data;
  }

  async forgotPassword(email: string) {
    const response = await this.api.post('/auth/forgot-password', { email });
    return response.data;
  }

  async resetPassword(token: string, new_password: string) {
    const response = await this.api.post('/auth/reset-password', { token, new_password });
    return response.data;
  }

  logout(clearDataCallback?: () => void): void {
    this.clearAuth();
    if (clearDataCallback) {
      clearDataCallback();
    }
    window.location.href = '/login';
  }

  async getCurrentUser() {
    const response = await this.api.get('/auth/me');
    return response.data;
  }

  // Memory endpoints
  async createMemory(memoryData: {
    title: string;
    description: string;
    image: string;
    tags?: string[];
    date?: string;
    position?: { x: number; y: number };
  }) {
    const response = await this.api.post('/memories', memoryData);
    return response.data;
  }

  async getMemories() {
    const response = await this.api.get('/memories');
    return response.data;
  }

  async getMemory(id: string) {
    const response = await this.api.get(`/memories/${id}`);
    return response.data;
  }

  async updateMemory(id: string, updates: Partial<{
    title: string;
    description: string;
    image: string;
    tags: string[];
    date: string;
    position: { x: number; y: number };
  }>) {
    const response = await this.api.put(`/memories/${id}`, updates);
    return response.data;
  }

  async deleteMemory(id: string) {
    await this.api.delete(`/memories/${id}`);
  }

  // Connection endpoints
  async createConnection(source: string, target: string) {
    const response = await this.api.post('/connections', { source, target });
    return response.data;
  }

  async getConnections() {
    const response = await this.api.get('/connections');
    return response.data;
  }

  async deleteConnection(id: string) {
    await this.api.delete(`/connections/${id}`);
  }

  // Health check
  async healthCheck() {
    const response = await this.api.get('/health');
    return response.data;
  }
}

export default new ApiService();
