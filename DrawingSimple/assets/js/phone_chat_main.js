// Pauzeknop
let isPaused = false;
const allContent = document.getElementById('all-content');
const pauseStatusWindow = document.getElementById('pause-status-window');
const connectPauseButton = document.getElementById('connect-pause-button');

let audioStreamActive = false;
let micStreamActive = false;

// Pauzeknop functionaliteit
connectPauseButton.addEventListener('click', function () {
  if (!isPaused) {
    allContent.style.display = 'none';
    pauseStatusWindow.style.display = 'block';
    pauseStatusWindow.innerHTML = `
      <h2>PAUSE</h2>
      <p>Audio status: ${audioStreamActive ? 'Active' : 'Inactive'}</p>
      <p>Microphone status: ${micStreamActive ? 'Active' : 'Inactive'}</p>
    `;
    isPaused = true;
  } else {
    allContent.style.display = 'block';
    pauseStatusWindow.style.display = 'none';
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

// Controleer elke 5 seconden audio status
setInterval(checkAudioStatus, 5000);


const socket = io("https://VPROtest.hopto.org:8443",{})

const peer = new Peer(undefined, {
    host: '/',
    port: '8443',  // The port where the PeerJS server is hosted
    path: 'peerjs'
})


const clientsTotal = document.getElementById('clients-total')

const messageContainer = document.getElementById('message-container')
const nameInput = document.getElementById('name-input')
const messageForm = document.getElementById('message-form')
const messageInput = document.getElementById('message-input')


const signalCircle = document.getElementById('signal-circle')
let PEERID;
let peers = [];  // Object to store connected peers
let localStream;

updateSignalIndicator(false);

messageForm.addEventListener('submit', (e)=>{
    e.preventDefault()
    sendMessage()
})

console.log(clientsTotal)

peer.on('open', (peerId) => {
    console.log('Peer ID: ' + peerId);
    PEERID = peerId;
    // Notify others that a new peer has joined
})

// Request microphone access
navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
    console.log('Microphone access granted.');
    localStream = stream;
    console.log(localStream)

    socket.emit('peer-connected', PEERID);


    peer.on('call', (call) => {
        console.log('call is being forwarded')
        // Answer the call and send the local stream
        call.answer(localStream);
    
        // When receiving a remote stream from another peer
        call.on('stream', (remoteStream) => {

            console.log(' streamis being forwarded')
            // Play the incoming audio
            addAudioStream(remoteStream);
        });
    });
    
    // Handle when a new peer is connected
    socket.on('peer-connected', (peerId) => {
        console.log('New peer connected: ' + peerId);
        connectToNewPeer(peerId);
    })

    }).catch((err) => {
    console.error('Error accessing microphone:', err);
})



// Add a new peer by calling them and sending the local audio stream
function connectToNewPeer(peerId) {


    if (!localStream) {
        console.error('No local stream available to connect to peer:', peerId);
        return;
    }

    const call = peer.call(peerId, localStream);
    console.log(`calling peer ${peerId}`)

    if (!call) {
        console.error('Call object not created for peer:', peerId);
        return;
    }

    call.on('stream', (remoteStream) => {
        // Play the remote peer's audio stream
        console.log(`received stream from peer, stream: ${remoteStream}`)
        addAudioStream(remoteStream);
    });

    call.on('error', (err) => {
        console.error('Call error:', err);
    });

    console.log('stream call has passed')

    // Store the peer connection
    peers[peerId] = call;

    console.log(peers)
}

// Play the remote audio stream
function addAudioStream(stream) {
    const audioElement = document.createElement('audio');
    audioElement.srcObject = stream;
    audioElement.play();
    console.log('audioelement created')
    console.log(audioElement)
    document.body.appendChild(audioElement);  // Add to DOM
}



socket.on('clients-total',(data) =>{
    console.log(data)
    clientsTotal.innerText = `total clients: ${data}`
})


socket.on('chat-message', (data) =>{
    // console.log(data)
    addMessageToUI(false, data)
})


function sendMessage(){
    if(messageInput.value === '') return
    // console.log(messageInput.value)
    const data = {
        name: nameInput.value,
        message: messageInput.value,
        dateTime: new Date()
    }
    socket.emit('message', data)
    addMessageToUI(true, data)
    messageInput.value= ''
}


function addMessageToUI(isOwnMessage, data){
    const element =`
        <li class="${isOwnMessage ? "message-right" : "message-left"}">
            <p class="message">
                ${data.message}
                <span>${data.name} - ${data.dateTime}</span>
            </p>
        </li>
        `
    messageContainer.innerHTML += element
    scrolltoBottom()
}

function scrolltoBottom(){
    messageContainer.scrollTo(0, messageContainer.scrollHeight)
}

// Function to update the circle color
function updateSignalIndicator(hasSignal) {
    signalCircle.style.backgroundColor = hasSignal ? 'green' : 'red';
}