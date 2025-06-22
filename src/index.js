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

    if (response.status === 200) {
      console.log('Success', data);
    } else {
      console.log('Server error', data.error.message);
    }
    // console.log(data);
    console.log(data.currentConditions.temp);
  } catch (error) {
    console.log('Fetch error:', error);
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

updateUnitsBtn();
getData();
