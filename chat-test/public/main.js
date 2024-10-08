// console.log("is UPDATED !!!!!")
const init = () => {

  const clientsTotal = document.getElementById("clients-total");
  //// **** dit zijn de chat functionaliteiten*/
  const messageContainer = document.getElementById("message-container");
  const nameInput = document.getElementById("name-input");
  const messageForm = document.getElementById("message-form");
  const messageInput = document.getElementById("message-input");
  const gridContainer = document.getElementById('grid');


  ///
  const allContent = document.getElementById("all-content"); /// container voor gehele pagina [voor verbergen]
  const pauseStatusWindow = document.getElementById("pause-status-window");
  allContent.style.display = "none"; // Verberg de content bij het opstarten
  pauseStatusWindow.style.display = "block";


  ////// *** signal circle gebruik ik om aan te geven of de takening door "receiver" ontvangen wordt
  ///// *** receiver is de externe collector van alle tekeningen
  const signalCircle = document.getElementById("signal-circle");
  let localStream, peerId, peer, socket, MATERIAL, isMouseDown;
  const activeCalls = {};

  MATERIAL = 'wood'; // Set the default material to 'wood';
  isMouseDown = false;

  let peers = []; // Object to store connected peers


  ///////

  navigator.mediaDevices
  .getUserMedia({ audio: true })
  .then((stream) => {
      console.log("Microphone access granted");
      localStream = stream;

      // remove mic notification
      //// ->>> DIT IS VOOR ESTHER'S PAUSE-ELEMENT
      // const micElem = document.getElementById("mic");
      // if (micElem) micElem.remove();

      // initialize peer only when mic stream is ready
      initPeer();
  })
  .catch((err) => {
    console.log("No microphone: " + err);
  });

  /////////

  ///////drawing section

  /////// ***** deze gaat dus aanpassen en wordt waarschijnlijk een div met vierkante "pixels" erin


  ///////// drawing section closed

  updateSignalIndicator(false);

  messageForm.addEventListener("submit", (e) => {
    e.preventDefault();
    // sendMessage();
  });

  // console.log(clientsTotal);

  //// INIT PEER /////

  const initPeer = () => {

    peer = new Peer(undefined, {
      host: "/",
      path: "peerjs",
      secure: true,
      config: {
          iceTransportPolicy: "relay",
          iceServers: [
              { url: "stun:stun.l.google.com:19302" },
              {
                  url: "turn:vpro-ddw.phrasa.nl:3478",
                  username: "vpro",
                  credential: "vproddw24",
              },
            ],
          },
        });

    //// maak hier plaats voor open, call error disconnected

      peer.on("open", (pId) => {
        peerId = pId;
        // info("Peer Connected: " + pId);
        // Initialize socket now peer is initialized
        initSocket();
      });


      //// --->>> ONLY NESSACERY WHEN IN P2P  MODE
    //   peer.on(
    //     "call",
    //     function (call) {
    //         info("Incoming call");

    //         // Only answer if call is not active yet
    //         if (activeCalls[call.peer]) {
    //             return;
    //         }

    //         call.answer(localStream);
    //         handleCall(call);
    //     },
    //     function (err) {
    //         error("Failed to get local stream", err);
    //     }
    // );

    // Peer error
    peer.on("error", (err) => {
        // console.log("Peer error: " + err);
    });

    // Peer disconnect
    peer.on("disconnected", (call) => {
      if (!(pId in activeCalls)) {
        info("Audio element was already removed");
        return;
      }
      delete activeCalls[pId];
      console.log(call);
      console.log("Peer disconnected");
    });

  }



  const initSocket = () =>{

    socket = io();

    socket.on("connect", () => {
      // Inform server about socket/peer connection
      // console.log("SocketID: " + socket.id);
      socket.emit("peer-connected", [socket.id, peerId]);
    });


    socket.on("receiver-peer-present", (pID) => {
      console.log("New receiver peer connected: " + pID);
      if (!pID) {
          // console.log("Invalid peer ID: " + pID);
      }
      // Only call if receiver is not active yet
      //// ---> IPLEMENTEER LIJST ONDERDEEL 1
      if (activeCalls[pID]) {
          return;
      }
      console.log("Connect to receiver peer");
      connectToReceiver(pID);
    });


    // function connectToPeer(pID) {
    //   if (!localStream) {
    //       console.error(
    //           "No local stream available to connect to peer:",
    //           pID
    //       );
    //       return;
    //   }

    //   console.log("Outgoing call to id: " + pID);
    //   // socket.emit("show-collector-id");
    //   const call = peer.call(pID, localStream);
    //   if (!call) {
    //       console.error("Call object not created for peer:", pID);
    //       return;
    //   }

    //   handleCall(call);
    // }
    function connectToReceiver(peerId) {
      if (!localStream) {
        // console.error("No local stream available to connect to peer:", peerId);
        return;
      }
    
      // socket.emit('show-collector-id');
      const call = peer.call(peerId, localStream);
      // console.log(`calling receiver peer ${peerId}`);
    
      if (!call) {
        // console.error("Call object not created for peer:", peerId);
        return;
      }

      handleCall(call);

      window.addEventListener('beforeunload', function () {
        // Signal the other peer that we are closing
        call.close();
      });
    

      // Store the peer connection
      // peers[peerId] = call;
      // console.log(peers);
    }

    socket.on("clients-total", (data) => {
      // console.log(data);
      // clientsTotal.innerText = `total clients: ${data}`;
    });
    
    socket.on("chat-message", (data) => {
      // console.log(data)
      // addMessageToUI(false, data);
    });
    
    socket.on("remote-console", (data) =>{
      // console.log(data)
    });


    initDrawing();


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

  }



  const handleCall = (call) => {
    let domElem;

    const endCall = () => {
        if (!domElem) return;
        // console.log("Removing audio element");
        domElem.remove();
        delete activeCalls[call.peer];
        // delete activeCalls[call.peer];
    };

    call.on("stream", (remoteStream) => {
        // console.log("Stream received from receiver: " + remoteStream.id);
        activeCalls[call.peer] = remoteStream.id;
        // console.log("Active calls", activeCalls);
        domElem = addAudioStream(remoteStream);
    });

    call.on("error", (err) => {
        console.log("Call error: " + err);
        endCall();
    });

    call.on("close", () => {
        console.log("Closing call");
        endCall();
    });
  };



  //// -> in handlecall

  // Request microphone access
  // navigator.mediaDevices
  //   .getUserMedia({ audio: true })
  //   .then((stream) => {
  //     console.log("Microphone access granted.");
  //     localStream = stream;
  //     console.log(localStream);

  //     function muteMicrophone(mute) {
  //       const audioTracks = localStream.getAudioTracks();
  //       if (audioTracks.length > 0) {
  //         audioTracks[0].enabled = mute; // Disable the microphone
  //         console.log("Microphone muted.");
  //       }
  //     }

      // console.log("sending message to server that peer is connected")
      // console.log("this is the currentsocketid: ", socket.id)
      // console.log("this is the peerid: ", PEERID)

      ///// ---->   dit moet er nog in
      // let sendlist = [socket.id, peerId]
      // // console.log("sendlist  ", sendlist);
      // socket.emit("peer-connected", sendlist);

      // socket.on("mute-user", (id) => {
      //   muteMicrophone(false);
      //   console.log("muting YOU: ", id);
      // });

      // socket.on("UNmute-user", (id) => {
      //   muteMicrophone(true);
      //   console.log("muting YOU: ", id);
      // });

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

      //// ---->>> dit moet er nog IN

    // })
    // .catch((err) => {
    //   console.error("Error accessing microphone:", err);
    // });

  // Add a new peer by calling them and sending the local audio stream


  // Play the remote audio stream
  function addAudioStream(stream) {
    const audioElement = document.createElement("audio");
    audioElement.srcObject = stream;
    // console.log("source object audio stream : ", audioElement.srcObject.getAudioTracks())
    audioElement.play();
    console.log("audioelement created");
    console.log(audioElement);
    document.body.appendChild(audioElement); // Add to DOM
    return audioElement
  }


  ///////////////////////////
  ////  initiate drawing ////
  ///////////////////////////
const initDrawing = () =>{
  // console.log('initdrawing is called')
  MATERIAL = 'wood'; // Set the default material to 'wood';
  isMouseDown = false;

  document.addEventListener('mousedown', function() {
    isMouseDown = true;
  });

  // Listen for mouse up events
  document.addEventListener('mouseup', function() {
      isMouseDown = false;
  });

  for (const element of document.getElementsByClassName("material")) {
    // console.log(element)
    // Get the ID of the current element
    const elementId = element.id;

    // Add an event listener (e.g., 'mousedown' event)
    element.addEventListener('mousedown', () => {
        // Do something with the ID (for example, log it to the console or send it to a server)
        // console.log('Element with ID:', elementId, 'was clicked.');
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
            // console.log(isMouseDown)
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
    }
  }

  // Listen for mouse down events


  // socket.emit("request_drawing")


  // document.getElementById("submitButton").addEventListener("click", function() {
  //   // Get the value of the input field
  //   let inputValue = document.getElementById("userInput").value;
  //   let x = Math.floor(Math.random() * 30) + 1; // Random integer between 1 and 100
  //   let y = Math.floor(Math.random() * 20) + 1;
  //   socket.emit("updateDrawing",[inputValue, x,y])
  // })
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
    // addMessageToUI(true, data);
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
    //const connectPauseButton = document.getElementById("connect-pause-button");
    let drawing = false;
    let isPaused = true; // Pauzeknop
    let audioStreamActive = true;
    let micStreamActive = true;
    
    // Zet de applicatie standaard in pauzestand bij het laden van de pagina
  // window.onload = function () {
  //   MATERIAL = 'wood'; // Set the default material to 'wood'
  //   allContent.style.display = "none"; // Verberg de content bij het opstarten
  //   pauseStatusWindow.style.display = "block"; // Toon het pauzevenster
  // };
    // Functie om de pauzeknop te beheren 
    // 9oct edit: vanuit hier moet de mic en audio ook worden gemute - oude logic zit er nog in, misschien hoeft dit niet te veranderen?
  // Pauze functionaliteit voor de knop onderin (PAUSE knop) 
  /*
  connectPauseButton.addEventListener("click", function () {
    if (!isPaused) {
      // Zet de applicatie op pauze
      allContent.style.display = "none"; // Verberg de content
      pauseStatusWindow.style.display = "block"; // Toon pauzevenster
      isPaused = true;
  
      // Zet de audio/microfoon uit zoals voorheen
      audioStreamActive = false;
      micStreamActive = false;
    } else {
      // Haal de applicatie uit pauze
      allContent.style.display = "block"; // Toon de content
      pauseStatusWindow.style.display = "none"; // Verberg pauzevenster
      isPaused = false;
  
      // Zet de audio/microfoon aan zoals voorheen
      audioStreamActive = true;
      micStreamActive = true;
    }
  });
  */
  
  // Functionaliteit voor "Click to Connect"-knop in het pauzevenster
  document.getElementById("click-to-connect-button").addEventListener("click", function () {
    const nameInput = document.getElementById('name-input');
    const userName = nameInput.value.trim();
  
    // Controleer of de naam nog steeds 'anonymous' is of leeg
    if (userName === 'anonymous' || userName === "") {
      nameInput.style.backgroundColor = '#D4A017'; // Highlight het tekstvak
      setTimeout(() => {
        nameInput.style.backgroundColor = ''; // Verwijder highlight na 2 seconden
      }, 2000);
      return; // Blokkeer toegang tot de ervaring totdat de naam is aangepast
    }
  
    // Zelfde logica als hierboven om de applicatie uit pauze te halen
    allContent.style.display = "block"; // Toon de content
    pauseStatusWindow.style.display = "none"; // Verberg pauzevenster
    isPaused = false;
  
    // Zet de audio/microfoon aan
    audioStreamActive = true;
    micStreamActive = true;
  
    // Start de video met geluid
    const iframe = document.getElementById('onsite-video');
    iframe.src = iframe.src.replace('autoplay=0&mute=1', 'autoplay=1&mute=0&controls=0');
  
    // Update mouseNameElement met de ingevoerde naam
    mouseNameElement.textContent = userName;
  });
  
  // Muis functionaliteit voor naam bij cursor als deze over het tekenraster beweegt
  const gridContainer = document.getElementById('grid');
  
  // Maak een element voor de naam bij de muis
  const mouseNameElement = document.createElement('div');
  mouseNameElement.id = 'mouse-name';
  mouseNameElement.style.position = 'absolute';
  mouseNameElement.style.display = 'none';
  mouseNameElement.style.fontFamily = 'Open Sans';  // Stijl van de naam
  mouseNameElement.style.backgroundColor = 'rgba(255, 255, 255, 0.8)'; // Witte achtergrond met transparantie
  mouseNameElement.style.padding = '5px 10px'; // Maak de naam duidelijker zichtbaar
  mouseNameElement.style.fontSize = '14px'; // Maak de tekst beter leesbaar
  mouseNameElement.style.borderRadius = '5px'; // Iets grotere border-radius
  mouseNameElement.style.zIndex = '1000';
  document.body.appendChild(mouseNameElement);
  
  // Functie om de naam bij de muis te tonen bij hover op het tekenraster
  gridContainer.addEventListener('mouseenter', () => {
    mouseNameElement.style.display = 'block';
  });
  
  // Verplaats de naam met de muisbeweging
  gridContainer.addEventListener('mousemove', (e) => {
    mouseNameElement.style.left = `${e.pageX + 10}px`; // Plaats de naam 10px naast de cursor
    mouseNameElement.style.top = `${e.pageY + 10}px`;  // Plaats de naam 10px onder de cursor
  });
  
  // Verberg de naam wanneer de muis het raster verlaat
  gridContainer.addEventListener('mouseleave', () => {
    mouseNameElement.style.display = 'none';
  });
  
  
  const materials = document.querySelectorAll('.material');
  const chatDefault = document.getElementById('chat-default');
  const chatHover = document.getElementById('chat-hover');
  const hoverMaterialName = document.getElementById('hover-material-name');
  const hoverMaterialInfo = document.getElementById('hover-material-info');
  
  // Define materials with their names and descriptions
  const materialsInfo = {
    wood: {
      name: "Wood",
      description: "Wood placeholder text. This is some wood, it floats in water. Wood comes from a tree. Trees can be farmed. Some farms are big, some are small. Trees have a lot of different types, they grow long roots. Wood can be used for a house or a boat."
    },
    bamboo: {
      name: "Bamboo",
      description: "Bamboo placeholder text."
    },
    hemp: {
      name: "Fiberhemp",
      description: "Fiberhemp placeholder text."
    },
    mycelium: {
      name: "Mycelium",
      description: "Mycelium placeholder text."
    },
    lisdodde: {
      name: "Lisdodde",
      description: "Lisdodde placeholder text."
    },
    grass: {
      name: "Mammoth Grass",
      description: "Mammoth Grass placeholder text."
    },
    straw: {
      name: "Hay",
      description: "Hay placeholder text."
    },
    mat: {
      name: "Recycled Mat",
      description: "Recycled Mat placeholder text."
    }
  };
  
  // Add event listeners for hover functionality on materials
  document.querySelectorAll('.material').forEach(material => {
    material.addEventListener('mouseenter', function() {
      const materialId = this.id;
      
      // Check if the hovered material has info
      if (materialsInfo[materialId]) {
        // Update the chat window with material info
        document.getElementById('material-name').textContent = materialsInfo[materialId].name;
        document.getElementById('material-description').textContent = materialsInfo[materialId].description;
  
        // Hide default text and show material info
        document.getElementById('default-text').style.display = 'none';
        document.getElementById('material-info').style.display = 'block';
      }
    });
  
    material.addEventListener('mouseleave', function() {
      // Show default text and hide material info when hover ends
      document.getElementById('default-text').style.display = 'block';
      document.getElementById('material-info').style.display = 'none';
    });
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
    const onlineBuildingWindow = document.getElementById("onsite-building");
    const header = document.getElementById("onsite-building-header");
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

}

window.addEventListener("load", init);

