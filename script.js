/*
 * Unicorn Pixel Art Editor
 * Version 1.0 by Jim Moore - September 2023
 *
 * A simple tool to generate and export pixel maps and palettes for Pimoroni Unicorn LED panels.
 * For more information, visit: https://shop.pimoroni.com/products/space-unicorns
 * Read the documentation for guidance on using this code.
 * You are free to repurpose this code as needed.
 */

// Initialization
let gridSize = 16;
let grid = new Array(gridSize).fill(null).map(() => new Array(gridSize).fill('#000000'));
let paletteColors = ['#000000', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffffff'];
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
        const swatch = document.createElement('div');
        swatch.classList.add('swatch');
        swatch.style.backgroundColor = color;
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

            const colorMapping = {};
            oldPaletteColors.forEach((oldColor, index) => {
                colorMapping[oldColor] = paletteColors[index];
            });

            for (let x = 0; x < gridSize; x++) {
                for (let y = 0; y < gridSize; y++) {
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
    const formattedGrid = data.grid.map(row => `[${row.join(', ')}],`).join(`\n${indent + indent}`);
    const formattedPalette = data.palette.map(color => JSON.stringify(color) + ',').join(`\n${indent + indent}`);
    const formattedCode = `data = {\n${indent}"grid": [\n${indent + indent}${formattedGrid}\n${indent}],\n${indent}"palette": [\n${indent + indent}${formattedPalette}\n${indent}]\n}`;
    return formattedCode;
}

// Grid Functions
function drawGrid() {
    const canvas = document.getElementById('pixel-canvas');
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#9a9a9a';
    ctx.lineWidth = 1;

    const cellWidth = canvas.width / gridSize;
    const cellHeight = canvas.height / gridSize;

    for (let x = 0; x < gridSize; x++) {
        for (let y = 0; y < gridSize; y++) {
            const xPos = x * cellWidth;
            const yPos = y * cellHeight;

            ctx.fillStyle = grid[x][y];
            ctx.fillRect(xPos, yPos, cellWidth, cellHeight);

            ctx.strokeStyle = '#9a9a9a';
            ctx.strokeRect(xPos, yPos, cellWidth, cellHeight);
        }
    }
}

function changeGridSize(size) {
    gridSize = parseInt(size);
    grid = new Array(gridSize).fill(null).map(() => new Array(gridSize).fill('#000000'));

    const canvas = document.getElementById('pixel-canvas');
    const cellWidth = canvas.width / gridSize;
    const cellHeight = canvas.height / gridSize;

    canvas.width = gridSize * cellWidth;
    canvas.height = gridSize * cellHeight;

    drawGrid();
}

// Pixel Manipulation Functions
function shiftPixels(dx, dy) {
    const newGrid = new Array(gridSize).fill(null).map(() => new Array(gridSize).fill(0));

    for (let x = 0; x < gridSize; x++) {
        for (let y = 0; y < gridSize; y++) {
            const newX = (x + dx + gridSize) % gridSize;
            const newY = (y + dy + gridSize) % gridSize;
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

    const formattedPythonCode = formatPythonCode(exportData);
    const exportTextBox = document.getElementById("export-text-box");
    exportTextBox.value = formattedPythonCode;
    exportTextBox.style.display = 'block';
}

function selectAllText() {
    const exportTextBox = document.getElementById("export-text-box");
    exportTextBox.select();
    document.execCommand("copy");
}

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

function loadTemplate() {
    const templateSelect = document.getElementById('template-select');
    const selectedTemplateIndex = templateSelect.selectedIndex;

    if (selectedTemplateIndex >= 0) {
        const selectedTemplateData = jsonData[selectedTemplateIndex];
        loadGridAndPalette(selectedTemplateData);
    }
}

function loadGridAndPalette(templateData) {
    paletteColors = templateData.palette.map((rgbColor) => {
        return rgbToHex(rgbColor.r, rgbColor.g, rgbColor.b);
    });

    createPalette();

    grid = Array.from({ length: gridSize }, () => Array(gridSize).fill(''));

    for (let x = 0; x < gridSize; x++) {
        for (let y = 0; y < gridSize; y++) {
            const colorIndex = templateData.grid[y][x];
            grid[x][y] = paletteColors[colorIndex];
        }
    }

    const canvas = document.getElementById('pixel-canvas');
    const cellWidth = canvas.width / gridSize;
    const cellHeight = canvas.height / gridSize;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let x = 0; x < gridSize; x++) {
        for (let y = 0; y < gridSize; y++) {
            const xPos = x * cellWidth;
            const yPos = y * cellHeight;

            ctx.fillStyle = grid[x][y];
            ctx.fillRect(xPos, yPos, cellWidth, cellHeight);

            ctx.strokeStyle = '#9a9a9a';
            ctx.strokeRect(xPos, yPos, cellWidth, cellHeight);
        }
    }
}

function populateTemplateDropdown() {
    const templateSelectContainer = document.getElementById("template-select-container");
    const templateSelect = document.getElementById("template-select");

    fetch('images.json')
        .then(response => response.json())
        .then(data => {
            jsonData = data;
            data.forEach((template, index) => {
                const option = document.createElement('option');
                option.value = `template${index + 1}`;
                option.textContent = `${template.label}`;
                templateSelect.appendChild(option);
            });

            loadTemplate();
        })
        .catch(error => {
            console.error('Error loading templates:', error);
        });

    templateSelectContainer.appendChild(templateSelect);
}

// Event Listeners
const canvas = document.getElementById('pixel-canvas');
canvas.addEventListener('mousedown', function (e) {
    const x = Math.floor((e.offsetX / (canvas.width / gridSize)));
    const y = Math.floor((e.offsetY / (canvas.height / gridSize)));

    grid[x][y] = selectedColor;
    drawGrid();
});

document.addEventListener("DOMContentLoaded", function () {
    populateTemplateDropdown();
});

document.getElementById('shift-left').addEventListener('click', shiftLeft);
document.getElementById('shift-right').addEventListener('click', shiftRight);
document.getElementById('shift-up').addEventListener('click', shiftUp);
document.getElementById('shift-down').addEventListener('click', shiftDown);

const templateSelect = document.getElementById('template-select');
templateSelect.addEventListener('change', function () {
    loadTemplate();
});

createPalette();
drawGrid();
