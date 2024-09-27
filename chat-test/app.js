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
function saveList(list) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(list, null, 4), 'utf-8');
        // console.log("List saved successfully.");
    } catch (err) {
        console.error("Error saving list:", err);
    }
}

// Load the list into memory
let list = loadList();

// Function to add an item to the list
function addToList(item) {
    if (!list.includes(item)) {
        list.push(item);  // Add the item to the list
        saveList(list);   // Save the updated list to the file
        // console.log(`${item} added to the list.`);
    } else {
        console.log(`${item} already exists in the list.`);
    }
}


/////////////////////////////////////////////////////////////////////

const current_users = path.join(__dirname, 'current_users.json');

// Function to load the dictionary (JSON) from the file
function loadDictionary() {
    if (!fs.existsSync(current_users)) {
        // If the file doesn't exist, start with an empty dictionary
        return {};
    }

    const data = fs.readFileSync(current_users, 'utf-8');
    try {
        // Parse the JSON data from the file
        return JSON.parse(data);
    } catch (err) {
        console.error("Error parsing JSON data:", err);
        return {};
    }
}

// Function to save the dictionary (JSON) back to the file
function saveDictionary(dictionary) {
    try {
        fs.writeFileSync(current_users, JSON.stringify(dictionary, null, 4), 'utf-8');
        // console.log("Dictionary saved successfully.");
    } catch (err) {
        console.error("Error saving dictionary:", err);
    }
}

// Load the dictionary into memory
let dictionary = loadDictionary();
freshStart();


// Function to add or update a key-value pair in the dictionary
function setKeyValue(key, value) {
    if(!dictionary[key]){
        dictionary[key] = value;  // Set the key-value pair
        saveDictionary(dictionary);  // Save the updated dictionary to the file
        io.emit('users-reloaded', dictionary)
    }
}

function updateMuted(key, mute) {
        dictionary[key][1] = mute;  // Set the key-value pair
        saveDictionary(dictionary);  // Save the updated dictionary to the file
        io.emit('users-reloaded', dictionary)
    }


function removeKey(key) {
    if (key in dictionary) {
        delete dictionary[key];  // Remove the key
        saveDictionary(dictionary);  // Save the updated dictionary to the file
        io.emit('users-reloaded', dictionary)
    } else {
        console.log(`Key '${key}' does not exist.`);
    }
}

function freshStart(){
    for(let key in dictionary){
        delete dictionary[key];
        saveDictionary;
    }
}

//////////////////////////////////////////////////////////////////////////////////////////////////
let currentUserList = {}

io.use((socket, next) => {
    let url = socket.handshake.headers.referer;
    if(!url.includes('/host') && !url.includes('/rec')){
    
        let userIP = socket.handshake.address;  // Get IP address
        let id = socket.id;  // Assuming username is passed as a query parameter

        io.emit('socket-connected', id)
        setKeyValue(id, [userIP, 0]);
        console.log("this is the ip", userIP, "this is the username", id)

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
function remoteConsole(message){
    socket.broadcast.emit("remote-console", message)
}

io.on('connection', onConnected)

function onConnected(socket){
    console.log(socket.id)
    socketsConnected.add(socket.id)
    io.emit('clients-total',socketsConnected.size)

    remoteConsole("this is a test message")


    socket.on('disconnect', ()=>{
        console.log('socket disconnected', socket.id)
        removeKey(socket.id)
        socketsConnected.delete(socket.id)
        io.emit('clients-total', socketsConnected.size)
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

    socket.on("receiver-log-on", (id) =>{
        receiverId = id;
        // remoteConsole(`FROMSERVER: receiver has joined, ID: ${receiverId}`)
        // console.log("receiver has joined, ID: ",receiverId)
    })

    // When a peer connects, notify others
    socket.on('peer-connected', () => {
        remoteConsole("Peer connected:")
        // console.log(`Peer connected: ${peerId}`);
        socket.to(peerId).emit("receiver-peer-present", receiverId)
        // socket.broadcast.emit('peer-connected', peerId);  // Notify all other peers about the new peer
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
        IP = currentUserList[username]
        addToList(IP);
    });
}


server.listen(PORT, ()=> console.log(`chat server on port ${PORT}`))

// console.log(rServer);

// rServer.listen(rPORT, ()=> console.log(`chat server on port ${rPORT}`))

