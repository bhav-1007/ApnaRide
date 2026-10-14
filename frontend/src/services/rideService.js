import apiClient from './apiClient';

const unwrap = (promise) => promise.then((res) => res.data);

export const rideService = {
  quote: (pickup, destination) => unwrap(apiClient.post('/rides/quote', { pickup, destination })),
  create: (body) => unwrap(apiClient.post('/rides', body)),
  active: () => unwrap(apiClient.get('/rides/active')),
  history: (params) => unwrap(apiClient.get('/rides/history', { params })),
  cancel: (id) => unwrap(apiClient.post(`/rides/${id}/cancel`)),
  pay: (id) => unwrap(apiClient.post(`/rides/${id}/pay`)),
  nearby: () => unwrap(apiClient.get('/rides/nearby')),
  accept: (id) => unwrap(apiClient.post(`/rides/${id}/accept`)),
  start: (id, otp) => unwrap(apiClient.post(`/rides/${id}/start`, { otp })),
  end: (id) => unwrap(apiClient.post(`/rides/${id}/end`)),
};

export default rideService;
