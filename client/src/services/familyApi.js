import { request } from './api';

export const familyApi = {
  getAll(search = '') {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    return request(`/families${query}`);
  },

  getById(id) {
    return request(`/families/${id}`);
  },

  create(data) {
    return request('/families', {
      method: 'POST',
      body: data,
    });
  },

  autoGenerate() {
    return request('/families/auto-generate', {
      method: 'POST',
    });
  },

  update(id, data) {
    return request(`/families/${id}`, {
      method: 'PUT',
      body: data,
    });
  },

  updateBulkStatus(id, status) {
    return request(`/families/${id}/status`, {
      method: 'PATCH',
      body: { status },
    });
  },

  updateDelivery(id, delivered) {
    return request(`/families/${id}/delivery`, {
      method: 'PATCH',
      body: { delivered },
    });
  },

  assignMembers(id, guestIds) {
    return request(`/families/${id}/members`, {
      method: 'POST',
      body: { guest_ids: guestIds },
    });
  },

  removeMember(familyId, guestId) {
    return request(`/families/${familyId}/members/${guestId}`, {
      method: 'DELETE',
    });
  },

  delete(id, deleteMembers = false) {
    return request(`/families/${id}?delete_members=${deleteMembers}`, {
      method: 'DELETE',
    });
  },
};
