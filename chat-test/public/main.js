const socket = io();

const peer = new Peer(undefined, {
  host: "/",
  path: "peerjs",
  secure: true,
});

const clientsTotal = document.getElementById("clients-total");

//// **** dit zijn de chat functionaliteiten*/
const messageContainer = document.getElementById("message-container");
const nameInput = document.getElementById("name-input");
const messageForm = document.getElementById("message-form");
const messageInput = document.getElementById("message-input");


////// *** signal circle gebruik ik om aan te geven of de takening door "receiver" ontvangen wordt
///// *** receiver is de externe collector van alle tekeningen
const signalCircle = document.getElementById("signal-circle");
let PEERID;
let peers = []; // Object to store connected peers
let localStream;

///////drawing section

/////// ***** deze gaat dus aanpassen en wordt waarschijnlijk een div met vierkante "pixels" erin
const canvas = document.getElementById("drawing-board");
const ctx = canvas.getContext("2d");
ctx.clearRect(0, 0, canvas.width, canvas.height);
let drawing = false;
let brushSize = 10;
ctx.strokeStyle = "rgba(255,255,255,1)";
ctx.globalCompositeOperation = "source-over";

canvas.addEventListener("mousedown", () => (drawing = true));
canvas.addEventListener("mouseup", () => {
  drawing = false;
  ctx.beginPath();
});

canvas.addEventListener("mousemove", (e) => {
  if (drawing) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.lineTo(x, y);
    ctx.stroke();
  }
});

//// *** Dit heb ik allemaal van jou over genomen
//// *** En volgens mij hoef je lager dan drawing board niet meer te kijken!
const toolsWindow = document.getElementById("board");
const toolsHeader = document.getElementById("board-header");
let offsetX = 0,
  offsetY = 0,
  isDragging = false;

toolsHeader.addEventListener("mousedown", (e) => {
  isDragging = true;
  offsetX = e.clientX - toolsWindow.offsetLeft;
  offsetY = e.clientY - toolsWindow.offsetTop;
});

document.addEventListener("mouseup", () => (isDragging = false));
document.addEventListener("mousemove", (e) => {
  if (isDragging) {
    toolsWindow.style.left = `${e.clientX - offsetX}px`;
    toolsWindow.style.top = `${e.clientY - offsetY}px`;
  }
});

///////// drawing section closed

updateSignalIndicator(false);

messageForm.addEventListener("submit", (e) => {
  e.preventDefault();
  sendMessage();
});

console.log(clientsTotal);

peer.on("open", (peerId) => {
  console.log("Peer ID: " + peerId);
  PEERID = peerId;
  // Notify others that a new peer has joined
});

// Request microphone access
navigator.mediaDevices
  .getUserMedia({ audio: true })
  .then((stream) => {
    console.log("Microphone access granted.");
    localStream = stream;
    console.log(localStream);

    function muteMicrophone(mute) {
      const audioTracks = localStream.getAudioTracks();
      if (audioTracks.length > 0) {
        audioTracks[0].enabled = mute; // Disable the microphone
        console.log("Microphone muted.");
      }
    }

    console.log("sending message to server that peer is connected")
    socket.emit("peer-connected", socket.id);

    socket.on("mute-user", (id) => {
      muteMicrophone(false);
      console.log("muting YOU: ", id);
    });

    socket.on("UNmute-user", (id) => {
      muteMicrophone(true);
      console.log("muting YOU: ", id);
    });

    // peer.on("call", (call) => {
    //   console.log("call is being forwarded");
    //   // Answer the call and send the local stream
    //   call.answer(localStream);

    //   // When receiving a remote stream from another peer
    //   call.on("stream", (remoteStream) => {
    //     console.log(" streamis being forwarded");
    //     // Play the incoming audio
    //     addAudioStream(remoteStream);
    //   });
    // });

    // Handle when a new peer is connected
    socket.on("receiver-peer-present", (peerId) => {
       console.log("receiver present: " + peerId);
       connectToReceiver(peerId);
     });
  })
  .catch((err) => {
    console.error("Error accessing microphone:", err);
  });

// Add a new peer by calling them and sending the local audio stream
function connectToReceiver(peerId) {
  if (!localStream) {
    console.error("No local stream available to connect to peer:", peerId);
    return;
  }

  const call = peer.call(peerId, localStream);
  console.log(`calling receiver peer ${peerId}`);

  if (!call) {
    console.error("Call object not created for peer:", peerId);
    return;
  }

  call.on("stream", (remoteStream) => {
    // Play the remote peer's audio stream
    console.log(`received stream from receiver peer, stream: ${remoteStream}`);
    addAudioStream(remoteStream);
  });

  call.on("error", (err) => {
    console.error("Call error:", err);
  });

  console.log("stream call has passed");

  // Store the peer connection
  peers[peerId] = call;

  console.log(peers);
}

// Play the remote audio stream
function addAudioStream(stream) {
  const audioElement = document.createElement("audio");
  audioElement.srcObject = stream;
  audioElement.play();
  console.log("audioelement created");
  console.log(audioElement);
  document.body.appendChild(audioElement); // Add to DOM
}

socket.on("clients-total", (data) => {
  console.log(data);
  clientsTotal.innerText = `total clients: ${data}`;
});

socket.on("chat-message", (data) => {
  // console.log(data)
  addMessageToUI(false, data);
});

socket.on("receiver-present", (peerId) => {
  console.log("receiver activated", peerId);
  updateSignalIndicator(true);

  const streamImage = canvas.captureStream(30); // 30 FPS

  ///////////temp record CHECK///////////
  console.log("Stream tracks:", streamImage.getTracks());

  videoElement = document.getElementById("received-video");
  videoElement.srcObject = streamImage;
  videoElement.play();

  console.log(streamImage);
  // Connect to the receiver
  const call = peer.call(peerId, streamImage);

  if (!call) {
    console.error("Call object not created for peer:", peerId);
    return;
  } else {
    console.log(call);
    console.log("stream and call-elements");
  }
});

function sendMessage() {
  if (messageInput.value === "") return;
  // console.log(messageInput.value)
  const data = {
    name: nameInput.value,
    message: messageInput.value,
    dateTime: new Date(),
  };
  socket.emit("message", data);
  addMessageToUI(true, data);
  messageInput.value = "";
}

function addMessageToUI(isOwnMessage, data) {
  const element = `
        <li class="${isOwnMessage ? "message-right" : "message-left"}">
            <p class="message">
                ${data.message}
                <span>${data.name} - ${data.dateTime}</span>
            </p>
        </li>
        `;
  messageContainer.innerHTML += element;
  scrolltoBottom();
}

function scrolltoBottom() {
  messageContainer.scrollTo(0, messageContainer.scrollHeight);
}

// Function to update the circle color
function updateSignalIndicator(hasSignal) {
  signalCircle.style.backgroundColor = hasSignal ? "green" : "red";
}
