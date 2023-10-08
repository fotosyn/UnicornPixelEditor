// Unicorn Pixel Art Image Analyser
// Version 1.0 by Jim Moore - September 2023
// A simple tool to convert pixel images into pixel maps and palettes for Pimoroni Unicorn LED panels.
// For more information, visit: https://shop.pimoroni.com/products/space-unicorns
// Read the documentation for guidance on using this code.
// Repurpose this code as needed

// Get references to DOM elements
const fileInput = document.getElementById('file-input');
const imagePreview = document.getElementById('image-preview');
const analyseButtonContainer = document.getElementById('analyse-button');
const analyseDataContainer = document.getElementById('analyse-data');
const resultContainer = document.getElementById('export-text-box');

// Function to hide the JSON container
function hideAnalyseDataContainer() {
    analyseDataContainer.style.display = 'none';
}

// Function to show the JSON container
function showAnalyseDataContainer() {
    analyseDataContainer.style.display = 'block';
}

// Function to hide the "Analyze Image" button
function hideAnalyseButton() {
    analyseButtonContainer.style.display = 'none';
}

// Function to show the "Analyze Image" button
function showAnalyseButton() {
    analyseButtonContainer.style.display = 'block';
}

// Function to handle file input change
function handleFileInputChange() {
    const file = fileInput.files[0];

    if (file) {
        // Display the selected image as a preview
        const img = new Image();
        img.src = URL.createObjectURL(file);
        img.onload = function () {
            // Clear the image preview container and append the preview image
            imagePreview.innerHTML = '';
            imagePreview.appendChild(img);

            // Show the "Analyze Image" button when an image is selected
            showAnalyseButton();
        };
    } else {
        // Hide the "Analyze Image" button when no file is selected
        hideAnalyseButton();
        // Clear the image preview container
        imagePreview.innerHTML = '';
    }
}

// Add an event listener to the file input element
fileInput.addEventListener('change', handleFileInputChange);


// Function to analyze the loaded image
function analyzeImage() {
    const file = fileInput.files[0];
    const img = new Image();

    img.onload = function () {

        imagePreview.innerHTML = '';
        imagePreview.appendChild(img);

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0, img.width, img.height);

        const imageData = ctx.getImageData(0, 0, img.width, img.height).data;
        const paletteMap = new Map();

        // Analyze the image and create an indexed palette
        const palette = [];
        let index = 0;
        for (let i = 0; i < imageData.length; i += 4) {
            const color = [
                imageData[i],    // Red
                imageData[i + 1],// Green
                imageData[i + 2],// Blue
            ];

            const colorKey = color.toString();

            if (!paletteMap.has(colorKey)) {
                paletteMap.set(colorKey, index);
                palette.push({
                    r: color[0],
                    g: color[1],
                    b: color[2],
                });
                index++;
            }
        }

        // Create a grid using the indexed palette
        const grid = [];
        const numRows = img.height;
        const numCols = img.width;
        for (let i = 0; i < numRows; i++) {
            const row = [];
            for (let j = 0; j < numCols; j++) {
                const pixelIndex = i * numCols * 4 + j * 4;
                const color = [
                    imageData[pixelIndex],      // Red
                    imageData[pixelIndex + 1],  // Green
                    imageData[pixelIndex + 2],  // Blue
                ];
                const colorKey = color.toString();
                const colorIndex = paletteMap.get(colorKey);
                row.push(colorIndex);
            }
            grid.push(row);
        }

        // Get the filename without extension and capitalize the "label" version
        const fileName = file.name;
        const fileNameWithoutExtension = fileName.replace(/\.[^/.]+$/, ''); // Remove file extension
        const labelVersion = fileNameWithoutExtension.charAt(0).toUpperCase() + fileNameWithoutExtension.slice(1);

        // Manually format the JSON string
        const indent = '    '; // Define your preferred indentation
        const formattedGrid = grid.map(row => `[${row.join(", ")}]`).join(`,\n${indent + indent}`);
        const formattedPalette = palette.map(color => `{"r": ${color.r}, "g": ${color.g}, "b": ${color.b}}`).join(`,\n${indent + indent}`);

        const formattedCode = `data = {
${indent}"value": "${fileName}",
${indent}"label": "${labelVersion}",
${indent}"grid": [
${indent + indent}${formattedGrid}
${indent}],
${indent}"palette": [
${indent + indent}${formattedPalette}
${indent}]
}`;

        // Show the JSON container and its content
        showAnalyseDataContainer();
        resultContainer.innerText = formattedCode;

        // Show the "Analyze Image" button
        showAnalyseButton();
    };

    img.src = URL.createObjectURL(file);

    // Hide the "Analyze Image" button and image preview container while processing
    hideAnalyseButton();
}

const selectButton = document.getElementById('select-all-button');
selectButton.addEventListener('click', selectAllText);

const copyButton = document.getElementById('copy-clipboard-button');
copyButton.addEventListener('click', copyToClipboard);

// Function to select all text in the result div
function selectAllText() {
    const range = document.createRange();
    range.selectNodeContents(resultContainer);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
}

// Function to copy the selected text to the clipboard
function copyToClipboard() {
    selectAllText();
    document.execCommand('copy');
    window.getSelection().removeAllRanges();
}

// Call hideAnalyseDataContainer() initially to hide the JSON container
hideAnalyseDataContainer();
