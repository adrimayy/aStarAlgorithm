// Configuration for the grid and animation delay
const ROW = 12; // Number of rows in the grid
const COL = 12; // Number of columns in the grid
const CELL_SIZE = Math.floor(window.innerHeight * 0.8 / ROW); // Calculate cell size based on window height
const DELAY = 3000; // Delay in milliseconds between each step of the visualization

// Setting up the canvas for drawing
const canvas = document.getElementById('grid'); // Get the canvas element by its ID
canvas.width = COL * CELL_SIZE * 2; // Set canvas width at double resolution for sharp visuals
canvas.height = ROW * CELL_SIZE * 2; // Set canvas height at double resolution for sharp visuals
canvas.style.width = `${COL * CELL_SIZE}px`; // Display width at original scale
canvas.style.height = `${ROW * CELL_SIZE}px`; // Display height at original scale
const ctx = canvas.getContext('2d'); // Get the 2D drawing context
ctx.scale(2, 2); // Scale down by 2x for higher resolution display

// Define starting and ending points for the path
const src = [ROW - 1, 0]; // Start point at the bottom-left corner of the grid
const dest = [0, COL - 1]; // End point at the top-right corner of the grid

// Generate a grid with random obstacles but ensure a path exists
function generateGrid() {
  const grid = Array.from({ length: ROW }, () => Array(COL).fill(1)); // Create a grid filled with "1" (walkable cells)
  
  // Loop through each cell to add obstacles
  for (let i = 0; i < ROW; i++) {
    for (let j = 0; j < COL; j++) {
      // Randomly assign "0" (obstacle) to cells, but keep start and end points open
      if (Math.random() < 0.3 && !(i === src[0] && j === src[1]) && !(i === dest[0] && j === dest[1])) {
        grid[i][j] = 0; // Set cell as an obstacle
      }
    }
  }
  return grid; // Return the generated grid
}

// Utility functions for checking cell properties
function isValid(row, col) {
  // Check if a cell is within the grid boundaries
  return row >= 0 && row < ROW && col >= 0 && col < COL;
}

function isUnBlocked(grid, row, col) {
  // Check if a cell is walkable (not an obstacle)
  return grid[row][col] === 1;
}

function isDestination(row, col, dest) {
  // Check if a cell is the destination
  return row === dest[0] && col === dest[1];
}

function calculateHValue(row, col, dest) {
  // Calculate heuristic (h) as the Euclidean distance to the destination
  return Math.sqrt((row - dest[0]) ** 2 + (col - dest[1]) ** 2);
}

// Define a Cell class to store information about each cell in the grid
class Cell {
  constructor(parent_i = -1, parent_j = -1, f = Infinity, g = Infinity, h = Infinity) {
    this.parent_i = parent_i; // Parent cell's row index
    this.parent_j = parent_j; // Parent cell's column index
    this.f = f; // Total cost (g + h)
    this.g = g; // Cost from the start cell
    this.h = h; // Heuristic (estimated distance to the end cell)
  }
}

// Function to draw the entire grid
function drawGrid(grid) {
  // Clear the canvas before drawing the grid
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Loop through each cell in the grid
  for (let i = 0; i < ROW; i++) {
    for (let j = 0; j < COL; j++) {
      // Set color based on cell type: walkable (white) or obstacle (gray)
      ctx.fillStyle = grid[i][j] === 1 ? 'white' : 'gray';
      ctx.fillRect(j * CELL_SIZE, i * CELL_SIZE, CELL_SIZE, CELL_SIZE); // Draw cell as a square
      ctx.strokeRect(j * CELL_SIZE, i * CELL_SIZE, CELL_SIZE, CELL_SIZE); // Outline cell

      // Draw coordinates inside each cell for reference
      ctx.font = '10px Arial';
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'black';
      ctx.strokeText(`(${i},${j})`, j * CELL_SIZE + 5, i * CELL_SIZE + 15); // Black outline for text
      ctx.fillStyle = 'white';
      ctx.fillText(`(${i},${j})`, j * CELL_SIZE + 5, i * CELL_SIZE + 15); // White text
    }
  }

  // Draw start and end points
  drawCircle(src[1], src[0], 'red'); // Start point in red
  drawCircle(dest[1], dest[0], 'green'); // End point in green
}

// Function to draw a circle at a specific cell (used for start, end, and path cells)
function drawCircle(x, y, color) {
  ctx.beginPath(); // Start a new path
  ctx.arc(x * CELL_SIZE + CELL_SIZE / 2, y * CELL_SIZE + CELL_SIZE / 2, CELL_SIZE / 3, 0, 2 * Math.PI); // Draw circle
  ctx.fillStyle = color;
  ctx.fill();
  ctx.stroke();

  // Redraw coordinates on top of the circle
  ctx.font = '10px Arial';
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'black';
  ctx.strokeText(`(${y},${x})`, x * CELL_SIZE + 5, y * CELL_SIZE + 15); // Black outline for text
  ctx.fillStyle = 'white';
  ctx.fillText(`(${y},${x})`, x * CELL_SIZE + 5, y * CELL_SIZE + 15); // White text
}

// Main function for A* search algorithm
async function aStarSearch(grid, src, dest) {
  drawGrid(grid); // Draw initial grid layout

  // Check if start or end points are blocked or invalid
  if (!isValid(src[0], src[1]) || !isValid(dest[0], dest[1]) || !isUnBlocked(grid, src[0], src[1]) || !isUnBlocked(grid, dest[0], dest[1])) {
    alert("Source or Destination is blocked or invalid.");
    return;
  }

  // Create and initialize lists for A* search
  const closedList = Array.from(Array(ROW), () => Array(COL).fill(false)); // Tracks cells already processed
  const cellDetails = Array.from(Array(ROW), () => Array.from(Array(COL), () => new Cell())); // Stores cell info

  // Initialize starting cell's cost values
  let [i, j] = src; // Row and column of the start cell
  cellDetails[i][j] = new Cell(i, j, 0, 0, 0); // Set costs to zero for start
  const openList = new Set([[i, j].toString()]); // Start cell in the open list

  // Loop until all cells are processed or destination is reached
  while (openList.size > 0) {
    // Get cell with the lowest f score from the open list
    const [current_i, current_j] = Array.from(openList).reduce((acc, cell) => {
      const [i, j] = cell.split(',').map(Number);
      return cellDetails[i][j].f < cellDetails[acc[0]][acc[1]].f ? [i, j] : acc;
    }, Array.from(openList)[0].split(',').map(Number));

    openList.delete([current_i, current_j].toString()); // Remove processed cell
    closedList[current_i][current_j] = true; // Mark cell as closed

    // Check if the destination has been reached
    if (isDestination(current_i, current_j, dest)) {
      tracePath(cellDetails, dest); // Trace and display the path
      return; // Stop the algorithm
    }

    // Process each possible direction from the current cell
    for (const [di, dj] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [-1, 1], [1, -1], [1, 1]]) {
      const ni = current_i + di; // New row index
      const nj = current_j + dj; // New column index

      // Check if the new cell is valid and walkable, and not already processed
      if (isValid(ni, nj) && isUnBlocked(grid, ni, nj) && !closedList[ni][nj]) {
        const stepCost = di && dj ? 1.414 : 1; // Set cost to √2 for diagonal, 1 for straight
        const gNew = cellDetails[current_i][current_j].g + stepCost; // Calculate new g cost
        const hNew = calculateHValue(ni, nj, dest); // Calculate heuristic h cost
        const fNew = gNew + hNew; // Total cost f = g + h

        // Update cell if new path is better (lower f value)
        if (fNew < cellDetails[ni][nj].f) {
          cellDetails[ni][nj] = new Cell(current_i, current_j, fNew, gNew, hNew); // Update cell details
          openList.add([ni, nj].toString()); // Add cell to open list

          // Update explanation text and draw cell
          explanation.innerHTML = `
            <div class="equation">
              <span class="highlight">Currently Evaluating:</span> (${current_i}, ${current_j})<br>
              <span class="highlight">New Successor:</span> (${ni}, ${nj})<br>
            </div>
            <div class="equation">
              <span class="highlight">Step Cost:</span> ${stepCost.toFixed(3)}
            </div>
            <div class="equation">
              <span class="highlight">g (Cost from Start):</span> g = ${gNew.toFixed(2)}
            </div>
            <div class="equation">
              <span class="highlight">h (Heuristic):</span> h = ${hNew.toFixed(2)}
            </div>
            <div class="equation">
              <span class="highlight">f (Total Cost):</span> f = ${fNew.toFixed(2)}
            </div>
          `;
          
          drawCircle(nj, ni, 'lightblue'); // Draw the cell in light blue
          await new Promise((resolve) => setTimeout(resolve, DELAY)); // Wait before continuing
        }
      }
    }
  }
  alert("Failed to find a path."); // No path found
}

// Trace and display the final path from the destination back to the start
function tracePath(cellDetails, dest) {
  const path = []; // Array to store the path cells
  let row = dest[0];
  let col = dest[1];

  // Backtrack from destination to start
  while (!(cellDetails[row][col].parent_i === row && cellDetails[row][col].parent_j === col)) {
    path.push([row, col]); // Add cell to path
    const tempRow = cellDetails[row][col].parent_i; // Move to the parent cell
    const tempCol = cellDetails[row][col].parent_j;
    row = tempRow;
    col = tempCol;
  }
  path.push([row, col]); // Add the start cell
  path.reverse(); // Reverse to show the path from start to end

  // Display path and update explanation text
  explanation.innerHTML = "<strong>Path Found!</strong><br>";
  path.forEach(([i, j], index) => {
    setTimeout(() => drawCircle(j, i, 'blue'), index * 200); // Draw each cell in blue
  });
}

// Main execution: generate a random grid and start A* search
const grid = generateGrid(); // Create grid with obstacles
aStarSearch(grid, src, dest); // Start pathfinding algorithm