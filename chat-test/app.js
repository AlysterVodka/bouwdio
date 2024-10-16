const fs = require('fs')
const http = require('http')
const express = require('express')

///////// SETUP APP PORT ///////////////////////////
const app = express()
const server = http.createServer(
    //{
   // key: fs.readFileSync('certs/localhost-key.pem'),
   // cert: fs.readFileSync('certs/localhost.pem')},
    app)
const path = require('path')
const PORT = process.env.PORT || 8443
let socketsConnected = new Set()

let receiverId;
let users = {};


app.use(express.static(path.join(__dirname, 'public')))

app.get("/rec", (req, res) => {
    console.log('request sent')
    // Send the HTML file as the response
    res.sendFile(path.join(__dirname, '/public/receiver.html'));
});

app.get("/host", (req, res) => {
    console.log('request sent')
    // Send the HTML file as the response
    res.sendFile(path.join(__dirname, '/public/host.html'));
});

const io = require('socket.io')(server)

////////// CHECK IP /////////////////////////////////////
const DATA_FILE = path.join(__dirname, 'blacklist.json');

function loadList() {
    if (!fs.existsSync(DATA_FILE)) {
        return [];  // If the file doesn't exist, start with an empty list
    }
    const data = fs.readFileSync(DATA_FILE, 'utf-8');
    try {
        return JSON.parse(data);  // Parse the JSON list
    } catch (err) {
        console.error("Error parsing JSON list:", err);
        return [];
    }
}

// Function to save the list back to the file
function saveList(LIST) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(LIST, null, 4), 'utf-8');
        // console.log("List saved successfully.");
    } catch (err) {
        console.error("Error saving list:", err);
    }
}

// Load the list into memory
let LIST = loadList();

// Function to add an item to the list
function addToList(item) {
    if (!LIST.includes(item)) {
        LIST.push(item);  // Add the item to the list
        saveList(LIST);   // Save the updated list to the file
        // console.log(`${item} added to the list.`);
    } else {
        console.log(`${item} already exists in the list.`);
    }
}

function refreshList() {
    LIST = []
    // Add the item to the list
        saveList(LIST);   // Save the updated list to the file
        // console.log(`${item} added to the list.`);
}


/////////////////////////////////////////////////////////////////////

const current_users = path.join(__dirname, 'current_users.json');
const drawing = path.join(__dirname, 'drawing.json');

// Function to load the dictionary (JSON) from the file
function loadDictionary(filename) {
    if (!fs.existsSync(filename)) {
        // If the file doesn't exist, start with an empty dictionary
        return {};
    }

    const data = fs.readFileSync(filename, 'utf-8');
    try {
        // Parse the JSON data from the file
        return JSON.parse(data);
    } catch (err) {
        console.error("Error parsing JSON data:", err);
        return {};
    }
}

// Function to save the dictionary (JSON) back to the file
function saveDictionary(dictionary, filename) {
    try {
        fs.writeFileSync(filename, JSON.stringify(dictionary, null, 4), 'utf-8');
        // console.log("DICTIONAIRY : ", dictionary, " SAVED, under filename : ",filename)
        // console.log("Dictionary saved successfully.");
    } catch (err) {
        console.error("Error saving dictionary:", err);
    }
}

// Load the dictionary into memory
let dictionary = loadDictionary(current_users);
let peerSocketIDMap = {}
freshStart(dictionary, current_users);

let DRAWING_dictionary = loadDictionary(drawing)
start_drawing(DRAWING_dictionary)


// Function to add or update a key-value pair in the dictionary
function setKeyValue(key, value) {
    if(!dictionary[key]){
        dictionary[key] = value;  // Set the key-value pair
        saveDictionary(dictionary, current_users);  // Save the updated dictionary to the file
        io.emit('users-reloaded', dictionary)
    }
}

function updateMuted(key, mute) {
        dictionary[key][1] = mute;  // Set the key-value pair
        saveDictionary(dictionary, current_users);  // Save the updated dictionary to the file
        io.emit('users-reloaded', dictionary)
    }

function updatetrackpos(key, position) {
    dictionary[key][2] = mute;  // Set the key-value pair
    saveDictionary(dictionary, current_users);  // Save the updated dictionary to the file
    io.emit('users-reloaded', dictionary)
}


function removeKey(key) {
    if (key in dictionary) {
        delete dictionary[key];  // Remove the key
        saveDictionary(dictionary, current_users);  // Save the updated dictionary to the file
        io.emit('users-reloaded', dictionary)
    } else {
        console.log(`Key '${key}' does not exist.`);
    }
}

function freshStart(data, filename){
    for(let key in data){
        delete data[key];
        saveDictionary(data, filename);
    }
}

function start_drawing(dictionary){
    console.log("DRAWING STARTED")
    for (let x = 0; x <= 19; x++) {
        // For each key, assign an array with 20 values (y = 1 to 20)
        dictionary[x] = [];
        for (let y = 0; y <= 29; y++) {
            let dict = 'texture'
          dictionary[x].push(dict);
        }
      }
      saveDictionary(dictionary, drawing)
}


function updateDrawing(dictionary, texture,x,y){
    dictionary[x][y] = texture
    saveDictionary(dictionary, drawing)
}


//////////////////////////////////////////////////////////////////////////////////////////////////
let currentUserList = {}

io.use((socket, next) => {
    let url = socket.handshake.headers.referer;
    if(!url.includes('/host') && !url.includes('/rec')){
    
        let userIP = socket.handshake.address;  // Get IP address
        io.emit('remote-console', `THIS IS THE BLACKLIST ${LIST}`)
        let id = socket.id;  // Assuming username is passed as a query parameter
        if(LIST.includes(userIP))
        {
            io.emit("remote-console", `IP recognised  ${userIP}`)
            console.log('INCLUDES')
            io.to(id).emit('not-welcome')
        } else{

            io.emit('socket-connected', id)
            setKeyValue(id, [userIP, 0, 0]);
            console.log("this is the ip", userIP, "this is the username", id)
        }

    // if (blacklist.includes(userIP) || blacklist.includes(username)) {
    //     console.log("User blocked:", userIP || username);
    //     return next(new Error("Blocked from the site"));
    }
    next();
});
////////////////////////////////////////////////////////

/// SETUPRECEIVER PORT /////////////////////////////////

// const rApp = express()
// const rServer = https.createServer({
//     key: fs.readFileSync('certs/localhost-key.pem'),
//     cert: fs.readFileSync('certs/localhost.pem')},
//     rApp)
// const rPath = require('path')
// const rPORT = process.env.PORT || 8444
// rApp.use(express.static(rPath.join(__dirname, 'receiver')))
// const rIo = require('socket.io')(rServer)
// // rApp.use('/peerjs', peerServer)

////////////////////////////////////////////////////////

io.on('connection', onConnected)

function onConnected(socket){
    console.log(socket.id)
    socketsConnected.add(socket.id)
    users[socket.id] = socket;
    io.emit('clients-total',socketsConnected.size)
    io.emit('send-receiver-id')
    "receiver-log-on"

    io.emit("remote-console", "this is a test message")

    socket.on('request_drawing', ()=>{
        if(DRAWING_dictionary){
            io.to(socket.id).emit("DRAWING", DRAWING_dictionary)
        }
    })

    socket.on("updateDrawing", (data)=>{
        console.log("update_drawing : ", data)
        updateDrawing(DRAWING_dictionary, data[0], data[1], data[2])
        io.emit('DRAWING', DRAWING_dictionary)
    })


    socket.on('disconnect', ()=>{
        console.log('socket disconnected', socket.id)
        removeKey(socket.id)
        socketsConnected.delete(socket.id)
        io.emit('clients-total', socketsConnected.size)
    })

    socket.on('show-collector-id', ()=>{
        io.emit("remote-console", `FROM SERVER, receiver ID :${receiverId} `)
    })

    socket.on('mute-user', (id)=>{
        if(dictionary[id]){
            if(dictionary[id][1]==0){
                updateMuted(id, 1)
                socket.to(id).emit('mute-user')
            }else{
                updateMuted(id, 0)
                console.log("UNMUTE")
                socket.to(id).emit('UNmute-user')
            }
        }
    })

    socket.on('message', (data) =>{
        console.log(data)
        socket.broadcast.emit('chat-message', data)
    })

    socket.on('refresh-blacklist', () =>{
        io.emit('remote-console', `BLACKLIST REFRESHING ${LIST}`)
        refreshList();
        io.emit('remote-console', `BLACKLIST REFRESHED ${LIST}`)
    })

    socket.on("receiver-log-on", (id) =>{
        receiverId = id;
        io.emit("remote-console", `FROM SERVER, receiver had joined:${receiverId} `)
        // remoteConsole(`FROMSERVER: receiver has joined, ID: ${receiverId}`)
        // console.log("receiver has joined, ID: ",receiverId)
    })

    // When a peer connects, notify others
    socket.on('peer-connected', (ids) => {
        const bothDefined = ids.every(item => item !== undefined);
        if(bothDefined){
            // io.emit("remote-console", `ids [0] , ${ids[0]}, ids [1] , ${ids[1]}`)
            peerSocketIDMap[ids[1]] = ids[0]
            // io.emit("remote-console", peerSocketIDMap)
            io.emit("remote-console", `FROM SERVER: Peer connected    : ${ids[1]} `)
            // console.log(`Peer connected: ${peerId}`);
            io.to(ids[0]).emit("receiver-peer-present", receiverId)
        }
        // socket.broadcast.emit('peer-connected', peerId);  // Notify all other peers about the new peer
    })

    socket.on("track-updated", (data)=>{
        io.emit("remote-console", `socket id map : ${data[0]}, track position : ${data[1]}, peertsocketid : ${peerSocketIDMap[data[0]]}`)
        updatetrackpos(peerSocketIDMap[data[0]], data[1])
    })

    // Handle a peer disconnecting and notify others
    socket.on('peer-disconnected', (peerId) => {
        console.log(`Peer disconnected: ${peerId}`);
        socket.broadcast.emit('peer-disconnected', peerId);  // Notify others when a peer disconnects
    })

    socket.on('receiver-present', (peerId)=>{
        console.log('RECEIVER ACTIVATED')
        socket.broadcast.emit('receiver-present',peerId)
    })

    socket.on('kick-user', (username)=>{
        io.emit("remote-console", `we are so glad with this  socket user  ${peerSocketIDMap[username]}`)
        if(users[peerSocketIDMap[username]]){
            let IP = currentUserList[username]
            io.emit("remote-console", `socket found, IP = ${IP}`)
            addToList(IP);
            users[peerSocketIDMap[username]].disconnect()
        }
        // IP = currentUserList[username]
        // addToList(IP);
    });
}


server.listen(PORT, ()=> console.log(`chat server on port ${PORT}`))

// console.log(rServer);

// rServer.listen(rPORT, ()=> console.log(`chat server on port ${rPORT}`))

