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
} from './render';

async function toggleGlobalUnits() {
  toggleUnits();
  updateGlobalUnitButtonText();

  const cityUpdatePromises = getDisplayedCities().map(async (city) => {
    const cardElement = document.querySelector(
      `.city-card[data-city-id="${city.id}"]`
    );

    // Show loading on existing cards
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

    // Create placeholder card with loading spinner
    const { cardElement } = createPlaceholderCard(cityName);

    const cityData = await getWeatherData(cityName);
    if (cityData) {
      // Remove the placeholder card
      cardElement.remove();

      // Add the real city data and render
      addDisplayedCity(cityData);
      renderCityCard(cityData);
      searchCityInput.value = '';
      showMessage(`${cityName} has been added to your dashboard.`);
    } else {
      // Remove the placeholder card on error
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

async function initializeApp() {
  updateGlobalUnitButtonText();
  setupEventListeners();

  // Create placeholder for default city
  const { cardElement } = createPlaceholderCard(CONFIG.DEFAULT_CITY);

  const cityData = await getWeatherData(CONFIG.DEFAULT_CITY);
  if (cityData) {
    // Remove placeholder and add real data
    cardElement.remove();
    addDisplayedCity(cityData);
    renderCityCard(cityData);
  } else {
    // Remove placeholder if loading failed
    cardElement.remove();
  }
}

document.addEventListener('DOMContentLoaded', initializeApp);
