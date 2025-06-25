import './styles.css';

const API_KEY = 'Q6F4VL97SCQY6LTMSQ5G22TJL';
let currentUnits = 'metric';

const appContainer = document.getElementById('app-container');
const cityCardsContainer = document.createElement('div');
cityCardsContainer.id = 'city-cards-container';
appContainer.appendChild(cityCardsContainer);

let displayedCities = [];

async function getWeatherData(locationName) {
  const url = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${locationName}?unitGroup=${currentUnits}&key=${API_KEY}&contentType=json&include=current,hours`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(
        `Error fetching data for ${locationName}: ${response.status} ${response.statusText}`
      );
      return null;
    }
    const data = await response.json();

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

    const existingCity = displayedCities.find(
      (city) => city.address === data.resolvedAddress
    );
    const id = existingCity ? existingCity.id : crypto.randomUUID();

    return {
      id,
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

function renderCityCard(cityData) {
  let cardElement = document.querySelector(
    `.city-card[data-city-id="${cityData.id}"]`
  );

  if (!cardElement) {
    cardElement = document.createElement('div');
    cardElement.classList.add('city-card');
    cardElement.setAttribute('data-city-id', cityData.id);
    cityCardsContainer.appendChild(cardElement);

    cardElement.addEventListener('click', () => toggleCardFlip(cardElement));
  }

  const parts = formatDateTimeFromEpoch(
    cityData.currentConditions.datetimeEpoch,
    cityData.timezone
  );

  const frontContent = `
    <div class="card-inner card-front">
      <div class="city-info">
        <h2 class="city-name">${cityData.address}</h2>
        <div class="datetime-info">
          <span class="day-name">${parts.weekday}</span> |
          <span class="date">${parts.month} ${parts.day}</span> |
          <span class="time">${parts.hour}:${parts.minute} ${
    parts.dayPeriod
  }</span>
        </div>
      </div>
      <div class="temp-section">
        <div class="hourly-temps">
          ${cityData.hourlyTemps.previous
            .map(
              (temp) => `<span class="hourly-temp">${Math.round(temp)}°</span>`
            )
            .join('')}
          <span class="current-temp">${Math.round(
            cityData.currentConditions.temp
          )}°</span>
          ${cityData.hourlyTemps.next
            .map(
              (temp) => `<span class="hourly-temp">${Math.round(temp)}°</span>`
            )
            .join('')}
        </div>
      </div>
    </div>
    <div class="card-inner card-back ${
      cardElement.classList.contains('flipped') ? '' : 'hidden'
    }">
      <h3>Detailed Info for ${cityData.address}</h3>
      <p>Feels like: <span class="feels-like-temp">${Math.round(
        cityData.currentConditions.feelsLike
      )}°</span></p>
      <p>Humidity: ${cityData.currentConditions.humidity}%</p>
      <p>Wind Speed: ${cityData.currentConditions.windSpeed} ${
    currentUnits === 'metric' ? 'km/h' : 'mph'
  }</p>
      <p>Conditions: ${cityData.currentConditions.conditions}</p>
      <p>UV Index: ${cityData.currentConditions.uvIndex}</p>
      <p>Precipitation Prob: ${cityData.currentConditions.precipProb}%</p>
    </div>
  `;

  cardElement.innerHTML = frontContent;

  if (cardElement.classList.contains('flipped')) {
    cardElement.querySelector('.card-front').classList.add('hidden');
    cardElement.querySelector('.card-back').classList.remove('hidden');
  } else {
    cardElement.querySelector('.card-front').classList.remove('hidden');
    cardElement.querySelector('.card-back').classList.add('hidden');
  }

  console.log('Card rendered/updated for:', cityData.address);
}

function toggleCardFlip(cardElement) {
  cardElement.classList.toggle('flipped');
  cardElement.querySelector('.card-front').classList.toggle('hidden');
  cardElement.querySelector('.card-back').classList.toggle('hidden');
}

const globalUnitsBtn = document.getElementById('global-units-btn');

function updateGlobalUnitButtonText() {
  if (globalUnitsBtn) {
    globalUnitsBtn.textContent = currentUnits === 'metric' ? 'C°' : 'F°';
  }
}

async function toggleGlobalUnits() {
  currentUnits = currentUnits === 'metric' ? 'us' : 'metric';
  updateGlobalUnitButtonText();

  console.log(`Global units toggled to: ${currentUnits}`);

  const citiesToUpdate = [...displayedCities];
  displayedCities = [];
  cityCardsContainer.innerHTML = '';

  for (const city of citiesToUpdate) {
    const updatedData = await getWeatherData(city.address);
    if (updatedData) {
      displayedCities.push(updatedData);
      renderCityCard(updatedData);
    }
  }
}

const searchCityInput = document.getElementById('search-city');
const searchButton = document.getElementById('search-btn');

searchButton.addEventListener('click', async (e) => {
  e.preventDefault();
  const cityName = searchCityInput.value.trim();

  if (cityName) {
    const existingCity = displayedCities.find(
      (city) =>
        city.address.includes(cityName) || cityName.includes(city.address)
    );
    if (existingCity) {
      alert(`${cityName} is already displayed.`);
      searchCityInput.value = '';
      return;
    }

    const cityData = await getWeatherData(cityName);
    if (cityData) {
      displayedCities.push(cityData);
      renderCityCard(cityData);
      searchCityInput.value = '';
    } else {
      alert('Could not find weather data for that city. Please try again.');
    }
  } else {
    alert('Please enter a city name.');
  }
});

document.addEventListener('DOMContentLoaded', async () => {
  updateGlobalUnitButtonText();
  globalUnitsBtn.addEventListener('click', toggleGlobalUnits);
  const defaultCityName = 'Edmonton';
  const cityData = await getWeatherData(defaultCityName);
  if (cityData) {
    displayedCities.push(cityData);
    renderCityCard(cityData);
  }
});
