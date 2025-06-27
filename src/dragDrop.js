import { saveCitiesToLocalStorage, reorderDisplayedCities } from './utils';

let draggedElement = null;

function updateCitiesOrder() {
  const container = document.getElementById('city-cards-container');
  const orderedCards = Array.from(container.querySelectorAll('.city-card'));

  // eslint-disable-next-line import/no-cycle
  import('./render').then(({ getDisplayedCities }) => {
    const displayedCities = getDisplayedCities();

    const newOrder = orderedCards
      .map((card) => {
        const { cityId } = card.dataset;
        return displayedCities.find((city) => city.id === cityId);
      })
      .filter(Boolean);

    reorderDisplayedCities(displayedCities, newOrder);

    saveCitiesToLocalStorage(newOrder);
  });
}

function handleDragStart(e) {
  draggedElement = e.currentTarget;
  draggedElement.classList.add('dragging');

  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/html', draggedElement.outerHTML);
  e.dataTransfer.setData('text/plain', draggedElement.dataset.cityId);
}

function handleDragEnd(e) {
  e.currentTarget.classList.remove('dragging');

  document.querySelectorAll('.city-card').forEach((card) => {
    card.classList.remove('drag-over', 'drag-adjacent');
  });

  draggedElement = null;
}

function handleCardDragOver(e) {
  e.preventDefault();

  if (!draggedElement || e.currentTarget === draggedElement) return;

  const container = document.getElementById('city-cards-container');
  const afterElement = e.currentTarget;
  const rect = afterElement.getBoundingClientRect();

  const mouseY = e.clientY;
  const cardMiddle = rect.top + rect.height / 2;

  if (mouseY < cardMiddle) {
    container.insertBefore(draggedElement, afterElement);
  } else {
    const nextSibling = afterElement.nextElementSibling;
    if (nextSibling) {
      container.insertBefore(draggedElement, nextSibling);
    } else {
      container.appendChild(draggedElement);
    }
  }
}

function handleContainerDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
}

function handleDrop(e) {
  e.preventDefault();

  if (!draggedElement) return;

  updateCitiesOrder();
}

export function enableDragAndDropForCard(cardElement) {
  if (!cardElement || cardElement.hasAttribute('draggable')) return;

  cardElement.setAttribute('draggable', 'true');
  cardElement.addEventListener('dragstart', handleDragStart);
  cardElement.addEventListener('dragend', handleDragEnd);
  cardElement.addEventListener('dragover', handleCardDragOver);
}

export function enableDragAndDropForAllCards() {
  const cityCards = document.querySelectorAll('.city-card');
  cityCards.forEach(enableDragAndDropForCard);
}

export function initializeDragAndDrop() {
  const container = document.getElementById('city-cards-container');
  if (!container) return;

  enableDragAndDropForAllCards();

  container.addEventListener('dragover', handleContainerDragOver);
  container.addEventListener('drop', handleDrop);
}

export function cleanupDragAndDrop() {
  const cityCards = document.querySelectorAll('.city-card');
  cityCards.forEach((card) => {
    card.removeAttribute('draggable');
    card.classList.remove('dragging', 'drag-over', 'drag-adjacent');
    card.removeEventListener('dragstart', handleDragStart);
    card.removeEventListener('dragend', handleDragEnd);
    card.removeEventListener('dragover', handleCardDragOver);
  });

  const container = document.getElementById('city-cards-container');
  if (container) {
    container.removeEventListener('dragover', handleContainerDragOver);
    container.removeEventListener('drop', handleDrop);
  }

  draggedElement = null;
}
