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
} from './render';

// Event handlers
async function toggleGlobalUnits() {
  toggleUnits();
  updateGlobalUnitButtonText();

  const cityUpdatePromises = getDisplayedCities().map(async (city) => {
    const updatedData = await getWeatherData(city.address);
    if (updatedData) {
      // Preserve the original ID when updating
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

    const cityData = await getWeatherData(cityName);
    if (cityData) {
      addDisplayedCity(cityData);
      renderCityCard(cityData);
      searchCityInput.value = '';
      showMessage(`${cityName} has been added to your dashboard.`);
    } else {
      showMessage(
        'Could not find weather data for that city. Please try again.'
      );
    }
  } else {
    showMessage('Please enter a city name.');
  }
}

// Event listeners setup
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

// Initialize the application
async function initializeApp() {
  updateGlobalUnitButtonText();
  setupEventListeners();

  // Load default city
  const cityData = await getWeatherData(CONFIG.DEFAULT_CITY);
  if (cityData) {
    addDisplayedCity(cityData);
    renderCityCard(cityData);
  }
}

// Start the application when DOM is ready
document.addEventListener('DOMContentLoaded', initializeApp);
