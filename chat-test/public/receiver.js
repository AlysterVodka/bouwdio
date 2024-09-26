const socket = io();

const present_light = document.getElementById("signal-circle");

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
  socket.emit("receiver-present", PEERID);
  // Notify others that a new peer has joined
});
////////////////////////////////////////////////////////

/////SOCKET SETUP ///////////////
socket.on("peer-connected", (peerId) => {
  console.log("New peer connected: " + peerId);
  socket.emit("receiver-present", PEERID);
});
//////////////////////////////////

peer.on("call", (call) => {
  console.log("call is being forwarded");
  // Answer the call and send the local stream

  call.answer();
  // When receiving a remote stream from another peer
  call.on("stream", (remoteStream) => {
    console.log(" stream is being forwarded");
    // Play the incoming audio

    console.log("Stream tracks:", remoteStream.getTracks());

    const videoElement = document.createElement("video");
    videoElement.autoplay = true;
    setAttributes(videoElement, {
      muted: 1,
      allow: "autoplay",
      height: "300px",
      width: "400px",
      class: "received-video",
    });
    // videoElement.setAttribute("muted:1" || "allow:autoplay" || "width:400" ||"height:300"|| "class:received-video") ;
    console.log("videoelement:", videoElement);
    videoElement.srcObject = remoteStream;
    console.log("videoelement:", videoElement);
    videoElement.play();
  });
});

function setAttributes(el, attrs) {
  Object.keys(attrs).forEach((key) => el.setAttribute(key, attrs[key]));
}
