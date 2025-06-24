import './styles.css';

const API_KEY = 'Q6F4VL97SCQY6LTMSQ5G22TJL';
const currentUnits = 'metric';
const appContainer = document.get('app-container');
const cityCardsContainer = document.createElement('div');
cityCardsContainer.id = 'city-cards-container';
appContainer.appendChild(cityCardsContainer);

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
          previousHours.unshift(hours[currentHourIndex - i].temp);
        }
      }
      for (let i = 1; i <= 2; i += 1) {
        if (currentHourIndex + i < hours.length) {
          nextHours.push(hours[currentHourIndex + i].temp);
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

function createCityCard(cityData) {
  const cardElement = document.createElement('div');
  cardElement.classList.add('city-card');
  cardElement.setAttribute('data-city-id', cityData.id);

  const cardCurrentUnits = cityData.initialUnits;

  const frontContent = `
    <div class="card-inner card-front">
      <div class="city-info">
        <h2 class="city-name">${cityData.address}</h2>
        <div class="datetime-info">
          <span class="day-name"></span> | <span class="date"></span> | <span class="time"></span>
        </div>
      </div>
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
      <button class="card-units-toggle-btn" data-units="${cardCurrentUnits}"></button>
    </div>
    <div class="card-inner card-back hidden">
      <h3>Detailed Info for ${cityData.address}</h3>
      <p>Feels like: <span class="feels-like-temp">${Math.round(
        cityData.currentConditions.feelsLike
      )}°</span></p>
      <p>Humidity: ${cityData.currentConditions.humidity}%</p>
      <p>Wind Speed: ${cityData.currentConditions.windSpeed} ${
    cardCurrentUnits === 'metric' ? 'km/h' : 'mph'
  }</p>
      <p>Conditions: ${cityData.currentConditions.conditions}</p>
      <p>UV Index: ${cityData.currentConditions.uvIndex}</p>
      <p>Precipitation Prob: ${cityData.currentConditions.precipProb}%</p>
    </div>
  `;

  cardElement.innerHTML = frontContent;
  cityCardsContainer.appendChild(cardElement);

  const parts = formatDateTimeFromEpoch(
    cityData.currentConditions.datetimeEpoch,
    cityData.timezone
  );

  cardElement.querySelector('.day-name').textContent = parts.weekday;
  cardElement.querySelector(
    '.date'
  ).textContent = `${parts.month} ${parts.day}`;
  cardElement.querySelector(
    '.time'
  ).textContent = `${parts.hour}:${parts.minute} ${parts.dayPeriod}`;

  const cardUnitsToggleBtn = cardElement.querySelector(
    '.card-units-toggle-btn'
  );

  if (cardUnitsToggleBtn) {
    cardUnitsToggleBtn.textContent =
      cardCurrentUnits === 'metric' ? 'C°' : 'F°';
    cardUnitsToggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleCardUnits(cardElement, cityData.id, cardCurrentUnits);
    });
  }

  cardElement.addEventListener('click', () => toggleCardFlip(cardElement));

  console.log('Card created for: ', cityData.address);
}

async function toggleCardUnits(cardElement, cityId, oldUnits) {
  const newUnits = oldUnits === 'metric' ? 'us' : 'metric';
  console.log(
    `Toggling units for card ID: ${cityId} from ${oldUnits} to ${newUnits}`
  );

  const originalCityName = cardElement.querySelector('.city-name').textContent;

  const updatedCityData = await getWeatherData(originalCityName, newUnits);
  if (updatedCityData) {
    updatedCityData.id = cityId;

    const cardUnitsToggleBtn = cardElement.querySelector(
      '.card-units-toggle-btn'
    );
    cardUnitsToggleBtn.setAttribute('data-units', newUnits);
    cardUnitsToggleBtn.textContent = newUnits === 'metric' ? 'C°' : 'F°';

    cardElement.querySelector('.current-temp').textContent = `${Math.round(
      updatedCityData.currentConditions.temp
    )}°`;
    cardElement.querySelector(
      '.hourly-temps'
    ).innerHTML = `${updatedCityData.hourlyTemps.previous
      .map((temp) => `<span class="hourly-temp">${Math.round(temp)}°</span>`)
      .join('')}
      <span class="current-temp">${Math.round(
        updatedCityData.currentConditions.temp
      )}°</span>
      ${updatedCityData.hourlyTemps.next
        .map((temp) => `<span class="hourly-temp">${Math.round(temp)}°</span>`)
        .join('')}`;

    const backContentElement = cardElement.querySelector('.card-back');
    if (backContentElement) {
      backContentElement.querySelector(
        '.feels-like-temp'
      ).textContent = `${Math.round(
        updatedCityData.currentConditions.feelsLike
      )}°`;
      backContentElement.querySelector(
        'p:nth-child(3)'
      ).textContent = `Wind Speed: ${
        updatedCityData.currentConditions.windSpeed
      } ${newUnits === 'metric' ? 'km/h' : 'mph'}`;
    }

    cardUnitsToggleBtn.addEventListener(
      'click',
      (event) => {
        event.stopPropagation();
        toggleCardUnits(cardElement, cityId, newUnits);
      },
      { once: true }
    );
  }
}

function toggleCardFlip(cardElement) {
  cardElement.classList.toggle('flipped');
  cardElement.querySelector('.card-front').classList.toggle('hidden');
  cardElement.querySelector('.card-back').classList.toggle('hidden');
}

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
