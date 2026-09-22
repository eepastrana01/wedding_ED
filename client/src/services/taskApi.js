import { request } from './api';

export const taskApi = {
  getAll(filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'all') {
        params.append(key, value);
      }
    });
    const query = params.toString() ? `?${params.toString()}` : '';
    return request(`/tasks${query}`);
  },

  getStats() {
    return request('/tasks/stats');
  },

  getById(id) {
    return request(`/tasks/${id}`);
  },

  create(data) {
    return request('/tasks', {
      method: 'POST',
      body: data,
    });
  },

  update(id, data) {
    return request(`/tasks/${id}`, {
      method: 'PUT',
      body: data,
    });
  },

  delete(id) {
    return request(`/tasks/${id}`, {
      method: 'DELETE',
    });
  },

  toggleStatus(id, status = null) {
    return request(`/tasks/${id}/toggle`, {
      method: 'PATCH',
      body: { status },
    });
  },

  toggleSubtask(taskId, subtaskId) {
    return request(`/tasks/${taskId}/subtasks/${subtaskId}/toggle`, {
      method: 'PATCH',
    });
  },

  loadPresets() {
    return request('/tasks/presets', {
      method: 'POST',
    });
  },
};
