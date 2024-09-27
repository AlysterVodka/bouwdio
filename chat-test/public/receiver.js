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
  socket.emit("receiver-log-on", PEERID);
  // Notify others that a new peer has joined
});

console.log("peer: ", peer)



////             MAAK STREAM               ///////

const audioContext = new AudioContext();

// Create an empty MediaStream using MediaStreamDestination
const destination = audioContext.createMediaStreamDestination();
const emptyStream = destination.stream;

console.log(" audiop stream : ", emptyStream)


function addToStream(emptyStream, remotestream) {
  console.log("trying to add stream")

  console.log("audiotracks amount:", emptyStream.getAudioTracks().length);

  if (remotestream) {
      const audioTracks = remotestream.getAudioTracks();
      if (audioTracks.length > 0) {
          emptyStream.addTrack(audioTracks[0]);
          console.log('Microphone audio track added to the empty stream');
      }
  }
}

////////////////////////////////////////////////////////

/////SOCKET SETUP ///////////////
// socket.on("peer-connected", (peerId) => {
//   console.log("New peer connected: " + peerId);
//   socket.emit("receiver-present", PEERID);
// });
//////////////////////////////////

peer.on("call", (call) => {
  console.log("call is being forwarded");
  // Answer the call and send the local stream

  call.answer(emptyStream);
  // When receiving a remote stream from another peer
  call.on("stream", (remoteStream) => {
    console.log("stream is being forwarded");
    addToStream(emptyStream, remoteStream)
    // Play the incoming audio

    console.log("Stream tracks:", remoteStream.getTracks());

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
