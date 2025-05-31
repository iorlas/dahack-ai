'use client';

import { useCreateTodo, useDeleteTodo, useTodos, useUpdateTodo } from '@/lib/api';
import { useState } from 'react';

export default function TodoManager() {
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const { data: todos, isLoading, error } = useTodos();
  const createTodo = useCreateTodo();
  const updateTodo = useUpdateTodo();
  const deleteTodo = useDeleteTodo();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoTitle.trim()) return;

    try {
      await createTodo.mutateAsync({ title: newTodoTitle });
      setNewTodoTitle('');
    } catch (error) {
      console.error('Failed to create todo:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">Error: {error.message}</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-8">Todo Manager</h1>

      {/* Add Todo Form */}
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="flex gap-2">
          <input
            type="text"
            value={newTodoTitle}
            onChange={(e) => setNewTodoTitle(e.target.value)}
            placeholder="What needs to be done?"
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={createTodo.isPending}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {createTodo.isPending ? 'Adding...' : 'Add Todo'}
          </button>
        </div>
      </form>

      {/* Todo List */}
      <div className="space-y-4">
        {todos?.map((todo) => (
          <div key={todo.id} className="flex items-center justify-between p-4 bg-white rounded-lg shadow">
            <div className="flex items-center gap-4">
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() =>
                  updateTodo.mutate({
                    id: todo.id.toString(),
                    todo: { completed: !todo.completed },
                  })
                }
                className="w-5 h-5 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
              />
              <div>
                <h3 className={`text-lg font-medium ${todo.completed ? 'line-through text-gray-500' : ''}`}>
                  {todo.title}
                </h3>
                {todo.description && <p className="text-gray-600">{todo.description}</p>}
              </div>
            </div>
            <button
              type="button"
              onClick={() => deleteTodo.mutate(todo.id.toString())}
              className="text-red-500 hover:text-red-700 focus:outline-none"
            >
              Delete
            </button>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {todos?.length === 0 && <div className="text-center text-gray-500 py-8">No todos yet. Add one above!</div>}
    </div>
  );
}
