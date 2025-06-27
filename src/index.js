import './styles.css';
import getWeatherData from './api';
import { CONFIG, toggleUnits } from './config';
import { showMessage } from './utils';
import {
  renderCityCard,
  updateGlobalUnitButtonText,
  getDisplayedCities,
  addDisplayedCity,
  findDisplayedCity,
  updateDisplayedCity,
  createPlaceholderCard,
  showLoadingOnCard,
  loadSavedCities,
  initializeDisplayedCities,
} from './render';
import { initializeDragAndDrop } from './dragDrop';

async function toggleGlobalUnits() {
  toggleUnits();
  updateGlobalUnitButtonText();

  const cityUpdatePromises = getDisplayedCities().map(async (city) => {
    const cardElement = document.querySelector(
      `.city-card[data-city-id="${city.id}"]`
    );

    if (cardElement) {
      showLoadingOnCard(cardElement);
    }

    const updatedData = await getWeatherData(city.address);
    if (updatedData) {
      updatedData.id = city.id;
      updateDisplayedCity(updatedData);
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

async function addCity() {
  const searchCityInput = document.getElementById('search-city');
  const cityName = searchCityInput.value.trim();

  if (cityName) {
    const existingCity = findDisplayedCity(
      (city) =>
        city.address.toLowerCase().includes(cityName.toLowerCase()) ||
        cityName.toLowerCase().includes(city.address.toLowerCase())
    );

    if (existingCity) {
      showMessage(`${cityName} is already displayed.`);
      searchCityInput.value = '';
      return;
    }

    const { cardElement } = createPlaceholderCard(cityName);

    const cityData = await getWeatherData(cityName);
    if (cityData) {
      cardElement.remove();

      addDisplayedCity(cityData);
      renderCityCard(cityData);
      searchCityInput.value = '';
      showMessage(`${cityName} has been added to your dashboard.`);
    } else {
      cardElement.remove();
      showMessage(
        'Could not find weather data for that city. Please try again.'
      );
    }
  } else {
    showMessage('Please enter a city name.');
  }
}

function setupEventListeners() {
  const searchButton = document.getElementById('search-btn');
  const searchCityInput = document.getElementById('search-city');
  const globalUnitsBtn = document.getElementById('global-units-btn');

  searchButton.addEventListener('click', async (e) => {
    e.preventDefault();
    await addCity();
  });

  searchCityInput.addEventListener('keypress', async (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      await addCity();
    }
  });

  if (globalUnitsBtn) {
    globalUnitsBtn.addEventListener('click', toggleGlobalUnits);
  }
}

async function loadDefaultCity() {
  const { cardElement } = createPlaceholderCard(CONFIG.DEFAULT_CITY);

  const cityData = await getWeatherData(CONFIG.DEFAULT_CITY);
  if (cityData) {
    cardElement.remove();
    addDisplayedCity(cityData);
    renderCityCard(cityData);
  } else {
    cardElement.remove();
  }
}

async function loadSavedCitiesWithFreshData(savedCities) {
  const placeholders = savedCities.map((city) => {
    const { cardElement } = createPlaceholderCard(
      city.address.split(',')[0].trim()
    );
    return { ...city, cardElement };
  });

  const weatherPromises = placeholders.map(async (placeholder) => {
    const freshData = await getWeatherData(placeholder.address);
    if (freshData) {
      freshData.id = placeholder.id;
      placeholder.cardElement.remove();
      return freshData;
    }
    placeholder.cardElement.remove();
    return null;
  });

  const weatherResults = await Promise.all(weatherPromises);
  const validCities = weatherResults.filter((city) => city !== null);

  initializeDisplayedCities(validCities);

  validCities.forEach((cityData) => {
    renderCityCard(cityData);
  });

  if (validCities.length === 0) {
    await loadDefaultCity();
  }
}

async function initializeApp() {
  updateGlobalUnitButtonText();
  setupEventListeners();

  initializeDragAndDrop();

  const savedCities = loadSavedCities();

  if (savedCities.length > 0) {
    await loadSavedCitiesWithFreshData(savedCities);
  } else {
    await loadDefaultCity();
  }
}

document.addEventListener('DOMContentLoaded', initializeApp);
