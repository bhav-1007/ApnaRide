import apiClient from './apiClient';

const unwrap = (promise) => promise.then((res) => res.data);

export const captainService = {
  setStatus: (status) => unwrap(apiClient.put('/captains/status', { status })),
  updateLocation: (lat, lng) => unwrap(apiClient.post('/captains/location', { lat, lng })),
  stats: (days = 7) => unwrap(apiClient.get('/captains/stats', { params: { days } })),
};

export default captainService;
