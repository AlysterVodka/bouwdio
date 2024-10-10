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
socket.on('send-receiver-id', ()=>{
  socket.emit("receiver-log-on", PEERID);
})


function individual_stream(AUDIOcontext, STREAMS, finalSTREAM) {
  this.STREAMS = STREAMS;
  this.muteTRACK = 0;
  this.destination = 0;
  this.AUDIOcontext = AUDIOcontext
  this.finalstream = finalstream;
}

individual_stream.prototype.setDestination = function() {
  this.destination = this.AUDIOcontext.createMediaStreamDestination()
  this.finalstream.connect(this.destination)
  // this.finalstream.connect(this.AUDIOcontext.destination);
  // console.log('destination created : ', this.destination.stream.getAudioTracks())
};

individual_stream.prototype.updateSTREAMS = function(streams, mutePosition){
  this.STREAMS = streams
  this.muteTRACK = mutePosition
  console.log(streams == this.STREAMS, "check if streams matches streams")
  console.log("UPDATED VERSION")
  console.log("muting ", mutePosition)
  for (let i = 1; i < this.STREAMS.length; i++) {
    // console.log("mute track number is: ", this.muteTRACK)
    if(i != mutePosition){
      // console.log("i :  ", i)
      console.log(this.STREAMS[i])
      this.STREAMS[i].connect(this.destination)
    }
  }
}


////             MAAK STREAM               ///////

const audioContext = new AudioContext();
const combinedStream = new MediaStream();
const streams_objects = [];
const streams = [];
let firstSTREAM, speaker;


// Create a silent audio track and add it to the combined stream
function createSilentTrack() {
  const buffer = audioContext.createBuffer(1, audioContext.sampleRate, audioContext.sampleRate); // 1 second of silence
  const source = audioContext.createBufferSource();
  source.buffer = buffer;

  const destination = audioContext.createMediaStreamDestination();
  source.connect(destination);
  source.start(); // Start the source (silent)
  combinedStream.addTrack(destination.stream.getAudioTracks()[0]); // Add the silent trFack to the combined stream
}


// Create the silent track initially
createSilentTrack();

const finalstream = audioContext.createMediaStreamSource(combinedStream)

function firstStream(){
  firstSTREAM = new individual_stream(audioContext, streams, combinedStream)
  streams_objects.push(firstSTREAM)
  streams.push("first stream")

  speaker = document.createElement("audio");
  speaker.srcObject = firstSTREAM.destination.stream;
  speaker.autoplay = true; // Ensure autoplay is enabled
  document.body.appendChild(speaker);

  // Play the audio after creation

  // console.log("source object audio stream : ", audioElement.srcObject.getAudioTracks())
  console.log("audioelement created");
  console.log(speaker);
  document.body.appendChild(speaker);

  speaker.play().then(() => {
    console.log("Audio is playing.");
  }).catch(error => {
    console.log("Error playing audio:", error);
  });
}

firstStream()
// finalstream.connect(audioContext.destination)

// incomingSource.connect(destination);

// gainNode.connect(audioContext.destination);

// const oscillator = audioContext.createOscillator();

// oscillator.type = "square";
// oscillator.frequency.setValueAtTime(3000, audioContext.currentTime); // value in hertz
// oscillator.connect(gainNode);
// oscillator.start();


// const emptyStream = destination.stream;

// console.log(" audiop stream : ", emptyStream)


audioElement = document.createElement("audio");
audioElement.setAttribute("controls", "controls");
document.body.appendChild(audioElement); // Add to DOM
document.getElementById('audio-refresh').addEventListener('click', refreshAudio);

function refreshAudio(){
  if (audioContext.state === 'suspended') {
    console.log("audiocontext was suspended")
    audioContext.resume().then(() => {
      console.log("AudioContext resumed after user interaction.");
    });
  if(speaker.paused){
    speaker.play().then(() => {
      console.log("Audio is playing.");
    }).catch(error => {
      console.log("Error playing audio:", error);
    });
    console.log(speaker)
  }
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



function addToStream(remoteStream, peerId, STREAM) {
  streams_objects.push(STREAM)
  // console.log("audiotracks amount:", remoteStream.getAudioTracks().length);
  trackPosition =  streams_objects.indexOf(STREAM)
  console.log(trackPosition, " is trackposition based on index of object")
  socket.emit("track-updated", [peerId, trackPosition])

  if (remoteStream.getAudioTracks().length === 0) {
    console.error('No audio tracks found in remote stream');
  } else{
    // console.log("audio tracks are present... amount :", remoteStream.getAudioTracks().length)
  }

  if (remoteStream) {
    // console.log(remoteStream)
      // const incomingStream = audioContext.createMediaStreamSource(remoteStream);

      const mediaSource = audioContext.createMediaStreamSource(remoteStream);
      streams.push(mediaSource)
      // console.log("streams,checkin if they are multiple:", streams)
      // remoteStream.getAudioTracks().forEach(track => {
      //   console.log(`Adding track from peer ${peerId}:`, track);
      //   combinedStream.addTrack(track); // Add the track to the central combined stream
      //   console.log("combined stream tracks: ", combinedStream.getTracks())
      // });

      // const options = {
      //   mediaStream: remoteStream,
      // };
      // const source = new MediaStreamAudioSourceNode(audioContext, options);

      // const gainNode = audioContext.createGain();
      // console.log("here is incoming stream:   ", incomingStream);
      // source.connect(gainNode);
      // gainNode.connect(destination);

      streams_objects.forEach((element) =>{
        element.updateSTREAMS(streams, trackPosition)
        // console.log("another streamin the loop:", element)
      })

      console.log("stream_objects + streams inside: ", streams_objects)
      // console.log("destination duaio 222 : ")
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

  const STREAM = new individual_stream(audioContext, streams, combinedStream)
  // console.log(STREAM)
  STREAM.setDestination()
  console.log(call.peer)
  // When receiving a remote stream from another peer
  call.on("stream", (remoteStream) => {
    // console.log("find here some audiotracks states: ", remoteStream.getAudioTracks().map(track => track.readyState));

    ///      addAudioStream(remoteStream);
    // console.log("stream is being forwarded");

    addToStream(remoteStream, call.peer, STREAM)
    // console.log("AFTERMATH STREAM: ", STREAM)
    // Play the incoming audio
    // console.log("Stream tracks:", remoteStream.getTracks());
    // videoElement.setAttribute("muted:1" || "allow:autoplay" || "width:400" ||"height:300"|| "class:received-video") ;
    // console.log("videoelement:", videoElement);
    // videoElement.srcObject = remoteStream;
    // console.log("videoelement:", videoElement);
    // videoElement.play();
  });

  call.answer(STREAM.destination.stream);

  call.on('close', function() {
    console.log("closing stremobjects list ",streams_objects)
    console.log("close call: ", streams_objects.indexOf(STREAM))
    console.log("closing stream list", streams)
    removeStream(streams_objects.indexOf(STREAM))
    // You can trigger additional actions here, like notifying the user
  });


  // socket.emit("receiver-log-on", PEERID);

});

function setAttributes(el, attrs) {
  Object.keys(attrs).forEach((key) => el.setAttribute(key, attrs[key]));
}


function removeStream(index){
  streams_objects.splice(index, 1)
  streams.splice(index, 1)
  console.log("new streams objects: :  ", streams_objects)
  console.log("new streams : :  ", streams)
  streams_objects.forEach((object)=>{
    trackPosition =  streams_objects.indexOf(object)
    console.log("new mute position aqcuired : ", trackPosition)
    object.updateSTREAMS(streams, trackPosition)
  })
}

function renderStreams(object){
  let stream = document.createElement('div')
  stream.innerHTML({

  })

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