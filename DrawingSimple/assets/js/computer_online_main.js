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

// Pauzeknop
let isPaused = false;
const allContent = document.getElementById('all-content');
const pauseStatusWindow = document.getElementById('pause-status-window');
const connectPauseButton = document.getElementById('connect-pause-button');

let audioStreamActive = false;
let micStreamActive = false;

// Functie om de pauzeknop te beheren
connectPauseButton.addEventListener('click', function () {
  if (!isPaused) {
    // Verberg de content en toon de pauzestatus
    allContent.style.display = 'none';  // Verberg de content
    pauseStatusWindow.style.display = 'block';  // Toon het statusvenster
    pauseStatusWindow.innerHTML = `
      <h2>PAUSE</h2>
      <p>Audio status: ${audioStreamActive ? 'Active' : 'Inactive'}</p>
      <p>Microphone status: ${micStreamActive ? 'Active' : 'Inactive'}</p>
    `;
    isPaused = true;
  } else {
    // Toon de content en verberg de pauzestatus
    allContent.style.display = 'block';  // Toon de content
    pauseStatusWindow.style.display = 'none';  // Verberg het statusvenster
    isPaused = false;
  }
});



// Controleer audio en microfoonstatus
function checkAudioStatus() {
  navigator.mediaDevices.getUserMedia({ audio: true })
    .then(function (stream) {
      audioStreamActive = true;
      const audioTracks = stream.getAudioTracks();
      micStreamActive = audioTracks.length > 0 && audioTracks[0].enabled;
    })
    .catch(function () {
      audioStreamActive = false;
      micStreamActive = false;
    });
}

// Roep de functie elke 5 seconden aan om de status te controleren
setInterval(checkAudioStatus, 5000);

/* ------ Einde audio check ----- */

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

// Socket en PeerJS setup
const socket = io("https://VPROtest.hopto.org:8443", {})

const peer = new Peer(undefined, {
  host: '/',
  port: '8443',  // The port where the PeerJS server is hosted
  path: 'peerjs'
})

const clientsTotal = document.getElementById('clients-total');
const messageContainer = document.getElementById('message-container');
const nameInput = document.getElementById('name-input');
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');
const signalCircle = document.getElementById('signal-circle');
let PEERID;
let peers = [];
let localStream;

updateSignalIndicator(false);

messageForm.addEventListener('submit', (e) => {
  e.preventDefault();
  sendMessage();
});

peer.on('open', (peerId) => {
  PEERID = peerId;
});

navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
  localStream = stream;

  socket.emit('peer-connected', PEERID);

  peer.on('call', (call) => {
    call.answer(localStream);

    call.on('stream', (remoteStream) => {
      addAudioStream(remoteStream);
    });
  });

  socket.on('peer-connected', (peerId) => {
    connectToNewPeer(peerId);
  });

}).catch((err) => {
  console.error('Error accessing microphone:', err);
});

function connectToNewPeer(peerId) {
  if (!localStream) return;

  const call = peer.call(peerId, localStream);

  call.on('stream', (remoteStream) => {
    addAudioStream(remoteStream);
  });
}

function addAudioStream(stream) {
  const audioElement = document.createElement('audio');
  audioElement.srcObject = stream;
  audioElement.play();
  document.body.appendChild(audioElement);
}

socket.on('clients-total', (data) => {
  clientsTotal.innerText = `total clients: ${data}`;
});

socket.on('chat-message', (data) => {
  addMessageToUI(false, data);
});

function sendMessage() {
  if (messageInput.value === '') return;
  const data = {
    name: nameInput.value,
    message: messageInput.value,
    dateTime: new Date()
  };
  socket.emit('message', data);
  addMessageToUI(true, data);
  messageInput.value = '';
}

function addMessageToUI(isOwnMessage, data) {
  const element = `
    <li class="${isOwnMessage ? "message-right" : "message-left"}">
      <p class="message">${data.message}<span>${data.name} - ${data.dateTime}</span></p>
    </li>`;
  messageContainer.innerHTML += element;
  scrolltoBottom();
}

function scrolltoBottom() {
  messageContainer.scrollTo(0, messageContainer.scrollHeight);
}

function updateSignalIndicator(hasSignal) {
  signalCircle.style.backgroundColor = hasSignal ? 'green' : 'red';
}
