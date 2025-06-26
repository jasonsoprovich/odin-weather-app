import { CONFIG, getCurrentUnits } from './config';
import { debugError } from './logger';

function processWeatherData(data) {
  const currentHour = new Date(
    data.currentConditions.datetimeEpoch * 1000
  ).getHours();
  const { hours } = data.days[0];

  let currentHourIndex = -1;
  for (let i = 0; i < hours.length; i += 1) {
    const hourDate = new Date(hours[i].datetimeEpoch * 1000);
    if (hourDate.getHours() === currentHour) {
      currentHourIndex = i;
      break;
    }
  }

  const previousHours = [];
  const nextHours = [];

  if (currentHourIndex !== -1) {
    for (let i = 1; i <= 2; i += 1) {
      if (currentHourIndex - i >= 0) {
        previousHours.unshift(hours[currentHourIndex - i].temp);
      }
    }
    for (let i = 1; i <= 2; i += 1) {
      if (currentHourIndex + i < hours.length) {
        nextHours.push(hours[currentHourIndex + i].temp);
      }
    }
  }

  const id = crypto.randomUUID();
  const { currentConditions } = data;

  return {
    id,
    address: data.resolvedAddress,
    timezone: data.timezone,
    currentConditions: {
      datetime: currentConditions.datetime,
      datetimeEpoch: currentConditions.datetimeEpoch,
      temp: currentConditions.temp,
      conditions: currentConditions.conditions,
      icon: currentConditions.icon,
      feelsLike:
        currentConditions.feelslike ||
        currentConditions.feelsLike ||
        currentConditions.temp,
      humidity: currentConditions.humidity || 0,
      windSpeed:
        currentConditions.windspeed || currentConditions.windSpeed || 0,
      uvIndex: currentConditions.uvindex || currentConditions.uvIndex || 0,
      precipProb:
        currentConditions.precipprob || currentConditions.precipProb || 0,
    },
    hourlyTemps: {
      previous: previousHours,
      current: data.currentConditions.temp,
      next: nextHours,
    },
    weeklyForecast: data.days.slice(0, 7).map((day) => ({
      date: day.datetimeEpoch,
      conditions: day.conditions,
      icon: day.icon,
      temp: day.temp,
      maxTemp: day.tempmax,
      minTemp: day.tempmin,
      dayName: new Date(day.datetimeEpoch * 1000).toLocaleDateString('en-US', {
        weekday: 'short',
      }),
    })),
    daysArray: data.days.map((day) => ({
      date: day.datetimeEpoch,
      conditions: day.conditions,
      icon: day.icon,
      temp: day.temp,
      maxTemp: day.tempmax,
      minTemp: day.tempmin,
    })),
  };
}

export default async function getWeatherData(locationName) {
  const url = `${
    CONFIG.API_BASE_URL
  }/${locationName}?unitGroup=${getCurrentUnits()}&key=${
    CONFIG.API_KEY
  }&contentType=json&include=current,hours`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Error fetching data for ${locationName}: ${response.status} ${response.statusText}`
      );
    }
    const data = await response.json();

    return processWeatherData(data);
  } catch (error) {
    debugError('Weather API Error:', error);
    return null;
  }
}
