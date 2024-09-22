const fs = require('fs')
const https = require('https')
const express = require('express')
const app = express()

const server = https.createServer({
    key: fs.readFileSync('certs/vprotest.hopto.org-key.pem'),
    cert: fs.readFileSync('certs/vprotest.hopto.org.pem')},
    app)


const path = require('path')
const PORT = process.env.PORT || 443

let socketsConnected = new Set()

app.use(express.static(path.join(__dirname, 'public')))
const io = require('socket.io')(server)

const {ExpressPeerServer} = require('peer')
const peerServer = ExpressPeerServer(server, {
    debug: true
})

app.use('/peerjs', peerServer)

io.on('connection', onConnected)

function onConnected(socket){
    console.log(socket.id)
    socketsConnected.add(socket.id)
    io.emit('clients-total',socketsConnected.size)


    socket.on('disconnect', ()=>{
        console.log('socket disconnected', socket.id)
        socketsConnected.delete(socket.id)
        io.emit('clients-total', socketsConnected.size)
    })

    socket.on('message', (data) =>{
        console.log(data)
        socket.broadcast.emit('chat-message', data)
    })

    // When a peer connects, notify others
    socket.on('peer-connected', (peerId) => {
        console.log(`Peer connected: ${peerId}`);
        socket.broadcast.emit('peer-connected', peerId);  // Notify all other peers about the new peer
    })

    // Handle a peer disconnecting and notify others
    socket.on('peer-disconnected', (peerId) => {
        console.log(`Peer disconnected: ${peerId}`);
        socket.broadcast.emit('peer-disconnected', peerId);  // Notify others when a peer disconnects
    })

}


server.listen(PORT, ()=> console.log(`chat server on port ${PORT}`))

