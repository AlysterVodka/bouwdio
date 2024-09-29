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

const gainNode = audioContext.createGain();
const destination = audioContext.createMediaStreamDestination();


gainNode.connect(destination);
// gainNode.connect(audioContext.destination);

// const oscillator = audioContext.createOscillator();

// oscillator.type = "square";
// oscillator.frequency.setValueAtTime(3000, audioContext.currentTime); // value in hertz
// oscillator.connect(gainNode);
// oscillator.start();


// const emptyStream = destination.stream;

// console.log(" audiop stream : ", emptyStream)



audioElement = document.createElement("audio");
document.body.appendChild(audioElement); // Add to DOM
document.getElementById('audio-refresh').addEventListener('click', refreshAudio);

function refreshAudio(){
  if (audioContext.state === 'suspended') {
    console.log("audiocontext was suspended")
    audioContext.resume().then(() => {
      console.log("AudioContext resumed after user interaction.");
    });
  }


  // audioElement.srcObject = destination.stream;
  // console.log("source object audio stream : ", audioElement.srcObject.getAudioTracks())
  // const audioTracks = audioElement.srcObject.getAudioTracks();
  // audioTracks.forEach((track, index) => {
  //   console.log(`Track ${index} - Kind: ${track.kind}, Active: ${track.readyState}`);
  // });
  // audioElement.play().catch((error) => {
  //   console.log('Error playing audio:', error);
  // });
  // console.log(audioElement);
}


function addToStream(remoteStream, peerId) {
  console.log("audiotracks amount:", remoteStream.getAudioTracks().length);
  trackPosition =  remoteStream.getAudioTracks().length
  socket.emit("track-updated", [peerId, trackPosition])


  if (remoteStream.getAudioTracks().length === 0) {
    console.error('No audio tracks found in remote stream');
  } else{
    console.log("audio tracks are present... amount :", remoteStream.getAudioTracks().length)
  }

  if (remoteStream) {
    console.log(remoteStream)
      const incomingStream = audioContext.createMediaStreamSource(remoteStream);

      const options = {
        mediaStream: remoteStream,
      };
      const source = new MediaStreamAudioSourceNode(audioContext, options);

      console.log("here is incoming stream:   ", incomingStream);
      source.connect(gainNode);

      console.log("destination duaio: ", destination)
      // console.log("destination duaio 222 : ")
      refreshAudio();
      // console.log('Microphone audio track added to the empty stream');
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
  // console.log("call is being forwarded");
  // Answer the call and send the local stream

  console.log(call.peer)
  // When receiving a remote stream from another peer
  call.on("stream", (remoteStream) => {
    console.log("find here some audiotracks states: ", remoteStream.getAudioTracks().map(track => track.readyState));

    ///      addAudioStream(remoteStream);
    // console.log("stream is being forwarded");
    addToStream(remoteStream, call.peer)
    // Play the incoming audio
    // console.log("Stream tracks:", remoteStream.getTracks());
    // videoElement.setAttribute("muted:1" || "allow:autoplay" || "width:400" ||"height:300"|| "class:received-video") ;
    // console.log("videoelement:", videoElement);
    // videoElement.srcObject = remoteStream;
    // console.log("videoelement:", videoElement);
    // videoElement.play();
  });
  call.answer(destination.stream);

  // socket.emit("receiver-log-on", PEERID);

});

function setAttributes(el, attrs) {
  Object.keys(attrs).forEach((key) => el.setAttribute(key, attrs[key]));
}



// function addAudioStream(stream) {
//   const audioElement = document.createElement("audio");
//   audioElement.srcObject = stream;
//   console.log("source object audio stream : ", audioElement.srcObject.getAudioTracks())
//   audioElement.play();
//   console.log("audioelement created");
//   console.log(audioElement);
//   document.body.appendChild(audioElement); // Add to DOM
// }