const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const fs = require('fs');
var rooms = {}
var port = 8000;
var clients = {}
http.listen(port, async () => {
    console.log('Server Created.')
});
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/movienight.html');
  });
  
app.use(express.static(__dirname));
io.on('connection', (socket) => {
    socket.on('createRoom', (id,host) => {
        console.log(`Room ${id} is being created with cookie ${host}`)
        rooms[id] = host;
        console.log(rooms)
        socket.join(id)
    })
    socket.on('pause',(id) => {
        console.log('Host paused')
        io.emit('hostPaused', id)
    })
    socket.on('play',(id) => {
        console.log(id+': Host started playing video')
        io.emit('hostPlayed', id)
    })
    socket.on('video', (id,videoID) => {
        console.log('Host from room '+id+' picked video with ID '+videoID)
        io.emit('hostVideo',id,videoID)
    })

    socket.on('requestSync', (id) => {
        console.log('Syncing data in room '+id)
        io.emit('retireveHostData',id)
    })
    socket.on('returnSync', (id,time) => {
        io.emit('sync',id,time)
    })
    socket.on('userConnected', (id,user,cookie) => {
        if(cookie.replace('hostID=','') == rooms[id]) {
            console.log(`Host ${user} connected to room ${id}`)
            io.emit('hostConnectEvent',id)
        }else {
            console.log('Client '+user+' connected to room '+id)
            io.emit('userConnectEvent',id)
        }
        clients[user] = id;
        io.emit('loadPlayer',rooms[id])
    })
    socket.on('recieveMessage',(id,messageContent,cookie) => {
        console.log('Chat message '+messageContent+' from '+id)
        if(cookie.includes(rooms[id])) {
            io.emit('displayMessage',id,'[HOST]: '+messageContent)
        }else {
            io.emit('displayMessage',id,'[USER]: '+messageContent)
        }
    })
    socket.on('intervalSync', (id) => {
        io.emit('intervalData',id)
    })
    socket.on('returnIntervalData', (id,time) => {
        io.emit('recieveIntervalData',id,time)
    })
    socket.on('disconnect', () => {
        console.log(socket.id)
        io.emit('globalPause',clients[socket.id])
    })
})