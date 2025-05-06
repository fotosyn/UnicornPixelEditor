// Unicorn Pixel Art Editor
// Version 1.0 by Jim Moore - September 2023
// A simple tool to generate and export pixel maps and palettes for Pimoroni Unicorn LED panels.
// For more information, visit: https://shop.pimoroni.com/products/space-unicorns
// Read the documentation for guidance on using this code.
// Repurpose this code as needed

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

    // Reset everything to defaults
    grid = createEmptyGrid(gridSize.width, gridSize.height, config.canvasFillColor);
    paletteColors = [...config.defaultPaletteColors];
    createPalette();
    
    // Reset template selection to first option (usually "None")
    const templateSelect = document.getElementById('template-select');
    if (templateSelect && templateSelect.options.length > 0) {
        templateSelect.selectedIndex = 0;
    }

    // Clear any export text
    const exportTextBox = document.getElementById("export-text-box");
    if (exportTextBox) {
        exportTextBox.textContent = '';
        exportTextBox.style.display = 'none';
    }

    // Hide export buttons
    toggleExportButtons(false);

    // Clear any loaded image preview
    const imagePreviewContainer = document.getElementById('image-preview-container');
    const imagePreview = document.getElementById('image-preview');
    if (imagePreviewContainer && imagePreview) {
        imagePreview.innerHTML = '';
        imagePreviewContainer.style.display = 'none';
    }

    // Reset the file input
    const imageFileInput = document.getElementById('image-file-input');
    if (imageFileInput) {
        imageFileInput.value = '';
    }

    console.log(`Canvas resized to: ${canvas.width}x${canvas.height}`);
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

function populateTemplateDropdown() {
    const templateSelect = document.getElementById("template-select");
    templateSelect.innerHTML = ''; // Clear existing options

    // Get the selected grid size
    const gridSizeSelect = document.getElementById('grid-size-select');
    const selectedGridSize = gridSizeSelect.value;

    // Add templates if they exist for this grid size
    if (gridTemplates && gridTemplates[selectedGridSize]) {
        gridTemplates[selectedGridSize].forEach((template) => {
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
    const x = Math.floor((e.clientX - rect.left) / (canvas.width / gridSize.width));
    const y = Math.floor((e.clientY - rect.top) / (canvas.height / gridSize.height));
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
    loadTemplatesFromJSON(); // Keep template loading
    populateGridSizeDropdown();
    createPalette();
    initializeGrid();
    drawGrid();
    toggleExportButtons(false);

    // Add event listener for JSON file input
    const jsonFileInput = document.getElementById('json-file-input');
    jsonFileInput.addEventListener('change', handleJSONFileLoad);

    // Initialize image file input handler
    handleImageFileSelect();

    // Apply the default grid size to the select menu on initial load
    const gridSizeSelect = document.getElementById('grid-size-select');
    const defaultGridSize = config.defaultUnicornGrid;
    if (gridSizeSelect) {
        gridSizeSelect.value = config.unicornGridSizes[defaultGridSize];
        changeGridSize(config.unicornGridSizes[defaultGridSize]);
        populateTemplateDropdown();
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

// Image Analysis Functions
function analyzeAndProcessImage(img, file, canvas, ctx) {
    try {
        // Get dimensions from canvas
        const targetWidth = canvas.width;
        const targetHeight = canvas.height;

        // Analyze the image
        const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight).data;
        
        // First pass: collect all unique colors
        const uniqueColors = new Map();
        for (let y = 0; y < targetHeight; y++) {
            for (let x = 0; x < targetWidth; x++) {
                const i = (y * targetWidth + x) * 4;
                const color = {
                    r: imageData[i],
                    g: imageData[i + 1],
                    b: imageData[i + 2]
                };
                const colorKey = `${color.r},${color.g},${color.b}`;
                uniqueColors.set(colorKey, color);
            }
        }

        // Get initial threshold based on number of unique colors
        let threshold = getColorSimilarityThreshold(uniqueColors.size);
        console.log(`Initial unique colors: ${uniqueColors.size}, using threshold: ${threshold}`);

        // Build optimized palette
        const optimizedPalette = [];
        const colorMapping = new Map(); // Maps original color keys to optimized indices

        // Process each unique color
        for (const [colorKey, color] of uniqueColors) {
            // Check if we have a similar color already
            const similarIndex = findSimilarColor(color, optimizedPalette, threshold);
            if (similarIndex !== -1) {
                // Use existing similar color
                colorMapping.set(colorKey, similarIndex);
            } else {
                // Add new color to palette
                colorMapping.set(colorKey, optimizedPalette.length);
                optimizedPalette.push(color);

                // Adjust threshold if palette is growing too large
                if (optimizedPalette.length > 32 && threshold < 25) {
                    threshold = Math.min(25, threshold * 1.5);
                    console.log(`Adjusting threshold to ${threshold} after ${optimizedPalette.length} colors`);
                }
            }
        }

        console.log(`Optimized palette from ${uniqueColors.size} to ${optimizedPalette.length} colors`);

        // Build pixel grid using optimized palette
        const pixelGrid = [];
        for (let y = 0; y < targetHeight; y++) {
            const row = [];
            for (let x = 0; x < targetWidth; x++) {
                const i = (y * targetWidth + x) * 4;
                const colorKey = `${imageData[i]},${imageData[i + 1]},${imageData[i + 2]}`;
                const colorIndex = colorMapping.get(colorKey);
                row.push(colorIndex);
            }
            pixelGrid.push(row);
        }

        // Update the palette with the optimized colors
        paletteColors = optimizedPalette.map(color => rgbToHex(color.r, color.g, color.b));
        createPalette();

        // Update the grid with the new data
        for (let y = 0; y < gridSize.height; y++) {
            for (let x = 0; x < gridSize.width; x++) {
                const colorIndex = pixelGrid[y][x];
                grid[x][y] = paletteColors[colorIndex];
            }
        }

        // Redraw the grid
        drawGrid();

        // Create the output data structure and display it
        const outputData = {
            grid: pixelGrid,
            palette: optimizedPalette
        };

        // Format and display the output
        const formatted = formatPythonCode(outputData);
        const exportTextBox = document.getElementById("export-text-box");
        exportTextBox.textContent = formatted;
        exportTextBox.style.display = 'block';
        toggleExportButtons(true);

        // Reset template selection to "none"
        const templateSelect = document.getElementById('template-select');
        if (templateSelect) {
            const noneOption = templateSelect.querySelector('option[value="none"]');
            if (noneOption) {
                templateSelect.value = 'none';
            }
        }

    } catch (error) {
        console.error('Error processing image:', error);
        alert('Error processing image: ' + error.message);
    }
}

function handleImageFileSelect() {
    const fileInput = document.getElementById('image-file-input');
    const previewContainer = document.getElementById('image-preview-container');
    const previewDiv = document.getElementById('image-preview');

    fileInput.addEventListener('change', async function(e) {
        const file = e.target.files[0];
        if (!file) return;

        const img = new Image();
        img.src = URL.createObjectURL(file);
        
        img.onload = function() {
            // Get current grid size
            const [targetWidth, targetHeight] = document.getElementById('grid-size-select').value.split(',').map(Number);
            
            // Check if image dimensions match the grid size
            if (img.width !== targetWidth || img.height !== targetHeight) {
                alert(`Image must be exactly ${targetWidth} x ${targetHeight} pixels. Your image is ${img.width} x ${img.height} pixels.`);
                return;
            }

            // Clear previous preview
            previewDiv.innerHTML = '';
            
            // Create a canvas to display the preview
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Set canvas size to match target dimensions
            canvas.width = targetWidth;
            canvas.height = targetHeight;
            
            // Draw image scaled to fit canvas
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            // Style the preview canvas
            canvas.style.width = '200px';
            canvas.style.imageRendering = 'pixelated';
            canvas.style.border = '1px solid #ccc';
            
            previewDiv.appendChild(canvas);
            previewContainer.style.display = 'block';

            // Immediately analyze and process the image
            analyzeAndProcessImage(img, file, canvas, ctx);
        };
    });
}

function analyzeImage() {
    const ctx = window.imageAnalysisCtx;
    if (!ctx) return;

    const [width, height] = document.getElementById('grid-size-select').value.split(',').map(Number);
    const imageData = ctx.getImageData(0, 0, width, height).data;
    
    // Create color map and palette
    const colorMap = new Map();
    const palette = [];
    const grid = [];

    // Process image data
    for (let y = 0; y < height; y++) {
        const row = [];
        for (let x = 0; x < width; x++) {
            const i = (y * width + x) * 4;
            const color = {
                r: imageData[i],
                g: imageData[i + 1],
                b: imageData[i + 2]
            };
            
            // Get or create color index
            const colorKey = `${color.r},${color.g},${color.b}`;
            let colorIndex = colorMap.get(colorKey);
            if (colorIndex === undefined) {
                colorIndex = palette.length;
                colorMap.set(colorKey, colorIndex);
                palette.push(color);
            }
            row.push(colorIndex);
        }
        grid.push(row);
    }

    // Create the output data structure
    const outputData = {
        value: "image-import",
        label: "Imported Image",
        grid: grid,
        palette: palette
    };

    // Format and display the output
    const formatted = formatPythonCode(outputData);
    const exportTextBox = document.getElementById("export-text-box");
    exportTextBox.textContent = formatted;
    exportTextBox.style.display = 'block';
    toggleExportButtons(true);

    // Update the palette with the new colors
    paletteColors = palette.map(color => rgbToHex(color.r, color.g, color.b));
    createPalette();

    // Update the grid with the new data
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const colorIndex = grid[y][x];
            const color = paletteColors[colorIndex];
            window.grid[x][y] = color;
        }
    }
    drawGrid();
}
