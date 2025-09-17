import { authStorage, getAuthHeader, type LoginResponse, type AuthTokens } from './auth';
import { toast } from '@/hooks/use-toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...options.headers,
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.detail || errorData.message || `HTTP ${response.status}`;
      throw new ApiError(response.status, errorMessage);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      // Handle token refresh for 401 errors
      if (error.status === 401 && endpoint !== '/auth/login' && endpoint !== '/auth/refresh') {
        try {
          await refreshToken();
          // Retry the original request with new token
          return apiRequest(endpoint, options);
        } catch {
          // Refresh failed, redirect to login
          authStorage.clear();
          window.location.href = '/login';
          throw error;
        }
      }
      
      toast({
        variant: "destructive",
        title: "API Error",
        description: error.message,
      });
      throw error;
    }
    
    toast({
      variant: "destructive",
      title: "Network Error",
      description: "Failed to connect to the server",
    });
    throw error;
  }
}

// Auth API
export const login = async (email: string, password: string): Promise<LoginResponse> => {
  const data = await apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  
  authStorage.setTokens(data.tokens);
  authStorage.setUser(data.user);
  return data;
};

export const refreshToken = async (): Promise<AuthTokens> => {
  const tokens = authStorage.getTokens();
  if (!tokens) throw new Error('No refresh token');

  const data = await apiRequest<AuthTokens>('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refresh: tokens.refresh }),
  });
  
  authStorage.setTokens(data);
  return data;
};


// Tasks API
export const getTasks = (): Promise<any[]> => apiRequest('/tasks/');
export const createTask = (task: any) => apiRequest('/tasks/', { method: 'POST', body: JSON.stringify(task) });
export const updateTaskStatus = (id: string, status: string) => 
  apiRequest(`/tasks/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });

export const uploadTaskPhoto = async (id: string, file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  
  return fetch(`${API_BASE_URL}/tasks/${id}/upload_photo`, {
    method: 'POST',
    headers: getAuthHeader(),
    body: formData,
  }).then(response => {
    if (!response.ok) throw new Error('Upload failed');
    return response.json();
  });
};

// Complaints API
export const getComplaints = (): Promise<any[]> => apiRequest('/complaints/');
export const createComplaint = async (complaint: any, file?: File) => {
  if (file) {
    const formData = new FormData();
    Object.keys(complaint).forEach(key => {
      formData.append(key, complaint[key]);
    });
    formData.append('file', file);
    
    return fetch(`${API_BASE_URL}/complaints/`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: formData,
    }).then(response => {
      if (!response.ok) throw new Error('Submit failed');
      return response.json();
    });
  }
  
  return apiRequest('/complaints/', { method: 'POST', body: JSON.stringify(complaint) });
};

export const updateComplaintStatus = (id: string, status: string) =>
  apiRequest(`/complaints/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });

// Audit API
export const getAuditLogs = (): Promise<any[]> => apiRequest('/audit_logs/');