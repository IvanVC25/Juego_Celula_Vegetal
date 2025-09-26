const grid = document.getElementById('grid');
const movesCounter = document.getElementById('moves');
const scoreCounter = document.getElementById('score');
const timerCounter = document.getElementById('timer');
const correctSound = document.getElementById('correct-sound');
const wrongSound = document.getElementById('wrong-sound');
const restartBtn = document.getElementById('restart');
const startScreen = document.getElementById('start-screen');
const topicSelectionScreen = document.getElementById('topic-selection-screen');
const gameContainer = document.getElementById('game-container');
const completionScreen = document.getElementById('completion-screen');
const dataSendingIndicator = document.getElementById('data-sending-indicator');
const startButton = document.getElementById('start-button');
const backButton = document.getElementById('back-button');
const backTopicButton = document.getElementById('back-topic-button');
const playAgainButton = document.getElementById('play-again-button');
const backHomeButton = document.getElementById('back-home-button');
// Los botones de tema se generarán dinámicamente, no necesitamos esta línea:
// const topicButtons = document.querySelectorAll('.topic-btn');

// Función para extraer user_id de la URL
function getUserId() {
  const urlParams = new URLSearchParams(window.location.search);
  const userId = urlParams.get('user_id');
  
  if (userId) {
    console.log('Usuario logueado:', userId);
    // Aquí puedes usar el user_id para:
    // - Guardar progreso del usuario
    // - Personalizar la experiencia
    // - Enviar estadísticas al backend
    return userId;
  } else {
    console.log('Usuario no identificado');
    return null;
  }
}

// Llamar la función cuando cargue el juego
const currentUserId = getUserId();

// Configuración del API
const API_CONFIG = {
  BASE_URL: 'https://puramentebackend.onrender.com/api/gamedata/category/Ciencias',
  FALLBACK_FILE: 'topics.json'
};

let firstCard = null;
let secondCard = null;
let moves = 0;
let lockBoard = false;
let cards = [];
let currentTopicData = null;
let currentSelectedTopic = null;
let gameStartTime = null;
let gameEndTime = null;
let lastMoveTime = null;
let score = 0;
let correctStreak = 0;
let totalPairs = 0;
let correctChallenges = 0;
let timerInterval = null;

// Función para cargar datos desde la API
async function loadGameDataFromAPI() {
  try {
    const response = await fetch(API_CONFIG.BASE_URL);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const apiData = await response.json();
    
    if (apiData.success && apiData.data) {
      // Transformar la estructura de la API al formato que usa el juego
      const gameTopics = {};
      
      apiData.data.forEach(item => {
        // Extraer los datos de cada subcategoría
        Object.keys(item.gamedata).forEach(subject => {
          gameTopics[subject] = item.gamedata[subject];
        });
      });
      
      return gameTopics;
    } else {
      throw new Error('Respuesta de API inválida');
    }
  } catch (error) {
    return null;
  }
}



// Función principal para cargar datos del juego
async function loadGameData() {
  showLoadingMessage('Cargando datos desde API...');
  
  try {
  
    let gameData = await loadGameDataFromAPI();
    
    
    if (gameData && Object.keys(gameData).length > 0) {
      hideLoadingMessage();
      return gameData;
    } else {
      throw new Error('No se pudieron cargar los datos del juego desde la API');
    }
  } catch (error) {
    hideLoadingMessage();
    showErrorMessage('Error al cargar los datos del juego. Por favor, recarga la página.');
    return null;
  }
}

// Funciones para mostrar mensajes de carga y error
function showLoadingMessage(message) {
  const indicator = document.getElementById('data-sending-indicator');
  const loadingText = indicator.querySelector('.loading-text');
  
  if (indicator && loadingText) {
    loadingText.textContent = message;
    indicator.style.display = 'flex';
  }
}

function hideLoadingMessage() {
  const indicator = document.getElementById('data-sending-indicator');
  if (indicator) {
    indicator.style.display = 'none';
  }
}

function showErrorMessage(message) {
  alert(message);
}

// Inicializar datos del juego al cargar la página
document.addEventListener('DOMContentLoaded', async () => {
  currentTopicData = await loadGameData();
  
  if (currentTopicData) {
    // Generar botones dinámicamente basándose en los datos de la API
    generateTopicButtons(currentTopicData);
  }
});

// Función para generar botones de tema dinámicamente
function generateTopicButtons(topicsData) {
  const topicButtonsContainer = document.querySelector('.topic-buttons');
  
  if (!topicButtonsContainer) {
    return;
  }
  
  // Limpiar botones existentes
  const existingButtons = topicButtonsContainer.querySelectorAll('.topic-btn');
  existingButtons.forEach(btn => btn.remove());
  
  // Generar botones dinámicamente
  Object.keys(topicsData).forEach(topicKey => {
    const button = document.createElement('button');
    button.classList.add('topic-btn');
    button.dataset.topic = topicKey;
    button.textContent = getTopicDisplayName(topicKey);
    
    // Agregar event listener
    button.addEventListener('click', () => {
      const selectedTopic = button.dataset.topic;
      currentSelectedTopic = selectedTopic;
      
      if (!currentTopicData[selectedTopic]) {
        alert(`No se encontraron datos para el tema: ${selectedTopic}`);
        return;
      }
      
      topicSelectionScreen.style.display = 'none';
      gameContainer.style.display = 'flex';
      initGame(currentTopicData[selectedTopic]);
    });
    
    // Agregar botón al contenedor
    topicButtonsContainer.appendChild(button);
  });
}

// Navegación entre pantallas
startButton.addEventListener('click', () => {
  startScreen.style.display = 'none';
  topicSelectionScreen.style.display = 'flex';
});

// Botón regresar desde selección de tema al inicio
backTopicButton.addEventListener('click', () => {
  topicSelectionScreen.style.display = 'none';
  startScreen.style.display = 'flex';
});

// Botones de la pantalla de finalización
playAgainButton.addEventListener('click', () => {
  stopTimer();
  hideDataSendingIndicator();
  completionScreen.style.display = 'none';
  topicSelectionScreen.style.display = 'flex';
});

backHomeButton.addEventListener('click', () => {
  stopTimer();
  hideDataSendingIndicator();
  completionScreen.style.display = 'none';
  startScreen.style.display = 'flex';
});

backButton.addEventListener('click', () => {
  gameContainer.style.display = 'none';
  startScreen.style.display = 'flex';
  
  // Detener cronómetro y limpiar
  stopTimer();
  
  // Reiniciar el juego cuando se vuelve al inicio
  grid.innerHTML = '';
  moves = 0;
  score = 0;
  movesCounter.textContent = moves;
  scoreCounter.textContent = score;
  timerCounter.textContent = '0:00';
  
  // Resetear variables del juego pero mantener los datos de temas
  firstCard = null;
  secondCard = null;
  lockBoard = false;
  cards = [];
  currentSelectedTopic = null;
  gameStartTime = null;
  gameEndTime = null;
  lastMoveTime = null;
  correctStreak = 0;
  totalPairs = 0;
  correctChallenges = 0;
});

function initGame(topicPairs) {
  grid.innerHTML = '';
  moves = 0;
  score = 0;
  correctStreak = 0;
  correctChallenges = 0;
  totalPairs = topicPairs.length;
  movesCounter.textContent = moves;
  scoreCounter.textContent = score;
  timerCounter.textContent = '0:00';
  gameStartTime = null; // No iniciamos el tiempo aún
  lastMoveTime = null;
  
  // NO iniciar cronómetro aquí - se iniciará al voltear primera carta
  cards = [];
  topicPairs.forEach((pair, index) => {
    cards.push({ id: index, text: pair.term });
    cards.push({ id: index, text: pair.definition });
  });
  cards.sort(() => Math.random() - 0.5);
  cards.forEach(card => {
    const cardElement = document.createElement('div');
    cardElement.classList.add('card');
    cardElement.dataset.id = card.id;
    cardElement.innerHTML = `
      <div class="card-inner">
        <div class="card-front"></div>
        <div class="card-back">${card.text}</div>
      </div>
    `;
    cardElement.addEventListener('click', flipCard);
    grid.appendChild(cardElement);
  });
}

function flipCard() {
  if (lockBoard) return;
  if (this === firstCard) return;
  
  // Iniciar cronómetro en la primera carta volteada
  if (!gameStartTime) {
    gameStartTime = new Date();
    lastMoveTime = new Date();
    startTimer();
  }
  
  this.classList.add('flipped');
  if (!firstCard) {
    firstCard = this;
    return;
  }
  secondCard = this;
  moves++;
  movesCounter.textContent = moves;
  checkMatch();
}

function checkMatch() {
  const isMatch = firstCard.dataset.id === secondCard.dataset.id;
  const currentTime = new Date();
  
  // Calcular tiempo desde último movimiento (solo si lastMoveTime existe)
  let timeSinceLastMove = 999; // valor alto por defecto para no dar bonus
  if (lastMoveTime) {
    timeSinceLastMove = (currentTime - lastMoveTime) / 1000; // en segundos
  }
  
  if (isMatch) {
    // Contar reto correcto
    correctChallenges++;
    
    // Puntos base por pareja correcta
    let points = 10;
    
    // Bonus por rapidez (menos de 3 segundos)
    if (timeSinceLastMove < 3) {
      points += 2;
    }
    
    // Incrementar racha
    correctStreak++;
    
    // Bonus por racha (cada 2 parejas seguidas)
    if (correctStreak % 2 === 0) {
      points += 5;
    }
    
    score += points;
    scoreCounter.textContent = score;
    
    firstCard.classList.add('correct');
    secondCard.classList.add('correct');
    correctSound.play().catch(() => console.log('Audio no disponible'));
    resetBoard();
    checkWin();
  } else {
    // Resetear racha en error
    correctStreak = 0;
    
    firstCard.classList.add('wrong');
    secondCard.classList.add('wrong');
    wrongSound.play().catch(() => console.log('Audio no disponible'));
    lockBoard = true;
    setTimeout(() => {
      firstCard.classList.remove('flipped', 'wrong');
      secondCard.classList.remove('flipped', 'wrong');
      resetBoard();
    }, 1000);
  }
  
  // Actualizar tiempo del último movimiento
  lastMoveTime = currentTime;
}

function resetBoard() {
  [firstCard, secondCard, lockBoard] = [null, null, false];
}

function checkWin() {
  const allCards = document.querySelectorAll('.card');
  const correctCards = document.querySelectorAll('.card.correct');
  
  if (correctCards.length === allCards.length) {
    gameEndTime = new Date();
    
    // Detener cronómetro
    stopTimer();
    
    // Calcular bonus de finalización y eficiencia
    calculateFinalBonus();
    
    setTimeout(() => {
      showCompletionScreen();
    }, 800);
  }
}

function calculateFinalBonus() {
  // Bonus por finalización
  score += 20;
  
  // Bonus por eficiencia - cálculo más realista
  // Movimientos mínimos realistas: (totalPairs * 2) + movimientos de exploración
  const realisticMinMoves = (totalPairs * 2) + 2; // 2 movimientos de exploración
  const allowedExtraMoves = 3; // permitir algunos errores
  
  if (moves <= realisticMinMoves + allowedExtraMoves) {
    score += 15;
  }
  
  scoreCounter.textContent = score;
}

function showCompletionScreen() {
  // Calcular tiempo transcurrido (solo si el juego realmente empezó)
  let timeDiff = 0;
  let timeString = '0:00';
  
  if (gameStartTime && gameEndTime) {
    timeDiff = gameEndTime - gameStartTime;
    const minutes = Math.floor(timeDiff / 60000);
    const seconds = Math.floor((timeDiff % 60000) / 1000);
    timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
  
  // Calcular puntuación normalizada (0-100)
  const maxPossibleScore = calculateMaxPossibleScore();
  const normalizedScore = Math.round((score / maxPossibleScore) * 100);
  
  // Actualizar estadísticas en la pantalla de finalización
  document.getElementById('final-score').textContent = `${score} pts (${normalizedScore}%)`;
  document.getElementById('final-moves').textContent = moves;
  document.getElementById('final-time').textContent = timeString;
  document.getElementById('final-topic').textContent = getTopicDisplayName(currentSelectedTopic);
  
  // Mostrar pantalla de finalización
  gameContainer.style.display = 'none';
  completionScreen.style.display = 'flex';
  
  // Enviar datos a la base de datos
  sendGameDataToDatabase();
}

function calculateMaxPossibleScore() {
  // Puntuación máxima REALISTA posible:
  // Consideramos que un jugador perfecto necesita explorar primero y luego emparejar
  
  // Escenario realista perfecto:
  // - Primeros movimientos: exploración (sin puntos de rapidez)
  // - Movimientos posteriores: emparejamiento perfecto con rapidez
  
  const basePairPoints = totalPairs * 10; // 10 puntos base por pareja
  
  // Bonus de rapidez: solo para las parejas encontradas después de explorar
  // Asumimos que puede obtener rapidez en todas las parejas después del 3er movimiento
  const speedBonus = totalPairs * 2;
  
  // Bonus de racha: todas las parejas pueden ser en racha después de explorar
  const streakBonus = Math.floor(totalPairs / 2) * 5;
  
  // Bonus de eficiencia: movimientos mínimos realistas
  // Mínimo teórico: totalPairs * 2 movimientos + algunos movimientos de exploración
  // Un jugador perfecto necesitaría aproximadamente (totalPairs * 2) + 2 movimientos
  const efficiencyBonus = 15;
  
  // Bonus de finalización: siempre posible
  const completionBonus = 20;
  
  return basePairPoints + speedBonus + streakBonus + efficiencyBonus + completionBonus;
}

function getTopicDisplayName(topicKey) {
  const topicNames = {
    'Biologia': 'Biología',
    'Quimica': 'Química',
    'Fisica': 'Física'
  };
  return topicNames[topicKey] || topicKey;
}

// Funciones del cronómetro
function startTimer() {
  // Limpiar cualquier cronómetro anterior
  if (timerInterval) {
    clearInterval(timerInterval);
  }
  
  // Iniciar nuevo cronómetro
  timerInterval = setInterval(updateTimer, 1000);
}

function updateTimer() {
  if (!gameStartTime) return;
  
  const currentTime = new Date();
  const timeDiff = currentTime - gameStartTime;
  const minutes = Math.floor(timeDiff / 60000);
  const seconds = Math.floor((timeDiff % 60000) / 1000);
  const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  
  timerCounter.textContent = timeString;
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

// Funciones para el indicador de envío de datos
function showDataSendingIndicator() {
  dataSendingIndicator.style.display = 'flex';
}

function hideDataSendingIndicator() {
  dataSendingIndicator.style.display = 'none';
}

function updateLoadingText(text) {
  const loadingText = dataSendingIndicator.querySelector('.loading-text');
  if (loadingText) {
    loadingText.textContent = text;
  }
}

function sendGameDataToDatabase() {
  // Calcular tiempo total en segundos (solo si el juego realmente empezó)
  let timeInSeconds = 0;
  
  if (gameStartTime && gameEndTime) {
    const timeDiff = gameEndTime - gameStartTime;
    timeInSeconds = Math.floor(timeDiff / 1000);
  }
  
  // Calcular puntuación máxima posible (total_challenges)
  const maxPossibleScore = calculateMaxPossibleScore();
  
  // Preparar datos exactos para la base de datos
  const gameData = {
    user_id: currentUserId, // user_id dinámico desde la URL
    game_id: 3, // ID estático por ahora
    correct_challenges: score, // Puntuación real obtenida por el usuario
    total_challenges: maxPossibleScore, // Puntuación máxima posible
    time_spent: timeInSeconds // Tiempo total en segundos
  };
  
  // Mostrar indicador de carga
  showDataSendingIndicator();
  
  // Enviar datos a la API
  fetch(`https://puramentebackend.onrender.com/api/game-attempts/from-game`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(gameData)
  })
  .then(response => response.json())
  .then(data => {
    // Mostrar mensaje de éxito temporalmente
    updateLoadingText('¡Datos enviados correctamente!');
    setTimeout(() => {
      hideDataSendingIndicator();
    }, 2000); // Ocultar después de 2 segundos
  })
  .catch(error => {
    // Mostrar mensaje de error temporalmente
    updateLoadingText('Error al enviar datos');
    setTimeout(() => {
      hideDataSendingIndicator();
    }, 3000); // Ocultar después de 3 segundos
  });
  
  return gameData; // Retorna los datos para que puedas usarlos si necesitas
}

restartBtn.addEventListener('click', () => {
  if (!currentTopicData || !currentSelectedTopic) {
    alert("No hay tema seleccionado para reiniciar.");
    return;
  }
  initGame(currentTopicData[currentSelectedTopic]);
});