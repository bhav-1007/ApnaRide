import apiClient, { session, errorMessage, UNAUTHORIZED_EVENT, API_URL } from './apiClient';
import authService from './authService';
import rideService from './rideService';
import mapService from './mapService';
import captainService from './captainService';

export {
  apiClient,
  session,
  errorMessage,
  UNAUTHORIZED_EVENT,
  API_URL,
  authService,
  rideService,
  mapService,
  captainService,
};

// Aliases for backwards compatibility with any existing imports
export const auth = authService;
export const rides = rideService;
export const maps = mapService;
export const captain = captainService;

export default {
  auth: authService,
  rides: rideService,
  maps: mapService,
  captain: captainService,
};
