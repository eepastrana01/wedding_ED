import { request } from './api';

export const csvApi = {
  importCsv(rows, options = {}) {
    return request('/csv/import', {
      method: 'POST',
      body: { rows, options },
    });
  },
};
