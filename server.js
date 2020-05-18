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
  socket.on('get-socket-ID', request => {
    console.log(`Socket ID: ${socket.id}`);
    socket.emit('socket-ID', socket.id);
  });
  socket.on('create-room', roomReq => {
    let newRoomCode = createRoom(socket.id, roomReq.roomURL);
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
    roomList[data.roomCode].socketIDs.push(socket.id);
    socket.join(`${data.roomCode}`);
    socket.emit('room-joined', data.roomCode);
    io.to(`${data.roomCode}`).emit('friend-joined', {
      username: data.username,
    });
  });
  socket.on('user-message', userInfo => {
    console.log(`${userInfo.username}: ${userInfo.message}`);
    io.to(`${userInfo.room}`).emit('chat-message', {
      username: userInfo.username,
      message: userInfo.message
    });
  });
});

app.get('/disconnected/:roomCode/:socketID/:username', function (req, res) {
  let roomCode = req.params.roomCode;
  let socketID = req.params.socketID;
  let username = req.params.username;

  if (roomList[roomCode]) {
    let index = roomList[roomCode].socketIDs.indexOf(socketID);
    roomList[roomCode].socketIDs.splice(index, 1);
  }

  let usrSocket = io.sockets.connected[socketID];
  usrSocket.leave(`${roomCode}`);

  if (roomList[roomCode].socketIDs.length == 0) {
    delete roomList[roomCode];
    console.log(`Room ${roomCode} was deleted`);
  }

  console.log(`${username} has left room ${roomCode}`);
  res.send('Successfully disconnected');
})

function createRoom(socketID, roomURL) {
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
  roomList[roomCode] = { roomURL: roomURL, socketIDs: [socketID] };
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