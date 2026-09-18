import { request } from './api';

export const guestApi = {
  getAll(filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'all') {
        params.append(key, value);
      }
    });
    const query = params.toString() ? `?${params.toString()}` : '';
    return request(`/guests${query}`);
  },

  getById(id) {
    return request(`/guests/${id}`);
  },

  create(data) {
    return request('/guests', {
      method: 'POST',
      body: data,
    });
  },

  update(id, data) {
    return request(`/guests/${id}`, {
      method: 'PUT',
      body: data,
    });
  },

  updateStatus(id, status) {
    return request(`/guests/${id}/status`, {
      method: 'PATCH',
      body: { status },
    });
  },

  updateDelivery(id, delivered) {
    return request(`/guests/${id}/delivery`, {
      method: 'PATCH',
      body: { delivered },
    });
  },

  delete(id) {
    return request(`/guests/${id}`, {
      method: 'DELETE',
    });
  },

  deleteMultiple(ids) {
    return request('/guests/batch', {
      method: 'DELETE',
      body: { ids },
    });
  },

  clearAll() {
    return request('/guests/clear-all', {
      method: 'DELETE',
    });
  }
};
