const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Helper function to get auth token from localStorage
const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};

// Helper function to make authenticated requests
const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'An error occurred' }));
    throw new Error(error.detail || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};

// Auth API
export const authAPI = {
  signup: async (userData: { firstName: string; lastName: string; email: string; password: string }) => {
    return fetchWithAuth('/api/v1/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  login: async (email: string, password: string) => {
    console.log('authAPI.login called with:', email, password);
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);

    const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Login failed' }));
      throw new Error(error.detail || 'Login failed');
    }

    const data = await response.json();
    localStorage.setItem('authToken', data.access_token);
    return data;
  },

  logout: () => {
    localStorage.removeItem('authToken');
  },

  getCurrentUser: async () => {
    return fetchWithAuth('/api/v1/auth/me');
  },
};

// Family API
export const familyAPI = {
  createFamily: async (familyData: {
    familyName: string;
    parent1_name: string;
    parent2_email?: string;
    custodyArrangement?: string;
  }) => {
    return fetchWithAuth('/api/v1/family', {
      method: 'POST',
      body: JSON.stringify(familyData),
    });
  },

  updateFamily: async (updates: any) => {
    // transform children if present
    const payload = { ...updates };
    if (payload.children && Array.isArray(payload.children)) {
      payload.children = payload.children.map((child: any) => ({
        ...child,
        name: child.name || `${child.firstName} ${child.lastName}`.trim(),
        // Backend expects date string YYYY-MM-DD
        dateOfBirth: new Date(child.dateOfBirth).toISOString().split('T')[0],
        // Transform arrays to strings for backend
        allergies: Array.isArray(child.allergies) ? child.allergies.join(', ') : child.allergies,
        medications: Array.isArray(child.medicalConditions) ? child.medicalConditions.join(', ') : child.medicalConditions,
        notes: Array.isArray(child.specialNeeds) ? child.specialNeeds.join(', ') : child.specialNeeds
      }));
    }

    return fetchWithAuth('/api/v1/family', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  linkToFamily: async (linkData: {
    familyCode: string;
    parent2_name: string;
  }) => {
    return fetchWithAuth('/api/v1/family/link', {
      method: 'POST',
      body: JSON.stringify(linkData),
    });
  },

  getFamily: async () => {
    return fetchWithAuth('/api/v1/family');
  },

  uploadContract: async (contractData: {
    fileName: string;
    fileContent: string;
    fileType: string;
  }) => {
    return fetchWithAuth('/api/v1/family/contract', {
      method: 'POST',
      body: JSON.stringify(contractData),
    });
  },

  getContract: async () => {
    return fetchWithAuth('/api/v1/family/contract');
  },

  downloadContract: async () => {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/api/v1/family/contract/download`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Download failed' }));
      throw new Error(error.detail || `HTTP error! status: ${response.status}`);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = 'custody_agreement.pdf';

    if (contentDisposition) {
      // Improved regex to handle quoted and unquoted filenames, and remove trailing underscores
      const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (filenameMatch) {
        filename = filenameMatch[1].replace(/['"]/g, '').trim();
        // Remove trailing underscores
        filename = filename.replace(/_+$/, '');
      }
    }

    // Check if it's a PDF - open in new tab instead of downloading
    const contentType = response.headers.get('Content-Type');
    if (contentType?.includes('application/pdf')) {
      // Open PDF in new tab
      window.open(url, '_blank');
      // Clean up after a delay to allow the browser to load the PDF
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 100);
    } else {
      // Download other file types
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }
  },
  getCustodyDistribution: async (params?: { period: 'weekly' | 'yearly' }) => {
    const url = new URL(`${API_BASE_URL}/api/v1/family/custody-distribution`);
    if (params?.period) {
      url.searchParams.append('period', params.period);
    }
    return fetchWithAuth(url.pathname + url.search);
  },

  saveManualCustody: async (data: {
    custodySchedule: string;
    holidaySchedule?: string;
    decisionMaking?: string;
    expenseSplitRatio?: string;
    expenseParent1?: number;
    expenseParent2?: number;
  }) => {
    return fetchWithAuth('/api/v1/family/custody-manual', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  deleteContract: async () => {
    return fetchWithAuth('/api/v1/family/contract', {
      method: 'DELETE',
    });
  },
};

// Children API
export const childrenAPI = {
  getChildren: async () => {
    return fetchWithAuth('/api/v1/children');
  },

  addChild: async (childData: {
    name: string;
    dateOfBirth: string;
    grade?: string;
    school?: string;
    allergies?: string;
    medications?: string;
    notes?: string;
  }) => {
    return fetchWithAuth('/api/v1/children', {
      method: 'POST',
      body: JSON.stringify(childData),
    });
  },

  updateChild: async (childId: string, updates: {
    name?: string;
    dateOfBirth?: string;
    school?: string;
    grade?: string;
    allergies?: string;
    medications?: string;
    notes?: string;
  }) => {
    return fetchWithAuth(`/api/v1/children/${childId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  deleteChild: async (childId: string) => {
    return fetchWithAuth(`/api/v1/children/${childId}`, {
      method: 'DELETE',
    });
  },
};

// Admin API
export const adminAPI = {
  getAllFamilies: async () => {
    return fetchWithAuth('/api/v1/admin/families');
  },

  getFamilyDetails: async (familyId: string) => {
    return fetchWithAuth(`/api/v1/admin/families/${familyId}`);
  },

  getStats: async () => {
    return fetchWithAuth('/api/v1/admin/stats');
  },

  getAllUsers: async () => {
    return fetchWithAuth('/api/v1/admin/users');
  },
};

// Calendar API
export const calendarAPI = {
  getEvents: async (year: number, month: number) => {
    return fetchWithAuth(`/api/v1/calendar/events?year=${year}&month=${month}`);
  },

  createEvent: async (eventData: {
    date: string;
    type: string;
    title: string;
    parent?: string;
    isSwappable?: boolean;
  }) => {
    return fetchWithAuth('/api/v1/calendar/events', {
      method: 'POST',
      body: JSON.stringify(eventData),
    });
  },

  updateEvent: async (eventId: string, eventData: {
    date: string;
    type: string;
    title: string;
    parent?: string;
    isSwappable?: boolean;
  }) => {
    return fetchWithAuth(`/api/v1/calendar/events/${eventId}`, {
      method: 'PUT',
      body: JSON.stringify(eventData),
    });
  },

  createChangeRequest: async (requestData: {
    event_id: string;
    requestType: 'swap' | 'modify' | 'cancel';
    newDate?: string;
    swapEventId?: string;
    reason?: string;
  }) => {
    return fetchWithAuth('/api/v1/calendar/change-requests', {
      method: 'POST',
      body: JSON.stringify(requestData),
    });
  },

  updateChangeRequest: async (requestId: string, status: 'approved' | 'rejected') => {
    return fetchWithAuth(`/api/v1/calendar/change-requests/${requestId}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  getChangeRequests: async () => {
    return fetchWithAuth('/api/v1/calendar/change-requests');
  },
};

// Messaging API
export const messagingAPI = {
  getConversations: async () => {
    return fetchWithAuth('/api/v1/messaging/conversations');
  },

  createConversation: async (conversationData: {
    subject: string;
    category: string;
  }) => {
    return fetchWithAuth('/api/v1/messaging/conversations', {
      method: 'POST',
      body: JSON.stringify(conversationData),
    });
  },

  getMessages: async (conversationId: string, page: number = 1, limit: number = 50) => {
    return fetchWithAuth(`/api/v1/messaging/conversations/${conversationId}/messages?page=${page}&limit=${limit}`);
  },

  sendMessage: async (messageData: {
    conversation_id: string;
    content: string;
    tone: string;
  }) => {
    return fetchWithAuth('/api/v1/messaging/messages', {
      method: 'POST',
      body: JSON.stringify(messageData),
    });
  },

  toggleStar: async (conversationId: string) => {
    return fetchWithAuth(`/api/v1/messaging/conversations/${conversationId}/star`, {
      method: 'PATCH',
    });
  },

  archiveConversation: async (conversationId: string) => {
    return fetchWithAuth(`/api/v1/messaging/conversations/${conversationId}/archive`, {
      method: 'PATCH',
    });
  },
};

// Expenses API
export const expensesAPI = {
  getExpenses: async () => {
    return fetchWithAuth('/api/v1/expenses');
  },

  createExpense: async (expenseData: {
    description: string;
    amount: number;
    category: string;
    date: string;
    receipt_file_name?: string;
    receipt_content?: string;
    children_ids?: string[];
  }) => {
    return fetchWithAuth('/api/v1/expenses', {
      method: 'POST',
      body: JSON.stringify(expenseData),
    });
  },

  updateExpense: async (expenseId: string, updates: {
    status?: 'approved' | 'disputed' | 'paid';
    dispute_reason?: string;
  }) => {
    return fetchWithAuth(`/api/v1/expenses/${expenseId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  deleteExpense: async (expenseId: string) => {
    return fetchWithAuth(`/api/v1/expenses/${expenseId}`, {
      method: 'DELETE',
    });
  },

  getExpenseSummary: async () => {
    return fetchWithAuth('/api/v1/expenses/summary');
  },
};

// Activity API
export const activityAPI = {
  getRecentActivity: async () => {
    return fetchWithAuth('/api/v1/activity');
  },
};

// Documents API
export const documentsAPI = {
  getFolders: async () => {
    return fetchWithAuth('/api/v1/documents/folders');
  },

  createFolder: async (folderData: {
    name: string;
    description: string;
    icon: string;
    color: string;
    bg_color: string;
  }) => {
    return fetchWithAuth('/api/v1/documents/folders', {
      method: 'POST',
      body: JSON.stringify(folderData),
    });
  },

  updateFolder: async (folderId: string, updates: {
    name?: string;
    description?: string;
    icon?: string;
    color?: string;
    bg_color?: string;
  }) => {
    return fetchWithAuth(`/api/v1/documents/folders/${folderId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  deleteFolder: async (folderId: string) => {
    return fetchWithAuth(`/api/v1/documents/folders/${folderId}`, {
      method: 'DELETE',
    });
  },

  getDocuments: async (folderId?: string) => {
    const url = folderId
      ? `/api/v1/documents?folder_id=${folderId}`
      : '/api/v1/documents';
    return fetchWithAuth(url);
  },

  uploadDocument: async (documentData: {
    folder_id?: string;
    name: string;
    type: string;
    description?: string;
    tags?: string[];
    file_content: string; // Base64 encoded
    file_name: string;
    children_ids?: string[];
  }) => {
    return fetchWithAuth('/api/v1/documents/upload', {
      method: 'POST',
      body: JSON.stringify(documentData),
    });
  },

  deleteDocument: async (documentId: string) => {
    return fetchWithAuth(`/api/v1/documents/${documentId}`, {
      method: 'DELETE',
    });
  },

  getDocumentFile: async (fileUrl: string) => {
    const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const fullUrl = fileUrl.startsWith('http') ? fileUrl : `${apiBaseUrl}${fileUrl}`;
    const token = localStorage.getItem('authToken');

    const response = await fetch(fullUrl, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch document');
    }

    const blob = await response.blob();
    return URL.createObjectURL(blob);
  },

  getDocumentUrl: (fileUrl: string, download: boolean = false) => {
    const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const cleanPath = fileUrl.startsWith('http') ? new URL(fileUrl).pathname : fileUrl;
    const fullUrl = `${apiBaseUrl}${cleanPath}`;
    const token = localStorage.getItem('authToken');
    return `${fullUrl}?token=${token}${download ? '&download=true' : ''}`;
  },
};

// Support Coach API
export const supportCoachAPI = {
  startSession: async (parentName?: string) => {
    const params = new URLSearchParams();
    if (parentName) {
      params.set('parent_name', parentName);
    }
    const query = params.toString() ? `?${params.toString()}` : '';
    return fetchWithAuth(`/api/v1/support/session${query}`);
  },

  sendMessage: async (payload: {
    message: string;
    parentName?: string;
    goal?: string;
    intensity?: string;
  }) => {
    const body = {
      message: payload.message,
      ...(payload.parentName ? { parent_name: payload.parentName } : {}),
      ...(payload.goal ? { goal: payload.goal } : {}),
      ...(payload.intensity ? { intensity: payload.intensity } : {}),
    };
    return fetchWithAuth('/api/v1/support/chat', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },
};