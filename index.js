import React, { useState, useRef } from 'react';
import { Download, RefreshCw, Upload, Sparkles } from 'lucide-react';

export default function MemeGenerator() {
  const [image, setImage] = useState(null);
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file) => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImage(e.target.result);
        generateCaption(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const generateCaption = async (imageData) => {
    setLoading(true);
    try {
      const base64Data = imageData.split(',')[1];
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
                  media_type: 'image/jpeg',
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
      const generatedCaption = data.content[0].text.trim();
      setCaption(generatedCaption);
    } catch (error) {
      console.error('Error generating caption:', error);
      setCaption('Error generating caption. Try again!');
    }
    setLoading(false);
  };

  const regenerateCaption = () => {
    if (image) {
      generateCaption(image);
    }
  };

  const downloadMeme = () => {
    const canvas = canvasRef.current;
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
      
      const words = caption.split(' ');
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
        ctx.strokeText(line, canvas.width / 2, y);
        ctx.fillText(line, canvas.width / 2, y);
      });
      
      const link = document.createElement('a');
      link.download = 'meme.png';
      link.href = canvas.toDataURL();
      link.click();
    };
    
    img.src = image;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-purple-50">
      <div className="absolute top-6 left-6 text-2xl font-bold text-gray-800 tracking-tight">
        ajnev
      </div>
      
      <div className="flex items-center justify-center min-h-screen p-8">
        <div className="w-full max-w-2xl">
          {!image ? (
            <div
              className={`border-4 border-dashed rounded-3xl p-16 text-center transition-all ${
                dragActive 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-300 bg-white/60 backdrop-blur-sm'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="w-20 h-20 mx-auto mb-6 text-blue-500" />
              <h2 className="text-3xl font-bold text-gray-800 mb-4">
                Drop Your Image Here
              </h2>
              <p className="text-gray-600 mb-8 text-lg">
                or click to browse files
              </p>
              <button
                onClick={() => fileInputRef.current.click()}
                className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-4 rounded-full font-semibold text-lg hover:shadow-xl transition-all transform hover:scale-105"
              >
                Choose Image
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleChange}
                className="hidden"
              />
            </div>
          ) : (
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8">
              <div className="relative mb-6 rounded-2xl overflow-hidden shadow-lg">
                <img src={image} alt="Uploaded" className="w-full" />
                {caption && !loading && (
                  <div className="absolute top-0 left-0 right-0 p-6">
                    <p className="text-white text-3xl font-bold text-center drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] [text-shadow:_-2px_-2px_0_#000,_2px_-2px_0_#000,_-2px_2px_0_#000,_2px_2px_0_#000] font-['Impact',_sans-serif] uppercase">
                      {caption}
                    </p>
                  </div>
                )}
              </div>
              
              {loading && (
                <div className="flex items-center justify-center py-8">
                  <Sparkles className="w-8 h-8 text-purple-500 animate-pulse" />
                  <span className="ml-3 text-lg text-gray-700 font-semibold">
                    Generating meme magic...
                  </span>
                </div>
              )}
              
              <div className="flex gap-4 mt-6">
                <button
                  onClick={regenerateCaption}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-4 rounded-full font-semibold text-lg hover:shadow-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                  Regenerate
                </button>
                
                <button
                  onClick={downloadMeme}
                  disabled={loading || !caption}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-4 rounded-full font-semibold text-lg hover:shadow-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Download
                </button>
              </div>
              
              <button
                onClick={() => {
                  setImage(null);
                  setCaption('');
                }}
                className="w-full mt-4 text-gray-600 py-3 rounded-full font-medium hover:bg-gray-100 transition-all"
              >
                Upload New Image
              </button>
            </div>
          )}
        </div>
      </div>
      
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
