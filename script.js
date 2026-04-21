// HUNT THE WUMPUS - full game logic
// Grid 6x6, player, wumpus, stench, movement, shooting, two controllers

const SIZE = 6;
let board = [];         // not heavily used, we track positions
let playerPos = { row: 0, col: 0 };
let wumpusPos = { row: 0, col: 0 };
let gameActive = true;
let gameWin = false;

// DOM elements
const gridContainer = document.getElementById('game-grid');
const statusDiv = document.getElementById('status-message');
const scentHintDiv = document.getElementById('scent-hint');

// Helper: random integer
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Generate random start positions (player & wumpus not equal)
function initPositions() {
  const startRow = randomInt(0, SIZE-1);
  const startCol = randomInt(0, SIZE-1);
  playerPos = { row: startRow, col: startCol };
  
  do {
    wumpusPos = { row: randomInt(0, SIZE-1), col: randomInt(0, SIZE-1) };
  } while (wumpusPos.row === playerPos.row && wumpusPos.col === playerPos.col);
}

// Check adjacency (up/down/left/right)
function isAdjacent(pos1, pos2) {
  return (Math.abs(pos1.row - pos2.row) + Math.abs(pos1.col - pos2.col)) === 1;
}

// Compute stench message (if any adjacent cell has wumpus)
function getStenchMessage() {
  if (!gameActive) return "";
  if (isAdjacent(playerPos, wumpusPos)) {
    return "💨👃 YOU SMELL A FOUL STENCH! The Wumpus is VERY close! 👃💨";
  }
  return "✨ Air is clean... for now. ✨";
}

// Update UI: draw grid + status + scent
function renderGrid() {
  if (!gridContainer) return;
  gridContainer.innerHTML = '';
  
  for (let i = 0; i < SIZE; i++) {
    for (let j = 0; j < SIZE; j++) {
      const cell = document.createElement('div');
      cell.classList.add('cell');
      
      // show player icon
      if (playerPos.row === i && playerPos.col === j && gameActive) {
        cell.textContent = '🧝';
        cell.classList.add('player');
      } 
      // after game over or win, we optionally show wumpus for clarity
      else if (!gameActive && wumpusPos.row === i && wumpusPos.col === j) {
        if (gameWin) {
          cell.textContent = '💀';  // dead wumpus
        } else {
          cell.textContent = '🐗';
        }
      }
      else if (gameActive && wumpusPos.row === i && wumpusPos.col === j) {
        // hidden wumpus (don't show icon) but for suspense keep empty
        cell.textContent = '';
      }
      else {
        cell.textContent = '⬚';
      }
      
      // extra style for empty
      if (cell.textContent === '⬚') cell.style.opacity = '0.7';
      gridContainer.appendChild(cell);
    }
  }
  
  // scent hint update
  if (gameActive) {
    scentHintDiv.innerHTML = getStenchMessage();
    if (isAdjacent(playerPos, wumpusPos)) {
      scentHintDiv.style.background = "#ffc49b";
    } else {
      scentHintDiv.style.background = "#f7e5b5";
    }
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

// check if player stepped on wumpus
function checkStepOnWumpus() {
  if (!gameActive) return true;
  if (playerPos.row === wumpusPos.row && playerPos.col === wumpusPos.col) {
    gameActive = false;
    gameWin = false;
    statusDiv.innerHTML = "💀 OH NO! You stepped into the Wumpus den! You were eaten. 💀";
    renderGrid();
    return false;
  }
  return true;
}

// move player (dx, dy)
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
  
  // perform move
  playerPos = { row: newRow, col: newCol };
  renderGrid();
  
  const stillAlive = checkStepOnWumpus();
  if (!stillAlive) {
    renderGrid();
    return;
  }
  
  // after move update status and stench
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

// shoot in direction (dx, dy)
function shootArrow(dx, dy) {
  if (!gameActive) return;
  
  // Determine the target cell based on player's position + direction
  const targetRow = playerPos.row + dx;
  const targetCol = playerPos.col + dy;
  
  // check if out of bounds
  if (targetRow < 0 || targetRow >= SIZE || targetCol < 0 || targetCol >= SIZE) {
    statusDiv.innerHTML = "🏹 Arrow flies into the void! No Wumpus there.";
    setTimeout(() => {
      if (gameActive) statusDiv.innerHTML = "✨ Keep hunting! Get adjacent and shoot again. ✨";
    }, 800);
    return;
  }
  
  // shooting logic: you must be adjacent to wumpus AND shoot exactly into wumpus cell
  const isAdj = isAdjacent(playerPos, wumpusPos);
  if (!isAdj) {
    statusDiv.innerHTML = "❌ You are not close enough! You must be NEXT to the Wumpus to shoot it! Move closer!";
    setTimeout(() => {
      if (gameActive) statusDiv.innerHTML = "👃 Get adjacent to the stench, then shoot! 👃";
    }, 1500);
    return;
  }
  
  // now check if the shot direction actually hits wumpus
  if (targetRow === wumpusPos.row && targetCol === wumpusPos.col) {
    // KILL!
    gameActive = false;
    gameWin = true;
    statusDiv.innerHTML = "🏆🔥 PERFECT SHOT! The Wumpus is DEAD! You are the hunter! 🔥🏆";
    renderGrid();
  } else {
    statusDiv.innerHTML = "🏹 Your arrow missed! The Wumpus growls angrily... You are still alive, but aim carefully! (Must shoot directly at its cell while adjacent)";
    setTimeout(() => {
      if (gameActive) statusDiv.innerHTML = "🐗 Wumpus is still out there! Get adjacent and shoot again.";
    }, 1500);
  }
  renderGrid();
}

// restart game fully
function restartGame() {
  gameActive = true;
  gameWin = false;
  initPositions();
  renderGrid();
  statusDiv.innerHTML = "✨ Game restarted! Hunt the Wumpus — move and shoot wisely. ✨";
  scentHintDiv.innerHTML = getStenchMessage();
  renderGrid();
}

// set up event listeners (keyboard + on-screen)
function bindEvents() {
  // MOVEMENT buttons (4)
  const moveUp = document.getElementById('move-up');
  const moveDown = document.getElementById('move-down');
  const moveLeft = document.getElementById('move-left');
  const moveRight = document.getElementById('move-right');
  
  if (moveUp) moveUp.addEventListener('click', () => tryMove(-1, 0));
  if (moveDown) moveDown.addEventListener('click', () => tryMove(1, 0));
  if (moveLeft) moveLeft.addEventListener('click', () => tryMove(0, -1));
  if (moveRight) moveRight.addEventListener('click', () => tryMove(0, 1));
  
  // SHOOTING buttons (4)
  const shootUp = document.getElementById('shoot-up');
  const shootDown = document.getElementById('shoot-down');
  const shootLeft = document.getElementById('shoot-left');
  const shootRight = document.getElementById('shoot-right');
  
  if (shootUp) shootUp.addEventListener('click', () => shootArrow(-1, 0));
  if (shootDown) shootDown.addEventListener('click', () => shootArrow(1, 0));
  if (shootLeft) shootLeft.addEventListener('click', () => shootArrow(0, -1));
  if (shootRight) shootRight.addEventListener('click', () => shootArrow(0, 1));
  
  // reset button
  const resetBtn = document.getElementById('reset-game');
  if (resetBtn) resetBtn.addEventListener('click', restartGame);
  
  // KEYBOARD: WASD for movement
  window.addEventListener('keydown', (e) => {
    if (!gameActive) return;
    const key = e.key;
    // prevent arrow keys from scrolling page
    if (key === 'ArrowUp' || key === 'ArrowDown' || key === 'ArrowLeft' || key === 'ArrowRight' ||
        key === 'w' || key === 's' || key === 'a' || key === 'd') {
      e.preventDefault();
    }
    // movement: wasd
    if (key === 'w' || key === 'W') tryMove(-1, 0);
    if (key === 's' || key === 'S') tryMove(1, 0);
    if (key === 'a' || key === 'A') tryMove(0, -1);
    if (key === 'd' || key === 'D') tryMove(0, 1);
    
    // SHOOTING: arrow keys (up, down, left, right)
    if (key === 'ArrowUp') shootArrow(-1, 0);
    if (key === 'ArrowDown') shootArrow(1, 0);
    if (key === 'ArrowLeft') shootArrow(0, -1);
    if (key === 'ArrowRight') shootArrow(0, 1);
  });
}

// initialize game
function initGame() {
  initPositions();
  bindEvents();
  renderGrid();
}

initGame();
