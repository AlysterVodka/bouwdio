// console.log("is UPDATED !!!!!")
const init = () => {

  const clientsTotal = document.getElementById("clients-total");

  const gridContainer = document.getElementById('grid');

  let socket, MATERIAL, isMouseDown;

  let viewportWidth = window.innerWidth;
let viewportHeight = window.innerHeight;


  let drawinginitiated = false;

  MATERIAL = 'wood'; // Set the default material to 'wood';
  isMouseDown = false;

  // let peers = []; // Object to store connected peers

  mouse = {x:0, y:0}

  let MICE = []


  const initSocket = () =>{

    socket = io();
    console.log("socket initialized")
    // socket.on('not-welcome', ()=>{
    //   console.log('NOT WELCOME')
    //   window.location.href = '/kicked'
    //   alert('You have been kicked from the chatroom.');
    //   // return
    // })

    socket.on("connect", () => {
      // Inform server about socket/peer connection
      // console.log("SocketID: " + socket.id);
      // socket.emit("peer-connected", [socket.id, peerId]);
    });

    // socket.on('disconnect', () => {
    //   console.log('DISCONNECTED')
    //   // alert('You have been kicked from the chatroom.');
    //   // Redirect to login or home page, for example
    //   window.location.href = '/';
    // });

    socket.emit('send-user-list')

    socket.on("users-reloaded", (users)=>{
      MICE = []
      console.log(users)
      for(let key in users){
        let mouse = document.createElement('div')
        mouse.classList = 'MOUSE'
        mouse.style.left = `${users[key][3].x*viewportWidth}px`
        mouse.style.right = `${users[key][3].y*viewportHeight}px`
        document.body.appendChild(mouse)
        MICE.push(mouse)
      }
    })


    // socket.on("receiver-peer-present", (pID) => {
    //   console.log("New receiver peer connected: " + pID);
    //   if (!pID) {
    //       // console.log("Invalid peer ID: " + pID);
    //   }
    //   // Only call if receiver is not active yet
    //   //// ---> IPLEMENTEER LIJST ONDERDEEL 1
    //   if (activeCalls[pID]) {
    //       return;
    //   }
    //   console.log("Connect to receiver peer");
    //   connectToReceiver(pID);
    // });

    socket.on('mouses', (data)=>{
      // console.log(data)
      Object.keys(data).forEach((key, index) => {
        MICE[index].style.left = `${data[key][3].x*viewportWidth}px`
        MICE[index].style.top = `${data[key][3].y*viewportHeight}px`
      });
    })

    // document.addEventListener('mousemove', function(event) {
    //   mouse.x = event.clientX; // X coordinate of the mouse relative to the viewport
    //   mouse.y = event.clientY; // Y coordinate of the mouse relative to the viewport
    //   // socket.emit('mouse', mouse)
    // });


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

    // socket.on("clients-total", (data) => {
    //   // console.log(data);
    //   // clientsTotal.innerText = `total clients: ${data}`;
    // });
    
    // socket.on("chat-message", (data) => {
    //   // console.log(data)
    //   // addMessageToUI(false, data);
    // });
    
    // socket.on("remote-console", (data) =>{
    //   // console.log(data)
    // });


    initDrawing();


    socket.on("DRAWING",(data) =>{
      if(drawinginitiated == false){
        console.log("drawing initiated")
        drawinginitiated = true
      }
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

  const initDrawing = () =>{
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
      const elementId = element.id;
      element.addEventListener('mousedown', () => {
          MATERIAL = elementId
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
              if(drawinginitiated){
                socket.emit("updateDrawing",[MATERIAL, x,y]);
              }
          });
          div.addEventListener('mouseenter', () => {
            if(isMouseDown){
              // console.log(isMouseDown)
              // Send a message through the socket
              // const message = { row: rowIndex, col: colIndex, data: item };
              x = x;
              y = y;
              if(drawinginitiated){
                socket.emit("updateDrawing",[MATERIAL, x,y]);
              }
            }
          });
  
          // Optionally, you can store some info in the div's dataset for reference
          div.dataset.row = x;
          div.dataset.col = y;
  
          // Append the div to the grid container
          gridContainer.appendChild(div);
          socket.emit("request_drawing")
        };
      }
    }

  initSocket();
  // function frontEndImplementation(){

  // }

  // frontEndImplementation()

}

window.addEventListener("load", init);

