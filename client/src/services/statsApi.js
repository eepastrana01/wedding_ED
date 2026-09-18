import { request } from './api';

export const statsApi = {
  getStats() {
    return request('/stats');
  },
};

export const csvApi = {
  importCsv(rows, options = {}) {
    return request('/csv/import', {
      method: 'POST',
      body: { rows, options },
    });
  },
};
