import './styles.css';

const API_KEY = 'Q6F4VL97SCQY6LTMSQ5G22TJL';
let currentUnits = 'metric';
const location = 'Edmonton';

function getUrl() {
  return `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${location}?unitGroup=${currentUnits}&key=${API_KEY}&contentType=json`;
}

async function getData() {
  try {
    const response = await fetch(getUrl());
    const data = await response.json();
    if (response.status !== 200) return null;

    return {
      address: data.resolvedAddress,
      timezone: data.timezone,
      currentConditions: {
        datetime: data.currentConditions.datetime,
        datetimeEpoch: data.currentConditions.datetimeEpoch,
        temp: data.currentConditions.temp,
        conditions: data.currentConditions.conditions,
        icon: data.currentConditions.icon,
        feelsLike: data.currentConditions.feelsLike,
        humidity: data.currentConditions.humidity,
        windSpeed: data.currentConditions.windSpeed,
        uvIndex: data.currentConditions.uvIndex,
        precipProb: data.currentConditions.precipProb,
      },
      daysArray: data.days.map((day) => ({
        date: day.datetimeEpoch,
        conditions: day.conditions,
        icon: day.icon,
        temp: day.temp,
        maxTemp: day.tempmax,
        minTemp: day.tempmin,
      })),
    };
  } catch {
    return null;
  }
}

function updateUnitsBtn() {
  const unitsBtn = document.getElementById('units-btn');
  if (unitsBtn) {
    unitsBtn.textContent = currentUnits === 'metric' ? 'C°' : 'F°';
  }
}

function toggleUnits() {
  currentUnits = currentUnits === 'metric' ? 'us' : 'metric';
  updateUnitsBtn();
  getData();
  console.log(`Units toggled to ${currentUnits}`);
}

const unitsBtn = document.getElementById('units-btn');
unitsBtn.addEventListener('click', toggleUnits);

function formatDateTimeFromEpoch(epochSeconds, timezone) {
  const date = new Date(epochSeconds * 1000);
  const options = {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: timezone,
  };
  return new Intl.DateTimeFormat('en-US', options)
    .formatToParts(date)
    .reduce((acc, part) => {
      acc[part.type] = part.value;
      return acc;
    }, {});
}

async function displayCityCard() {
  const data = await getData();
  if (!data) return;

  const parts = formatDateTimeFromEpoch(
    data.currentConditions.datetimeEpoch,
    data.timezone
  );

  document.getElementById('city-name').textContent = data.address;
  document.getElementById('day-name').textContent = parts.weekday;
  document.getElementById('date').textContent = `${parts.month} ${parts.day}`;
  document.getElementById(
    'time'
  ).textContent = `${parts.hour}:${parts.minute} ${parts.dayPeriod}`;
  document.getElementById(
    'current-temp'
  ).textContent = `${data.currentConditions.temp}°`;
}

updateUnitsBtn();
// getData();
displayCityCard();
