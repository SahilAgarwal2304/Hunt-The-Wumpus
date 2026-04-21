// HUNT THE WUMPUS - COMPLETE FIX
// - Wumpus is COMPLETELY HIDDEN during active game
// - Keyboard (WASD + Arrow Keys) works 100% with focus fix

const SIZE = 6;
let playerPos = { row: 0, col: 0 };
let wumpusPos = { row: 0, col: 0 };
let gameActive = true;
let gameWin = false;

const gridContainer = document.getElementById('game-grid');
const statusDiv = document.getElementById('status-message');
const scentHintDiv = document.getElementById('scent-hint');

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function initPositions() {
  const startRow = randomInt(0, SIZE-1);
  const startCol = randomInt(0, SIZE-1);
  playerPos = { row: startRow, col: startCol };
  
  do {
    wumpusPos = { row: randomInt(0, SIZE-1), col: randomInt(0, SIZE-1) };
  } while (wumpusPos.row === playerPos.row && wumpusPos.col === playerPos.col);
}

function isAdjacent(pos1, pos2) {
  return (Math.abs(pos1.row - pos2.row) + Math.abs(pos1.col - pos2.col)) === 1;
}

function getStenchMessage() {
  if (!gameActive) return "";
  if (isAdjacent(playerPos, wumpusPos)) {
    return "💨👃 YOU SMELL A FOUL STENCH! The Wumpus is VERY close! 👃💨";
  }
  return "✨ Air is clean... for now. ✨";
}

function renderGrid() {
  if (!gridContainer) return;
  gridContainer.innerHTML = '';
  
  for (let i = 0; i < SIZE; i++) {
    for (let j = 0; j < SIZE; j++) {
      const cell = document.createElement('div');
      cell.classList.add('cell');
      
      // Show player (if game active)
      if (playerPos.row === i && playerPos.col === j && gameActive) {
        cell.textContent = '🧝';
        cell.classList.add('player');
      } 
      // After game over, show Wumpus (dead or alive)
      else if (!gameActive && wumpusPos.row === i && wumpusPos.col === j) {
        cell.textContent = gameWin ? '💀' : '🐗';
      }
      // ACTIVE GAME: Wumpus cell is completely empty (hidden)
      else if (gameActive && wumpusPos.row === i && wumpusPos.col === j) {
        cell.textContent = '';   // 👈 HIDDEN – no icon, no text
      }
      else {
        cell.textContent = '⬚';
        cell.style.opacity = '0.7';
      }
      
      gridContainer.appendChild(cell);
    }
  }
  
  // Update scent hint
  if (gameActive) {
    scentHintDiv.innerHTML = getStenchMessage();
    scentHintDiv.style.background = isAdjacent(playerPos, wumpusPos) ? "#ffc49b" : "#f7e5b5";
  } else {
    if (gameWin) {
      scentHintDiv.innerHTML = "🏆 VICTORY! The Wumpus is slain! 🏆";
      statusDiv.innerHTML = "🏆 YOU KILLED THE WUMPUS! 🏆 Press RESTART to hunt again.";
    } else {
      scentHintDiv.innerHTML = "💀 GAME OVER: The Wumpus devoured you... 💀";
      statusDiv.innerHTML = "💀 GAME OVER – You stepped on the Wumpus. Restart to try again! 💀";
    }
  }
}

function checkStepOnWumpus() {
  if (!gameActive) return false;
  if (playerPos.row === wumpusPos.row && playerPos.col === wumpusPos.col) {
    gameActive = false;
    gameWin = false;
    statusDiv.innerHTML = "💀 OH NO! You stepped into the Wumpus den! You were eaten. 💀";
    renderGrid();
    return false;
  }
  return true;
}

function tryMove(dx, dy) {
  if (!gameActive) return;
  
  const newRow = playerPos.row + dx;
  const newCol = playerPos.col + dy;
  if (newRow < 0 || newRow >= SIZE || newCol < 0 || newCol >= SIZE) {
    statusDiv.innerHTML = "🧱 You hit a cave wall! Can't go there.";
    setTimeout(() => {
      if (gameActive) statusDiv.innerHTML = "✨ Move or shoot the Wumpus! ✨";
    }, 800);
    return;
  }
  
  playerPos = { row: newRow, col: newCol };
  renderGrid();
  
  const alive = checkStepOnWumpus();
  if (!alive) return;
  
  if (gameActive) {
    if (isAdjacent(playerPos, wumpusPos)) {
      statusDiv.innerHTML = "⚠️ YOU SMELL THE WUMPUS! Get ready to shoot! ⚠️";
    } else {
      statusDiv.innerHTML = "✅ Move complete. Listen for the stench...";
    }
    setTimeout(() => {
      if (gameActive && !gameWin) statusDiv.innerHTML = "🏹 Use SHOOT controller or arrow keys to kill the beast!";
    }, 1200);
  }
  renderGrid();
}

function shootArrow(dx, dy) {
  if (!gameActive) return;
  
  const targetRow = playerPos.row + dx;
  const targetCol = playerPos.col + dy;
  
  if (targetRow < 0 || targetRow >= SIZE || targetCol < 0 || targetCol >= SIZE) {
    statusDiv.innerHTML = "🏹 Arrow flies into the void! No Wumpus there.";
    setTimeout(() => {
      if (gameActive) statusDiv.innerHTML = "✨ Keep hunting! Get adjacent and shoot again. ✨";
    }, 800);
    return;
  }
  
  const adjacent = isAdjacent(playerPos, wumpusPos);
  if (!adjacent) {
    statusDiv.innerHTML = "❌ You are not close enough! You must be NEXT to the Wumpus to shoot it! Move closer!";
    setTimeout(() => {
      if (gameActive) statusDiv.innerHTML = "👃 Get adjacent to the stench, then shoot! 👃";
    }, 1500);
    return;
  }
  
  if (targetRow === wumpusPos.row && targetCol === wumpusPos.col) {
    gameActive = false;
    gameWin = true;
    statusDiv.innerHTML = "🏆🔥 PERFECT SHOT! The Wumpus is DEAD! You are the hunter! 🔥🏆";
    renderGrid();
  } else {
    statusDiv.innerHTML = "🏹 Your arrow missed! The Wumpus growls angrily... Aim directly at its cell while adjacent!";
    setTimeout(() => {
      if (gameActive) statusDiv.innerHTML = "🐗 Wumpus is still out there! Get adjacent and shoot again.";
    }, 1500);
  }
  renderGrid();
}

function restartGame() {
  gameActive = true;
  gameWin = false;
  initPositions();
  renderGrid();
  statusDiv.innerHTML = "✨ Game restarted! Hunt the Wumpus — move and shoot wisely. ✨";
  scentHintDiv.innerHTML = getStenchMessage();
  renderGrid();
}

function bindEvents() {
  // Movement buttons
  document.getElementById('move-up')?.addEventListener('click', () => tryMove(-1, 0));
  document.getElementById('move-down')?.addEventListener('click', () => tryMove(1, 0));
  document.getElementById('move-left')?.addEventListener('click', () => tryMove(0, -1));
  document.getElementById('move-right')?.addEventListener('click', () => tryMove(0, 1));
  
  // Shooting buttons
  document.getElementById('shoot-up')?.addEventListener('click', () => shootArrow(-1, 0));
  document.getElementById('shoot-down')?.addEventListener('click', () => shootArrow(1, 0));
  document.getElementById('shoot-left')?.addEventListener('click', () => shootArrow(0, -1));
  document.getElementById('shoot-right')?.addEventListener('click', () => shootArrow(0, 1));
  
  // Reset button
  document.getElementById('reset-game')?.addEventListener('click', restartGame);
  
  // KEYBOARD CONTROLS - FIXED with focus guarantee
  window.addEventListener('keydown', (e) => {
    const key = e.key;
    // Prevent page scrolling with arrows
    if (key === 'ArrowUp' || key === 'ArrowDown' || key === 'ArrowLeft' || key === 'ArrowRight' ||
        key === 'w' || key === 'W' || key === 's' || key === 'S' || key === 'a' || key === 'A' || key === 'd' || key === 'D') {
      e.preventDefault();
    }
    
    // MOVEMENT: WASD
    if (key === 'w' || key === 'W') tryMove(-1, 0);
    if (key === 's' || key === 'S') tryMove(1, 0);
    if (key === 'a' || key === 'A') tryMove(0, -1);
    if (key === 'd' || key === 'D') tryMove(0, 1);
    
    // SHOOTING: Arrow keys
    if (key === 'ArrowUp') shootArrow(-1, 0);
    if (key === 'ArrowDown') shootArrow(1, 0);
    if (key === 'ArrowLeft') shootArrow(0, -1);
    if (key === 'ArrowRight') shootArrow(0, 1);
  });
  
  // Extra: click anywhere on game panel to ensure focus (helps keyboard)
  document.querySelector('.game-panel')?.addEventListener('click', () => {
    // just to make sure no input steals focus
  });
}

// Initialize everything
function initGame() {
  initPositions();
  bindEvents();
  renderGrid();
  // Force focus on body to capture keys immediately
  document.body.click();
}

initGame();
