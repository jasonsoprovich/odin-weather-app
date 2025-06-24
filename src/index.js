import './styles.css';

const API_KEY = 'Q6F4VL97SCQY6LTMSQ5G22TJL';
const currentUnits = 'metric';

const countryUnitMap = {
  US: 'us',
  LR: 'us',
  FM: 'us',
  VI: 'us',
  KY: 'us',
  MH: 'us',
};

async function getWeatherData(locationName, units) {
  const url = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${locationName}?unitGroup=${units}&key=${API_KEY}&contentType=json&include=current,hours`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(
        `Error fetching data for ${locationName}: ${response.status} ${response.statusText}`
      );
      return null;
    }
    const data = await response.json();

    let defaultUnitsForLocation = units;
    if (data && data.resolvedAddress) {
      const countryMatch = data.resolvedAddress.match(/,\s*([A-Za-z]{2,})$/);
      if (countryMatch && countryMatch[1]) {
        const countryCode = countryMatch[1].toUpperCase();
        const mappedUnit = countryUnitMap[countryCode];
        if (mappedUnit) {
          defaultUnitsForLocation = mappedUnit;
        }
      }
    }

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
          previousHours.unshift(hours[currentHourIndex - 1].temp);
        }
      }
      for (let i = 1; i <= 2; i += 1) {
        if (currentHourIndex + i < hours.length) {
          nextHours.push(hours[currentHourIndex + 1].temp);
        }
      }
    }

    return {
      id: crypto.randomUUID(),
      initialUnits: defaultUnitsForLocation,
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
      hourlyTemps: {
        previous: previousHours,
        current: data.currentConditions.temp,
        next: nextHours,
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
  } catch (error) {
    console.error(`Fetch error for ${locationName}:`, error);
    return null;
  }
}

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

// function updateUnitsBtn() {
//   const unitsBtn = document.getElementById('units-btn');
//   if (unitsBtn) {
//     unitsBtn.textContent = currentUnits === 'metric' ? 'C°' : 'F°';
//   }
// }

// function toggleUnits() {
//   currentUnits = currentUnits === 'metric' ? 'us' : 'metric';
//   updateUnitsBtn();
//   getWeatherData();
//   console.log(`Units toggled to ${currentUnits}`);
// }

// const unitsBtn = document.getElementById('units-btn');
// unitsBtn.addEventListener('click', toggleUnits);

const searchCityInput = document.getElementById('search-city');
const searchButton = document.getElementById('search-btn');

searchButton.addEventListener('click', async (e) => {
  e.preventDefault();
  const cityName = searchCityInput.value.trim();
  if (cityName) {
    const cityData = await getWeatherData(cityName, currentUnits);
    if (cityData) {
      createCityCard(cityData);
      searchCityInput.value = '';
    } else {
      alert('Could not find weather data for that city. Please try again.');
    }
  } else {
    alert('Please enter a city name.');
  }
});

document.addEventListener('DOMContentLoaded', async () => {
  const defaultCityName = 'Edmonton';
  const cityData = await getWeatherData(defaultCityName, currentUnits);
  if (cityData) {
    createCityCard(cityData);
  }
});

// async function displayCityCard() {
//   const data = await getWeatherData('Edmonton', 'us');
//   if (!data) return;

//   const parts = formatDateTimeFromEpoch(
//     data.currentConditions.datetimeEpoch,
//     data.timezone
//   );

//   document.getElementById('city-name').textContent = data.address;
//   document.getElementById('day-name').textContent = parts.weekday;
//   document.getElementById('date').textContent = `${parts.month} ${parts.day}`;
//   document.getElementById(
//     'time'
//   ).textContent = `${parts.hour}:${parts.minute} ${parts.dayPeriod}`;
//   document.getElementById(
//     'current-temp'
//   ).textContent = `${data.currentConditions.temp}°`;
// }

// updateUnitsBtn();
// getData();
// displayCityCard();
