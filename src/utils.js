export function showMessage(message) {
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
    if (document.body.contains(messageDiv)) {
      document.body.removeChild(messageDiv);
    }
  }, 3000);
}

export function formatCurrentTimeFromTimezone(timezone) {
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

export function generateUniqueId() {
  return crypto.randomUUID();
}

export function extractCityName(address) {
  return address.split(',')[0].trim();
}

export function createModalOverlay() {
  const modalOverlay = document.createElement('div');
  modalOverlay.classList.add('modal-overlay');
  return modalOverlay;
}

export function removeModal(modalOverlay) {
  if (document.body.contains(modalOverlay)) {
    document.body.removeChild(modalOverlay);
  }
}

export function appendModal(modalOverlay) {
  document.body.appendChild(modalOverlay);
}

// LocalStorage management for persistent city data
const STORAGE_KEY = 'weather-app-cities';

export function saveCitiesToLocalStorage(cities) {
  try {
    // Only save essential data, not the full weather data which will be stale
    const cityData = cities.map((city) => ({
      id: city.id,
      address: city.address,
      timezone: city.timezone,
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cityData));
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('Failed to save cities to localStorage:', error);
  }
}

export function loadCitiesFromLocalStorage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('Failed to load cities from localStorage:', error);
  }
  return [];
}

export function clearCitiesFromLocalStorage() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('Failed to clear cities from localStorage:', error);
  }
}
