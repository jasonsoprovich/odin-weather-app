/**
 * Drag and Drop functionality for city cards
 * Allows users to reorder city cards by dragging and dropping them
 */

import { saveCitiesToLocalStorage, reorderDisplayedCities } from './utils';

let draggedElement = null;
let placeholder = null;

/**
 * Create a placeholder element for drop positioning
 */
function createPlaceholder() {
  placeholder = document.createElement('div');
  placeholder.className = 'drag-placeholder';
  placeholder.style.display = 'flex';
}

/**
 * Remove the placeholder element
 */
function removePlaceholder() {
  if (placeholder && placeholder.parentNode) {
    placeholder.parentNode.removeChild(placeholder);
  }
  placeholder = null;
}

/**
 * Handle drag start event
 * @param {DragEvent} e - The drag event
 */
function handleDragStart(e) {
  draggedElement = e.currentTarget;
  draggedElement.classList.add('dragging');

  // Set drag data
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/html', draggedElement.outerHTML);
  e.dataTransfer.setData('text/plain', draggedElement.dataset.cityId);

  // Create placeholder
  createPlaceholder();
}

/**
 * Handle drag end event
 * @param {DragEvent} e - The drag event
 */
function handleDragEnd(e) {
  e.currentTarget.classList.remove('dragging');

  // Clean up placeholder
  removePlaceholder();

  // Remove drag-over classes from all cards
  document.querySelectorAll('.city-card').forEach((card) => {
    card.classList.remove('drag-over');
  });

  draggedElement = null;
}

/**
 * Handle drag enter event
 * @param {DragEvent} e - The drag event
 */
function handleDragEnter(e) {
  if (e.currentTarget !== draggedElement) {
    e.currentTarget.classList.add('drag-over');
  }
}

/**
 * Handle drag leave event
 * @param {DragEvent} e - The drag event
 */
function handleDragLeave(e) {
  // Only remove drag-over if we're actually leaving the element
  if (!e.currentTarget.contains(e.relatedTarget)) {
    e.currentTarget.classList.remove('drag-over');
  }
}

/**
 * Get the element after which to insert the dragged item
 * @param {HTMLElement} container - The container element
 * @param {number} y - The y coordinate of the mouse
 * @returns {HTMLElement|null} The element after which to insert
 */
function getDragAfterElement(container, y) {
  const draggableElements = [
    ...container.querySelectorAll('.city-card:not(.dragging)'),
  ];

  return draggableElements.reduce(
    (closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;

      if (offset < 0 && offset > closest.offset) {
        return { offset, element: child };
      }
      return closest;
    },
    { offset: Number.NEGATIVE_INFINITY }
  ).element;
}

/**
 * Update the cities order based on current DOM order
 */
function updateCitiesOrder() {
  const container = document.getElementById('city-cards-container');
  const orderedCards = Array.from(container.querySelectorAll('.city-card'));

  // Import getDisplayedCities dynamically to avoid circular dependency
  // eslint-disable-next-line import/no-cycle
  import('./render').then(({ getDisplayedCities }) => {
    const displayedCities = getDisplayedCities();

    // Create new ordered array based on DOM order
    const newOrder = orderedCards
      .map((card) => {
        const { cityId } = card.dataset;
        return displayedCities.find((city) => city.id === cityId);
      })
      .filter(Boolean); // Remove any undefined entries

    // Update the displayed cities array
    reorderDisplayedCities(displayedCities, newOrder);

    // Save to localStorage
    saveCitiesToLocalStorage(newOrder);
  });
}

/**
 * Handle drag over event
 * @param {DragEvent} e - The drag event
 */
function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';

  if (!draggedElement) return;

  const afterElement = getDragAfterElement(e.currentTarget, e.clientY);

  if (afterElement == null) {
    e.currentTarget.appendChild(placeholder);
  } else {
    e.currentTarget.insertBefore(placeholder, afterElement);
  }
}

/**
 * Handle drop event
 * @param {DragEvent} e - The drag event
 */
function handleDrop(e) {
  e.preventDefault();

  if (!draggedElement || !placeholder) return;

  // Get the new position
  const container = document.getElementById('city-cards-container');
  const cards = Array.from(container.children).filter(
    (child) => child.classList.contains('city-card') && child !== draggedElement
  );

  const placeholderIndex = Array.from(container.children).indexOf(placeholder);
  let newIndex = placeholderIndex;

  // Adjust for placeholder removal
  if (placeholderIndex > 0) {
    const beforePlaceholder = container.children[placeholderIndex - 1];
    if (beforePlaceholder.classList.contains('city-card')) {
      newIndex = cards.indexOf(beforePlaceholder) + 1;
    }
  } else {
    newIndex = 0;
  }

  // Insert the dragged element at the new position
  if (newIndex >= cards.length) {
    container.appendChild(draggedElement);
  } else {
    container.insertBefore(draggedElement, cards[newIndex]);
  }

  // Update the displayed cities array order
  updateCitiesOrder();

  removePlaceholder();
}

/**
 * Enable drag and drop for a specific city card
 * @param {HTMLElement} cardElement - The city card element
 */
export function enableDragAndDropForCard(cardElement) {
  if (!cardElement || cardElement.hasAttribute('draggable')) return;

  cardElement.setAttribute('draggable', 'true');
  cardElement.addEventListener('dragstart', handleDragStart);
  cardElement.addEventListener('dragend', handleDragEnd);
  cardElement.addEventListener('dragenter', handleDragEnter);
  cardElement.addEventListener('dragleave', handleDragLeave);
}

/**
 * Enable drag and drop for all city cards in the container
 */
export function enableDragAndDropForAllCards() {
  const cityCards = document.querySelectorAll('.city-card');
  cityCards.forEach(enableDragAndDropForCard);
}

/**
 * Initialize drag and drop functionality for all city cards
 */
export function initializeDragAndDrop() {
  const container = document.getElementById('city-cards-container');
  if (!container) return;

  // Enable drag and drop for existing cards
  enableDragAndDropForAllCards();

  // Set up container as drop zone
  container.addEventListener('dragover', handleDragOver);
  container.addEventListener('drop', handleDrop);
}

/**
 * Clean up drag and drop event listeners (for cleanup/testing)
 */
export function cleanupDragAndDrop() {
  const cityCards = document.querySelectorAll('.city-card');
  cityCards.forEach((card) => {
    card.removeAttribute('draggable');
    card.classList.remove('dragging', 'drag-over');
  });

  const container = document.getElementById('city-cards-container');
  if (container) {
    container.removeEventListener('dragover', handleDragOver);
    container.removeEventListener('drop', handleDrop);
  }

  removePlaceholder();
  draggedElement = null;
}
