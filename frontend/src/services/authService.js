import apiClient from './apiClient';

const unwrap = (promise) => promise.then((res) => res.data);
const basePath = (role) => (role === 'captain' ? '/captains' : '/users');

export const authService = {
  login: (role, body) => unwrap(apiClient.post(`${basePath(role)}/login`, body)),
  register: (role, body) => unwrap(apiClient.post(`${basePath(role)}/register`, body)),
  profile: (role) => unwrap(apiClient.get(`${basePath(role)}/profile`)),
  logout: (role) => unwrap(apiClient.get(`${basePath(role)}/logout`)),
  forgotPassword: (role, email) => unwrap(apiClient.post(`${basePath(role)}/forgot-password`, { email })),
  resetPassword: (role, body) => unwrap(apiClient.post(`${basePath(role)}/reset-password`, body)),
};

export default authService;
