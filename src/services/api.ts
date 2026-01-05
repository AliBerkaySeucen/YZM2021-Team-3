import axios, { AxiosInstance, AxiosError } from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

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
          // Token expired or invalid - only logout if not already on login page
          const isLoginPage = window.location.pathname === '/login';
          if (!isLoginPage) {
            console.error('[AUTH] Token expired or invalid - logging out');
            this.clearAuth();
            window.location.href = '/login';
          }
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
    // Backend: POST /users/create_user with JSON body
    const response = await this.api.post('/users/create_user', { 
      first_name: name.split(' ')[0] || name,
      surname: name.split(' ')[1] || '',
      email, 
      password 
    });
    
    // Get token by logging in after registration
    const loginResponse = await this.login(email, password);
    return loginResponse;
  }

  async login(email: string, password: string) {
    // Backend: POST /users/get_access_token with form-data (OAuth2PasswordRequestForm)
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);
    
    const response = await this.api.post('/users/get_access_token', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    this.setToken(response.data.access_token);
    
    // Get user info after login
    const userInfo = await this.getCurrentUser();
    localStorage.setItem('memolink_current_user', JSON.stringify(userInfo));
    
    return { access_token: response.data.access_token, user: userInfo };
  }

  async forgotPassword(email: string) {
    // Password reset functionality not yet implemented on backend
    // TODO: Implement password reset with /auth/forgot-password endpoint
    throw new Error('Password reset functionality is not available yet');
  }

  async resetPassword(token: string, password: string) {
    // Password reset functionality not yet implemented on backend
    // TODO: Implement password reset with /auth/reset-password endpoint
    throw new Error('Password reset functionality is not available yet');
  }

  async changePassword(new_password: string) {
    // Backend: PUT /users/reset_user_info with password reset_mode
    const response = await this.api.put('/users/reset_user_info', null, {
      params: {
        new_val: new_password,
        reset_mode: 'password'
      }
    });
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
    // Backend: POST /users/get_user_info (requires authentication)
    const response = await this.api.post('/users/get_user_info');
    const user = response.data;
    
    // Transform backend user to frontend format
    return {
      id: user.user_id,
      name: user.first_name && user.surname ? `${user.first_name} ${user.surname}`.trim() : user.first_name || user.surname || 'User',
      email: user.email,
      createdAt: user.created_at,
      is_premium: user.is_premium || false,
      memory_limit: user.memory_limit || 30
    };
  }

  async upgradeToPremium() {
    // Backend: PUT /users/set_user_premium
    const response = await this.api.put('/users/set_user_premium');
    return response.data;
  }

  async updateProfile(field: 'first_name' | 'surname' | 'email' | 'password', value: string) {
    // Backend: PUT /users/reset_user_info
    const response = await this.api.put('/users/reset_user_info', null, {
      params: {
        new_val: value,
        reset_mode: field
      }
    });
    return response.data;
  }

  // Memory endpoints (Backend uses /nodes)
  async createMemory(memoryData: {
    title: string;
    description: string;
    image: string;
    tags?: string[];
    date?: string;
    position?: { x: number; y: number };
  }) {
    console.log('[API] createMemory called with:', {
      title: memoryData.title,
      hasImage: !!memoryData.image,
      imageLength: memoryData.image ? memoryData.image.length : 0,
      imageStart: memoryData.image ? memoryData.image.substring(0, 50) : 'no image'
    });
    
    // Backend: POST /nodes/create_node with JSON body including all fields
    const response = await this.api.post('/nodes/create_node', {
      image_id: memoryData.image,
      description: memoryData.description,
      title: memoryData.title || 'Untitled',
      tags: memoryData.tags || [],
      position: memoryData.position,
      date: memoryData.date
    });
    
    console.log('[API] createMemory response:', {
      node_id: response.data.node_id,
      image_id: response.data.image_id,
      hasImageData: !!response.data.image_data,
      imageDataLength: response.data.image_data ? response.data.image_data.length : 0
    });
    
    console.log('[API] Full response.data:', JSON.stringify(response.data, null, 2));
    
    // Transform backend node to frontend Memory format
    const node = response.data;
    return {
      id: node.node_id || node.id,
      title: node.title || memoryData.title || 'Untitled',
      description: node.description || '',
      image: node.image_data || node.image_id || memoryData.image,
      createdAt: node.created_at || new Date().toISOString(),
      tags: node.tags || [],
      date: node.custom_date || memoryData.date,
      position: node.position_x && node.position_y ? { x: node.position_x, y: node.position_y } : memoryData.position
    };
  }

  async getMemories(limit: number = 40, offset: number = 0) {
    // Backend: GET /nodes/list_nodes with pagination
    const response = await this.api.get('/nodes/list_nodes', {
      params: { limit, offset }
    });
    const data = response.data;
    
    // Handle new response format with nodes array and total_count
    const nodes = data.nodes || data;
    const totalCount = data.total_count || nodes.length;
    
    console.log(`[API] Raw nodes from backend (limit=${limit}, offset=${offset}):`, { count: nodes.length, totalCount });
    
    // Transform backend nodes to frontend Memory format
    const memories = (nodes || []).map((node: any) => {
      const memory = {
        id: node.node_id || node.id,
        title: node.title || 'Memory',
        description: node.description || '',
        image: node.image_data || node.image_id || '',
        createdAt: node.created_at || new Date().toISOString(),
        tags: node.tags || [],
        date: node.custom_date,
        position: node.position_x && node.position_y ? { x: node.position_x, y: node.position_y } : undefined
      };
      console.log(`[API] Mapped node ${memory.id}:`, {
        hasImageData: !!node.image_data,
        hasImageId: !!node.image_id,
        imageLength: memory.image ? memory.image.length : 0
      });
      return memory;
    });
    
    return { memories, totalCount };
  }

  async getMemory(id: string) {
    // Backend: POST /nodes/get_node_info
    const response = await this.api.post('/nodes/get_node_info', null, {
      params: {
        node_id: id
      }
    });
    
    // Transform backend node to frontend Memory format
    const node = response.data;
    return {
      id: node.node_id || node.id,
      title: node.title || 'Memory',
      description: node.description || '',
      image: node.image_data || node.image_id || '',
      createdAt: node.created_at || new Date().toISOString(),
      tags: node.tags || [],
      date: node.custom_date,
      position: node.position_x && node.position_y ? { x: node.position_x, y: node.position_y } : undefined
    };
  }

  async updateMemory(id: string, updates: Partial<{
    title: string;
    description: string;
    image: string;
    tags: string[];
    date: string;
    position: { x: number; y: number };
  }>) {
    // Backend: PUT /nodes/update_node with Body
    const response = await this.api.put('/nodes/update_node', {
      node_id: id,
      image_id: updates.image || '',
      description: updates.description || '',
      title: updates.title,
      tags: updates.tags,
      position: updates.position,
      date: updates.date
    });
    
    // Transform backend node to frontend Memory format
    const node = response.data;
    return {
      id: node.node_id || node.id,
      title: node.title || updates.title || 'Memory',
      description: node.description || '',
      image: node.image_id || '',
      createdAt: node.created_at || new Date().toISOString(),
      tags: node.tags || updates.tags || [],
      date: node.custom_date || updates.date,
      position: node.position_x && node.position_y ? { x: node.position_x, y: node.position_y } : updates.position
    };
  }

  async deleteMemory(id: string) {
    // Backend: DELETE /nodes/delete_node
    await this.api.delete('/nodes/delete_node', {
      params: {
        node_id: id
      }
    });
  }

  // Connection endpoints (Backend uses /nodelinks)
  async createConnection(source: string, target: string) {
    // Backend: POST /nodelinks/create_link
    const response = await this.api.post('/nodelinks/create_link', null, {
      params: {
        source_node_id: source,
        target_node_id: target
      }
    });
    
    // Transform backend nodelink to frontend Connection format
    const link = response.data;
    return {
      id: link.link_id || link.id,
      source: link.source_node_id || source,
      target: link.target_node_id || target
    };
  }

  async getConnections() {
    // Backend: GET /nodelinks/list_links
    const response = await this.api.get('/nodelinks/list_links');
    const links = response.data;
    
    // Transform backend nodelinks to frontend Connection format
    return (links || []).map((link: any) => ({
      id: link.link_id || link.id,
      source: link.source_node_id || link.source,
      target: link.target_node_id || link.target
    }));
  }

  async deleteConnection(id: string) {
    // Backend: DELETE /nodelinks/delete_link with link_id
    await this.api.delete('/nodelinks/delete_link', {
      params: {
        link_id: parseInt(id)
      }
    });
  }

  // Image endpoints
  async getUploadUrl(filename: string) {
    // Backend: POST /images/get_upload_url
    const response = await this.api.post('/images/get_upload_url', null, {
      params: { file_name: filename }
    });
    return response.data;
  }

  async confirmUpload(filename: string) {
    // Backend: POST /images/confirm_upload
    const response = await this.api.post('/images/confirm_upload', null, {
      params: { file_name: filename }
    });
    return response.data;
  }

  async getImageUrl(filename: string) {
    // Backend: POST /images/get_url_by_name
    const response = await this.api.post('/images/get_url_by_name', null, {
      params: { file_name: filename }
    });
    return response.data;
  }

  async deleteImage(filename: string) {
    // Backend: DELETE /images/delete_image_file
    const response = await this.api.delete('/images/delete_image_file', {
      params: { file_name: filename }
    });
    return response.data;
  }

  async fetchImageFromUrl(url: string) {
    // Backend: POST /images/fetch_from_url
    const response = await this.api.post('/images/fetch_from_url', { url });
    return response.data;
  }

  // Health check
  async healthCheck() {
    const response = await this.api.get('/health');
    return response.data;
  }
}

const apiService = new ApiService();
export default apiService;
