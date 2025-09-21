import { authStorage, getAuthHeader, type LoginResponse, type User } from './auth';
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
  options: RequestInit = {},
  queryParams: string = ''
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}${queryParams}`;
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
          return apiRequest(endpoint, options, queryParams);
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
export const login = async (username: string, password: string): Promise<LoginResponse> => {
  const data = await apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  
  authStorage.setTokens(data.access_token, data.refresh_token);
  
  // Fetch user profile based on role
  let userProfile: User;
  if (data.role === 'admin') {
    // For admin, we'll need to implement a profile endpoint or use a placeholder
    userProfile = {
      id: 'admin-' + Date.now(),
      username: username,
      role: 'admin' as const,
      created_at: new Date().toISOString()
    };
  } else {
    userProfile = await apiRequest<User>('/worker/profile');
  }
  
  authStorage.setUser(userProfile);
  return data;
};

export const refreshToken = async (): Promise<{access_token: string}> => {
  const refreshToken = authStorage.getRefreshToken();
  if (!refreshToken) throw new Error('No refresh token');

  const data = await apiRequest<{access_token: string}>('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  
  authStorage.setTokens(data.access_token, refreshToken);
  return data;
};


// Admin APIs
export const getWorkers = (): Promise<any[]> => apiRequest('/admin/workers/');
export const addWorker = (username: string, password: string) => 
  apiRequest('/admin/workers/', { 
    method: 'POST', 
    body: JSON.stringify({}),
    headers: { ...getAuthHeader(), 'Content-Type': 'application/json' }
  }, `?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`);
export const removeWorker = (username: string) => apiRequest(`/admin/workers/${username}`, { method: 'DELETE' });
export const updateWorkerStatus = (username: string, status: string) => 
  apiRequest(`/admin/workers/${username}/status?status=${encodeURIComponent(status)}`, { method: 'PATCH' });

export const getTasks = (): Promise<any[]> => apiRequest('/admin/tasks/');
export const createTask = (task: {title: string, description: string, assigned_to: string}) => 
  apiRequest(`/admin/tasks/?title=${encodeURIComponent(task.title)}&description=${encodeURIComponent(task.description)}&assigned_to=${encodeURIComponent(task.assigned_to)}`, { method: 'POST' });
export const updateTaskStatus = (taskId: string, status: string) => 
  apiRequest(`/admin/tasks/${taskId}?status=${encodeURIComponent(status)}`, { method: 'PATCH' });
export const deleteTask = (taskId: string) => apiRequest(`/admin/tasks/${taskId}`, { method: 'DELETE' });

export const getAdminComplaints = (): Promise<any[]> => apiRequest('/admin/complaints/');
export const updateComplaintStatus = (complaintId: string, status: string) => 
  apiRequest(`/admin/complaints/${complaintId}/status?status=${encodeURIComponent(status)}`, { method: 'PATCH' });

// Worker APIs
export const getWorkerTasks = (): Promise<any[]> => apiRequest('/worker/tasks');
export const getWorkerProfile = (): Promise<User> => apiRequest('/worker/profile');
export const acknowledgeTask = (taskId: string) => apiRequest(`/worker/tasks/${taskId}/acknowledge`, { method: 'PATCH' });

export const uploadTaskEvidence = async (taskId: string, files: File[]) => {
  const formData = new FormData();
  files.forEach(file => formData.append('files', file));
  
  return fetch(`${API_BASE_URL}/worker/tasks/${taskId}/evidence`, {
    method: 'POST',
    headers: getAuthHeader(),
    body: formData,
  }).then(response => {
    if (!response.ok) throw new Error('Upload failed');
    return response.json();
  });
};

export const updateWorkerPassword = (password: string) => 
  apiRequest(`/worker/profile/password?password=${encodeURIComponent(password)}`, { method: 'PATCH' });

// Note: Worker complaints are only for submission, not retrieval
// Workers cannot view their own complaints - only admins can see them

export const submitWorkerComplaint = (description: string) => 
  apiRequest(`/worker/complaints?description=${encodeURIComponent(description)}`, { method: 'POST' });

// Public Complaints API
export const getComplaints = (): Promise<any[]> => apiRequest('/complaints/');

export const createComplaint = async (description: string, category: string, location?: string, file?: File) => {
  const formData = new FormData();
  formData.append('description', description);
  formData.append('category', category);
  if (location) formData.append('location', location);
  if (file) formData.append('file', file);
  
  return fetch(`${API_BASE_URL}/complaints/`, {
    method: 'POST',
    body: formData,
  }).then(response => {
    if (!response.ok) throw new Error('Submit failed');
    return response.json();
  });
};

// Audit API
export const getAuditLogs = (): Promise<any[]> => apiRequest('/admin/audit-logs/');