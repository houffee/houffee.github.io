document.addEventListener('DOMContentLoaded', () => {
  const nav = document.querySelector('.floating-nav');
  const toggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelectorAll('.floating-nav-links a');

  if (nav && toggle) {
    const setMenuState = (isOpen) => {
      nav.classList.toggle('is-open', isOpen);
      toggle.setAttribute('aria-expanded', String(isOpen));
      toggle.setAttribute('aria-label', isOpen ? 'Cerrar menú' : 'Abrir menú');
    };

    toggle.addEventListener('click', (event) => {
      event.stopPropagation();
      const willOpen = !nav.classList.contains('is-open');
      setMenuState(willOpen);
    });

    navLinks.forEach((link) => {
      link.addEventListener('click', () => setMenuState(false));
    });

    document.addEventListener('click', (event) => {
      if (!nav.contains(event.target)) {
        setMenuState(false);
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        setMenuState(false);
      }
    });
  }

  const canvas = document.getElementById('pufCanvas');
  const clearButton = document.getElementById('clearPufButton');
  const colorPicker = document.getElementById('pufColorPicker');
  const alphaPicker = document.getElementById('pufAlphaPicker');
  const toolButtons = document.querySelectorAll('.tool-button');

  if (canvas) {
    const ctx = canvas.getContext('2d');
    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;
    let activeTool = 'draw';

    const hexToRgba = (hex, alpha) => {
      const safeHex = hex.replace('#', '');
      const normalized = safeHex.length === 3
        ? safeHex.split('').map((char) => char + char).join('')
        : safeHex;
      const value = Number.parseInt(normalized, 16);
      const r = (value >> 16) & 255;
      const g = (value >> 8) & 255;
      const b = value & 255;
      return [r, g, b, alpha];
    };

    const applyToolState = () => {
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = activeTool === 'eraser' ? 18 : 6;
      ctx.strokeStyle = activeTool === 'eraser' ? 'rgba(0,0,0,1)' : `rgba(${hexToRgba(colorPicker?.value || '#4a2d2d', Number(alphaPicker?.value || 100) / 100).join(', ')})`;
      ctx.globalCompositeOperation = activeTool === 'eraser' ? 'destination-out' : 'source-over';
    };

    const setActiveTool = (toolName) => {
      activeTool = toolName;
      toolButtons.forEach((button) => {
        const isActive = button.dataset.tool === toolName;
        button.classList.toggle('is-active', isActive);
      });
      applyToolState();
    };

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const width = Math.max(320, rect.width);
      const height = Math.max(220, rect.height);
      canvas.width = width;
      canvas.height = height;
      ctx.clearRect(0, 0, width, height);
      applyToolState();
    };

    const getPosition = (event) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: Math.min(Math.max(event.clientX - rect.left, 0), rect.width),
        y: Math.min(Math.max(event.clientY - rect.top, 0), rect.height),
      };
    };

    const drawLine = (x, y) => {
      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
      ctx.lineTo(x, y);
      ctx.stroke();
      lastX = x;
      lastY = y;
    };

    const getCanvasPixel = (imageData, x, y) => {
      const index = (Math.floor(y) * imageData.width + Math.floor(x)) * 4;
      return [
        imageData.data[index],
        imageData.data[index + 1],
        imageData.data[index + 2],
        imageData.data[index + 3],
      ];
    };

    const floodFill = (startX, startY, fillColor) => {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const width = imageData.width;
      const height = imageData.height;
      const target = getCanvasPixel(imageData, startX, startY);
      const stack = [[Math.floor(startX), Math.floor(startY)]];

      while (stack.length) {
        const [x, y] = stack.pop();
        if (x < 0 || x >= width || y < 0 || y >= height) {
          continue;
        }

        const index = (y * width + x) * 4;
        const current = [data[index], data[index + 1], data[index + 2], data[index + 3]];
        const matchTarget = current.every((value, i) => Math.abs(value - target[i]) <= 2);

        if (!matchTarget) {
          continue;
        }

        data[index] = fillColor[0];
        data[index + 1] = fillColor[1];
        data[index + 2] = fillColor[2];
        data[index + 3] = fillColor[3];

        stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
      }

      ctx.putImageData(imageData, 0, 0);
    };

    const handlePointerDown = (event) => {
      const point = getPosition(event);
      lastX = point.x;
      lastY = point.y;

      if (activeTool === 'bucket') {
        const rgba = hexToRgba(colorPicker?.value || '#4a2d2d', Number(alphaPicker?.value || 100) / 100);
        floodFill(point.x, point.y, rgba);
        return;
      }

      isDrawing = true;
      drawLine(point.x, point.y);
    };

    const handlePointerMove = (event) => {
      if (!isDrawing) {
        return;
      }
      const point = getPosition(event);
      drawLine(point.x, point.y);
    };

    const stopDrawing = () => {
      isDrawing = false;
    };

    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerup', stopDrawing);
    canvas.addEventListener('pointerleave', stopDrawing);
    canvas.addEventListener('pointercancel', stopDrawing);

    colorPicker?.addEventListener('input', () => {
      applyToolState();
    });

    alphaPicker?.addEventListener('input', () => {
      applyToolState();
    });

    toolButtons.forEach((button) => {
      button.addEventListener('click', () => setActiveTool(button.dataset.tool));
    });

    clearButton?.addEventListener('click', () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      applyToolState();
    });

    resizeCanvas();
    setActiveTool('draw');
  }
});
