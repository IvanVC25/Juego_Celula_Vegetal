const grid = document.getElementById('grid');
const movesCounter = document.getElementById('moves');
const scoreCounter = document.getElementById('score');
const timerCounter = document.getElementById('timer');
const correctSound = document.getElementById('correct-sound');
const wrongSound = document.getElementById('wrong-sound');
const winningSound = document.getElementById('winning-sound');
const backgroundMusic = document.getElementById('background-music');
const audioControlBtn = document.getElementById('audio-control-btn');
const volumeSlider = document.getElementById('volume-slider');
const toggleInstructionsBtn = document.getElementById('toggle-instructions-btn');
const gameContentLeft = document.getElementById('game-content-left');
const gameContentRight = document.getElementById('game-content-right');
const instructionsContent = document.getElementById('instructions-content');
const restartBtn = document.getElementById('restart');
const startScreen = document.getElementById('start-screen');
const topicSelectionScreen = document.getElementById('topic-selection-screen');
const gameContainer = document.getElementById('game-container');
const completionScreen = document.getElementById('completion-screen');
const dataSendingIndicator = document.getElementById('data-sending-indicator');
const bestRecordElement = document.getElementById('best-record');
const startButton = document.getElementById('start-button');
const backButton = document.getElementById('back-button');
const backTopicButton = document.getElementById('back-topic-button');
const playAgainButton = document.getElementById('play-again-button');
const backHomeButton = document.getElementById('back-home-button');
// Los botones de tema se generarán dinámicamente, no necesitamos esta línea:
// const topicButtons = document.querySelectorAll('.topic-btn');

// Control de instrucciones
let instructionsVisible = true;

// Control de audio global
let audioEnabled = true;
let masterVolume = 0.7; // Volumen maestro inicial (70%)
let previousVolume = 0.7; // Para recordar el volumen antes de mutear

// Configurar volumen inicial de los audios
function updateAllVolumes() {
  const bgVol = audioEnabled ? masterVolume * 0.4 : 0; // Música de fondo más suave
  const effectVol = audioEnabled ? masterVolume : 0;
  
  backgroundMusic.volume = Math.min(bgVol, 1.0);
  correctSound.volume = Math.min(effectVol, 1.0);
  wrongSound.volume = Math.min(effectVol, 1.0);
  winningSound.volume = Math.min(effectVol * 1.1, 1.0); // Limitado a 1.0 máximo
}

// Función para alternar el audio (mute/unmute)
function toggleAudio() {
  const audioIcon = document.querySelector('.audio-icon');
  
  if (audioEnabled) {
    // Si está habilitado, deshabilitar (mute)
    audioEnabled = false;
    previousVolume = masterVolume; // Guardar volumen actual
    masterVolume = 0;
    volumeSlider.value = 0; // Mover slider a 0
    audioControlBtn.classList.add('muted');
    audioIcon.textContent = '🔇';
    backgroundMusic.pause();
  } else {
    // Si está deshabilitado, habilitar (unmute)
    audioEnabled = true;
    // Si previousVolume no está definido o es 0, usar un valor por defecto
    if (!previousVolume || previousVolume === 0) {
      previousVolume = 0.7;
    }
    masterVolume = previousVolume; // Restaurar volumen anterior
    volumeSlider.value = Math.round(previousVolume * 100); // Restaurar slider
    audioControlBtn.classList.remove('muted');
    
    // Restaurar el ícono según el volumen restaurado
    if (previousVolume > 0.66) {
      audioIcon.textContent = '🔊';
    } else if (previousVolume > 0.33) {
      audioIcon.textContent = '🔉';
    } else if (previousVolume > 0) {
      audioIcon.textContent = '�';
    } else {
      audioIcon.textContent = '🔇';
    }
    
    // Solo reproducir música si el volumen restaurado no es 0
    if (masterVolume > 0) {
      backgroundMusic.play().catch(() => {
        console.debug('Audio requiere interacción del usuario');
      });
    }
  }
  
  updateAllVolumes();
}

// Función para actualizar el volumen desde el slider
function updateVolumeFromSlider() {
  const sliderValue = parseInt(volumeSlider.value);
  masterVolume = sliderValue / 100;
  const audioIcon = document.querySelector('.audio-icon');
  
  // Actualizar estado del audio basado en el volumen
  if (sliderValue === 0) {
    audioEnabled = false;
    audioIcon.textContent = '🔇';
    audioControlBtn.classList.add('muted');
    backgroundMusic.pause();
  } else {
    if (!audioEnabled) {
      audioEnabled = true;
      backgroundMusic.play().catch(() => {
        console.debug('Audio requiere interacción del usuario');
      });
    }
    audioControlBtn.classList.remove('muted');
    
    // Cambiar icono según el nivel de volumen
    if (sliderValue > 66) {
      audioIcon.textContent = '🔊';
    } else if (sliderValue > 33) {
      audioIcon.textContent = '🔉';
    } else {
      audioIcon.textContent = '🔈';
    }
  }
  
  updateAllVolumes();
}

// Función para reproducir efectos de sonido
function playSoundEffect(sound) {
  if (audioEnabled) {
    sound.play().catch(() => console.log('Audio no disponible'));
  }
}

// Event listener para el botón de control de audio
audioControlBtn.addEventListener('click', toggleAudio);

// Event listener para el slider de volumen
volumeSlider.addEventListener('input', updateVolumeFromSlider);

// Event listener para prevenir que el slider se oculte al hacer clic
volumeSlider.addEventListener('mousedown', (e) => {
  e.stopPropagation();
});

volumeSlider.addEventListener('click', (e) => {
  e.stopPropagation();
});

// Función para alternar la visibilidad de las instrucciones
function toggleInstructions() {
  instructionsVisible = !instructionsVisible;
  
  if (instructionsVisible) {
    // Mostrar instrucciones
    gameContentLeft.classList.remove('collapsed');
    gameContentRight.classList.remove('expanded');
    instructionsContent.classList.remove('hidden');
    toggleInstructionsBtn.classList.remove('collapsed');
    console.log('Instrucciones mostradas');
  } else {
    // Ocultar instrucciones
    gameContentLeft.classList.add('collapsed');
    gameContentRight.classList.add('expanded');
    instructionsContent.classList.add('hidden');
    toggleInstructionsBtn.classList.add('collapsed');
    console.log('Instrucciones ocultas');
  }
}

// Event listener para el botón de toggle de instrucciones
toggleInstructionsBtn.addEventListener('click', toggleInstructions);

// Iniciar música de fondo cuando se cargue la página
document.addEventListener('DOMContentLoaded', () => {
  // Inicializar volúmenes
  updateAllVolumes();
  
  if (audioEnabled && masterVolume > 0) {
    backgroundMusic.play().catch(() => {
      // Silenciar error si el usuario no ha interactuado aún
      console.debug('Audio requiere interacción del usuario para reproducirse');
    });
  }
  
  // Cargar y mostrar el mejor récord al iniciar
  loadAndDisplayBestRecord();
});

// Funciones para manejar el récord
function getBestRecord() {
  const savedRecord = localStorage.getItem('bestRecord');
  return savedRecord ? parseInt(savedRecord) : null;
}

function saveBestRecord(moves) {
  const currentBest = getBestRecord();
  if (currentBest === null || moves < currentBest) {
    localStorage.setItem('bestRecord', moves.toString());
    return true; // Nuevo récord
  }
  return false; // No es un nuevo récord
}

function loadAndDisplayBestRecord() {
  const bestRecord = getBestRecord();
  if (bestRecord !== null) {
    bestRecordElement.textContent = `${bestRecord} Movimientos`;
  } else {
    bestRecordElement.textContent = 'Sin récord';
  }
}

function updateRecordIfNeeded(moves) {
  const isNewRecord = saveBestRecord(moves);
  loadAndDisplayBestRecord(); // Actualizar la pantalla de inicio
  return isNewRecord;
}



// ========================================
// CONFIGURACIÓN DEL JUEGO
// ========================================
// ⚙️ IMPORTANTE: Configura este valor según el juego actual



const GAME_CONFIG = {
  GAME_ID: 4,  // 🔧 CAMBIA ESTE NÚMERO según el juego:
  API_BASE_URL:'https://puramentebackend.onrender.com' // Backend producción
};



// Variables globales para parámetros de URL
let currentUserId = null;
let sessionToken = '';
let subject = 'Ciencias';

// Función para obtener y validar parámetros de la URL
function getURLParameters() {
 
  
  const urlParams = new URLSearchParams(window.location.search);
  
  
  currentUserId = urlParams.get('user_id') || null;
  sessionToken = urlParams.get('session') || '';
  subject = urlParams.get('subject') || 'Ciencias';
  
  
  
  // Advertencias de parámetros faltantes
  if (!sessionToken) {
    console.warn('⚠️ ADVERTENCIA: Parámetro "session" no encontrado en la URL');
    console.warn('   El juego funcionará pero no se podrá rastrear la sesión');
  }
  
  if (!subject) {
    console.warn('⚠️ ADVERTENCIA: Parámetro "subject" no encontrado. Usando valor por defecto: "Ciencias"');
  }
  
  if (!currentUserId) {
    console.warn('⚠️ ADVERTENCIA: Parámetro "user_id" no encontrado');
    console.warn('   El juego funcionará en modo invitado (sin guardar progreso)');
  }
  
  return {
    userId: currentUserId,
    session: sessionToken,
    subject: subject
  };
}

// Capturar parámetros al cargar
getURLParameters();

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


// ========================================
// Función para cargar datos desde la API
// ========================================
async function loadGameDataFromAPI() {
  try {
    // Validar que tenemos los parámetros necesarios
    if (!subject) {
      throw new Error('Falta el parámetro requerido: subject en la URL');
    }

    // Construir la URL de la API correctamente
    // Formato: /api/game/{game_id}/category/{category}?session={token}
    let apiUrl = `${GAME_CONFIG.API_BASE_URL}/api/gamedata/game/${GAME_CONFIG.GAME_ID}/category/${encodeURIComponent(subject)}`;
    
    // Agregar el parámetro session si está disponible
    if (sessionToken) {
      apiUrl += `?session=${sessionToken}`;
    }

    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const apiData = await response.json();

    if (apiData.success && apiData.data) {
      const gameTopics = {};

      apiData.data.forEach(item => {
        if (Array.isArray(item.gamedata)) {
          item.gamedata.forEach(gameDataItem => {
            if (gameDataItem.title && gameDataItem.subcategoria) {
              const topicKey = gameDataItem.title;
              gameTopics[topicKey] = gameDataItem.subcategoria;
            } else {
              Object.keys(gameDataItem).forEach(key => {
                if (Array.isArray(gameDataItem[key]) && gameDataItem[key].length > 0) {
                  gameTopics[key] = gameDataItem[key];
                }
              });
            }
          });
        } else {
          Object.keys(item.gamedata).forEach(subcategory => {
            gameTopics[subcategory] = item.gamedata[subcategory];
          });
        }
      });

      return gameTopics;
    } else {
      throw new Error('Respuesta de API inválida: ' + JSON.stringify(apiData));
    }
  } catch (error) {
    alert(`Error al cargar los datos del juego:\n${error.message}\n\nPor favor, verifica la consola para más detalles.`);
    return null;
  }
}



// Función principal para cargar datos del juego
async function loadGameData() {
  showLoadingMessage('Cargando...');
  
  try {
  
    let gameData = await loadGameDataFromAPI();
    
    
    if (gameData && Object.keys(gameData).length > 0) {
      hideLoadingMessage();
      return gameData;
    } else {
      throw new Error('No se pudieron cargar los datos del juego');
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
  Object.keys(topicsData).forEach((topicKey, index) => {
    // Validar que topicKey no esté vacío
    if (!topicKey || topicKey.trim() === '') {
      console.warn('⚠️ Se encontró una clave de tema vacía, omitiendo...');
      return;
    }
    
    const button = document.createElement('button');
    button.classList.add('topic-btn');
    button.dataset.topic = topicKey;
    button.setAttribute('data-index', index); // Agregar índice único para evitar duplicados
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
      
      // Asegurar que la música de fondo esté reproduciéndose
      if (audioEnabled && masterVolume > 0) {
        backgroundMusic.play().catch(() => {
          console.debug('No se pudo reproducir la música de fondo');
        });
      }
    });
    
    // Agregar botón al contenedor
    topicButtonsContainer.appendChild(button);
  });
}

// Navegación entre pantallas
startButton.addEventListener('click', () => {
  startScreen.style.display = 'none';
  topicSelectionScreen.style.display = 'flex';
  
  // Iniciar música de fondo con la primera interacción del usuario
  if (audioEnabled && masterVolume > 0) {
    backgroundMusic.play().catch(() => {
      console.debug('No se pudo reproducir la música de fondo');
    });
  }
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
  
  // Asegurar que la música de fondo esté reproduciéndose
  if (audioEnabled && masterVolume > 0) {
    backgroundMusic.play().catch(() => {
      console.debug('No se pudo reproducir la música de fondo');
    });
  }
});

backHomeButton.addEventListener('click', () => {
  stopTimer();
  hideDataSendingIndicator();
  completionScreen.style.display = 'none';
  startScreen.style.display = 'flex';
  
  // Actualizar récord en pantalla de inicio
  loadAndDisplayBestRecord();
});

backButton.addEventListener('click', () => {
  gameContainer.style.display = 'none';
  startScreen.style.display = 'flex';
  
  // Detener cronómetro y limpiar
  stopTimer();
  
  // Actualizar récord en pantalla de inicio
  loadAndDisplayBestRecord();
  
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
  
  // Resetear estado de las instrucciones al iniciar el juego
  instructionsVisible = true;
  gameContentLeft.classList.remove('collapsed');
  gameContentRight.classList.remove('expanded');
  instructionsContent.classList.remove('hidden');
  toggleInstructionsBtn.classList.remove('collapsed');
  
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
  // Ajustar legibilidad tras montar todas las cartas
  adaptCardTextLegibility();
}

// Ajusta dinámicamente tamaños de texto y comportamiento de overflow en las cartas
function adaptCardTextLegibility() {
  const backs = grid.querySelectorAll('.card-back');
  backs.forEach(back => {
    const len = back.textContent.trim().length;

    if (len > 85) {
      back.classList.add('text-xs');
    } else if (len > 55) {
      back.classList.add('text-sm');
    }

    // Medir overflow real después del render
    requestAnimationFrame(() => {
      if (back.scrollHeight > back.clientHeight) {
        // Intentar reducir un paso si aún no está en el mínimo
        if (!back.classList.contains('text-xs')) {
          back.classList.remove('text-sm');
          back.classList.add('text-xs');
        }
        // Si todavía hay overflow, activar scroll interno
        if (back.scrollHeight > back.clientHeight) {
          back.classList.add('overflowing');
        }
      }
    });
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
    playSoundEffect(correctSound);
    resetBoard();
    checkWin();
  } else {
    // Resetear racha en error
    correctStreak = 0;
    
    firstCard.classList.add('wrong');
    secondCard.classList.add('wrong');
    playSoundEffect(wrongSound);
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
    
    // Reproducir sonido de victoria
    playSoundEffect(winningSound);
    
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
  
  // Verificar y actualizar récord de movimientos
  const isNewRecord = updateRecordIfNeeded(moves);
  if (isNewRecord) {
    console.log(`¡Nuevo récord! ${moves} movimientos`);
    // Aquí podrías agregar una animación o notificación especial para el nuevo récord
  }
  
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
  // Si no hay user_id (usuario anónimo) evitamos envío para prevenir errores en backend
  if (!currentUserId) {
    console.log('[GameData] user_id no presente en la URL. Se omite el envío de datos.');
    return null; // No enviamos nada
  }

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
    game_id: 4, // ID estático por ahora
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
  
  // Asegurar que la música de fondo esté reproduciéndose
  if (audioEnabled && masterVolume > 0) {
    backgroundMusic.play().catch(() => {
      console.debug('No se pudo reproducir la música de fondo');
    });
  }
});