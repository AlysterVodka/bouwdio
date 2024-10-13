const init = () =>{
  const audioContext = new AudioContext();
  const combinedStream = new MediaStream();
  const streams_objects = [];
  const streams = [];
  const analyserNodes = [];
  const MUTETRACKS = [];
  const finalstream = new MediaStreamAudioSourceNode();
  let firstSTREAM, speaker, PEERID, peer, socket;


  const signalContainer = document.getElementById("signal-circle");



  navigator.mediaDevices
  .getUserMedia({ audio: true })
  .then((stream) => {
      console.log("Microphone access granted");
      localStream = stream;

      const destination = audioContext.createMediaStreamDestination();
      localStream.connect(destination);
      localStream.start(); // Start the source (silent)
      combinedStream.addTrack(destination.stream.getAudioTracks()[0]);

      finalstream = audioContext.createMediaStreamSource(combinedStream)
      streams.push(finalstream)
  
      finalstream.connect(audioContext.destination)

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


  ///// ------ DELETE IF WORKS THE AUDIO INPUT FROM HOST ----////

  // function createSilentTrack() {
  //   const buffer = audioContext.createBuffer(1, audioContext.sampleRate, audioContext.sampleRate); // 1 second of silence
  //   const source = audioContext.createBufferSource();
  //   source.buffer = buffer;
  
  //   const destination = audioContext.createMediaStreamDestination();
  //   source.connect(destination);
  //   source.start(); // Start the source (silent)
  //   combinedStream.addTrack(destination.stream.getAudioTracks()[0]); // Add the silent trFack to the combined stream
  // }
  
  
  // // Create the silent track initially
  // createSilentTrack();

  //// ---- UNTILLE HERE IF AUDIO INPUT OFHOST WORKS DELETE DELETE DELETE ---- /////

  const initPeer = () =>{
    peer = new Peer(undefined, {
      host: "/",
      path: "peerjs",
      secure: true,
    });
    
    
    peer.on("open", (peerId) => {
      console.log("Peer ID: " + peerId);
      PEERID = peerId;
      initSocket();
      // Notify others that a new peer has joined
    });

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
        // console.log("closing stremobjects list ",streams_objects)
        console.log("close call: ", streams_objects.indexOf(STREAM))
        // console.log("closing stream list", streams)
        removeStream(streams_objects.indexOf(STREAM))
        // You can trigger additional actions here, like notifying the user
      });
    
      // socket.emit("receiver-log-on", PEERID);
    
    });
    
    console.log("peer: ", peer)

    /// here PEERinit function closes

  }

  const initSocket = ()=>{
    socket = io();

    socket.emit("receiver-log-on", PEERID);

    socket.on('send-receiver-id', ()=>{
      socket.emit("receiver-log-on", PEERID);
    })

    firstStream()

    ////initSocket ENDS here

  }


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
    console.log("STREAMS updated for each streamobject")
    // console.log(streams == this.STREAMS, "check if streams matches streams")
    // console.log("UPDATED VERSION")
    this.connectStreams()
  }

  individual_stream.prototype.connectStreams = function(){
    // console.log("CONNECTING STREAMS, WITHOUT ", MUTETRACKS)
    // const connectedNodes = this.destination.numberOfInputs;
    // console.log('connected nodes should be ZERO, NOW IS = ', connectedNodes)
    // if (connectedNodes > 0) {
      // Disconnect everything connected to audioContext.destination
      // this.destination.disconnect();
      // console.log("DICSONNECTED ", this.Position)
    // }
    for (let i = 0; i < this.STREAMS.length; i++) {
      // console.log("mute track number is: ", this.muteTRACK)
      // console.log("this POSITION, ", this.Position)
      if(!MUTETRACKS.includes(i)){
        this.connecting(i)
          }
            // console.log("i :  ", i)
            // console.log(this.STREAMS[i])
        }
    }

  individual_stream.prototype.disconnect = function(index){
    console.log("DISCONNECTING ... : ", index, " for object ", this.Position)
    try{
        this.STREAMS[index].disconnect();
    } catch (error) {
      console.log("Node was not connected, skipping...", error);
    }
  }

  individual_stream.prototype.reconnect = function(index){
    console.log("RECONNECTING ... : ", index, " for object ", this.Position)
    try{
      this.connecting(index)
    } catch (error) {
      console.log("Node was not connected, skipping...", error);
    }
  }

  individual_stream.prototype.positioning = function(index){
    if(this.Position != 0){
        if(index != this.Position){
          if(this.STREAMS[index] instanceof MediaStreamAudioSourceNode){
              this.STREAMS[index].connect(this.destination)
          }
        }
    }
    else{
        if(this.STREAMS[index] instanceof MediaStreamAudioSourceNode){
          const analyserNode = this.AUDIOcontext.createAnalyser();
          analyserNodes[index] = analyserNode;
  
          this.STREAMS[index].connect(analyserNode);
  
          analyserNode.connect(this.destination);

          monitorAudioLevel(analyserNode, index)
        }
    }
  }


  const firstStream = () => {
    firstSTREAM = new individual_stream(audioContext, streams, combinedStream)
    firstSTREAM.setDestination()
    firstSTREAM.Position = 0
    streams_objects.push(firstSTREAM)
    // streams.push("first stream")

    speaker = document.createElement("audio");
    console.log("this is firststream ",firstSTREAM)
    speaker.srcObject = firstSTREAM.destination.stream;
    speaker.autoplay = true; // Ensure autoplay is enabled
    document.body.appendChild(speaker);

    // Play the audio after creation

    // console.log("source object audio stream : ", audioElement.srcObject.getAudioTracks())
    // console.log("audioelement created");
    console.log(speaker);
    document.body.appendChild(speaker);

    speaker.play().then(() => {
      console.log("Audio is playing.");
    }).catch(error => {
      console.log("Error playing audio:", error);
    });
    renderStreams(firstSTREAM, 0)
  }

  document.getElementById('audio-refresh').addEventListener('click', refreshAudio);

  function refreshAudio(){
    if (audioContext.state === 'suspended') {
      console.log("audiocontext was suspended")
      audioContext.resume().then(() => {
        console.log("AudioContext RESUMED");
      });
      if(speaker.paused){
        speaker.play().then(() => {
          console.log("Audio is playing.");
        }).catch(error => {
          console.log("Error playing audio:", error);
        });
        // console.log(speaker)
      }
    }
  }


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

  function addToStream(remoteStream, peerId, STREAM) {
    streams_objects.push(STREAM)
    trackPosition =  streams_objects.indexOf(STREAM)
    STREAM.Position = trackPosition
    // socket.emit("track-updated", [peerId, trackPosition])
  
    if (remoteStream.getAudioTracks().length === 0) {
      console.error('No audio tracks found in remote stream');
      return
    } else{
  
    if (remoteStream) {
        const mediaSource = audioContext.createMediaStreamSource(remoteStream);
        streams.push(mediaSource)
        signalContainer.innerHTML = ''
        streams_objects.forEach((element, index) =>{
          STREAM.Position = index
          element.updateSTREAMS(streams)
          renderStreams(element, index)
  
        })
      }
    }
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
      object.Position = trackPosition
      object.updateSTREAMS(streams)
      renderStreams(object, index)
    })
  }


  function renderStreams(object, i){
    let stream = document.createElement('div')
    stream.innerHTML =
    `<div id="stream_id">${object.Position}</div>`
    let mutebutton = document.createElement('div')
    mutebutton.setAttribute('data-user-id', i);
    let userID = +mutebutton.dataset.userId
    mutebutton.addEventListener('click', ()=>{
      if(MUTETRACKS.includes(userID)){
        // console.log('ALRLEADY IN LIST, ', mutebutton.dataset.userId)
        removeItem(MUTETRACKS, userID)
        console.log('removed: ',userID ,'NEW MUTELIST, ', MUTETRACKS)
        streams_objects.forEach((object) => {
            object.reconnect(userID)
            // object.connectStreams()
          // object.connectStreams()
        })
      } else{
        // console.log('Adding to list, ', mutebutton.dataset.userId)
        MUTETRACKS.push(userID)
        console.log('added: ',userID ,'NEW MUTELIST, ', MUTETRACKS)
        object.disconnect(userID)
      }
        // object.connectStreams()
      // console.log(MUTETRACKS)
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



  function removeItem(listObject, item){
    const index = listObject.indexOf(item);
    if (index > -1) { // only splice array when item is found
      listObject.splice(index, 1); // 2nd parameter means remove one item only
    }
  }



  /// here INIT function closes

}


window.addEventListener("load", init);



