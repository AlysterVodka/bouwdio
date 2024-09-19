// Signal circle DOM element
const signalCircle = document.getElementById('signalCircle');

// Function to update the circle color
function updateSignalIndicator(hasSignal) {
    signalCircle.style.backgroundColor = hasSignal ? 'green' : 'red';
}

// Initially set to no signal (red)
updateSignalIndicator(false);

// WebRTC and Socket.IO setup
const socket = io();  // Connect to the signaling server
let peerConnection = null;

// Request microphone access
navigator.mediaDevices.getUserMedia({ audio: true })
    .then(function (stream) {
        console.log('Microphone access granted.');

        // Create an AudioContext to analyze the audio stream
        const audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256; // Increase precision
        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        // Monitor the audio stream for activity
        function checkAudioSignal() {
            analyser.getByteFrequencyData(dataArray);
            const signal = dataArray.some(value => value > 10); // Detect if there's audio signal
            updateSignalIndicator(signal); // Update the circle based on audio signal
            requestAnimationFrame(checkAudioSignal); // Continuously check the signal
        }
        checkAudioSignal(); // Start checking

        // Set up WebRTC connection
        peerConnection = new RTCPeerConnection({
            iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
        });

        // Add the local audio stream to the peer connection
        peerConnection.addTrack(stream.getTracks()[0], stream);

        // Handle receiving remote audio streams
        peerConnection.ontrack = function (event) {
            const audio = new Audio();
            audio.srcObject = event.streams[0];
            audio.play();
        };

        // Send ICE candidates to the other peer via Socket.IO
        peerConnection.onicecandidate = function (event) {
            if (event.candidate) {
                socket.emit('webrtc-signaling', { candidate: event.candidate });
            }
        };

        // Create an offer to start WebRTC connection
        peerConnection.createOffer().then(offer => {
            peerConnection.setLocalDescription(offer);
            socket.emit('webrtc-signaling', { offer: offer });
        });

    })
    .catch(function (err) {
        console.error('Error accessing microphone: ', err);
        alert('Please allow microphone access to use this feature.');
    });

// Handle incoming WebRTC signaling messages from Socket.IO
socket.on('webrtc-signaling', function (message) {
    if (message.offer) {
        peerConnection.setRemoteDescription(new RTCSessionDescription(message.offer));
        peerConnection.createAnswer().then(answer => {
            peerConnection.setLocalDescription(answer);
            socket.emit('webrtc-signaling', { answer: answer });
        });
    } else if (message.answer) {
        peerConnection.setRemoteDescription(new RTCSessionDescription(message.answer));
    } else if (message.candidate) {
        peerConnection.addIceCandidate(new RTCIceCandidate(message.candidate));
    }
});
