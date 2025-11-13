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
    family_id: string;
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

  createChangeRequest: async (requestData: {
    event_id: string;
    requestedDate?: string;
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

  getMessages: async (conversationId: string) => {
    return fetchWithAuth(`/api/v1/messaging/conversations/${conversationId}/messages`);
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