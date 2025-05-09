// Unicorn Pixel Art Editor
// Version 1.0 by Jim Moore - September 2023
// A simple tool to generate and export pixel maps and palettes for Pimoroni Unicorn LED panels.
// For more information, visit: https://shop.pimoroni.com/products/space-unicorns
// Read the documentation for guidance on using this code.
// Repurpose this code as needed

// Initialize default palette
const defaultPalette = [
    '#000000', // Black
    '#ff0000', // Red
    '#00ff00', // Green
    '#0000ff', // Blue
    '#ffff00', // Yellow
    '#ff00ff', // Magenta
    '#00ffff', // Cyan
    '#ffffff'  // White
];

// Configuration Object
const config = {
    unicornGridSizes: {
        'Stellar Unicorn': '16,16',
        'Galactic Unicorn': '53,11',
        'Cosmic Unicorn': '32,32'
    },
    defaultUnicornGrid: 'Stellar Unicorn',
    defaultPaletteColors: defaultPalette,
    canvasStrokeStyle: '#9a9a9a',
    canvasFillColor: '#000000'
};

// Initialization
const defaultUnicornGrid = config.defaultUnicornGrid;
var gridSize = parseGridSize(config.unicornGridSizes[defaultUnicornGrid]);
let grid = createEmptyGrid(gridSize.width, gridSize.height, config.canvasFillColor);
let paletteColors = [...defaultPalette];
let selectedColor = defaultPalette[0];
let jsonData;

// Color Maps Setup
const colorToIndexMap = {};
const indexToGridPositionsMap = {};

// Python code templates for different Unicorn types
const pythonTemplates = {
    'Stellar Unicorn': `from stellar import StellarUnicorn
from picographics import PicoGraphics, DISPLAY_STELLAR_UNICORN
import time

# create a PicoGraphics framebuffer to draw into
graphics = PicoGraphics(display=DISPLAY_STELLAR_UNICORN)

# create our StellarUnicorn object
su = StellarUnicorn()

# paste your generated code from the Unicorn pixel art tool in here
{IMAGE_DATA}

# grab the data from the code
palette_data = image["palette"]
pixel_data = image["grid"]

# pen colours to draw with
BG = graphics.create_pen(0, 0, 0)

while True:
    # clear the graphics object
    graphics.set_pen(BG)
    graphics.clear()

    # draw the graphics
    for y, row in enumerate(pixel_data):
        for x, pixel in enumerate(row):
            r = palette_data[pixel]["r"]
            g = palette_data[pixel]["g"]
            b = palette_data[pixel]["b"]
            FG = graphics.create_pen(r, g, b)
            graphics.set_pen(FG)
            graphics.pixel(x, y)

    # update the display
    su.update(graphics)

    time.sleep(0.02)`,

    'Galactic Unicorn': `from galactic import GalacticUnicorn
from picographics import PicoGraphics, DISPLAY_GALACTIC_UNICORN
import time

# create a PicoGraphics framebuffer to draw into
graphics = PicoGraphics(display=DISPLAY_GALACTIC_UNICORN)

# create our GalacticUnicorn object
gu = GalacticUnicorn()

# paste your generated code from the Unicorn pixel art tool in here
{IMAGE_DATA}

# grab the data from the code
palette_data = image["palette"]
pixel_data = image["grid"]

# pen colours to draw with
BG = graphics.create_pen(0, 0, 0)

while True:
    # clear the graphics object
    graphics.set_pen(BG)
    graphics.clear()

    # draw the graphics
    for y, row in enumerate(pixel_data):
        for x, pixel in enumerate(row):
            r = palette_data[pixel]["r"]
            g = palette_data[pixel]["g"]
            b = palette_data[pixel]["b"]
            FG = graphics.create_pen(r, g, b)
            graphics.set_pen(FG)
            graphics.pixel(x, y)

    # update the display
    gu.update(graphics)

    time.sleep(0.02)`,

    'Cosmic Unicorn': `from cosmic import CosmicUnicorn
from picographics import PicoGraphics, DISPLAY_COSMIC_UNICORN
import time

# create a PicoGraphics framebuffer to draw into
graphics = PicoGraphics(display=DISPLAY_COSMIC_UNICORN)

# create our CosmicUnicorn object
cu = CosmicUnicorn()

# paste your generated code from the Unicorn pixel art tool in here
{IMAGE_DATA}

# grab the data from the code
palette_data = image["palette"]
pixel_data = image["grid"]

# pen colours to draw with
BG = graphics.create_pen(0, 0, 0)

while True:
    # clear the graphics object
    graphics.set_pen(BG)
    graphics.clear()

    # draw the graphics
    for y, row in enumerate(pixel_data):
        for x, pixel in enumerate(row):
            r = palette_data[pixel]["r"]
            g = palette_data[pixel]["g"]
            b = palette_data[pixel]["b"]
            FG = graphics.create_pen(r, g, b)
            graphics.set_pen(FG)
            graphics.pixel(x, y)

    # update the display
    cu.update(graphics)

    time.sleep(0.02)`
};

// Initialize empty templates object
let gridTemplates = {};

// Dynamic color similarity threshold based on palette size
function getColorSimilarityThreshold(paletteSize) {
    if (paletteSize <= 16) {
        return 3;  // Very conservative for small palettes
    } else if (paletteSize <= 32) {
        return 8;  // Moderate for medium palettes
    } else if (paletteSize <= 64) {
        return 15; // More aggressive for large palettes
    } else {
        return 25; // Very aggressive for very large palettes
    }
}

// Calculate color distance using Euclidean distance
function getColorDistance(color1, color2) {
    const rDiff = color1.r - color2.r;
    const gDiff = color1.g - color2.g;
    const bDiff = color1.b - color2.b;
    return Math.sqrt(rDiff * rDiff + gDiff * gDiff + bDiff * bDiff);
}

// Find similar color in palette
function findSimilarColor(color, palette, threshold) {
    for (let i = 0; i < palette.length; i++) {
        if (getColorDistance(color, palette[i]) <= threshold) {
            return i;
        }
    }
    return -1;
}

// Palette Functions
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

function createPalette() {
    const paletteContainer = document.getElementById('color-palette');
    paletteContainer.innerHTML = '';

    // Ensure we have at least the default palette
    if (paletteColors.length === 0) {
        paletteColors = [...defaultPalette];
    }

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

    // Select the first color by default
    const defaultSelectedSwatch = document.querySelector('.swatch:first-child');
    if (defaultSelectedSwatch) {
    highlightSelectedSwatch(defaultSelectedSwatch);
        selectedColor = paletteColors[0];
    }
}

let selectedPaletteIndex = -1;

function updatePalettePreview() {
    const palettePreview = document.getElementById('palettePreview');
    palettePreview.innerHTML = '';
    
    // Add existing colors
    paletteColors.forEach((color, index) => {
        const swatch = document.createElement('div');
        swatch.classList.add('swatch');
        swatch.style.backgroundColor = color;
        swatch.addEventListener('click', () => selectPaletteColor(index));
        palettePreview.appendChild(swatch);
    });

    // Add the "+" button
    const addButton = document.createElement('div');
    addButton.classList.add('swatch', 'add-color');
    addButton.innerHTML = '+';
    addButton.title = 'Add new color';
    addButton.addEventListener('click', addNewColor);
    palettePreview.appendChild(addButton);
}

function addNewColor() {
    // Add a new black color to the palette
    const newColor = '#000000';
    paletteColors.push(newColor);
    
    // Update the preview and select the new color
    updatePalettePreview();
    selectPaletteColor(paletteColors.length - 1);
}

function editPalette() {
    const modal = new bootstrap.Modal(document.getElementById('paletteEditorModal'));
    
    // Store the original palette for mapping later
    const originalPalette = [...paletteColors];
    
    // Initialize the palette preview with the add button
    updatePalettePreview();

    // Select the first color by default
    selectPaletteColor(0);

    // Set up event listeners for RGB sliders and inputs
    ['red', 'green', 'blue'].forEach(color => {
        const slider = document.getElementById(`${color}Slider`);
        const input = document.getElementById(`${color}Input`);
        
        slider.addEventListener('input', () => {
            input.value = slider.value;
            updateColorFromRGB();
        });
        
        input.addEventListener('input', () => {
            let value = parseInt(input.value);
            if (isNaN(value)) value = 0;
            if (value < 0) value = 0;
            if (value > 255) value = 255;
            slider.value = value;
            updateColorFromRGB();
        });
    });

    // Set up hex color input handler
    const hexInput = document.getElementById('hexColorInput');
    hexInput.addEventListener('input', () => {
        if (/^#[0-9A-F]{6}$/i.test(hexInput.value)) {
            updateColorFromHex(hexInput.value);
        }
    });
    
    // Set up delete button handler
    const deleteButton = document.getElementById('delete-color-btn');
    if (deleteButton) {
        deleteButton.addEventListener('click', () => {
            if (selectedPaletteIndex > 0) { // Don't allow deleting the first color
                handleColorDelete(selectedPaletteIndex);
            }
        });
    }

    // Set up save button handler
    document.getElementById('savePaletteBtn').addEventListener('click', () => {
        // Update the grid with the new colors
        updateGridColors(originalPalette);
        
        // Update the main palette display
            createPalette();

        // Redraw the grid with updated colors
        drawGrid();
        
        modal.hide();
    });

    modal.show();
}

function updateGridColors(originalPalette) {
    // Create a mapping from old colors to new colors
    const colorMapping = {};
    originalPalette.forEach((oldColor, index) => {
        if (index < paletteColors.length) {
            colorMapping[oldColor] = paletteColors[index];
        }
    });

    // Update the grid with new colors
            for (let x = 0; x < gridSize.width; x++) {
                for (let y = 0; y < gridSize.height; y++) {
                    const currentColor = grid[x][y];
                    if (colorMapping.hasOwnProperty(currentColor)) {
                        grid[x][y] = colorMapping[currentColor];
                    }
                }
            }

    // Update selected color if it was changed
    if (colorMapping.hasOwnProperty(selectedColor)) {
        selectedColor = colorMapping[selectedColor];
    }
}

function selectPaletteColor(index) {
    selectedPaletteIndex = index;
    const color = paletteColors[index];
    const rgb = hexToRgb(color);
    
    // Update sliders and inputs
    document.getElementById('redSlider').value = rgb.r;
    document.getElementById('greenSlider').value = rgb.g;
    document.getElementById('blueSlider').value = rgb.b;
    document.getElementById('redInput').value = rgb.r;
    document.getElementById('greenInput').value = rgb.g;
    document.getElementById('blueInput').value = rgb.b;
    document.getElementById('hexColorInput').value = color;
    document.getElementById('currentColorPreview').style.backgroundColor = color;
    
    // Update delete button visibility
    const deleteColorBtn = document.getElementById('delete-color-btn');
    if (deleteColorBtn) {
        if (index > 0) {
            deleteColorBtn.style.display = 'inline-block';
        } else {
            deleteColorBtn.style.display = 'none';
        }
    }

    // Update selected state in preview
    const swatches = document.querySelectorAll('#palettePreview .swatch');
    swatches.forEach((swatch, i) => {
        swatch.classList.toggle('selected', i === index);
    });
}

function updateColorFromRGB() {
    if (selectedPaletteIndex === -1) return;
    
    const r = parseInt(document.getElementById('redSlider').value);
    const g = parseInt(document.getElementById('greenSlider').value);
    const b = parseInt(document.getElementById('blueSlider').value);
    
    const hex = rgbToHex(r, g, b);
    document.getElementById('hexColorInput').value = hex;
    document.getElementById('currentColorPreview').style.backgroundColor = hex;
    
    // Update the palette
    paletteColors[selectedPaletteIndex] = hex;
    const swatch = document.querySelectorAll('#palettePreview .swatch')[selectedPaletteIndex];
    if (swatch) {
        swatch.style.backgroundColor = hex;
    }
}

function updateColorFromHex(hex) {
    if (selectedPaletteIndex === -1) return;
    
    const rgb = hexToRgb(hex);
    document.getElementById('redSlider').value = rgb.r;
    document.getElementById('greenSlider').value = rgb.g;
    document.getElementById('blueSlider').value = rgb.b;
    document.getElementById('redInput').value = rgb.r;
    document.getElementById('greenInput').value = rgb.g;
    document.getElementById('blueInput').value = rgb.b;
    document.getElementById('currentColorPreview').style.backgroundColor = hex;
    
    // Update the palette
    paletteColors[selectedPaletteIndex] = hex;
    const swatch = document.querySelectorAll('#palettePreview .swatch')[selectedPaletteIndex];
    if (swatch) {
        swatch.style.backgroundColor = hex;
    }
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
    const formattedCode = `image = {
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

    // Parse the size string into width and height
    gridSize = parseGridSize(size);
    
    // Set canvas dimensions
    const canvasWidth = gridSize.width * pixelSize;
    const canvasHeight = gridSize.height * pixelSize;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Reset everything to defaults
    grid = createEmptyGrid(gridSize.width, gridSize.height, config.canvasFillColor);
    paletteColors = [...defaultPalette];
    createPalette();
    
    // Update pixel size display
    const pixelSizeSpan = document.getElementById('pixel-size');
    if (pixelSizeSpan) {
        pixelSizeSpan.textContent = `${gridSize.width} x ${gridSize.height}`;
    }

    // Reset template selection to first option
    const templateSelect = document.getElementById('template-select');
    if (templateSelect) {
        populateTemplateDropdown();
    }

    // Clear any export text
    const exportTextBox = document.getElementById("export-text-box");
    if (exportTextBox) {
        exportTextBox.textContent = '';
        exportTextBox.style.display = 'none';
    }

    // Hide export buttons
    toggleExportButtons(false);

    // Clear any image preview
    const imagePreviewContainer = document.getElementById('image-preview-container');
    const imagePreview = document.getElementById('image-preview');
    if (imagePreviewContainer && imagePreview) {
        imagePreview.innerHTML = '';
        imagePreviewContainer.style.display = 'none';
    }

    // Reset file input
    const imageFileInput = document.getElementById('image-file-input');
    if (imageFileInput) {
        imageFileInput.value = '';
    }

    // Draw grid lines
    ctx.beginPath();
    for (let x = 0; x <= gridSize.width; x++) {
        ctx.moveTo(x * pixelSize, 0);
        ctx.lineTo(x * pixelSize, canvasHeight);
    }
    for (let y = 0; y <= gridSize.height; y++) {
        ctx.moveTo(0, y * pixelSize);
        ctx.lineTo(canvasWidth, y * pixelSize);
    }
    ctx.strokeStyle = config.canvasStrokeStyle;
    ctx.stroke();

    // Draw the grid
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
    exportTextBox.textContent = formattedPythonCode;
    exportTextBox.style.display = 'block';
    toggleExportButtons(true);
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

const selectButton = document.getElementById('select-all-button');
selectButton.addEventListener('click', selectAllText);

function selectAllText() {
    const preElement = document.getElementById('export-text-box');
    const selection = window.getSelection();
    const range = document.createRange();

    range.selectNodeContents(preElement);
    selection.removeAllRanges();
    selection.addRange(range);
}

// Add an event listener to the "Copy to Clipboard" button
const copyButton = document.getElementById('copy-clipboard-button');
copyButton.addEventListener('click', copyToClipboard);

// Function to copy text to the clipboard
function copyToClipboard() {
    const preElement = document.getElementById('export-text-box');
    const textToCopy = preElement.textContent;

    navigator.clipboard.writeText(textToCopy)

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

function populateGridSizeDropdown() {
    const gridSizeSelect = document.getElementById('grid-size-select');
    gridSizeSelect.innerHTML = '';

    // Add placeholder option
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Select Grid Size...';
    placeholder.disabled = true;
    // Only set as selected if no value is set
    if (!gridSizeSelect.value) {
        placeholder.selected = true;
    }
    gridSizeSelect.appendChild(placeholder);

    // Add grid size options
    for (const gridLabel in config.unicornGridSizes) {
        const option = document.createElement('option');
        option.value = config.unicornGridSizes[gridLabel];
        option.textContent = gridLabel;
        gridSizeSelect.appendChild(option);
    }
}

function populateTemplateDropdown() {
    const templateSelect = document.getElementById('template-select');
    templateSelect.innerHTML = '';

    // Add placeholder option
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Select Template...';
    placeholder.disabled = true;
    placeholder.selected = true;
    templateSelect.appendChild(placeholder);

    // Get the selected grid size
    const gridSizeSelect = document.getElementById('grid-size-select');
    const selectedGridSize = gridSizeSelect.value;

    // Add templates if they exist for this grid size, skipping any with label 'None' or value 'none'
    if (gridTemplates && gridTemplates[selectedGridSize]) {
        gridTemplates[selectedGridSize].forEach((template) => {
            if (
                template.label && template.label.toLowerCase() === 'none' ||
                template.value && template.value.toLowerCase() === 'none'
            ) {
                // Skip 'None' entry
                return;
            }
            const option = document.createElement('option');
            option.value = template.value;
            option.textContent = template.label;
            templateSelect.appendChild(option);
        });
    }
}

// Event Listeners
// Enable drawing while dragging with the mouse
let isDrawing = false;
let drawStartPosition = null;
let previewGrid = null; // Store the preview version of the grid

// Get grid position from mouse event
function getGridPositionFromEvent(e) {
    const rect = canvas.getBoundingClientRect();
    
    // Get mouse position relative to canvas with higher precision
    const mouseX = (e.clientX - rect.left);
    const mouseY = (e.clientY - rect.top);
    
    // Convert to canvas coordinates with higher precision
    const canvasX = mouseX * (canvas.width / rect.width);
    const canvasY = mouseY * (canvas.height / rect.height);
    
    // Calculate grid position
    const x = Math.floor(canvasX / (canvas.width / gridSize.width));
    const y = Math.floor(canvasY / (canvas.height / gridSize.height));
    
    return { 
        x, 
        y,
        // Add exact position within the grid for higher precision
        exactX: canvasX / (canvas.width / gridSize.width),
        exactY: canvasY / (canvas.height / gridSize.height)
    };
}

const canvas = document.getElementById('pixel-canvas');
canvas.addEventListener('mousedown', function (e) {
    if (e.button !== 0) return; // Only left mouse button
    
    isDrawing = true;
    const pos = getGridPositionFromEvent(e);
    previewLastPos = null; // Reset last position
    
    // Different behavior based on selected tool
    switch (currentTool) {
        case 'draw':
            fillPixelFromEvent(e);
            break;
        case 'fill':
            if (pos.x >= 0 && pos.x < gridSize.width && pos.y >= 0 && pos.y < gridSize.height) {
                const targetColor = grid[pos.x][pos.y];
                floodFill(pos.x, pos.y, targetColor, selectedColor);
                drawGrid();
            }
            break;
        case 'square':
        case 'circle':
            drawStartPosition = pos;
            // Create a copy of the current grid for preview
            previewGrid = JSON.parse(JSON.stringify(grid));
            break;
    }
});

canvas.addEventListener('mousemove', function (e) {
    if (!isDrawing) return;
    
    const currentPos = getGridPositionFromEvent(e);
    
    switch (currentTool) {
        case 'draw':
            fillPixelFromEvent(e);
            break;
        case 'square':
        case 'circle':
            if (drawStartPosition) {
                // Always redraw on movement for better responsiveness
                // Create a fresh copy of the original grid
                previewGrid = JSON.parse(JSON.stringify(grid));
                
                // Draw the preview shape on the preview grid
                if (currentTool === 'square') {
                    drawRectOnGrid(previewGrid, 
                        drawStartPosition.x, 
                        drawStartPosition.y, 
                        currentPos.x, 
                        currentPos.y, 
                        selectedColor, 
                        false);
                } else if (currentTool === 'circle') {
                    drawShapeOnGrid(previewGrid, 
                        drawStartPosition.x, 
                        drawStartPosition.y, 
                        currentPos.x, 
                        currentPos.y, 
                        selectedColor,
                        false);
                }
                
                // Draw the preview
                drawGridWithPreview(previewGrid);
                previewLastPos = { x: currentPos.x, y: currentPos.y };
            }
            break;
    }
});

canvas.addEventListener('mouseup', function (e) {
    if (e.button !== 0) return; // Only left mouse button
    
    if (isDrawing) {
        const endPos = getGridPositionFromEvent(e);
        
        switch (currentTool) {
            case 'square':
                if (drawStartPosition) {
                    drawRectOnGrid(grid, drawStartPosition.x, drawStartPosition.y, endPos.x, endPos.y, selectedColor, false);
                    drawGrid();
                }
                break;
            case 'circle':
                if (drawStartPosition) {
                    drawShapeOnGrid(grid, drawStartPosition.x, drawStartPosition.y, endPos.x, endPos.y, selectedColor, false);
                    drawGrid();
                }
                break;
        }
        
        drawStartPosition = null;
        previewGrid = null;
        previewLastPos = null;
        isDrawing = false;
    }
});

canvas.addEventListener('mouseleave', function () {
    if (isDrawing && (currentTool === 'square' || currentTool === 'circle')) {
        // If mouse leaves canvas while drawing a shape, revert to original grid
        drawGrid();
    }
    isDrawing = false;
    drawStartPosition = null;
    previewGrid = null;
    previewLastPos = null;
});

function fillPixelFromEvent(e) {
    const pos = getGridPositionFromEvent(e);
    const x = pos.x;
    const y = pos.y;
    
    // Debug output
    console.log('Grid:', x, y, 'Max:', gridSize.width, gridSize.height);
    
    // Check if the coordinates are within bounds
    if (x >= 0 && x < gridSize.width && y >= 0 && y < gridSize.height) {
    grid[x][y] = selectedColor;
    drawGrid();
    }
}

// Add event listeners for tool buttons
document.addEventListener("DOMContentLoaded", function() {
    // ... existing code ...
    
    // Add tool button listeners
    document.getElementById('draw-tool').addEventListener('click', () => selectTool('draw'));
    document.getElementById('fill-tool').addEventListener('click', () => selectTool('fill'));
    document.getElementById('square-tool').addEventListener('click', () => selectTool('square'));
    document.getElementById('circle-tool').addEventListener('click', () => selectTool('circle'));
});

document.getElementById('shift-left').addEventListener('click', shiftLeft);
document.getElementById('shift-right').addEventListener('click', shiftRight);
document.getElementById('shift-up').addEventListener('click', shiftUp);
document.getElementById('shift-down').addEventListener('click', shiftDown);

const templateSelect = document.getElementById('template-select');
templateSelect.addEventListener('change', loadTemplate);

function initializeGrid() {
    const gridSizeSelect = document.getElementById('grid-size-select');
    
    // Set the default selected grid size from the config
    gridSizeSelect.value = config.defaultUnicornGrid;

    gridSizeSelect.addEventListener('change', function () {
        const selectedGridSize = gridSizeSelect.value;
        changeGridSize(selectedGridSize);
        populateTemplateDropdown(); // Populate the template dropdown based on the new grid size
        updatePixelSizeDisplay(selectedGridSize); // Update the pixel size display
    });

    // Initialize the grid size based on the default selection
    changeGridSize(config.unicornGridSizes[config.defaultUnicornGrid]);
    parseGridSize(config.unicornGridSizes[config.defaultUnicornGrid]);
    // Initialize pixel size display
    updatePixelSizeDisplay(config.unicornGridSizes[config.defaultUnicornGrid]);
}

// Function to update the pixel size display
function updatePixelSizeDisplay(size) {
    const [width, height] = size.split(',');
    const pixelSizeSpan = document.getElementById('pixel-size');
    pixelSizeSpan.textContent = `${width} x ${height}`;
}

// Function to show/hide the "Select All" and "Copy to Clipboard" buttons
function toggleExportButtons(display) {
    const selectButton = document.getElementById('select-all-button');
    const copyButton = document.getElementById('copy-clipboard-button');
    const fullCodeButton = document.getElementById('show-full-code-button');
    const exportPngButton = document.getElementById('export-png-button');
    
    if (display) {
        selectButton.style.display = 'inline-block';
        copyButton.style.display = 'inline-block';
        fullCodeButton.style.display = 'inline-block';
        exportPngButton.style.display = 'inline-block';
    } else {
        selectButton.style.display = 'none';
        copyButton.style.display = 'none';
        fullCodeButton.style.display = 'none';
        exportPngButton.style.display = 'none';
    }
}

// Function to export the current pixel art as a PNG file
function exportAsPng() {
    // Create a temporary canvas with the exact pixel dimensions
    // We'll make it larger for better quality
    const pixelSize = 10; // Each pixel will be 10x10 in the exported image
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = gridSize.width * pixelSize;
    tempCanvas.height = gridSize.height * pixelSize;
    const ctx = tempCanvas.getContext('2d');
    
    // Optional: Add a background if desired
    ctx.fillStyle = '#ffffff'; // White background
    ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    
    // Draw each pixel at the scaled size
    for (let x = 0; x < gridSize.width; x++) {
        for (let y = 0; y < gridSize.height; y++) {
            ctx.fillStyle = grid[x][y] || config.canvasFillColor;
            ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
        }
    }
    
    // Optional: Draw grid lines for clarity
    const drawGridLines = false; // Set to true if you want grid lines
    if (drawGridLines) {
        ctx.strokeStyle = 'rgba(200, 200, 200, 0.5)'; // Light gray, semi-transparent
        ctx.lineWidth = 0.5;
        
        // Draw vertical lines
        for (let x = 0; x <= gridSize.width; x++) {
            ctx.beginPath();
            ctx.moveTo(x * pixelSize, 0);
            ctx.lineTo(x * pixelSize, tempCanvas.height);
            ctx.stroke();
        }
        
        // Draw horizontal lines
        for (let y = 0; y <= gridSize.height; y++) {
            ctx.beginPath();
            ctx.moveTo(0, y * pixelSize);
            ctx.lineTo(tempCanvas.width, y * pixelSize);
            ctx.stroke();
        }
    }
    
    // Convert canvas to PNG data URL with maximum quality
    const pngDataUrl = tempCanvas.toDataURL('image/png', 1.0);
    
    // Create a download link
    const downloadLink = document.createElement('a');
    
    // Generate a filename based on the current date/time
    const now = new Date();
    const timestamp = `${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;
    
    // Set the filename and download properties
    const gridName = document.getElementById('grid-size-select').options[document.getElementById('grid-size-select').selectedIndex].text.toLowerCase().replace(/\s+/g, '-');
    downloadLink.download = `unicorn-pixel-art-${gridName}-${timestamp}.png`;
    downloadLink.href = pngDataUrl;
    
    // Trigger the download
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
}

// Load templates from an external JSON file
function loadTemplatesFromJSON() {
    fetch('images.json')
        .then(response => {
            if (!response.ok) throw new Error('Failed to load images.json');
            return response.json();
        })
        .then(data => {
            gridTemplates = data;
            populateTemplateDropdown();
        })
        .catch(err => {
            console.warn('Note: images.json not loaded:', err.message);
            // Continue without templates
            populateTemplateDropdown();
        });
}

// Handle the loaded templates
function handleTemplates(templates) {
    gridTemplates = templates; // Assuming gridTemplates is a global variable used to store template data
    populateTemplateDropdown();
    loadTemplate(); // Load the default template
}

// Initialize image analysis functionality
document.addEventListener("DOMContentLoaded", function() {
    // First load templates and populate dropdowns
    loadTemplatesFromJSON();
    populateGridSizeDropdown();
    
    // Set default grid size and trigger change
    const gridSizeSelect = document.getElementById('grid-size-select');
    const defaultSize = config.unicornGridSizes[config.defaultUnicornGrid];
    gridSizeSelect.value = defaultSize;
    changeGridSize(defaultSize);
    updatePixelSizeDisplay(defaultSize);
    
    // Initialize palette and grid
    createPalette();
    drawGrid();
    toggleExportButtons(false);

    // Initialize template dropdown
    populateTemplateDropdown();
    const templateSelect = document.getElementById('template-select');
    if (templateSelect.options.length > 1) {  // If we have templates besides placeholder
        templateSelect.selectedIndex = 1;  // Select first actual template
        loadTemplate();
    }

    // Add event listeners
    const jsonFileInput = document.getElementById('json-file-input');
    jsonFileInput.addEventListener('change', handleJSONFileLoad);
    handleImageFileSelect();

    // Add dropdown change listeners
    gridSizeSelect.addEventListener('change', function() {
        const selectedSize = this.value;
        if (selectedSize && selectedSize !== '') {
            changeGridSize(selectedSize);
            updatePixelSizeDisplay(selectedSize);
        }
    });

    templateSelect.addEventListener('change', function() {
        const selectedTemplate = this.value;
        if (selectedTemplate) {
            loadTemplate();
        }
    });
    
    // Add tool button listeners
    document.getElementById('draw-tool').addEventListener('click', () => selectTool('draw'));
    document.getElementById('fill-tool').addEventListener('click', () => selectTool('fill'));
    document.getElementById('square-tool').addEventListener('click', () => selectTool('square'));
    document.getElementById('circle-tool').addEventListener('click', () => selectTool('circle'));
    
    // Set default tool
    selectTool('draw');

    // Add "Export as PNG" button functionality
    const exportPngButton = document.getElementById('export-png-button');
    if (exportPngButton) {
        exportPngButton.addEventListener('click', exportAsPng);
    }
});

// Function to get the full Python code
function getFullPythonCode() {
    const gridSizeSelect = document.getElementById('grid-size-select');
    const selectedLabel = gridSizeSelect.options[gridSizeSelect.selectedIndex].text;
    const template = pythonTemplates[selectedLabel];
    
    if (!template) {
        return 'Error: Unknown Unicorn type';
    }

    const exportTextBox = document.getElementById("export-text-box");
    const imageData = exportTextBox.textContent || '';
    
    return template.replace('{IMAGE_DATA}', imageData);
}

// Function to show full Python code
function showFullPythonCode() {
    const exportTextBox = document.getElementById("export-text-box");
    const fullCode = getFullPythonCode();
    exportTextBox.textContent = fullCode;
}

// Function to handle loading JSON data
function handleJSONFileLoad(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            let content = e.target.result.trim();
            // Remove any prefix like 'data =' or 'image =' (with optional spaces) before the first '{'
            content = content.replace(/^(data|image)\s*=\s*/, '');
            content = content.trim();
            if (!content.startsWith('{')) {
                alert('Could not find JSON object in file.');
                return;
            }
            const jsonData = JSON.parse(content);
            
            // Check if it's a valid image data structure
            if (!jsonData.grid || !jsonData.palette) {
                alert('Invalid JSON format. File must contain "grid" and "palette" properties.');
                return;
            }

            // Update the grid size based on the loaded data
            const newWidth = jsonData.grid[0].length;
            const newHeight = jsonData.grid.length;
            
            // Find the matching grid size in the config
            let matchingSize = null;
            for (const [label, size] of Object.entries(config.unicornGridSizes)) {
                const [width, height] = size.split(',').map(Number);
                if (width === newWidth && height === newHeight) {
                    matchingSize = label;
                    break;
                }
            }

            if (!matchingSize) {
                alert(`Warning: Grid size ${newWidth}x${newHeight} doesn't match any Unicorn display type.`);
                return;
            }

            // Update the grid size dropdown
            const gridSizeSelect = document.getElementById('grid-size-select');
            gridSizeSelect.value = config.unicornGridSizes[matchingSize];
            
            // Update the grid size
            gridSize = parseGridSize(config.unicornGridSizes[matchingSize]);

            // Load the palette directly from JSON without optimization
            paletteColors = jsonData.palette.map(color => rgbToHex(color.r, color.g, color.b));
            createPalette();

            // Create new grid with the correct dimensions
            grid = createEmptyGrid(gridSize.width, gridSize.height, config.canvasFillColor);

            // Update the grid with the loaded data
            for (let y = 0; y < gridSize.height; y++) {
                for (let x = 0; x < gridSize.width; x++) {
                    const colorIndex = jsonData.grid[y][x];
                    grid[x][y] = paletteColors[colorIndex];
    }
            }

            // Reset template selection to "none"
            const templateSelect = document.getElementById('template-select');
            if (templateSelect) {
                const noneOption = templateSelect.querySelector('option[value="none"]');
                if (noneOption) {
                    templateSelect.value = 'none';
                }
            }

            // Clear any image preview
            const imagePreviewContainer = document.getElementById('image-preview-container');
            const imagePreview = document.getElementById('image-preview');
            if (imagePreviewContainer && imagePreview) {
                imagePreview.innerHTML = '';
                imagePreviewContainer.style.display = 'none';
            }

            // Reset the image file input
            const imageFileInput = document.getElementById('image-file-input');
            if (imageFileInput) {
                imageFileInput.value = '';
            }

            // Redraw the grid
            drawGrid();

        } catch (error) {
            alert('Error loading JSON file: ' + error.message);
        }
    };
    reader.readAsText(file);
}

// Function to clear all pixels and reset to the default palette
function clearGridAndPalette() {
    if (!confirm('Are you sure you want to clear the editor? All pixels and colours will revert to the defaults')) {
        return;
    }
    // Reset paletteColors to default
    paletteColors = [...config.defaultPaletteColors];
    createPalette();

    // Reset grid to default color
    grid = createEmptyGrid(gridSize.width, gridSize.height, config.canvasFillColor);
    drawGrid();

    // Reset template selection to None (first option)
    const templateSelect = document.getElementById('template-select');
    if (templateSelect && templateSelect.options.length > 0) {
        templateSelect.selectedIndex = 0;
    }
}

// Function to save the current image as a template
function saveCurrentAsTemplate() {
    const gridSizeSelect = document.getElementById('grid-size-select');
    const selectedGridSize = gridSizeSelect.value;
    const templateName = prompt('Enter a name for this template:');
    if (!templateName) return;

    // Format value and label
    const value = templateName.trim().toLowerCase().replace(/\s+/g, '-');
    const label = templateName.trim().replace(/\b\w/g, c => c.toUpperCase());

    // Build the template object in the same format as Skyline
    const paletteRGB = paletteColors.map(hex => hexToRgb(hex));
    const paletteMap = {};
    paletteColors.forEach((color, idx) => { paletteMap[color] = idx; });
    const gridIndexes = [];
    for (let y = 0; y < gridSize.height; y++) {
        const row = [];
        for (let x = 0; x < gridSize.width; x++) {
            const color = grid[x][y];
            row.push(paletteMap[color] !== undefined ? paletteMap[color] : 0);
        }
        gridIndexes.push(row);
    }
    const newTemplate = {
        value: value,
        label: label,
        grid: gridIndexes,
        palette: paletteRGB
    };

    // Add to the correct section in gridTemplates
    if (!window.gridTemplates) window.gridTemplates = {};
    if (!window.gridTemplates[selectedGridSize]) window.gridTemplates[selectedGridSize] = [];
    window.gridTemplates[selectedGridSize].push(newTemplate);

    // Update the template dropdown
    populateTemplateDropdown();
    // Select the newly added template
    const templateSelect = document.getElementById('template-select');
    if (templateSelect) {
        templateSelect.selectedIndex = window.gridTemplates[selectedGridSize].length - 1;
    }
    alert('Template saved!');
}

// Function to load example.json and show its contents in a lightbox modal
function loadExampleJson() {
    // Get the currently selected grid size
    const gridSizeSelect = document.getElementById('grid-size-select');
    const selectedSize = gridSizeSelect.value;

    fetch('example.json')
        .then(response => {
            if (!response.ok) throw new Error('Failed to load example.json');
            return response.json();
        })
        .then(data => {
            // Get only the templates for the selected size
            const templates = data[selectedSize];
            if (!templates) {
                alert('No examples found for the selected grid size.');
                return;
            }

            // Find the test-card template
            const testCard = templates.find(t => t.value === 'test-card');
            if (!testCard) {
                alert('No test-card example found for the selected grid size.');
                return;
            }

            // Format just the inner template object
            let formatted = '{\n';
            formatted += `    "value": "${testCard.value}",\n`;
            formatted += `    "label": "${testCard.label}",\n`;
            formatted += '    "grid": [\n';
            testCard.grid.forEach((row, rowIndex) => {
                formatted += `        [${row.join(', ')}]${rowIndex < testCard.grid.length - 1 ? ',' : ''}\n`;
            });
            formatted += '    ],\n';
            formatted += '    "palette": [\n';
            testCard.palette.forEach((color, colorIndex) => {
                formatted += `        {"r":${color.r},"g":${color.g},"b":${color.b}}${colorIndex < testCard.palette.length - 1 ? ',' : ''}\n`;
            });
            formatted += '    ]\n';
            formatted += '}';
            
            // Set the content in the modal
            document.getElementById('jsonLightboxContent').textContent = formatted;
            // Show the modal using Bootstrap's modal API
            const modal = new bootstrap.Modal(document.getElementById('jsonLightboxModal'));
            modal.show();
        })
        .catch(err => {
            alert('Error loading example.json: ' + err.message);
        });
}

// Add a stub for handleImageFileSelect if not already defined
if (typeof handleImageFileSelect !== 'function') {
    function handleImageFileSelect() {
        const imageFileInput = document.getElementById('image-file-input');
        if (!imageFileInput) return;

        // Add event listener for file selection
        imageFileInput.addEventListener('change', function(event) {
            const file = event.target.files[0];
            if (!file) return;
            
            // Only process image files
            if (!file.type.match('image.*')) {
                alert('Please select an image file.');
                return;
            }
            
            const reader = new FileReader();
            reader.onload = function(e) {
                // Create an image element to load the file
                const img = new Image();
                img.onload = function() {
                    // Get current grid dimensions
                    const gridSizeSelect = document.getElementById('grid-size-select');
                    const selectedSize = gridSizeSelect.value;
                    const [width, height] = selectedSize.split(',').map(Number);
                    
                    // Check if the image dimensions match the required grid dimensions
                    // We'll get the natural dimensions before any resizing
                    const originalWidth = img.naturalWidth;
                    const originalHeight = img.naturalHeight;
                    
                    // Only allow exact matching dimensions
                    if (originalWidth !== width || originalHeight !== height) {
                        alert(`Image dimensions (${originalWidth}×${originalHeight}) don't match the selected grid size (${width}×${height}).\n\nPlease resize your image to exactly ${width}×${height} pixels or select a different grid size.`);
                        return;
                    }
                    
                    // Create a canvas to process the image
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    canvas.width = width;
                    canvas.height = height;
                    
                    // Draw the image to the canvas (no resizing needed since dimensions match)
                    ctx.drawImage(img, 0, 0);
                    
                    // Get the pixel data
                    const imageData = ctx.getImageData(0, 0, width, height);
                    const pixels = imageData.data;
                    
                    // Extract all colors from the image
                    const colorFrequency = {};
                    const pixelGrid = [];
                    
                    // Initialize pixel grid and collect color frequencies
                    for (let y = 0; y < height; y++) {
                        const row = [];
                        for (let x = 0; x < width; x++) {
                            const index = (y * width + x) * 4;
                            const r = pixels[index];
                            const g = pixels[index + 1];
                            const b = pixels[index + 2];
                            const a = pixels[index + 3];
                            
                            // Skip transparent pixels
                            if (a < 128) {
                                row.push({ r: 0, g: 0, b: 0 });
                                continue;
                            }
                            
                            const color = { r, g, b };
                            row.push(color);
                            
                            // Count color frequency
                            const colorKey = `${r},${g},${b}`;
                            colorFrequency[colorKey] = (colorFrequency[colorKey] || 0) + 1;
                        }
                        pixelGrid.push(row);
                    }
                    
                    // Get an array of unique colors sorted by frequency (most frequent first)
                    const uniqueColors = Object.keys(colorFrequency)
                        .map(key => {
                            const [r, g, b] = key.split(',').map(Number);
                            return { r, g, b, count: colorFrequency[key] };
                        })
                        .sort((a, b) => b.count - a.count);
                    
                    // Determine optimal palette size based on image complexity
                    // Use a smaller palette for Unicorn displays (8-32 colors max)
                    const maxPaletteSize = 32; // Increased from 28 to 32
                    
                    // Create a balanced palette with diverse colors
                    let optimizedPalette = [];
                    
                    // Start with the most frequent color
                    optimizedPalette.push(uniqueColors[0]);
                    
                    // Even stricter similarity threshold to ensure more diverse colors
                    const similarityThreshold = 15; // Increased from 5 to ensure more diversity
                    
                    // Divide color space into regions to ensure full coverage
                    // We'll score each color based on both frequency and distance from existing colors
                    const calculateScoreForColor = (color) => {
                        // Base score is frequency relative to most common color
                        const frequencyScore = Math.sqrt(color.count / uniqueColors[0].count); // Square root to boost less frequent colors
                        
                        // Calculate minimum distance to any color in our palette
                        let minDistance = Number.MAX_VALUE;
                        for (const existingColor of optimizedPalette) {
                            const distance = getColorDistance(color, existingColor);
                            minDistance = Math.min(minDistance, distance);
                        }
                        
                        // Higher minimum distance means more unique color
                        // Scale it to roughly 0-1 range
                        const uniquenessScore = Math.min(minDistance / 150, 1);
                        
                        // Weight uniqueness much higher than frequency to encourage diversity
                        return (frequencyScore * 0.1) + (uniquenessScore * 0.9);
                    };
                    
                    // Keep selecting colors until we fill the palette
                    while (optimizedPalette.length < maxPaletteSize && uniqueColors.length > optimizedPalette.length) {
                        let bestScore = -1;
                        let bestColor = null;
                        
                        // Check all remaining colors for the best candidate
                        for (const color of uniqueColors) {
                            // Skip colors already in the palette
                            if (optimizedPalette.some(c => c.r === color.r && c.g === color.g && c.b === color.b)) {
                                continue;
                            }
                            
                            const score = calculateScoreForColor(color);
                            if (score > bestScore) {
                                bestScore = score;
                                bestColor = color;
                            }
                        }
                        
                        if (bestColor) {
                            optimizedPalette.push(bestColor);
                        } else {
                            break; // No suitable colors found
                        }
                    }
                    
                    // Ensure we have black and white in the palette if they exist in the image
                    // This helps with common design elements
                    const ensureColor = (r, g, b) => {
                        const key = `${r},${g},${b}`;
                        if (colorFrequency[key] && !optimizedPalette.some(c => c.r === r && c.g === g && c.b === b)) {
                            // If we're at max palette size, replace the least used color
                            if (optimizedPalette.length >= maxPaletteSize) {
                                // Find least frequent color in our palette
                                let leastUsedIndex = 0;
                                let leastCount = Number.MAX_VALUE;
                                
                                for (let i = 0; i < optimizedPalette.length; i++) {
                                    const c = optimizedPalette[i];
                                    const count = colorFrequency[`${c.r},${c.g},${c.b}`] || 0;
                                    if (count < leastCount) {
                                        leastCount = count;
                                        leastUsedIndex = i;
                                    }
                                }
                                
                                // Replace it if the color we want to ensure is used more
                                if (colorFrequency[key] > leastCount) {
                                    optimizedPalette[leastUsedIndex] = {r, g, b, count: colorFrequency[key]};
                                }
                            } else {
                                optimizedPalette.push({r, g, b, count: colorFrequency[key]});
                            }
                        }
                    };
                    
                    // Try to ensure we have black and white
                    ensureColor(0, 0, 0);       // Black 
                    ensureColor(255, 255, 255); // White
                    
                    // Convert the RGB palette to hex colors
                    const hexPalette = optimizedPalette.map(color => rgbToHex(color.r, color.g, color.b));
                    
                    // Update the palette
                    paletteColors = hexPalette;
                    createPalette();
                    
                    // Ensure grid size is correct
                    gridSize = { width, height };
                    
                    // Create new grid
                    grid = createEmptyGrid(width, height, config.canvasFillColor);
                    
                    // Map each pixel to the closest color in the palette
                    for (let y = 0; y < height; y++) {
                        for (let x = 0; x < width; x++) {
                            const pixelColor = pixelGrid[y][x];
                            
                            // Skip black/transparent pixels
                            if (pixelColor.r === 0 && pixelColor.g === 0 && pixelColor.b === 0 && pixelGrid[y][x].a < 128) {
                                grid[x][y] = config.canvasFillColor;
                                continue;
                            }
                            
                            // Find the closest color in the palette
                            let closestColorIndex = 0;
                            let minDistance = Number.MAX_VALUE;
                            
                            for (let i = 0; i < optimizedPalette.length; i++) {
                                const paletteColor = optimizedPalette[i];
                                const distance = getColorDistance(pixelColor, paletteColor);
                                
                                if (distance < minDistance) {
                                    minDistance = distance;
                                    closestColorIndex = i;
                                }
                            }
                            
                            grid[x][y] = paletteColors[closestColorIndex];
                        }
                    }
                    
                    // Show the image preview
                    const imagePreviewContainer = document.getElementById('image-preview-container');
                    const imagePreview = document.getElementById('image-preview');
                    
                    if (imagePreviewContainer && imagePreview) {
                        imagePreview.innerHTML = '';
                        
                        // Create a preview of the pixelated image
                        const previewCanvas = document.createElement('canvas');
                        previewCanvas.width = width * 5;  // Scale up for visibility
                        previewCanvas.height = height * 5;
                        const previewCtx = previewCanvas.getContext('2d');
                        
                        for (let y = 0; y < height; y++) {
                            for (let x = 0; x < width; x++) {
                                previewCtx.fillStyle = grid[x][y];
                                previewCtx.fillRect(x * 5, y * 5, 5, 5);
                            }
                        }
                        
                        imagePreview.appendChild(previewCanvas);
                        imagePreviewContainer.style.display = 'block';
                    }
                    
                    // Update dropdown
                    const templateSelect = document.getElementById('template-select');
                    if (templateSelect) {
                        // Try to find a "none" option
                        const noneOption = templateSelect.querySelector('option[value="none"]');
                        if (noneOption) {
                            templateSelect.value = 'none';
                        } else {
                            // Or select first option
                            templateSelect.selectedIndex = 0;
                        }
                    }
                    
                    // Update the pixel size display
                    const pixelSizeSpan = document.getElementById('pixel-size');
                    if (pixelSizeSpan) {
                        pixelSizeSpan.textContent = `${width} x ${height}`;
                    }
                    
                    // Redraw the main grid
                    drawGrid();
                };
                
                img.src = e.target.result;
            };
            
            reader.readAsDataURL(file);
        });
    }
}

// Initialize drawing tool variables
let currentTool = 'draw'; // Default tool is draw (pencil)
let previewLastPos = null; // Last position for preview optimization

// Tool functions
function selectTool(toolName) {
    // Reset any active states on tool buttons
    document.querySelectorAll('.navigation-controls-row button').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Set the current tool
    currentTool = toolName;
    
    // Add active class to the selected tool button
    document.getElementById(`${toolName}-tool`).classList.add('active');
    
    // Update cursor style based on tool
    const canvas = document.getElementById('pixel-canvas');
    switch(toolName) {
        case 'draw':
            canvas.style.cursor = 'crosshair';
            break;
        case 'fill':
            canvas.style.cursor = 'cell';
            break;
        case 'square':
        case 'circle':
            canvas.style.cursor = 'crosshair';
            break;
        default:
            canvas.style.cursor = 'default';
    }
}

// Flood fill implementation (4-way)
function floodFill(x, y, targetColor, replacementColor) {
    // Bounds check
    if (x < 0 || x >= gridSize.width || y < 0 || y >= gridSize.height) {
        return;
    }
    
    // If current pixel is not the target color, return
    if (grid[x][y] !== targetColor) {
        return;
    }
    
    // If current pixel is already the replacement color, return
    if (grid[x][y] === replacementColor) {
        return;
    }
    
    // Set current pixel to replacement color
    grid[x][y] = replacementColor;
    
    // Recursively fill in all four directions
    // Using a queue to prevent stack overflow for large areas
    const queue = [];
    queue.push({x, y});
    
    while (queue.length > 0) {
        const current = queue.shift();
        const cx = current.x;
        const cy = current.y;
        
        // Check north
        if (cy > 0 && grid[cx][cy-1] === targetColor) {
            grid[cx][cy-1] = replacementColor;
            queue.push({x: cx, y: cy-1});
        }
        
        // Check east
        if (cx < gridSize.width - 1 && grid[cx+1][cy] === targetColor) {
            grid[cx+1][cy] = replacementColor;
            queue.push({x: cx+1, y: cy});
        }
        
        // Check south
        if (cy < gridSize.height - 1 && grid[cx][cy+1] === targetColor) {
            grid[cx][cy+1] = replacementColor;
            queue.push({x: cx, y: cy+1});
        }
        
        // Check west
        if (cx > 0 && grid[cx-1][cy] === targetColor) {
            grid[cx-1][cy] = replacementColor;
            queue.push({x: cx-1, y: cy});
        }
    }
}

// Draw a square
function drawSquare(startX, startY, endX, endY, color) {
    // Ensure we use the original grid
    const targetGrid = grid;
    drawRectOnGrid(targetGrid, startX, startY, endX, endY, color, false);
}

// Draw a circle or oval
function drawCircle(startX, startY, endX, endY, color) {
    // Ensure we use the original grid
    const targetGrid = grid;
    drawShapeOnGrid(targetGrid, startX, startY, endX, endY, color, false);
}

// Common function to draw rectangles or squares on any grid
function drawRectOnGrid(targetGrid, startX, startY, endX, endY, color, filled = false) {
    // Ensure startX <= endX and startY <= endY
    if (startX > endX) [startX, endX] = [endX, startX];
    if (startY > endY) [startY, endY] = [endY, startY];
    
    // Make sure we're within bounds
    startX = Math.max(0, Math.min(startX, gridSize.width - 1));
    startY = Math.max(0, Math.min(startY, gridSize.height - 1));
    endX = Math.max(0, Math.min(endX, gridSize.width - 1));
    endY = Math.max(0, Math.min(endY, gridSize.height - 1));
    
    // Draw top and bottom lines
    for (let x = startX; x <= endX; x++) {
        targetGrid[x][startY] = color;
        targetGrid[x][endY] = color;
    }
    
    // Draw left and right lines
    for (let y = startY + 1; y < endY; y++) {
        targetGrid[startX][y] = color;
        targetGrid[endX][y] = color;
    }
    
    // If filled, fill the inside
    if (filled) {
        for (let x = startX + 1; x < endX; x++) {
            for (let y = startY + 1; y < endY; y++) {
                targetGrid[x][y] = color;
            }
        }
    }
}

// Common function to draw circles or ovals on any grid
function drawShapeOnGrid(targetGrid, startX, startY, endX, endY, color, filled = false) {
    // Ensure startX <= endX and startY <= endY
    if (startX > endX) [startX, endX] = [endX, startX];
    if (startY > endY) [startY, endY] = [endY, startY];
    
    // Make sure we're within bounds
    startX = Math.max(0, Math.min(startX, gridSize.width - 1));
    startY = Math.max(0, Math.min(startY, gridSize.height - 1));
    endX = Math.max(0, Math.min(endX, gridSize.width - 1));
    endY = Math.max(0, Math.min(endY, gridSize.height - 1));
    
    // Calculate center point exactly between pixels for symmetry
    const centerX = startX + (endX - startX) / 2;
    const centerY = startY + (endY - startY) / 2;
    
    // Calculate exact radius to match rectangle boundaries
    const radiusX = (endX - startX) / 2 + 0.5;
    const radiusY = (endY - startY) / 2 + 0.5;
    
    // Implementation of midpoint ellipse algorithm
    if (filled) {
        drawFilledEllipseOnGrid(targetGrid, centerX, centerY, radiusX, radiusY, color);
    } else {
        drawEllipseOnGrid(targetGrid, centerX, centerY, radiusX, radiusY, color);
    }
}

// Function to draw grid with preview - ensure it's available for both circles and squares
function drawGridWithPreview(previewGrid) {
    const canvas = document.getElementById('pixel-canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const cellWidth = canvas.width / gridSize.width;
    const cellHeight = canvas.height / gridSize.height;
    
    for (let x = 0; x < gridSize.width; x++) {
        for (let y = 0; y < gridSize.height; y++) {
            const xPos = x * cellWidth;
            const yPos = y * cellHeight;
            
            ctx.fillStyle = previewGrid[x][y] || config.canvasFillColor;
            ctx.fillRect(xPos, yPos, cellWidth, cellHeight);
            
            ctx.strokeStyle = config.canvasStrokeStyle;
            ctx.strokeRect(xPos, yPos, cellWidth, cellHeight);
        }
    }
}

// Helper function to draw an ellipse on specified grid using midpoint algorithm
function drawEllipseOnGrid(targetGrid, centerX, centerY, radiusX, radiusY, color) {
    // Convert to integers for pixel plotting with size correction
    const cX = Math.round(centerX);
    const cY = Math.round(centerY);
    
    // Special case: if radiusX equals radiusY, we can use a simpler circle algorithm
    if (Math.abs(radiusX - radiusY) < 0.5) {
        return drawPerfectCircleOnGrid(targetGrid, cX, cY, radiusX - 0.5, color);
    }
    
    // Handle oval of width 1 or height 1 as a special case
    if (radiusX < 0.5 || radiusY < 0.5) {
        // Draw a line instead
        if (radiusX < 0.5) {
            for (let y = Math.round(cY - radiusY + 0.5); y <= Math.round(cY + radiusY - 0.5); y++) {
                setPixelSafeOnGrid(targetGrid, cX, y, color);
            }
        } else {
            for (let x = Math.round(cX - radiusX + 0.5); x <= Math.round(cX + radiusX - 0.5); x++) {
                setPixelSafeOnGrid(targetGrid, x, cY, color);
            }
        }
        return;
    }
    
    // Use adjusted radii to match the grid boundaries exactly
    const rX = radiusX - 0.5;
    const rY = radiusY - 0.5;
    
    // Midpoint ellipse algorithm
    let x = 0;
    let y = Math.floor(rY);
    
    // Initial decision parameter for region 1
    let d1 = (rY * rY) - (rX * rX * rY) + (0.25 * rX * rX);
    let dx = 2 * rY * rY * x;
    let dy = 2 * rX * rX * y;
    
    // Region 1
    while (dx < dy) {
        // Plot four points for each quadrant
        setPixelSafeOnGrid(targetGrid, cX + x, cY + y, color);
        setPixelSafeOnGrid(targetGrid, cX - x, cY + y, color);
        setPixelSafeOnGrid(targetGrid, cX + x, cY - y, color);
        setPixelSafeOnGrid(targetGrid, cX - x, cY - y, color);
        
        // Increment x
        x++;
        dx += 2 * rY * rY;
        
        // Check if decision parameter should be updated
        if (d1 < 0) {
            d1 += dx + (rY * rY);
        } else {
            y--;
            dy -= 2 * rX * rX;
            d1 += dx - dy + (rY * rY);
        }
    }
    
    // Decision parameter for region 2
    let d2 = ((rY * rY) * ((x + 0.5) * (x + 0.5))) + 
              ((rX * rX) * ((y - 1) * (y - 1))) - 
              (rX * rX * rY * rY);
    
    // Region 2
    while (y >= 0) {
        // Plot four points for each quadrant
        setPixelSafeOnGrid(targetGrid, cX + x, cY + y, color);
        setPixelSafeOnGrid(targetGrid, cX - x, cY + y, color);
        setPixelSafeOnGrid(targetGrid, cX + x, cY - y, color);
        setPixelSafeOnGrid(targetGrid, cX - x, cY - y, color);
        
        // Decrement y
        y--;
        dy -= 2 * rX * rX;
        
        // Check if decision parameter should be updated
        if (d2 > 0) {
            d2 += (rX * rX) - dy;
        } else {
            x++;
            dx += 2 * rY * rY;
            d2 += dx - dy + (rX * rX);
        }
    }
}

// Helper for drawing a perfect circle on specified grid using Bresenham's algorithm
function drawPerfectCircleOnGrid(targetGrid, centerX, centerY, radius, color) {
    // Convert to integers for pixel coordinates with size correction
    const cX = Math.round(centerX);
    const cY = Math.round(centerY);
    
    // Use floor instead of round to slightly reduce the circle size
    const r = Math.floor(radius);
    
    if (r < 1) {
        // For very small circles, just draw a single pixel
        setPixelSafeOnGrid(targetGrid, cX, cY, color);
        return;
    }
    
    let x = 0;
    let y = r;
    let d = 3 - 2 * r;
    
    // Function to draw pixels in all octants
    const drawCirclePixels = (cx, cy, x, y) => {
        // Draw 8 octants
        setPixelSafeOnGrid(targetGrid, cx + x, cy + y, color);
        setPixelSafeOnGrid(targetGrid, cx - x, cy + y, color);
        setPixelSafeOnGrid(targetGrid, cx + x, cy - y, color);
        setPixelSafeOnGrid(targetGrid, cx - x, cy - y, color);
        setPixelSafeOnGrid(targetGrid, cx + y, cy + x, color);
        setPixelSafeOnGrid(targetGrid, cx - y, cy + x, color);
        setPixelSafeOnGrid(targetGrid, cx + y, cy - x, color);
        setPixelSafeOnGrid(targetGrid, cx - y, cy - x, color);
    };
    
    while (y >= x) {
        drawCirclePixels(cX, cY, x, y);
        x++;
        if (d > 0) {
            y--;
            d = d + 4 * (x - y) + 10;
        } else {
            d = d + 4 * x + 6;
        }
    }
}

// Draw filled ellipse using scan line algorithm
function drawFilledEllipseOnGrid(targetGrid, centerX, centerY, radiusX, radiusY, color) {
    // Handle special cases for very small radii
    if (radiusX < 1 && radiusY < 1) {
        const x = Math.round(centerX);
        const y = Math.round(centerY);
        setPixelSafeOnGrid(targetGrid, x, y, color);
        return;
    }
    
    // Convert to integers for pixel coordinates with size correction
    const cX = Math.round(centerX);
    const cY = Math.round(centerY);
    
    // Use floor instead of round to slightly reduce the ellipse size
    const rX = Math.floor(radiusX);
    const rY = Math.floor(radiusY);
    
    // Use the standard ellipse equation: (x-h)²/a² + (y-k)²/b² = 1
    // where (h,k) is the center, a is the x radius, and b is the y radius
    
    // For each y coordinate, find the x range that's inside the ellipse
    for (let y = cY - rY; y <= cY + rY; y++) {
        if (y < 0 || y >= gridSize.height) continue;
        
        // Calculate the width at this y-coordinate
        // Derived from the ellipse equation solving for x
        const dy = y - cY;
        const term = 1 - (dy * dy) / (rY * rY);
        
        if (term < 0) continue; // No intersection with this horizontal line
        
        const dx = rX * Math.sqrt(term);
        const xStart = Math.max(0, Math.floor(cX - dx));
        const xEnd = Math.min(gridSize.width - 1, Math.ceil(cX + dx));
        
        // Fill the horizontal line
        for (let x = xStart; x <= xEnd; x++) {
            targetGrid[x][y] = color;
        }
    }
}

// Helper function to safely set a pixel on specified grid if in bounds
function setPixelSafeOnGrid(targetGrid, x, y, color) {
    if (x >= 0 && x < gridSize.width && y >= 0 && y < gridSize.height) {
        targetGrid[x][y] = color;
    }
}

// --- Localisation Support ---
const translations = {
  'en-us': {
    canvas: 'Canvas',
    settings: 'Settings',
    gridSize: 'Grid Size',
    template: 'Template',
    colorPalette: 'Color Palette',
    edit: 'Edit',
    import: 'Import',
    export: 'Export',
    createFromImage: 'Create from an image',
    loadDataFile: 'Load data file',
    showExample: 'Show Example',
    generateImageData: 'Generate Image Data',
    showFullPythonCode: 'Show Full Python Code',
    selectAll: 'Select All',
    copy: 'Copy',
    exportAsPng: 'Export as PNG',
    github: 'GitHub',
    exampleJsonFormat: 'Example JSON Format',
    close: 'Close',
    editColorPalette: 'Edit Color Palette',
    selectedColor: 'Selected Color:',
    hexColorPlaceholder: '#000000',
    red: 'Red',
    green: 'Green',
    blue: 'Blue',
    palette: 'Palette:',
    cancel: 'Cancel',
    saveChanges: 'Save Changes',
    tools: 'Tools:',
    shiftImage: 'Shift image:',
    resetCanvas: 'Reset canvas:',
    drawPixel: 'Draw Pixel',
    floodFill: 'Flood Fill',
    square: 'Square',
    circle: 'Circle',
  },
  'en-gb': {
    canvas: 'Canvas',
    settings: 'Settings',
    gridSize: 'Grid Size',
    template: 'Template',
    colorPalette: 'Colour Palette',
    edit: 'Edit',
    import: 'Import',
    export: 'Export',
    createFromImage: 'Create from an image',
    loadDataFile: 'Load data file',
    showExample: 'Show Example',
    generateImageData: 'Generate Image Data',
    showFullPythonCode: 'Show Full Python Code',
    selectAll: 'Select All',
    copy: 'Copy',
    exportAsPng: 'Export as PNG',
    github: 'GitHub',
    exampleJsonFormat: 'Example JSON Format',
    close: 'Close',
    editColorPalette: 'Edit Colour Palette',
    selectedColor: 'Selected Colour:',
    hexColorPlaceholder: '#000000',
    red: 'Red',
    green: 'Green',
    blue: 'Blue',
    palette: 'Palette:',
    cancel: 'Cancel',
    saveChanges: 'Save Changes',
    tools: 'Tools:',
    shiftImage: 'Shift image:',
    resetCanvas: 'Reset canvas:',
    drawPixel: 'Draw Pixel',
    floodFill: 'Flood Fill',
    square: 'Square',
    circle: 'Circle',
  }
};

function detectLanguage() {
  const lang = navigator.language || navigator.userLanguage || 'en-US';
  if (lang.toLowerCase().startsWith('en-gb')) return 'en-gb';
  return 'en-us'; // default
}
let currentLang = detectLanguage();
let t = translations[currentLang];

function localisePage() {
  // Text content
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (t[key]) el.textContent = t[key];
  });
  // Placeholders
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (t[key]) el.setAttribute('placeholder', t[key]);
  });
}

document.addEventListener('DOMContentLoaded', function() {
  localisePage();
  // ...rest of your DOMContentLoaded code...
});

function handleColorDelete(index) {
    // Don't allow deleting the first color (index 0)
    if (index <= 0) return;
    
    // Get the color being deleted
    const colorToDelete = paletteColors[index];
    
    // Remove the color from the palette
    paletteColors.splice(index, 1);
    
    // If the selected color is the one being deleted, select color 0 instead
    if (selectedPaletteIndex === index) {
        selectPaletteColor(0);
    } else if (selectedPaletteIndex > index) {
        // If we were editing a color after the deleted one, adjust the index
        selectedPaletteIndex--;
    }
    
    // Remap pixels using this color to color 0 (black)
    for (let x = 0; x < gridSize.width; x++) {
        for (let y = 0; y < gridSize.height; y++) {
            if (grid[x][y] === colorToDelete) {
                grid[x][y] = paletteColors[0]; // Replace with color 0
            }
        }
    }
    
    // Update the palette preview
    updatePalettePreview();
}
