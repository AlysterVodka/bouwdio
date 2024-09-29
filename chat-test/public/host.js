const socket = io();

const userList = document.getElementById("user-list");
// const present_light = document.getElementById('signal-circle')

///// SET CANVAS PARAMETERS ///////

///////// PEER CONNECTION ///////////////////////////////
let PEERID;
const peer = new Peer(undefined, {
  host: "/",
  path: "peerjs",
  secure: true,
});

peer.on("open", (peerId) => {
  console.log("Peer ID: " + peerId);
  PEERID = peerId;
  socket.emit("host-present", PEERID);
  // Notify others that a new peer has joined
});
////////////////////////////////////////////////////////

socket.on("users-reloaded", (current_users) => {
  console.log(current_users);
  userList.innerHTML = "";
  for (let key in current_users) {
    show_user(key, current_users[key]);
  }
  setButtons();
});

let mutedUser = {};
/////SOCKET SETUP ///////////////
function show_user(peerId, values) {
  console.log("New peer connected: " + peerId);
  socket.emit("host-present", PEERID);

  const userDiv = document.createElement("div");
  const userName = document.createElement("div");
  userDiv.classList.add("user");
  if (values[1] == 0) {
    userDiv.innerHTML = `
        <div class="user-name" id=user-name>${peerId} </div>
        <button id=${peerId} class="mute-button" style="color:red;">mute</button>
        <div class ="kick-button">kick</div>
        <div class ="track-position">${values[2]}</div>`;
  } else {
    userDiv.innerHTML = `
        <div class="user-name" id=user-name>${peerId} </div>
        <button id=${peerId} class="mute-button" style="color:green;">mute</button>
        <div class ="kick-button">kick</div>
        <div class ="track-position">${values[2]}</div>`;
  }
  userList.appendChild(userDiv);
}

function setButtons() {
  let muteButtons = Array.from(document.getElementsByClassName("mute-button"));

  muteButtons.forEach(function (element) {
    console.log(element.id); // Output the text content of each element
    element.addEventListener("click", () => {
      socket.emit("mute-user", element.id);
    });
  });
}

//////////////////////////////////

peer.on("call", (call) => {
  console.log("call is being forwarded");
  // Answer the call and send the local stream

  call.answer();
  // When receiving a remote stream from another peer
});

function setAttributes(el, attrs) {
  Object.keys(attrs).forEach((key) => el.setAttribute(key, attrs[key]));
}
