const canvas = document.getElementById('drawing-board');
const ctx = canvas.getContext('2d');
let drawing = false;
let brushSize = 10;
let selectedPattern = "assets/images/wood1.png";

// Resize canvas to fit window size
canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;

// Set default pattern
const img = new Image();
img.src = selectedPattern;
img.onload = () => {
  const pattern = ctx.createPattern(img, 'repeat');
  ctx.strokeStyle = pattern;
};

function updateBrushSize() {
  brushSize = document.getElementById('size-slider').value;
}

function setEraser() {
  ctx.globalCompositeOperation = 'destination-out';
}

document.querySelectorAll('.material').forEach(material => {
  material.addEventListener('click', () => {
    const imgUrl = material.style.backgroundImage.slice(5, -2);
    const img = new Image();
    img.src = imgUrl;
    img.onload = () => {
      const pattern = ctx.createPattern(img, 'repeat');
      ctx.strokeStyle = pattern;
      ctx.globalCompositeOperation = 'source-over';
    };

    document.querySelectorAll('.material').forEach(el => el.classList.remove('selected'));
    material.classList.add('selected');
  });
});

canvas.addEventListener('mousedown', (e) => {
  drawing = true;
  ctx.beginPath();
});

canvas.addEventListener('mouseup', () => {
  drawing = false;
});

canvas.addEventListener('mousemove', (e) => {
  if (drawing) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = brushSize;
    ctx.lineTo(x, y);
    ctx.stroke();
  }
});

// Draggable window
const onlineBuildingWindow = document.getElementById('online-building-window');
const header = document.getElementById('online-building-header');
let offsetX, offsetY, isDragging = false;

header.addEventListener('mousedown', (e) => {
  isDragging = true;
  offsetX = e.clientX - onlineBuildingWindow.offsetLeft;
  offsetY = e.clientY - onlineBuildingWindow.offsetTop;
});

document.addEventListener('mouseup', () => isDragging = false);
document.addEventListener('mousemove', (e) => {
  if (isDragging) {
    let newX = e.clientX - offsetX;
    let newY = e.clientY - offsetY;
    onlineBuildingWindow.style.left = `${newX}px`;
    onlineBuildingWindow.style.top = `${newY}px`;
  }
});
