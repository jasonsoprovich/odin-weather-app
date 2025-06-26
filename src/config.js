import { debugWarn } from './logger';

export const CONFIG = {
  API_KEY: process.env.WEATHER_API_KEY || 'YOUR_API_KEY_HERE',
  API_BASE_URL:
    'https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline',
  WEATHER_ICONS_BASE_URL:
    'https://raw.githubusercontent.com/visualcrossing/WeatherIcons/main/PNG/2nd%20Set%20-%20Monochrome',
  DEFAULT_CITY: 'Edmonton',
  MESSAGE_DURATION: 3000,
};

if (CONFIG.API_KEY === 'YOUR_API_KEY_HERE') {
  debugWarn(
    '⚠️  Weather API key not configured. Please set WEATHER_API_KEY environment variable.'
  );
  debugWarn(
    '📖 Check SETUP.md for instructions on how to configure your API key.'
  );
}

export const UNITS = {
  METRIC: 'metric',
  US: 'us',
};

const unitsState = {
  current: UNITS.METRIC,
};

export function setCurrentUnits(units) {
  unitsState.current = units;
}

export function getCurrentUnits() {
  return unitsState.current;
}

export function toggleUnits() {
  unitsState.current =
    unitsState.current === UNITS.METRIC ? UNITS.US : UNITS.METRIC;
  return unitsState.current;
}
