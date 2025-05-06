/**
 * Unicorn Pixel Art Editor - v1.0 by Jim Moore, September 2023
 * A browser-based tool for creating pixelated images for Pimoroni Unicorn LED panels.
 * For more info: https://shop.pimoroni.com/products/space-unicorns
 * License: Free to repurpose.
 */

// ================================
// CONSTANTS
// ================================

const GRID_LINE_COLOR = '#9a9a9a';

// ================================
// INITIAL SETUP
// ================================

let gridSize = 16;
let grid = createGridArray('#000000');
let paletteColors = ['#000000', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffffff'];
let selectedColor = '';
let jsonData = {};
const colorToIndexMap = {};
const indexToGridPositionsMap = {};

// ================================
// UTILITY FUNCTIONS
// ================================

function createGridArray(defaultColor) {
    return new Array(gridSize).fill(null).map(() => new Array(gridSize).fill(defaultColor));
}

function hexToRgb(hex) {
    hex = hex.replace(/^#/, '');
    const bigint = parseInt(hex, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return { r, g, b };
}

function rgbToHex(r, g, b) {
    return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`;
}

// ================================
// PALETTE FUNCTIONS
// ================================

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

    // Highlight the default selected color swatch (index 0)
    const defaultSelectedSwatch = document.querySelector('.swatch:first-child');
    highlightSelectedSwatch(defaultSelectedSwatch);
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

// Function to highlight the selected swatch
function highlightSelectedSwatch(swatch) {
    const swatches = document.querySelectorAll('.swatch');
    swatches.forEach((s) => {
        s.classList.remove('selected-swatch');
    });
    swatch.classList.add('selected-swatch');
}

// ================================
// GRID FUNCTIONS
// ================================

// Function to draw the grid
function drawGrid() {
    const canvas = document.getElementById('pixel-canvas');
    const ctx = canvas.getContext('2d');

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid lines
    ctx.strokeStyle = '#9a9a9a'; // Grid line color
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

// Adjust the size of the grid based on the selected device from the menu
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

// ================================
// PIXEL MANIPULATION FUNCTIONS
// ================================

/// Function to shift pixels to the left (along the X-axis)
function shiftLeft() {
    const newGrid = new Array(gridSize).fill(null).map(() => new Array(gridSize).fill(0));

    for (let x = 0; x < gridSize; x++) {
        for (let y = 0; y < gridSize; y++) {
            const newX = (x - 1 + gridSize) % gridSize; // Move left in X
            const newY = y; // No change in Y

            newGrid[newX][newY] = grid[x][y];
        }
    }

    grid = newGrid;
    drawGrid();
}

// Function to shift pixels to the right (along the X-axis)
function shiftRight() {
    const newGrid = new Array(gridSize).fill(null).map(() => new Array(gridSize).fill(0));

    for (let x = 0; x < gridSize; x++) {
        for (let y = 0; y < gridSize; y++) {
            const newX = (x + 1) % gridSize; // Move right in X
            const newY = y; // No change in Y

            newGrid[newX][newY] = grid[x][y];
        }
    }

    grid = newGrid;
    drawGrid();
}

// Function to shift pixels up (along the Y-axis)
function shiftUp() {
    const newGrid = new Array(gridSize).fill(null).map(() => new Array(gridSize).fill(0));

    for (let x = 0; x < gridSize; x++) {
        for (let y = 0; y < gridSize; y++) {
            const newX = x; // No change in X
            const newY = (y - 1 + gridSize) % gridSize; // Move up in Y

            newGrid[newX][newY] = grid[x][y];
        }
    }

    grid = newGrid;
    drawGrid();
}

// Function to shift pixels down (along the Y-axis)
function shiftDown() {
    const newGrid = new Array(gridSize).fill(null).map(() => new Array(gridSize).fill(0));

    for (let x = 0; x < gridSize; x++) {
        for (let y = 0; y < gridSize; y++) {
            const newX = x; // No change in X
            const newY = (y + 1) % gridSize; // Move down in Y

            newGrid[newX][newY] = grid[x][y];
        }
    }

    grid = newGrid;
    drawGrid();
}

// ================================
// DATA EXPORT & IMPORT FUNCTIONS
// ================================

// Function to export the grid data
function exportGrid() {
    const exportData = {
        grid: [],
        palette: paletteColors.map(color => {
            const rgb = hexToRgb(color);
            return rgb;
        })
    };

    for (let y = 0; y < gridSize; y++) { // Loop through rows
        const row = [];
        for (let x = 0; x < gridSize; x++) { // Loop through columns
            const color = grid[x][y]; // Retrieve color from the original grid
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

// Function to selet all text in the export text box
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

// Function to load the selected template
function loadTemplate() {
    const templateSelect = document.getElementById('template-select');
    const selectedTemplateIndex = templateSelect.selectedIndex;
    
    // Make sure the selectedTemplateIndex is valid
    if (selectedTemplateIndex >= 0) {
      // Load the template data from the loaded JSON data
      const selectedTemplateData = jsonData[selectedTemplateIndex];
      
      // Use the selectedTemplateData to update the grid and palette
      // (You can reuse your existing code for this)
      loadGridAndPalette(selectedTemplateData);
    }
  }
  
// Function to load the grid and palette from template data
function loadGridAndPalette(templateData) {
    // Load palette data from the template and convert RGB to hex
    paletteColors = templateData.palette.map((rgbColor) => {
        return rgbToHex(rgbColor.r, rgbColor.g, rgbColor.b);
    });

    // Reinitialize the palette
    createPalette();

    // Load and transpose grid data from the template and draw it
    grid = Array.from({ length: gridSize }, () => Array(gridSize).fill(''));
    
    for (let x = 0; x < gridSize; x++) {
        for (let y = 0; y < gridSize; y++) {
            const colorIndex = templateData.grid[y][x]; // Transpose rows and columns
            grid[x][y] = paletteColors[colorIndex];
        }
    }

    // Calculate the canvas size based on the grid size
    const canvas = document.getElementById('pixel-canvas');
    const cellWidth = canvas.width / gridSize;
    const cellHeight = canvas.height / gridSize;

    // Clear the canvas
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid elements in the correct orientation
    for (let x = 0; x < gridSize; x++) {
        for (let y = 0; y < gridSize; y++) {
            const xPos = x * cellWidth;
            const yPos = y * cellHeight;

            ctx.fillStyle = grid[x][y];
            ctx.fillRect(xPos, yPos, cellWidth, cellHeight);

            // Draw grid cell border (grey line)
            ctx.strokeStyle = '#9a9a9a'; // Grey line color
            ctx.strokeRect(xPos, yPos, cellWidth, cellHeight);
        }
    }
}

// Function to populate the Template dropdown
function populateTemplateDropdown() {
    // Get a reference to the select container div
    const templateSelectContainer = document.getElementById("template-select-container");

    // Create the select element
    const templateSelect = document.getElementById("template-select");

    // Fetch the JSON data from images.json
    fetch('images.json')
        .then(response => response.json())
        .then(data => {
            // Assign the loaded data to the jsonData variable
            jsonData = data;

            // Populate the template select element with the loaded data
            data.forEach((template, index) => {
                const option = document.createElement('option');
                option.value = `template${index + 1}`;
                option.textContent = `${template.label}`;
                templateSelect.appendChild(option);
            });

            // Call the loadTemplate function initially to load the default template
            loadTemplate();
        })
        .catch(error => {
            console.error('Error loading templates:', error);
        });

    // Append the dynamically created select element to the container
    templateSelectContainer.appendChild(templateSelect);
}