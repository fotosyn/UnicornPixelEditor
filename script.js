// Initialize the grid and palette
let gridSize = 16; // Default grid size
let selectedColor = ''; // Default color
let grid = new Array(gridSize).fill(null).map(() => new Array(gridSize).fill('#000000'));
let paletteColors = ['#000000', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffffff'];

// Initialize color maps
const colorToIndexMap = {};
const indexToGridPositionsMap = {};

// Function to convert hex color to RGB
function hexToRgb(hex) {
    hex = hex.replace(/^#/, '');
    const bigint = parseInt(hex, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return { r, g, b };
}

// Function to create and display color swatches
function createPalette() {
    const paletteContainer = document.getElementById('color-palette');
    paletteContainer.innerHTML = '';

    paletteColors.forEach((color, index) => {
        const swatch = document.createElement('div');
        swatch.classList.add('swatch');
        swatch.style.backgroundColor = color;
        swatch.addEventListener('click', () => {
            selectedColor = color;
            highlightSelectedSwatch(swatch);
        });
        paletteContainer.appendChild(swatch);

        // Map color to its index
        colorToIndexMap[color] = index;

        // Initialize the positions map
        indexToGridPositionsMap[index] = [];
    });

    // Highlight the default selected color swatch (index 1)
    const defaultSelectedSwatch = document.querySelector('.swatch:nth-child(2)');
    highlightSelectedSwatch(defaultSelectedSwatch); // Assuming index 1 is the default
}

// Function to highlight the selected swatch
function highlightSelectedSwatch(swatch) {
    const swatches = document.querySelectorAll('.swatch');
    swatches.forEach((s) => {
        s.classList.remove('selected-swatch');
    });
    swatch.classList.add('selected-swatch');
}

// Function to draw the grid
function drawGrid() {
    const canvas = document.getElementById('pixel-canvas');
    const ctx = canvas.getContext('2d');

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid lines
    ctx.strokeStyle = '#888'; // Grid line color
    ctx.lineWidth = 1; // Grid line width

    const cellWidth = canvas.width / gridSize;
    const cellHeight = canvas.height / gridSize;

    for (let x = 0; x < gridSize; x++) {
        for (let y = 0; y < gridSize; y++) {
            const xPos = x * cellWidth;
            const yPos = y * cellHeight;

            // Draw a filled rectangle for each cell
            ctx.fillStyle = grid[x][y];
            ctx.fillRect(xPos, yPos, cellWidth, cellHeight);

            // Draw grid cell border (grey line)
            ctx.strokeStyle = '#9a9a9a'; // Grey line color
            ctx.strokeRect(xPos, yPos, cellWidth, cellHeight);
        }
    }
}

// Event listener for mouse click to change pixel color
const canvas = document.getElementById('pixel-canvas');
canvas.addEventListener('mousedown', function (e) {
    const x = Math.floor((e.offsetX / (canvas.width / gridSize)));
    const y = Math.floor((e.offsetY / (canvas.height / gridSize)));

    grid[x][y] = selectedColor;
    drawGrid();
});

// Function to set the selected color
function setColor(color) {
    selectedColor = color;
}

function changeGridSize(size) {
    gridSize = parseInt(size);

    // Clear the grid and initialize it with the default color
    grid = new Array(gridSize).fill(null).map(() => new Array(gridSize).fill('#000000'));

    // Update the canvas size
    const canvas = document.getElementById('pixel-canvas');
    if (gridSize === 53) {
        canvas.width = gridSize * 16;
        canvas.height = 11 * 16; // Set the height to 11 as an exception
    } else {
        canvas.width = gridSize * 16;
        canvas.height = gridSize * 16;
    }

    // Redraw the grid
    drawGrid();
}



// Function to export the grid data
function exportGrid() {
    const exportData = {
        grid: [],
        palette: paletteColors.map(color => {
            const rgb = hexToRgb(color);
            return rgb;
        })
    };

    for (let y = 0; y < gridSize; y++) {
        const row = [];
        for (let x = 0; x < gridSize; x++) {
            const color = grid[x][y];
            const index = colorToIndexMap[color];
            row.push(index === undefined ? 0 : index);
        }
        exportData.grid.push(row);
    }

    // Format the exportData object as a Python dictionary with indentation and line breaks
    const formattedPythonCode = formatPythonCode(exportData);

    // Set the export data in the textarea element
    var exportTextBox = document.getElementById("export-text-box");
    exportTextBox.value = formattedPythonCode;
    exportTextBox.style.display = 'block';
}

// Create a custom formatting function for Python code
function formatPythonCode(data) {
    const indent = '    '; // Define the indentation (4 spaces)

    const formattedGrid = data.grid.map(row => {
        return `[${row.join(', ')}],`;
    }).join('\n' + indent + indent);

    const formattedPalette = data.palette.map(color => {
        return JSON.stringify(color) + ',';
    }).join('\n' + indent + indent);

    const formattedCode = `data = {
${indent}"grid": [
${indent + indent}${formattedGrid}
${indent}],
${indent}"palette": [
${indent + indent}${formattedPalette}
${indent}]
}`;

    return formattedCode;
}

// Function to edit the palette
function editPalette() {
    const newPaletteColors = prompt("Edit the palette (comma-separated hex values):", paletteColors.join(','));
    if (newPaletteColors !== null) {
        const colorsArray = newPaletteColors.split(',').map(color => color.trim());

        if (colorsArray.length > 0) {
            const oldSelectedColor = selectedColor; // Store the currently selected color
            const oldPaletteColors = paletteColors.slice(); // Create a copy of the old palette colors
            paletteColors = colorsArray;
            createPalette();

            // Create a mapping of old color to new color
            const colorMapping = {};
            oldPaletteColors.forEach((oldColor, index) => {
                colorMapping[oldColor] = paletteColors[index];
            });

            // Update grid elements to reflect the new palette colors
            for (let x = 0; x < gridSize; x++) {
                for (let y = 0; y < gridSize; y++) {
                    const currentColor = grid[x][y];
                    if (colorMapping.hasOwnProperty(currentColor)) {
                        grid[x][y] = colorMapping[currentColor];
                    }
                }
            }

            // Update the selected color if it has changed in the palette
            if (colorMapping.hasOwnProperty(oldSelectedColor)) {
                selectedColor = colorMapping[oldSelectedColor];
            }

            drawGrid();
        } else {
            alert("Invalid input. Please enter at least one color.");
        }
    }
}


// Event listeners for shift buttons
document.getElementById('shift-left').addEventListener('click', shiftLeft);
document.getElementById('shift-right').addEventListener('click', shiftRight);
document.getElementById('shift-up').addEventListener('click', shiftUp);
document.getElementById('shift-down').addEventListener('click', shiftDown);

// Function to shift pixels to the left
function shiftLeft() {
    const newGrid = new Array(gridSize).fill(null).map(() => new Array(gridSize).fill(0));

    for (let x = 0; x < gridSize; x++) {
        for (let y = 0; y < gridSize; y++) {
            const newX = (x - 1 + gridSize) % gridSize;
            const newY = y;
            newGrid[newX][newY] = grid[x][y];
        }
    }

    grid = newGrid;
    drawGrid();
}

// Function to shift pixels to the right
function shiftRight() {
    const newGrid = new Array(gridSize).fill(null).map(() => new Array(gridSize).fill(0));

    for (let x = 0; x < gridSize; x++) {
        for (let y = 0; y < gridSize; y++) {
            const newX = (x + 1) % gridSize;
            const newY = y;
            newGrid[newX][newY] = grid[x][y];
        }
    }

    grid = newGrid;
    drawGrid();
}

// Function to shift pixels up
function shiftUp() {
    const newGrid = new Array(gridSize).fill(null).map(() => new Array(gridSize).fill(0));

    for (let x = 0; x < gridSize; x++) {
        for (let y = 0; y < gridSize; y++) {
            const newX = x;
            const newY = (y - 1 + gridSize) % gridSize;
            newGrid[newX][newY] = grid[x][y];
        }
    }

    grid = newGrid;
    drawGrid();
}

// Function to shift pixels down
function shiftDown() {
    const newGrid = new Array(gridSize).fill(null).map(() => new Array(gridSize).fill(0));

    for (let x = 0; x < gridSize; x++) {
        for (let y = 0; y < gridSize; y++) {
            const newX = x;
            const newY = (y + 1) % gridSize;
            newGrid[newX][newY] = grid[x][y];
        }
    }

    grid = newGrid;
    drawGrid();
}

// Function to select all text in the export text box
function selectAllText() {
    const exportTextBox = document.getElementById("export-text-box");
    exportTextBox.select();
    document.execCommand("copy");
}

// Function to copy the export data to the clipboard
function copyToClipboard() {
    const exportTextBox = document.getElementById("export-text-box");
    const copyAlert = document.getElementById("copy-alert");

    exportTextBox.select();
    document.execCommand("copy");

    if (exportTextBox.value.trim() === '') {
        copyAlert.textContent = "Click 'Generate Code' to populate the text area first.";
    } else {
        exportTextBox.select();
        document.execCommand("copy");
        copyAlert.textContent = "You can now paste this into your Python script";
    }
}

// Initialize palette and grid
createPalette();
drawGrid();