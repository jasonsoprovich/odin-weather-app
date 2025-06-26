import { CONFIG, getCurrentUnits, UNITS } from './config';
import {
  formatCurrentTimeFromTimezone,
  extractCityName,
  createModalOverlay,
  removeModal,
  appendModal,
  showMessage,
} from './utils';

const displayedCities = [];

export function getDisplayedCities() {
  return displayedCities;
}

export function addDisplayedCity(cityData) {
  displayedCities.push(cityData);
}

export function removeDisplayedCity(cityId) {
  const cityIndex = displayedCities.findIndex((city) => city.id === cityId);
  if (cityIndex !== -1) {
    displayedCities.splice(cityIndex, 1);
  }
}

export function updateDisplayedCity(cityData) {
  const index = displayedCities.findIndex((c) => c.id === cityData.id);
  if (index !== -1) {
    displayedCities[index] = cityData;
  }
}

export function findDisplayedCity(predicate) {
  return displayedCities.find(predicate);
}

function deleteCity(cityId, cardElement) {
  removeDisplayedCity(cityId);
  const cityName = cardElement.querySelector('.city-name').textContent;
  cardElement.remove();
  showMessage(`${cityName} has been removed from your dashboard.`);
}

function showDeleteConfirmation(cityData, cardElement) {
  const cityName = extractCityName(cityData.address);
  const modalOverlay = createModalOverlay();

  modalOverlay.innerHTML = `
    <div class="modal">
      <h3>Delete City Card</h3>
      <p>Are you sure you want to remove <strong>${cityName}</strong> from your weather dashboard?</p>
      <div class="modal-buttons">
        <button class="modal-btn cancel">Cancel</button>
        <button class="modal-btn confirm">Delete</button>
      </div>
    </div>
  `;

  const cancelBtn = modalOverlay.querySelector('.cancel');
  const confirmBtn = modalOverlay.querySelector('.confirm');

  cancelBtn.addEventListener('click', () => {
    removeModal(modalOverlay);
  });

  confirmBtn.addEventListener('click', () => {
    deleteCity(cityData.id, cardElement);
    removeModal(modalOverlay);
  });

  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
      removeModal(modalOverlay);
    }
  });

  appendModal(modalOverlay);
}

function createDeleteButton(cityData, cardElement) {
  const deleteBtn = document.createElement('button');
  deleteBtn.classList.add('delete-btn');
  deleteBtn.innerHTML = '×';
  deleteBtn.setAttribute('aria-label', 'Delete city card');

  deleteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    showDeleteConfirmation(cityData, cardElement);
  });

  return deleteBtn;
}

function toggleCardFlip(cardElement) {
  cardElement.classList.toggle('flipped');
  cardElement.querySelector('.card-front').classList.toggle('hidden');
  cardElement.querySelector('.card-back').classList.toggle('hidden');
}

function generateCardFrontContent(cityData) {
  const currentParts = formatCurrentTimeFromTimezone(cityData.timezone);
  const cityName = extractCityName(cityData.address);

  return `
    <div class="card-inner card-front">
      <div class="city-info">
        <div class="weather-icon">
          <img src="${CONFIG.WEATHER_ICONS_BASE_URL}/${
    cityData.currentConditions.icon
  }.png" 
               alt="${cityData.currentConditions.conditions}" 
               onerror="this.style.display='none'">
        </div>
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

      <div class="weekly-forecast">
        ${cityData.weeklyForecast
          .map(
            (day, index) => `
            <div class="forecast-day ${index === 0 ? 'today' : ''}">
              <span class="forecast-day-name">${
                index === 0 ? 'Today' : day.dayName
              }</span>
              <img src="${CONFIG.WEATHER_ICONS_BASE_URL}/${day.icon}.png" 
                   alt="${day.conditions}" 
                   class="forecast-icon"
                   onerror="this.style.display='none'">
              <div class="forecast-temps">
                <span class="forecast-high">${Math.round(day.maxTemp)}</span>
                <span class="forecast-low">${Math.round(day.minTemp)}</span>
              </div>
            </div>
          `
          )
          .join('')}
      </div>
    </div>
  `;
}

function generateCardBackContent(cityData) {
  const cityName = extractCityName(cityData.address);
  const currentUnits = getCurrentUnits();

  return `
    <div class="card-inner card-back">
      <div class="card-back-content">
        <h3>Detailed Info for ${cityName}</h3>
        <div class="details-grid">
          <div class="detail-item">
            <span class="detail-label">Feels like:</span>
            <span class="detail-value">${
              cityData.currentConditions.feelsLike !== undefined &&
              !Number.isNaN(cityData.currentConditions.feelsLike)
                ? `${Math.round(cityData.currentConditions.feelsLike)}°`
                : 'N/A'
            }</span>
          </div>
          
          <div class="detail-item">
            <span class="detail-label">Humidity:</span>
            <span class="detail-value">${
              cityData.currentConditions.humidity !== undefined &&
              !Number.isNaN(cityData.currentConditions.humidity)
                ? `${cityData.currentConditions.humidity}%`
                : 'N/A'
            }</span>
          </div>
          
          <div class="detail-item">
            <span class="detail-label">Wind Speed:</span>
            <span class="detail-value">${
              cityData.currentConditions.windSpeed !== undefined &&
              !Number.isNaN(cityData.currentConditions.windSpeed)
                ? `${cityData.currentConditions.windSpeed} ${
                    currentUnits === UNITS.METRIC ? 'km/h' : 'mph'
                  }`
                : 'N/A'
            }</span>
          </div>
          
          <div class="detail-item">
            <span class="detail-label">Conditions:</span>
            <span class="detail-value">${
              cityData.currentConditions.conditions || 'N/A'
            }</span>
          </div>
          
          <div class="detail-item">
            <span class="detail-label">UV Index:</span>
            <span class="detail-value">${
              cityData.currentConditions.uvIndex !== undefined &&
              !Number.isNaN(cityData.currentConditions.uvIndex)
                ? cityData.currentConditions.uvIndex
                : 'N/A'
            }</span>
          </div>
          
          <div class="detail-item">
            <span class="detail-label">Precipitation:</span>
            <span class="detail-value">${
              cityData.currentConditions.precipProb !== undefined &&
              !Number.isNaN(cityData.currentConditions.precipProb)
                ? `${cityData.currentConditions.precipProb}%`
                : 'N/A'
            }</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function renderCityCard(cityData) {
  const cityCardsContainer = document.getElementById('city-cards-container');
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

  const frontContent = generateCardFrontContent(cityData);
  const backContent = generateCardBackContent(cityData);

  cardElement.innerHTML = frontContent + backContent;

  const deleteBtn = createDeleteButton(cityData, cardElement);
  cardElement.appendChild(deleteBtn);

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

export function updateGlobalUnitButtonText() {
  const globalUnitsBtn = document.getElementById('global-units-btn');
  if (globalUnitsBtn) {
    globalUnitsBtn.textContent =
      getCurrentUnits() === UNITS.METRIC ? 'C°' : 'F°';
  }
}
