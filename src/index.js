import './styles.css';

const API_KEY = 'Q6F4VL97SCQY6LTMSQ5G22TJL';
let currentUnits = 'metric';

const cityCardsContainer = document.getElementById('city-cards-container');

const displayedCities = [];

function toggleCardFlip(cardElement) {
  cardElement.classList.toggle('flipped');
  cardElement.querySelector('.card-front').classList.toggle('hidden');
  cardElement.querySelector('.card-back').classList.toggle('hidden');
}

async function getWeatherData(locationName) {
  const url = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${locationName}?unitGroup=${currentUnits}&key=${API_KEY}&contentType=json&include=current,hours`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Error fetching data for ${locationName}: ${response.status} ${response.statusText}`
      );
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
    return null;
  }
}

function formatCurrentTimeFromTimezone(timezone) {
  const now = new Date();
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
    .formatToParts(now)
    .reduce((acc, part) => {
      acc[part.type] = part.value;
      return acc;
    }, {});
}

function renderCityCard(cityData) {
  let cardElement = document.querySelector(
    `.city-card[data-city-id="${cityData.id}"]`
  );

  const wasFlipped = cardElement
    ? cardElement.classList.contains('flipped')
    : false;

  if (!cardElement) {
    cardElement = document.createElement('div');
    cardElement.classList.add('city-card');
    cardElement.setAttribute('data-city-id', cityData.id);
    cityCardsContainer.appendChild(cardElement);

    cardElement.addEventListener('click', () => toggleCardFlip(cardElement));
  }

  const currentParts = formatCurrentTimeFromTimezone(cityData.timezone);

  const cityName = cityData.address.split(',')[0].trim();

  const frontContent = `
    <div class="card-inner card-front">
      <div class="city-info">
        <h2 class="city-name">${cityName}</h2>
        <div class="datetime-info">
          <span class="day-name">${currentParts.weekday}</span> |
          <span class="date">${currentParts.month} ${currentParts.day}</span> |
          <span class="time">${currentParts.hour}:${currentParts.minute} ${
    currentParts.dayPeriod
  }</span>
      </div>
      </div>
      <div class="temp-section">
        <div class="hourly-temps">
          ${cityData.hourlyTemps.previous
            .map(
              (temp) => `<span class="hourly-temp">${Math.round(temp)}</span>`
            )
            .join('')}
          <span class="current-temp">${Math.round(
            cityData.currentConditions.temp
          )}°</span>
          ${cityData.hourlyTemps.next
            .map(
              (temp) => `<span class="hourly-temp">${Math.round(temp)}</span>`
            )
            .join('')}
        </div>
      </div>
    </div>
    <div class="card-inner card-back">
      <h3>Detailed Info for ${cityName}</h3>
      <p>Feels like: <span class="feels-like-temp">${
        cityData.currentConditions.feelsLike !== undefined &&
        !Number.isNaN(cityData.currentConditions.feelsLike)
          ? `${Math.round(cityData.currentConditions.feelsLike)}°`
          : 'N/A'
      }</span></p>
      <p>Humidity: ${
        cityData.currentConditions.humidity !== undefined &&
        !Number.isNaN(cityData.currentConditions.humidity)
          ? `${cityData.currentConditions.humidity}%`
          : 'N/A'
      }</p>
      <p>Wind Speed: ${
        cityData.currentConditions.windSpeed !== undefined &&
        !Number.isNaN(cityData.currentConditions.windSpeed)
          ? `${cityData.currentConditions.windSpeed} ${
              currentUnits === 'metric' ? 'km/h' : 'mph'
            }`
          : 'N/A'
      }</p>
      <p>Conditions: ${cityData.currentConditions.conditions || 'N/A'}</p>
      <p>UV Index: ${
        cityData.currentConditions.uvIndex !== undefined &&
        !Number.isNaN(cityData.currentConditions.uvIndex)
          ? cityData.currentConditions.uvIndex
          : 'N/A'
      }</p>
      <p>Precipitation Probability: ${
        cityData.currentConditions.precipProb !== undefined &&
        !Number.isNaN(cityData.currentConditions.precipProb)
          ? `${cityData.currentConditions.precipProb}%`
          : 'N/A'
      }</p>
    </div>
  `;

  cardElement.innerHTML = frontContent;

  if (wasFlipped) {
    cardElement.classList.add('flipped');
    cardElement.querySelector('.card-front').classList.add('hidden');
    cardElement.querySelector('.card-back').classList.remove('hidden');
  } else {
    cardElement.classList.remove('flipped');
    cardElement.querySelector('.card-front').classList.remove('hidden');
    cardElement.querySelector('.card-back').classList.add('hidden');
  }
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

  const cityUpdatePromises = displayedCities.map(async (city) => {
    const updatedData = await getWeatherData(city.address);
    if (updatedData) {
      const index = displayedCities.findIndex((c) => c.id === city.id);
      if (index !== -1) {
        displayedCities[index] = updatedData;
      }
      return updatedData;
    }
    return null;
  });

  const updatedCities = await Promise.all(cityUpdatePromises);

  updatedCities.forEach((cityData) => {
    if (cityData) {
      renderCityCard(cityData);
    }
  });
}

const searchCityInput = document.getElementById('search-city');
const searchButton = document.getElementById('search-btn');

function showMessage(message) {
  console.log(message);

  const messageDiv = document.createElement('div');
  messageDiv.textContent = message;
  messageDiv.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #333;
    color: white;
    padding: 10px 15px;
    border-radius: 5px;
    z-index: 1000;
  `;
  document.body.appendChild(messageDiv);

  setTimeout(() => {
    document.body.removeChild(messageDiv);
  }, 3000);
}

searchButton.addEventListener('click', async (e) => {
  e.preventDefault();
  const cityName = searchCityInput.value.trim();

  if (cityName) {
    const existingCity = displayedCities.find(
      (city) =>
        city.address.toLowerCase().includes(cityName.toLowerCase()) ||
        cityName.toLowerCase().includes(city.address.toLowerCase())
    );
    if (existingCity) {
      showMessage(`${cityName} is already displayed.`);
      searchCityInput.value = '';
      return;
    }

    const cityData = await getWeatherData(cityName);
    if (cityData) {
      displayedCities.push(cityData);
      renderCityCard(cityData);
      searchCityInput.value = '';
    } else {
      showMessage(
        'Could not find weather data for that city. Please try again.'
      );
    }
  } else {
    showMessage('Please enter a city name.');
  }
});

document.addEventListener('DOMContentLoaded', async () => {
  updateGlobalUnitButtonText();
  if (globalUnitsBtn) {
    globalUnitsBtn.addEventListener('click', toggleGlobalUnits);
  }
  const defaultCityName = 'Edmonton';
  const cityData = await getWeatherData(defaultCityName);
  if (cityData) {
    displayedCities.push(cityData);
    renderCityCard(cityData);
  }
});
