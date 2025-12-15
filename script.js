let currentImage = null;
let currentCaption = '';
let currentMediaType = 'image/jpeg';

const uploadSection = document.getElementById('uploadSection');
const memeSection = document.getElementById('memeSection');
const fileInput = document.getElementById('fileInput');
const chooseFileBtn = document.getElementById('chooseFileBtn');
const previewImage = document.getElementById('previewImage');
const captionOverlay = document.getElementById('captionOverlay');
const loadingIndicator = document.getElementById('loadingIndicator');
const regenerateBtn = document.getElementById('regenerateBtn');
const downloadBtn = document.getElementById('downloadBtn');
const newImageBtn = document.getElementById('newImageBtn');
const memeCanvas = document.getElementById('memeCanvas');

// Drag and drop handlers
uploadSection.addEventListener('dragenter', handleDrag);
uploadSection.addEventListener('dragover', handleDrag);
uploadSection.addEventListener('dragleave', handleDragLeave);
uploadSection.addEventListener('drop', handleDrop);

function handleDrag(e) {
    e.preventDefault();
    e.stopPropagation();
    uploadSection.classList.add('drag-active');
}

function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    uploadSection.classList.remove('drag-active');
}

function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    uploadSection.classList.remove('drag-active');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
}

// File selection
chooseFileBtn.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFile(e.target.files[0]);
    }
});

function handleFile(file) {
    if (!file.type.startsWith('image/')) {
        alert('Please upload an image file');
        return;
    }
    
    // Store the actual media type
    currentMediaType = file.type;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        currentImage = e.target.result;
        previewImage.src = currentImage;
        uploadSection.style.display = 'none';
        memeSection.style.display = 'block';
        generateCaption(currentImage);
    };
    reader.readAsDataURL(file);
}

async function generateCaption(imageData) {
    loadingIndicator.style.display = 'flex';
    captionOverlay.style.display = 'none';
    regenerateBtn.disabled = true;
    downloadBtn.disabled = true;
    
    try {
        const base64Data = imageData.split(',')[1];
        
        // Determine the correct media type
        let mediaType = currentMediaType;
        // Handle common image formats
        if (mediaType === 'image/jpg') {
            mediaType = 'image/jpeg';
        }
        // For unsupported formats, default to jpeg
        if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(mediaType)) {
            mediaType = 'image/jpeg';
        }
        
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 1000,
                messages: [{
                    role: 'user',
                    content: [
                        {
                            type: 'image',
                            source: {
                                type: 'base64',
                                media_type: mediaType,
                                data: base64Data
                            }
                        },
                        {
                            type: 'text',
                            text: 'Generate a short, funny meme caption for this image. The caption should be witty, relatable, and follow current meme trends. Keep it under 100 characters and make it punchy. Return ONLY the caption text, nothing else.'
                        }
                    ]
                }]
            })
        });
        
        const data = await response.json();
        currentCaption = data.content[0].text.trim();
        captionOverlay.textContent = currentCaption;
        captionOverlay.style.display = 'block';
    } catch (error) {
        console.error('Error generating caption:', error);
        currentCaption = 'Error generating caption. Try again!';
        captionOverlay.textContent = currentCaption;
        captionOverlay.style.display = 'block';
    }
    
    loadingIndicator.style.display = 'none';
    regenerateBtn.disabled = false;
    downloadBtn.disabled = false;
}

regenerateBtn.addEventListener('click', () => {
    if (currentImage) {
        generateCaption(currentImage);
    }
});

downloadBtn.addEventListener('click', () => {
    const canvas = memeCanvas;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        
        ctx.drawImage(img, 0, 0);
        
        const fontSize = Math.max(24, img.width / 20);
        ctx.font = `bold ${fontSize}px Impact, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = fontSize / 12;
        
        const words = currentCaption.split(' ');
        const lines = [];
        let currentLine = words[0];
        
        for (let i = 1; i < words.length; i++) {
            const testLine = currentLine + ' ' + words[i];
            const metrics = ctx.measureText(testLine);
            if (metrics.width > img.width * 0.9) {
                lines.push(currentLine);
                currentLine = words[i];
            } else {
                currentLine = testLine;
            }
        }
        lines.push(currentLine);
        
        const lineHeight = fontSize * 1.2;
        const startY = 50;
        
        lines.forEach((line, index) => {
            const y = startY + (index * lineHeight);
            ctx.strokeText(line.toUpperCase(), canvas.width / 2, y);
            ctx.fillText(line.toUpperCase(), canvas.width / 2, y);
        });
        
        const link = document.createElement('a');
        link.download = 'meme.png';
        link.href = canvas.toDataURL();
        link.click();
    };
    
    img.src = currentImage;
});

newImageBtn.addEventListener('click', () => {
    currentImage = null;
    currentCaption = '';
    previewImage.src = '';
    captionOverlay.textContent = '';
    fileInput.value = '';
    memeSection.style.display = 'none';
    uploadSection.style.display = 'block';
});
