import { request } from './api';

export const tableApi = {
  getAll() {
    return request('/tables');
  },

  getById(id) {
    return request(`/tables/${id}`);
  },

  create(data) {
    return request('/tables', {
      method: 'POST',
      body: data,
    });
  },

  update(id, data) {
    return request(`/tables/${id}`, {
      method: 'PUT',
      body: data,
    });
  },

  delete(id) {
    return request(`/tables/${id}`, {
      method: 'DELETE',
    });
  },

  assignGuests(tableId, guestIds) {
    return request(`/tables/${tableId}/assign`, {
      method: 'POST',
      body: { guest_ids: guestIds },
    });
  },

  unassignGuests(guestIds) {
    return request('/tables/unassign', {
      method: 'POST',
      body: { guest_ids: guestIds },
    });
  },

  clearTable(tableId) {
    return request(`/tables/${tableId}/clear`, {
      method: 'POST',
    });
  },

  autoGenerate(count = 10, capacity = 10) {
    return request('/tables/auto-generate', {
      method: 'POST',
      body: { count, capacity },
    });
  },
};
