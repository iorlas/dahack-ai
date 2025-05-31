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

// API functions
export const todoApi = {
  listTodos: async (params?: {
    completed?: boolean;
    skip?: number;
    limit?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.completed !== undefined)
      searchParams.set('completed', String(params.completed));
    if (params?.skip !== undefined)
      searchParams.set('skip', String(params.skip));
    if (params?.limit !== undefined)
      searchParams.set('limit', String(params.limit));

    const response = await fetch(
      `${API_URL}/v1/todos?${searchParams.toString()}`
    );
    if (!response.ok) throw new Error('Failed to fetch todos');
    return response.json() as Promise<Todo[]>;
  },

  getTodo: async (id: string) => {
    const response = await fetch(`${API_URL}/v1/todos/${id}`);
    if (!response.ok) throw new Error('Failed to fetch todo');
    return response.json() as Promise<Todo>;
  },

  createTodo: async (todo: TodoCreate) => {
    const response = await fetch(`${API_URL}/v1/todos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(todo),
    });
    if (!response.ok) throw new Error('Failed to create todo');
    return response.json() as Promise<Todo>;
  },

  updateTodo: async (id: string, todo: TodoUpdate) => {
    const response = await fetch(`${API_URL}/v1/todos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(todo),
    });
    if (!response.ok) throw new Error('Failed to update todo');
    return response.json() as Promise<Todo>;
  },

  deleteTodo: async (id: string) => {
    const response = await fetch(`${API_URL}/v1/todos/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete todo');
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
    mutationFn: ({ id, todo }: { id: string; todo: TodoUpdate }) =>
      todoApi.updateTodo(id, todo),
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
