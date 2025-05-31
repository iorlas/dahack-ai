import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface Todo {
  id: number;
  title: string;
  description: string | null;
  due_date: string | null;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface TodoCreate {
  title: string;
  description?: string;
  due_date?: string;
}

export interface TodoUpdate {
  title?: string;
  description?: string;
  due_date?: string;
  completed?: boolean;
}

export interface ValidationError {
  loc: (string | number)[];
  msg: string;
  type: string;
}

export interface HTTPValidationError {
  detail: ValidationError[];
}

// Auth interfaces
export interface User {
  id: number;
  username: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

// Contact interfaces
export interface ContactInvite {
  username: string;
}

export interface InvitationResponse {
  id: number;
  from_user: User;
  to_user: User;
  created_at: string;
  updated_at: string;
}

export interface ContactResponse {
  id: number;
  other_user: User;
  created_at: string;
  updated_at: string;
}

export interface ContactListResponse {
  sent_invitations: InvitationResponse[];
  received_invitations: InvitationResponse[];
  contacts: ContactResponse[];
}

export interface MutualContactCheck {
  is_mutual_contact: boolean;
}

// Enhanced error handling
const handleApiError = async (response: Response) => {
  if (response.status === 422) {
    const errorData: HTTPValidationError = await response.json();
    const errorMessage = errorData.detail.map((err) => `${err.loc.join('.')}: ${err.msg}`).join(', ');
    throw new Error(`Validation error: ${errorMessage}`);
  }

  try {
    // Try to parse JSON error response for 400, 401, etc.
    const errorData = await response.json();
    if (errorData.detail) {
      throw new Error(`API error (${response.status}): ${errorData.detail}`);
    }
    throw new Error(`API error (${response.status}): ${JSON.stringify(errorData)}`);
  } catch {
    // If JSON parsing fails, fall back to status text
    throw new Error(`API error (${response.status}): ${response.statusText}`);
  }
};

// Get auth headers
const getAuthHeaders = (): Record<string, string> => {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('access_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// API functions
export const todoApi = {
  listTodos: async (params?: {
    completed?: boolean;
    skip?: number;
    limit?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.completed !== undefined) searchParams.set('completed', String(params.completed));
    if (params?.skip !== undefined) searchParams.set('skip', String(params.skip));
    if (params?.limit !== undefined) searchParams.set('limit', String(params.limit));

    const response = await fetch(`${API_URL}/v1/todos?${searchParams.toString()}`, {
      headers: getAuthHeaders(),
    });

    if (response.status !== 200) {
      await handleApiError(response);
    }

    return response.json() as Promise<Todo[]>;
  },

  getTodo: async (id: string) => {
    const response = await fetch(`${API_URL}/v1/todos/${id}`, {
      headers: getAuthHeaders(),
    });

    if (response.status !== 200) {
      await handleApiError(response);
    }

    return response.json() as Promise<Todo>;
  },

  createTodo: async (todo: TodoCreate) => {
    const response = await fetch(`${API_URL}/v1/todos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(todo),
    });

    if (response.status !== 201) {
      await handleApiError(response);
    }

    return response.json() as Promise<Todo>;
  },

  updateTodo: async (id: string, todo: TodoUpdate) => {
    const response = await fetch(`${API_URL}/v1/todos/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(todo),
    });

    if (response.status !== 200) {
      await handleApiError(response);
    }

    return response.json() as Promise<Todo>;
  },

  deleteTodo: async (id: string) => {
    const response = await fetch(`${API_URL}/v1/todos/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (response.status !== 204) {
      await handleApiError(response);
    }

    // 204 No Content - no response body expected
  },
};

// Auth API functions
export const authApi = {
  login: async (credentials: LoginRequest) => {
    const response = await fetch(`${API_URL}/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });

    if (response.status !== 200) {
      await handleApiError(response);
    }

    return response.json() as Promise<AuthResponse>;
  },

  register: async (userData: RegisterRequest) => {
    const response = await fetch(`${API_URL}/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });

    if (response.status !== 201) {
      await handleApiError(response);
    }

    return response.json() as Promise<User>;
  },

  getCurrentUser: async () => {
    const response = await fetch(`${API_URL}/v1/auth/me`, {
      headers: getAuthHeaders(),
    });

    if (response.status !== 200) {
      await handleApiError(response);
    }

    return response.json() as Promise<User>;
  },
};

// Contact API functions
export const contactApi = {
  sendInvitation: async (invite: ContactInvite) => {
    const response = await fetch(`${API_URL}/v1/contacts/invite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(invite),
    });

    if (response.status !== 200) {
      await handleApiError(response);
    }

    return response.json() as Promise<InvitationResponse>;
  },

  acceptInvitation: async (invitationId: number) => {
    const response = await fetch(`${API_URL}/v1/contacts/${invitationId}/accept`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });

    if (response.status !== 200) {
      await handleApiError(response);
    }

    return response.json() as Promise<ContactResponse>;
  },

  rejectInvitation: async (invitationId: number) => {
    const response = await fetch(`${API_URL}/v1/contacts/${invitationId}/reject`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });

    if (response.status !== 204) {
      await handleApiError(response);
    }

    // 204 No Content - no response body expected
  },

  getContacts: async () => {
    const response = await fetch(`${API_URL}/v1/contacts`, {
      headers: getAuthHeaders(),
    });

    if (response.status !== 200) {
      await handleApiError(response);
    }

    return response.json() as Promise<ContactListResponse>;
  },

  checkMutualContact: async (username: string) => {
    const response = await fetch(`${API_URL}/v1/contacts/check/${username}`, {
      headers: getAuthHeaders(),
    });

    if (response.status !== 200) {
      await handleApiError(response);
    }

    return response.json() as Promise<MutualContactCheck>;
  },
};

// React Query hooks
export const useTodos = (params?: {
  completed?: boolean;
  skip?: number;
  limit?: number;
}) => {
  return useQuery({
    queryKey: ['todos', params],
    queryFn: () => todoApi.listTodos(params),
  });
};

export const useTodo = (id: string) => {
  return useQuery({
    queryKey: ['todo', id],
    queryFn: () => todoApi.getTodo(id),
    enabled: !!id,
  });
};

export const useCreateTodo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: todoApi.createTodo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });
};

export const useUpdateTodo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, todo }: { id: string; todo: TodoUpdate }) => todoApi.updateTodo(id, todo),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
      queryClient.invalidateQueries({ queryKey: ['todo', data.id] });
    },
  });
};

export const useDeleteTodo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: todoApi.deleteTodo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });
};

// Auth hooks
export const useLogin = () => {
  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      localStorage.setItem('access_token', data.access_token);
    },
  });
};

export const useRegister = () => {
  return useMutation({
    mutationFn: authApi.register,
  });
};

export const useCurrentUser = () => {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: authApi.getCurrentUser,
    enabled: typeof window !== 'undefined' && !!localStorage.getItem('access_token'),
  });
};

// Contact hooks
export const useContacts = () => {
  return useQuery({
    queryKey: ['contacts'],
    queryFn: contactApi.getContacts,
    enabled: typeof window !== 'undefined' && !!localStorage.getItem('access_token'),
  });
};

export const useSendInvitation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: contactApi.sendInvitation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
};

export const useAcceptInvitation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: contactApi.acceptInvitation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
};

export const useRejectInvitation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: contactApi.rejectInvitation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
};

export const useMutualContactCheck = (username: string) => {
  return useQuery({
    queryKey: ['mutualContact', username],
    queryFn: () => contactApi.checkMutualContact(username),
    enabled: !!username && typeof window !== 'undefined' && !!localStorage.getItem('access_token'),
  });
};
