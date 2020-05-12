var express = require('express');
var app = express();
var server = app.listen(process.env.PORT || 3000, "host.streamwithme.net", listen);

var roomList = {};

function listen() {
  var host = server.address().address;
  var port = server.address().port;
  console.log('Example app listening at http://' + host + ':' + port);
}

app.use(express.static('public'));
const io = require('socket.io').listen(server);

io.on('connection', socket => {
  socket.on('create-room', name => {
    let newRoomCode = createRoom(name.username);
    console.log(`Username: ${name.username}`);
    console.log(`Room Code: ${newRoomCode}`);
    socket.emit('new-room-created', newRoomCode);
    socket.join(`${newRoomCode}`);
  });
  socket.on('join-room', data => {
    roomList[data.roomCode].push(data.username);
    socket.emit('room-joined', newRoomCode);
    socket.join(`${newRoomCode}`);
  });
  socket.on('send-chat-message', message => {
    socket.broadcast.emit('chat-message', message);
  });
});

function createRoom(username) {
  let charset = 'BCDFGHJKMNPQRSTVWXYZ23456789';
  let roomCode = '';
  for(let i = 0 ; i < 7; i++) {
    roomCode += charset.charAt(Math.floor((Math.random()*100)%28));
  }
  roomList[roomCode] = [username];
  return roomCode;
}