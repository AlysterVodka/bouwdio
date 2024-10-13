const socket = io();

const signalContainer = document.getElementById("signal-circle");

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

const analyserNodes = [];
const MUTETRACKS = [];


function individual_stream(AUDIOcontext, STREAMS, finalSTREAM) {
  this.STREAMS = STREAMS;
  this.Position = 0;
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

individual_stream.prototype.updateSTREAMS = function(streams){
  this.STREAMS = streams
  console.log(trackPosition, " is trackposition based on index of object")
  // console.log(streams == this.STREAMS, "check if streams matches streams")
  // console.log("UPDATED VERSION")
  this.connectStreams()
}

individual_stream.prototype.connectStreams = function(){
  console.log("CONNECTING STREAMS, WITHOUT ", MUTETRACKS)
  const connectedNodes = this.destination.numberOfInputs;
  console.log('connected nodes: ', connectedNodes)
  if (connectedNodes > 0) {
    // Disconnect everything connected to audioContext.destination
    this.destination.disconnect();
    console.log("All streams disconnected from the destination.");
  }
  for (let i = 1; i < this.STREAMS.length; i++) {
    // console.log("mute track number is: ", this.muteTRACK)
    if(this.Position != 0){
      if(!MUTETRACKS.includes(i)){
        console.log('HOST IS FALSE for index, ', i)
        if(i != this.Position){
          if(this.STREAMS[i] instanceof MediaStreamAudioSourceNode){
              this.STREAMS[i].connect(this.destination)
          }
        }
      }
    }
    else{
        if(!MUTETRACKS.includes(i)){
          console.log('HOST IS TRUE for index, ', i)
          if(this.STREAMS[i] instanceof MediaStreamAudioSourceNode){
            const analyserNode = this.AUDIOcontext.createAnalyser();
            analyserNodes[i] = analyserNode;
    
            this.STREAMS[i].connect(analyserNode);
    
            analyserNode.connect(this.destination);

            monitorAudioLevel(analyserNode, i)

          }
        }
    }
      // console.log("i :  ", i)
      // console.log(this.STREAMS[i])
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

finalstream.connect(audioContext.destination)

function firstStream(){
  firstSTREAM = new individual_stream(audioContext, streams, combinedStream)
  firstSTREAM.setDestination()
  streams_objects.push(firstSTREAM)
  streams.push("first stream")
  firstSTREAM.Position = 0

  speaker = document.createElement("audio");
  console.log("this is firststream ",firstSTREAM)
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

function monitorAudioLevel(analyserNode, index){
  const dataArray = new Uint8Array(analyserNode.frequencyBinCount);
  
  const updateVolumeLevel = () => {
    analyserNode.getByteFrequencyData(dataArray);
    
    // Calculate the average volume level for this track
    const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
    const volumePercentage = (average / 255) * 100;

    // Update the HTML element for this specific track
    const volumeElement = document.getElementById(`volume${index}`);
    if (volumeElement) {
      volumeElement.style.width = volumePercentage + '%';
    }

    // Continuously update
    requestAnimationFrame(updateVolumeLevel);
  };

  updateVolumeLevel();

}
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
// audioElement.setAttribute("controls", "controls");
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
  STREAM.Position = trackPosition
  console.log(STREAM.Position, " is trackposition based on index of object")
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
      signalContainer.innerHTML = ''
      streams_objects.forEach((element, index) =>{
        // let mutePosition =  streams_objects.indexOf(STREAM)
        STREAM.Position = index
        element.updateSTREAMS(streams)
        renderStreams(element, index)
        console.log(`this is stream ${index}: `, element)
        // console.log("another streamin the loop:", element)
      })

      console.log("stream_objects + streams inside: ", streams_objects)
      console.log("audioelement : ", speaker)
      console.log("audioelement audiotracks: ", speaker.srcObject.getAudioTracks())
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
  // console.log("new streams objects: :  ", streams_objects)
  // console.log("new streams : :  ", streams)
  signalContainer.innerHTML = ''
  streams_objects.forEach((object, index)=>{
    trackPosition =  streams_objects.indexOf(object)
    console.log("new mute position aqcuired : ", trackPosition)
    object.updateSTREAMS(streams, trackPosition)
    renderStreams(object, index)
  })
}


function renderStreams(object, i){
  let stream = document.createElement('div')
  stream.innerHTML =
  `<div id="stream_id">${object}</div>`
  let mutebutton = document.createElement('div')
  mutebutton.setAttribute('data-user-id', i);
  mutebutton.addEventListener('click', ()=>{
    if(MUTETRACKS.includes(mutebutton.dataset.userId)){
      console.log('ALRLEADY IN LIST, ', mutebutton.dataset.userId)
      removeItem(MUTETRACKS, mutebutton.dataset.userId)
      console.log('NEW MUTELIST, ', MUTETRACKS)
    } else{
      console.log('Adding to list, ', mutebutton.dataset.userId)
      MUTETRACKS.push(mutebutton.dataset.userId)
    }
    streams_objects.forEach((object) => {
      object.connectStreams()
    })
    console.log(MUTETRACKS)
  })

  stream.classList = "stream_object"
  mutebutton.id = "mutebutton"
  mutebutton.innerHTML = 'MUTE'
  let audiolevel = document.createElement('div')
  audiolevel.classList = "audiolevel"
  const volume = document.createElement('div')
  volume.id = `volume${i}`
  volume.classList = "VOLUME"
  audiolevel.appendChild(volume)
  stream.appendChild(mutebutton)
  stream.appendChild(audiolevel)
  signalContainer.appendChild(stream)
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


function removeItem(listObject, item){
  const index = listObject.indexOf(item);
  if (index > -1) { // only splice array when item is found
    listObject.splice(index, 1); // 2nd parameter means remove one item only
  }
}