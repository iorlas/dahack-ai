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
  user: User;
}

// Enhanced error handling
const handleApiError = async (response: Response) => {
  if (response.status === 422) {
    const errorData: HTTPValidationError = await response.json();
    const errorMessage = errorData.detail.map((err) => `${err.loc.join('.')}: ${err.msg}`).join(', ');
    throw new Error(`Validation error: ${errorMessage}`);
  }

  const errorText = await response.text();
  throw new Error(`API error (${response.status}): ${errorText || response.statusText}`);
};

// Get auth headers
const getAuthHeaders = (): Record<string, string> => {
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
      localStorage.setItem('username', data.user.username);
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
    enabled: !!localStorage.getItem('access_token'),
  });
};
