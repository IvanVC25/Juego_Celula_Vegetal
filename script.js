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
const topicButtons = document.querySelectorAll('.topic-btn');

// Configuración del API
// Para desarrollo local: 'http://localhost:3000'
// Para producción: 'https://puramentebackend.onrender.com'
const API_BASE_URL = 'https://puramentebackend.onrender.com';

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

// Manejo de selección de tema
topicButtons.forEach(button => {
  button.addEventListener('click', () => {
    const selectedTopic = button.dataset.topic;
    currentSelectedTopic = selectedTopic;
    topicSelectionScreen.style.display = 'none';
    gameContainer.style.display = 'flex';
    
    // Cargar datos del tema seleccionado
    if (currentTopicData && currentTopicData[selectedTopic]) {
      initGame(currentTopicData[selectedTopic]);
    }
  });
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
  movesCounter.textContent = moves;
  currentTopicData = null;
});

fetch('topics.json')
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    // Almacenar los datos para usar en la selección de tema
    currentTopicData = data;
  })
  .catch(err => {
    console.error("Error cargando JSON: ", err);
    alert("Error al cargar los datos del juego. Verifica que el archivo topics.json existe.");
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
    user_id: 2, // ID estático por ahora
    game_id: 1, // ID estático por ahora
    correct_challenges: score, // Puntuación real obtenida por el usuario
    total_challenges: maxPossibleScore, // Puntuación máxima posible
    time_spent: timeInSeconds // Tiempo total en segundos
  };
  
  console.log('Datos del juego para enviar a la base de datos:', gameData);
  
  // Mostrar indicador de carga
  showDataSendingIndicator();
  
  // Enviar datos a la API
  fetch(`${API_BASE_URL}/game-attempts/from-game`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(gameData)
  })
  .then(response => response.json())
  .then(data => {
    console.log('Datos enviados exitosamente:', data);
    // Mostrar mensaje de éxito temporalmente
    updateLoadingText('¡Datos enviados correctamente!');
    setTimeout(() => {
      hideDataSendingIndicator();
    }, 2000); // Ocultar después de 2 segundos
  })
  .catch(error => {
    console.error('Error enviando datos:', error);
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

