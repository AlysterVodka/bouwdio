const socket = io();

const peer = new Peer(undefined, {
  host: "/",
  path: "peerjs",
  secure: true,
});

console.log("is UPDATED !!!!!")

const clientsTotal = document.getElementById("clients-total");

//// **** dit zijn de chat functionaliteiten*/
const messageContainer = document.getElementById("message-container");
const nameInput = document.getElementById("name-input");
const messageForm = document.getElementById("message-form");
const messageInput = document.getElementById("message-input");

const gridContainer = document.getElementById('grid');


////// *** signal circle gebruik ik om aan te geven of de takening door "receiver" ontvangen wordt
///// *** receiver is de externe collector van alle tekeningen
const signalCircle = document.getElementById("signal-circle");
let PEERID;
let peers = []; // Object to store connected peers
let localStream;

///////drawing section

/////// ***** deze gaat dus aanpassen en wordt waarschijnlijk een div met vierkante "pixels" erin


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
    console.log("this is the currentsocketid: ", socket.id)
    console.log("this is the peerid: ", PEERID)
    let sendlist = [socket.id, PEERID]
    console.log("sendlist  ", sendlist);
    socket.emit("peer-connected", sendlist);

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
       console.log("starting to call RECEIVER: " + peerId);
       connectToReceiver(peerId);
       socket.emit('show-collector-id');
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

  socket.emit('show-collector-id');
  const call = peer.call(peerId, localStream);
  console.log(`calling receiver peer ${peerId}`);

  if (!call) {
    console.error("Call object not created for peer:", peerId);
    return;
  }

  call.on("stream", (remoteStream) => {
    // Play the remote peer's audio stream
    console.log(`received stream from receiver peer, stream: ${remoteStream}`);
    console.log(remoteStream.getAudioTracks());
    addAudioStream(remoteStream);
  });

  call.on("error", (err) => {
    console.error("Call error:", err);
  });

  console.log("stream call has passed");

  // Store the peer connection
  // peers[peerId] = call;
  // console.log(peers);
}

// Play the remote audio stream
function addAudioStream(stream) {
  const audioElement = document.createElement("audio");
  audioElement.srcObject = stream;
  console.log("source object audio stream : ", audioElement.srcObject.getAudioTracks())
  audioElement.play();
  console.log("audioelement created");
  console.log(audioElement);
  document.body.appendChild(audioElement); // Add to DOM
}


///////////////////////////
////  initiate drawing ////
///////////////////////////

let MATERIAL = null;

let isMouseDown = false; // Track mouse down state

// Listen for mouse down events
document.addEventListener('mousedown', function() {
    isMouseDown = true;
});

// Listen for mouse up events
document.addEventListener('mouseup', function() {
    isMouseDown = false;
});

for (const element of document.getElementsByClassName("material")) {
  console.log(element)
  // Get the ID of the current element
  const elementId = element.id;

  // Add an event listener (e.g., 'mousedown' event)
  element.addEventListener('mousedown', () => {
      // Do something with the ID (for example, log it to the console or send it to a server)
      console.log('Element with ID:', elementId, 'was clicked.');
      MATERIAL = elementId
      
      // If using a socket to send the ID, you can emit the ID here
      // socket.emit('material-clicked', { id: elementId });
  });
}



for (let x = 0; x <= 19; x++) {
  // For each key, assign an array with 20 values (y = 1 to 20)
  for (let y = 0; y <= 29; y++) {
      const div = document.createElement('div');
      div.classList.add('grid-item');
      div.id = `${x}-${y}`

      // Attach mousedown event for socket message
      div.addEventListener('mousedown', () => {
          // Send a message through the socket
          // const message = { row: rowIndex, col: colIndex, data: item };
          x = x;
          y = y;
          socket.emit("updateDrawing",[MATERIAL, x,y]);
      });
      div.addEventListener('mouseenter', () => {
        if(isMouseDown){
          console.log(isMouseDown)
          // Send a message through the socket
          // const message = { row: rowIndex, col: colIndex, data: item };
          x = x;
          y = y;
          socket.emit("updateDrawing",[MATERIAL, x,y]);
        }
      });

      // Optionally, you can store some info in the div's dataset for reference
      div.dataset.row = x;
      div.dataset.col = y;

      // Append the div to the grid container
      gridContainer.appendChild(div);
  };
};


socket.emit("request_drawing")


// document.getElementById("submitButton").addEventListener("click", function() {
//   // Get the value of the input field
//   let inputValue = document.getElementById("userInput").value;
//   let x = Math.floor(Math.random() * 30) + 1; // Random integer between 1 and 100
//   let y = Math.floor(Math.random() * 20) + 1;
//   socket.emit("updateDrawing",[inputValue, x,y])
// })


socket.on("DRAWING",(data) =>{
  // Loop through the dictionary and create divs
  Object.keys(data).forEach((rowKey, rowIndex) => {
      data[rowKey].forEach((item, colIndex) => {
        // console.log(rowIndex, colIndex)
        // console.log(data[rowIndex][colIndex])
        let element = document.getElementById(`${rowIndex}-${colIndex}`);
        // console.log(element)
        element.className =  `grid-item ${data[rowIndex][colIndex]}`
        // console.log(element.class)
      });
  });
  // console.log(data)
})


socket.on("clients-total", (data) => {
  console.log(data);
  clientsTotal.innerText = `total clients: ${data}`;
});

socket.on("chat-message", (data) => {
  // console.log(data)
  addMessageToUI(false, data);
});

socket.on("remote-console", (data) =>{
  console.log(data)
});

// socket.on("receiver-present", (peerId) => {
//   console.log("receiver activated", peerId);
//   updateSignalIndicator(true);

//   // const streamImage = canvas.captureStream(30); // 30 FPS

//   ///////////temp record CHECK///////////
//   // console.log("Stream tracks:", streamImage.getTracks());

//   // videoElement = document.getElementById("received-video");
//   // videoElement.srcObject = streamImage;
//   // videoElement.play();

//   // console.log(streamImage);
//   // Connect to the receiver
//   // const call = peer.call(peerId, streamImage);

//   // if (!call) {
//   //   console.error("Call object not created for peer:", peerId);
//   //   return;
//   // } else {
//   //   console.log(call);
//   //   console.log("stream and call-elements");
//   // }
// });

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

///------ Alyster toevoegingen ----/// 

function frontEndImplementation(){

  let selectedPattern = "assets/images/wood1.png"; /// pattern selector
  const allContent = document.getElementById("all-content"); /// container voor gehele pagina [voor verbergen]
  const pauseStatusWindow = document.getElementById("pause-status-window");
  const connectPauseButton = document.getElementById("connect-pause-button");
  let drawing = false;
  let isPaused = true; // Pauzeknop
  let audioStreamActive = false;
  let micStreamActive = false;
  

  // Functie om de pauzeknop te beheren 
  // 9oct edit: vanuit hier moet de mic en audio ook worden gemute - oude logic zit er nog in, misschien hoeft dit niet te veranderen?
  connectPauseButton.addEventListener("click", function () {
    if (!isPaused) {
      // Verberg de content en toon de pauzestatus
      allContent.style.display = "none"; // Verberg de content
      pauseStatusWindow.style.display = "block"; // Toon het statusvenster
      pauseStatusWindow.innerHTML = `
        <h2>PAUSE - debug - replace with image</h2>
        <p>Audio status: ${audioStreamActive ? "Active" : "Inactive"}</p>
        <p>Microphone status: ${micStreamActive ? "Active" : "Inactive"}</p>
      `;
      isPaused = true;
    } else {
      // Toon de content en verberg de pauzestatus
      allContent.style.display = "block"; // Toon de content
      pauseStatusWindow.style.display = "none"; // Verberg het statusvenster
      isPaused = false;
    }
  });

  // document.querySelectorAll(".material").forEach((material) => {
  //   material.addEventListener("click", () => {
  //     // Herstel alle knoppen naar hun oorspronkelijke materiaalpreview en verwijder selectie van gum
  //     document.querySelectorAll(".material").forEach((el) => {
  //       el.classList.remove("selected");
  //       const imgUrl = el.getAttribute("data-image-url"); // Sla de originele URL op
  //       el.style.backgroundImage = `url(${imgUrl})`; // Herstel de materiaalpreview
  //       el.style.backgroundColor = ""; // Verwijder de zwarte achtergrondkleur
  //     });

  //     // Verwijder de selectie van de gum
  //     const eraser = document.getElementById("eraser-button");
  //     eraser.classList.remove("selected");
  //     eraser.style.backgroundColor = ""; // Herstel de achtergrondkleur van de gum

  //     // Verander de achtergrond van de geselecteerde knop naar zwart en verberg de materiaalpreview
  //     material.classList.add("selected");
  //     material.style.backgroundImage = "none"; // Verberg de materiaalpreview
  //     material.style.backgroundColor = "black"; // Zet de achtergrond op zwart

  //     // Update het tekenpatroon
  //     const imgUrl = material.getAttribute("data-image-url");
  //     const img = new Image();
  //     img.src = imgUrl;
  //     img.onload = () => {
  //       const pattern = ctx.createPattern(img, "repeat");
  //       ctx.strokeStyle = pattern;
  //       ctx.globalCompositeOperation = "source-over"; // Zorg dat je weer "normaal" tekent
  //     };
  //   });
  // });

  // // Behandel de eraser apart
  // document.getElementById("eraser-button").addEventListener("click", () => {
  //   // Herstel alle materiaal knoppen en verwijder hun selectie
  //   document.querySelectorAll(".material").forEach((el) => {
  //     el.classList.remove("selected");
  //     const imgUrl = el.getAttribute("data-image-url"); // Sla de originele URL op
  //     el.style.backgroundImage = `url(${imgUrl})`; // Herstel de materiaalpreview
  //     el.style.backgroundColor = ""; // Verwijder de zwarte achtergrondkleur
  //   });

  //   // Zet de gum als geselecteerd
  //   const eraser = document.getElementById("eraser-button");
  //   eraser.classList.add("selected");
  //   eraser.style.backgroundColor = "black"; // Zwart voor geselecteerde gum

  //   // Zet de gum functie in de canvas
  //   ctx.globalCompositeOperation = "destination-out"; // Gum modus inschakelen
  // });

  // Draggable window
  const onlineBuildingWindow = document.getElementById("online-building-window");
  const header = document.getElementById("online-building-header");
  let offsetX,
    offsetY,
    isDragging = false;

  header.addEventListener("mousedown", (e) => {
    isDragging = true;
    offsetX = e.clientX - onlineBuildingWindow.offsetLeft;
    offsetY = e.clientY - onlineBuildingWindow.offsetTop;
  });

  document.addEventListener("mouseup", () => (isDragging = false));
  document.addEventListener("mousemove", (e) => {
    if (isDragging) {
      let newX = e.clientX - offsetX;
      let newY = e.clientY - offsetY;
      onlineBuildingWindow.style.left = `${newX}px`;
      onlineBuildingWindow.style.top = `${newY}px`;
    }
  });
}

frontEndImplementation()