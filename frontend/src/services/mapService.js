import apiClient from './apiClient';

const unwrap = (promise) => promise.then((res) => res.data);

export const mapService = {
  suggestions: (input, signal) => unwrap(apiClient.get('/maps/suggestions', { params: { input }, signal })),
  reverse: (lat, lng) => unwrap(apiClient.get('/maps/reverse', { params: { lat, lng } })),
};

export default mapService;
