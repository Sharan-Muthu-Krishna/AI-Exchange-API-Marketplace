/**
 * API Client for AIExchange Backend
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('access_token', token);
    } else {
      localStorage.removeItem('access_token');
    }
  }

  getToken(): string | null {
    if (typeof window !== 'undefined') {
      return this.token || localStorage.getItem('access_token');
    }
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = this.getToken();
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { error: errorData.detail || `Error: ${response.status}` };
      }

      if (response.status === 204) {
        return { data: undefined as T };
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      return { error: 'Network error. Please try again.' };
    }
  }

  // Auth endpoints
  async login(email: string, password: string) {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);

    const response = await fetch(`${this.baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return { error: error.detail || 'Login failed' };
    }

    const data = await response.json();
    this.setToken(data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    return { data };
  }

  async register(email: string, password: string, role: 'VENDOR' | 'BUYER', companyName?: string) {
    const endpoint = role === 'VENDOR' ? '/api/auth/register/vendor' : '/api/auth/register/buyer';
    const body = role === 'VENDOR' 
      ? { email, password, company_name: companyName }
      : { email, password };

    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async getMe() {
    return this.request<{ id: string; email: string; role: string; is_active: boolean }>('/api/auth/me');
  }

  logout() {
    this.setToken(null);
    localStorage.removeItem('refresh_token');
  }

  // Marketplace endpoints
  async getMarketplaceApis(params?: { category?: string; search?: string; page?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.category) searchParams.set('category', params.category);
    if (params?.search) searchParams.set('search', params.search);
    if (params?.page) searchParams.set('page', params.page.toString());
    
    return this.request(`/api/marketplace/apis?${searchParams}`);
  }

  async getApiDetails(apiId: string) {
    return this.request(`/api/marketplace/apis/${apiId}`);
  }

  async getCategories() {
    return this.request('/api/marketplace/categories');
  }

  // Vendor endpoints
  async getVendorDashboard() {
    return this.request('/api/vendor/dashboard');
  }

  async getVendorApis() {
    return this.request('/api/vendor/apis');
  }

  async createApi(data: {
    name: string;
    description: string;
    category: string;
    real_endpoint: string;
    price_per_call: number;
    input_schema?: string;
    output_schema?: string;
  }) {
    return this.request('/api/vendor/apis', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateApi(apiId: string, data: Record<string, unknown>) {
    return this.request(`/api/vendor/apis/${apiId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteApi(apiId: string) {
    return this.request(`/api/vendor/apis/${apiId}`, { method: 'DELETE' });
  }

  async getVendorAnalytics(apiId: string) {
    return this.request(`/api/vendor/apis/${apiId}/analytics`);
  }

  async getVendorLogs(params?: { apiId?: string; page?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.apiId) searchParams.set('api_id', params.apiId);
    if (params?.page) searchParams.set('page', params.page.toString());
    return this.request(`/api/vendor/logs?${searchParams}`);
  }

  async getVendorEarnings() {
    return this.request('/api/vendor/earnings');
  }

  // Buyer endpoints
  async getBuyerDashboard() {
    return this.request('/api/buyer/dashboard');
  }

  async getSubscriptions() {
    return this.request('/api/buyer/subscriptions');
  }

  async subscribe(apiId: string) {
    return this.request('/api/buyer/subscriptions', {
      method: 'POST',
      body: JSON.stringify({ api_id: apiId }),
    });
  }

  async cancelSubscription(subscriptionId: string) {
    return this.request(`/api/buyer/subscriptions/${subscriptionId}`, { method: 'DELETE' });
  }

  async getApiKeys() {
    return this.request('/api/buyer/keys');
  }

  async createApiKey(name?: string) {
    return this.request('/api/buyer/keys', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  }

  async revokeApiKey(keyId: string) {
    return this.request(`/api/buyer/keys/${keyId}`, { method: 'DELETE' });
  }

  async getCredits() {
    return this.request('/api/buyer/credits');
  }

  async purchaseCredits(amount: number) {
    return this.request('/api/buyer/credits/purchase', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
  }

  async getBuyerUsage(apiId?: string) {
    const params = apiId ? `?api_id=${apiId}` : '';
    return this.request(`/api/buyer/usage${params}`);
  }

  // Admin endpoints
  async getAdminDashboard() {
    return this.request('/api/admin/dashboard');
  }

  async getAdminUsers(params?: { role?: string; is_active?: boolean; page?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.role) searchParams.set('role', params.role);
    if (params?.is_active !== undefined) searchParams.set('is_active', String(params.is_active));
    if (params?.page) searchParams.set('page', params.page.toString());
    
    return this.request(`/api/admin/users?${searchParams}`);
  }

  async updateUserStatus(userId: string, isActive: boolean) {
    return this.request(`/api/admin/users/${userId}/status?is_active=${isActive}`, {
      method: 'PATCH',
    });
  }

  async getAdminVendors(page?: number) {
    return this.request(`/api/admin/vendors?page=${page || 1}`);
  }

  async getAdminBuyers(page?: number) {
    return this.request(`/api/admin/buyers?page=${page || 1}`);
  }

  async getAdminApis(isActive?: boolean) {
    const params = isActive !== undefined ? `?is_active=${isActive}` : '';
    return this.request(`/api/admin/apis${params}`);
  }

  async updateApiStatus(apiId: string, isActive: boolean) {
    return this.request(`/api/admin/apis/${apiId}/status?is_active=${isActive}`, {
      method: 'PATCH',
    });
  }

  async getTraffic(hours?: number) {
    return this.request(`/api/admin/traffic?hours=${hours || 24}`);
  }

  async getSystemLogs(params?: { userId?: string; action?: string; page?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.userId) searchParams.set('user_id', params.userId);
    if (params?.action) searchParams.set('action', params.action);
    if (params?.page) searchParams.set('page', params.page.toString());
    
    return this.request(`/api/admin/logs?${searchParams}`);
  }

  async getRevenue(days?: number) {
    return this.request(`/api/admin/revenue?days=${days || 30}`);
  }
}

export const api = new ApiClient(API_BASE_URL);
export type { ApiResponse };
