
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