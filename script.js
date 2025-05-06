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

const canvas = document.getElementById('pixel-canvas');
canvas.addEventListener('mousedown', function (e) {
    if (e.button !== 0) return; // Only left mouse button
    isDrawing = true;
    fillPixelFromEvent(e);
});
canvas.addEventListener('mousemove', function (e) {
    if (isDrawing) {
        fillPixelFromEvent(e);
    }
});
canvas.addEventListener('mouseup', function (e) {
    if (e.button === 0) {
        isDrawing = false;
    }
});
canvas.addEventListener('mouseleave', function () {
    isDrawing = false;
});

function fillPixelFromEvent(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    // Get the mouse position relative to the canvas
    const mouseX = (e.clientX - rect.left);
    const mouseY = (e.clientY - rect.top);
    
    // Convert to canvas coordinates
    const canvasX = mouseX * (canvas.width / rect.width);
    const canvasY = mouseY * (canvas.height / rect.height);
    
    // Calculate grid position
    const x = Math.floor(canvasX / (canvas.width / gridSize.width));
    const y = Math.floor(canvasY / (canvas.height / gridSize.height));
    
    // Debug output
    console.log('Mouse:', mouseX, mouseY);
    console.log('Canvas:', canvasX, canvasY);
    console.log('Grid:', x, y, 'Max:', gridSize.width, gridSize.height);
    
    // Check if the coordinates are within bounds
    if (x >= 0 && x < gridSize.width && y >= 0 && y < gridSize.height) {
        grid[x][y] = selectedColor;
        drawGrid();
    }
}

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
    
    if (display) {
        selectButton.style.display = 'inline-block';
        copyButton.style.display = 'inline-block';
        fullCodeButton.style.display = 'inline-block';
    } else {
        selectButton.style.display = 'none';
        copyButton.style.display = 'none';
        fullCodeButton.style.display = 'none';
    }
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
        // Stub: No operation. Implement if needed.
    }
}
