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
  socket.emit('socket-ID', socket.id);
  socket.on('create-room', roomReq => {
    let newRoomCode = createRoom(roomReq.username, roomReq.roomURL);
    console.log(`Username: ${roomReq.username}`);
    console.log(`Room Code: ${roomReq.roomURL}`);
    console.log(`Room Code: ${newRoomCode}`);
    socket.emit('new-room-created', newRoomCode);
    socket.join(`${newRoomCode}`);
  });
  socket.on('get-URL', room => {
    socket.emit('room-URL', roomList[room].roomURL);
  });
  socket.on('join-room', data => {
    roomList[data.roomCode].users.push(data.username);
    socket.join(`${data.roomCode}`);
    socket.emit('room-joined', data.roomCode);
  });
  socket.on('user-message', userInfo => {
    console.log(`${userInfo.username}: ${userInfo.message}`);
    socket.broadcast.emit('chat-message', {
      username: userInfo.username,
      message: userInfo.message
    });
  });
  socket.on('user-left', userInfo => {
    console.log(`${userInfo.username} has left`);
    socket.leave(`${userInfo.roomCode}`);
  })
});

function createRoom(username, roomURL) {
  let roomCode = generateRoomCode();
  let numLoop = 0;
  while (roomCode in roomList) {
    numLoop += 1;
    roomCode = generateRoomCode();
    if (numLoop >= 100) {
      roomCode = 'ERROR, RELOAD';
      break;
    }
  }
  roomList[roomCode] = { roomURL: roomURL, users: [username] };
  return roomCode;
}

function generateRoomCode() {
  let charset = 'BCDFGHJKMNPQRSTVWXYZ23456789';
  let roomCode = '';
  for(let i = 0 ; i < 7; i++) {
    roomCode += charset.charAt(Math.floor((Math.random()*100)%28));
  }
  return roomCode;
}

roomList = { 
  12345: {
    roomURL: 'https://somewebsite.com',
    users: [ 'user1', 'user2', 'user3' ]
  } 
}