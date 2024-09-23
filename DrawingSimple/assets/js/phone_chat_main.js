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
