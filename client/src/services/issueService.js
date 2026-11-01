import API from './api';

export const getIssues = async (params = {}) => {
  const response = await API.get('/issues', { params });
  return response.data;
};

export const getIssuesForMap = async () => {
  const response = await API.get('/issues/map');
  return response.data;
};

export const getIssueById = async (id) => {
  const response = await API.get(`/issues/${id}`);
  return response.data;
};

export const createIssue = async (formData) => {
  const response = await API.post('/issues', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const updateIssueStatus = async (id, data) => {
  const response = await API.patch(`/issues/${id}/status`, data);
  return response.data;
};

export const deleteIssue = async (id) => {
  const response = await API.delete(`/issues/${id}`);
  return response.data;
};
