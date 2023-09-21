// Unicorn Pixel Art Editor
// Version 1.0 by Jim Moore - September 2023
// A simple tool to generate and export pixel maps and palettes for Pimoroni Unicorn LED panels.
// For more information, visit: https://shop.pimoroni.com/products/space-unicorns
// Read the documentation for guidance on using this code.
// You are free to repurpose this code as needed.

// Configuration Object
const config = {
    unicornGridSizes: {
        'Stellar Unicorn': '16,16',
        'Galactic Unicorn': '53,11',
        'Cosmic Unicorn': '32,32'
    },
    defaultUnicornGrid: 'Stellar Unicorn',
    defaultPaletteColors: ['#000000', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffffff'],
    canvasStrokeStyle: '#9a9a9a',
    canvasFillColor: '#000000'
};

// Initialization
const defaultUnicornGrid = config.defaultUnicornGrid;
var gridSize = parseGridSize(config.unicornGridSizes[defaultUnicornGrid]);
let grid = createEmptyGrid(gridSize.width, gridSize.height, config.canvasFillColor);
let paletteColors = [...config.defaultPaletteColors];
let selectedColor = '';
let jsonData;

// Color Maps Setup
const colorToIndexMap = {};
const indexToGridPositionsMap = {};

// Palette Functions
function createPalette() {
    const paletteContainer = document.getElementById('color-palette');
    paletteContainer.innerHTML = '';

    paletteColors.forEach((color, index) => {
        const swatch = createSwatch(color);
        swatch.addEventListener('click', () => {
            selectedColor = color;
            highlightSelectedSwatch(swatch);
        });
        paletteContainer.appendChild(swatch);

        colorToIndexMap[color] = index;
        indexToGridPositionsMap[index] = [];
    });

    const defaultSelectedSwatch = document.querySelector('.swatch:first-child');
    highlightSelectedSwatch(defaultSelectedSwatch);
}

function editPalette() {
    const newPaletteColors = prompt("Edit the palette (comma-separated hex values):", paletteColors.join(','));
    if (newPaletteColors !== null) {
        const colorsArray = newPaletteColors.split(',').map(color => color.trim());

        if (colorsArray.length > 0) {
            const oldSelectedColor = selectedColor;
            const oldPaletteColors = paletteColors.slice();
            paletteColors = colorsArray;
            createPalette();

            const colorMapping = createColorMapping(oldPaletteColors, paletteColors);

            for (let x = 0; x < gridSize.width; x++) {
                for (let y = 0; y < gridSize.height; y++) {
                    const currentColor = grid[x][y];
                    if (colorMapping.hasOwnProperty(currentColor)) {
                        grid[x][y] = colorMapping[currentColor];
                    }
                }
            }

            if (colorMapping.hasOwnProperty(oldSelectedColor)) {
                selectedColor = colorMapping[oldSelectedColor];
            }

            drawGrid();
        } else {
            alert("Invalid input. Please enter at least one color.");
        }
    }
}

function createSwatch(color) {
    const swatch = document.createElement('div');
    swatch.classList.add('swatch');
    swatch.style.backgroundColor = color;
    return swatch;
}

function highlightSelectedSwatch(swatch) {
    const swatches = document.querySelectorAll('.swatch');
    swatches.forEach((s) => {
        s.classList.remove('selected-swatch');
    });
    swatch.classList.add('selected-swatch');
}

// Utility Functions
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

function formatPythonCode(data) {
    const indent = '    ';

    // Formatting the grid and removing the last comma
    let formattedGrid = data.grid.map(row => `[${row.join(', ')}],`).join(`\n${indent + indent}`);
    formattedGrid = formattedGrid.substring(0, formattedGrid.length - 1);

    // Formatting the palette and removing the last comma
    let formattedPalette = data.palette.map(color => JSON.stringify(color) + ',').join(`\n${indent + indent}`);
    formattedPalette = formattedPalette.substring(0, formattedPalette.length - 1);

    // Assembling the final code with value and label
    const formattedCode = `data = {
${indent}"value": "none",
${indent}"label": "None",
${indent}"grid": [
${indent + indent}${formattedGrid}
${indent}],
${indent}"palette": [
${indent + indent}${formattedPalette}
${indent}]
}`;

    return formattedCode;
}

// Grid Functions
function drawGrid() {
    const canvas = document.getElementById('pixel-canvas');
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = config.canvasStrokeStyle;
    ctx.lineWidth = 1;

    const cellWidth = canvas.width / gridSize.width;
    const cellHeight = canvas.height / gridSize.height;

    for (let x = 0; x < gridSize.width; x++) {
        for (let y = 0; y < gridSize.height; y++) {
            const xPos = x * cellWidth;
            const yPos = y * cellHeight;

            ctx.fillStyle = grid[x][y] || config.canvasFillColor;
            ctx.fillRect(xPos, yPos, cellWidth, cellHeight);

            ctx.strokeStyle = config.canvasStrokeStyle;
            ctx.strokeRect(xPos, yPos, cellWidth, cellHeight);
        }
    }
}

function changeGridSize(size) {
    const canvas = document.getElementById("pixel-canvas");
    const ctx = canvas.getContext("2d");
    const pixelSize = 16;

    gridSize = parseGridSize(size);
    const maxSize = Math.max(gridSize.width, gridSize.height);
    const canvasWidth = gridSize.width * pixelSize;
    const canvasHeight = gridSize.height * pixelSize;

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let x = 0; x <= canvas.width; x += pixelSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
    }
    for (let y = 0; y <= canvas.height; y += pixelSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
    }

    ctx.strokeStyle = config.canvasStrokeStyle;
    ctx.stroke();

    console.log(`Canvas resized to: ${canvas.width}x${canvas.height}`);

    grid = createEmptyGrid(gridSize.width, gridSize.height, config.canvasFillColor);

    drawGrid();
}

function createEmptyGrid(width, height, defaultValue) {
    return new Array(width).fill(null).map(() => new Array(height).fill(defaultValue));
}

function parseGridSize(size) {
    const dimensions = size.split(",");
    const widthInPixels = parseInt(dimensions[0], 10);
    const heightInPixels = parseInt(dimensions[1], 10);
    return { width: widthInPixels, height: heightInPixels };
}

// Pixel Manipulation Functions
function shiftPixels(dx, dy) {
    const newGrid = createEmptyGrid(gridSize.width, gridSize.height, 0);

    for (let x = 0; x < gridSize.width; x++) {
        for (let y = 0; y < gridSize.height; y++) {
            const newX = (x + dx + gridSize.width) % gridSize.width;
            const newY = (y + dy + gridSize.height) % gridSize.height;
            newGrid[newX][newY] = grid[x][y];
        }
    }

    grid = newGrid;
    drawGrid();
}

function shiftLeft() {
    shiftPixels(-1, 0);
}

function shiftRight() {
    shiftPixels(1, 0);
}

function shiftUp() {
    shiftPixels(0, -1);
}

function shiftDown() {
    shiftPixels(0, 1);
}

// Data Export & Import Functions
function exportGrid() {
    const exportData = {
        grid: [],
        palette: paletteColors.map(color => hexToRgb(color))
    };

    for (let y = 0; y < gridSize.height; y++) {
        const row = [];
        for (let x = 0; x < gridSize.width; x++) {
            const color = grid[x][y];
            const index = colorToIndexMap[color];
            row.push(index === undefined ? 0 : index);
        }
        exportData.grid.push(row);
    }

    const formattedPythonCode = formatPythonCode(exportData);
    const exportTextBox = document.getElementById("export-text-box");
    exportTextBox.value = formattedPythonCode;
    exportTextBox.style.display = 'block';
}

function createColorMapping(oldColors, newColors) {
    const colorMapping = {};
    oldColors.forEach((oldColor, index) => {
        colorMapping[oldColor] = newColors[index];
    });
    return colorMapping;
}

function loadTemplate() {
    const templateSelect = document.getElementById('template-select');
    const selectedTemplateIndex = templateSelect.selectedIndex;

    // Get the selected grid size
    const gridSizeSelect = document.getElementById('grid-size-select');
    const selectedGridSize = gridSizeSelect.value;

    // Use the template data based on the selected grid size
    const templates = gridTemplates[selectedGridSize];

    if (templates && selectedTemplateIndex >= 0) {
        const selectedTemplateData = templates[selectedTemplateIndex];
        loadGridAndPalette(selectedTemplateData);
    }
}

function selectAllText() {
    const textarea = document.getElementById('export-text-box');
    textarea.select();
    textarea.setSelectionRange(0, 99999);
    document.execCommand('copy');
}

function copyToClipboard() {
    const textarea = document.getElementById('export-text-box');
    textarea.select();
    document.execCommand('copy');
}

function loadGridAndPalette(templateData) {
    paletteColors = templateData.palette.map((rgbColor) => {
        return rgbToHex(rgbColor.r, rgbColor.g, rgbColor.b);
    });

    createPalette();

    gridSize = { width: templateData.grid[0].length, height: templateData.grid.length };
    grid = createEmptyGrid(gridSize.width, gridSize.height, '');

    for (let x = 0; x < gridSize.width; x++) {
        for (let y = 0; y < gridSize.height; y++) {
            const colorIndex = templateData.grid[y][x];
            grid[x][y] = paletteColors[colorIndex];
        }
    }

    const canvas = document.getElementById('pixel-canvas');
    const cellWidth = canvas.width / gridSize.width;
    const cellHeight = canvas.height / gridSize.height;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let x = 0; x < gridSize.width; x++) {
        for (let y = 0; y < gridSize.height; y++) {
            const xPos = x * cellWidth;
            const yPos = y * cellHeight;

            ctx.fillStyle = grid[x][y];
            ctx.fillRect(xPos, yPos, cellWidth, cellHeight);

            ctx.strokeStyle = config.canvasStrokeStyle;
            ctx.strokeRect(xPos, yPos, cellWidth, cellHeight);
        }
    }
}

function populateTemplateDropdown() {
    const templateSelectContainer = document.getElementById("template-select-container");
    const templateSelect = document.getElementById("template-select");

    templateSelect.innerHTML = ''; // Clear existing options

    // Get the selected grid size
    const gridSizeSelect = document.getElementById('grid-size-select');
    const selectedGridSize = gridSizeSelect.value;

    // Use the template data based on the selected grid size
    const templates = gridTemplates[selectedGridSize];

    if (templates) {
        templates.forEach((template, index) => {
            const option = document.createElement('option');
            option.value = `template${index + 1}`;
            option.textContent = `${template.label}`;
            templateSelect.appendChild(option);
        });
    } else {
        // Handle the case when templates are not available for the selected grid size
        const option = document.createElement('option');
        option.textContent = 'No templates available';
        templateSelect.appendChild(option);
    }

    loadTemplate(); // Load the default template
}

// Event Listeners
const canvas = document.getElementById('pixel-canvas');
canvas.addEventListener('mousedown', function (e) {
    const cellSize = canvas.width / gridSize.width;
    const x = Math.floor(e.offsetX / cellSize);
    const y = Math.floor(e.offsetY / cellSize);

    grid[x][y] = selectedColor;
    drawGrid();
});

document.getElementById('shift-left').addEventListener('click', shiftLeft);
document.getElementById('shift-right').addEventListener('click', shiftRight);
document.getElementById('shift-up').addEventListener('click', shiftUp);
document.getElementById('shift-down').addEventListener('click', shiftDown);

const templateSelect = document.getElementById('template-select');
templateSelect.addEventListener('change', loadTemplate);

function populateGridSizeDropdown() {
    const gridSizeSelect = document.getElementById('grid-size-select');
    gridSizeSelect.innerHTML = '';

    for (const gridLabel in config.unicornGridSizes) {
        const option = document.createElement('option');
        option.value = config.unicornGridSizes[gridLabel];
        option.textContent = gridLabel;
        if (gridLabel === defaultUnicornGrid) {
            option.selected = true;
        }
        gridSizeSelect.appendChild(option);
    }
}

function initializeGrid() {
    const gridSizeSelect = document.getElementById('grid-size-select');
    
    // Set the default selected grid size from the config
    gridSizeSelect.value = config.defaultUnicornGrid;

    gridSizeSelect.addEventListener('change', function () {
        const selectedGridSize = gridSizeSelect.value;
        changeGridSize(selectedGridSize);
        populateTemplateDropdown(); // Populate the template dropdown based on the new grid size
    });

    // Initialize the grid size based on the default selection
    changeGridSize(config.unicornGridSizes[config.defaultUnicornGrid]);
    parseGridSize(config.unicornGridSizes[config.defaultUnicornGrid]);
}

// Load templates from an external JSON file
function loadTemplatesFromJSON() {
    const xhr = new XMLHttpRequest();
    xhr.overrideMimeType("application/json");
    xhr.open("GET", "images.json", true);
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            const jsonContent = JSON.parse(xhr.responseText);
            handleTemplates(jsonContent);
        }
    };
    xhr.send(null);
}

// Handle the loaded templates
function handleTemplates(templates) {
    gridTemplates = templates; // Assuming gridTemplates is a global variable used to store template data
    populateTemplateDropdown();
    loadTemplate(); // Load the default template
}

document.addEventListener("DOMContentLoaded", function () {
    loadTemplatesFromJSON(); // Load templates when the DOM is ready
    populateGridSizeDropdown();
    createPalette();
    initializeGrid();
    drawGrid();

    // Apply the default grid size to the select menu on initial load
    const gridSizeSelect = document.getElementById('grid-size-select');
    const defaultGridSize = config.defaultUnicornGrid;
    if (gridSizeSelect) {
        gridSizeSelect.value = config.unicornGridSizes[defaultGridSize];
        changeGridSize(config.unicornGridSizes[defaultGridSize]);
        populateTemplateDropdown(); // Populate the template dropdown based on the new grid size
    }
});



