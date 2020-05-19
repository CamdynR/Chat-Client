var express = require('express');
var app = express();
var server = app.listen(process.env.PORT || 3000, "host.streamwithme.net", listen);

function listen() {
  console.log('Stream with Me listening at https://host.streamwithme.net');
}

app.use(express.static('public'));
const io = require('socket.io').listen(server);

// Holds all of the rooms, the users in those rooms, and the URL for that room
var roomList = {};

io.on('connection', socket => {
  // Gets the user's socket ID to hand it back to them.
  // Socket ID is used to identify instead of usernames to avoid clashing
  socket.on('get-socket-ID', request => {
    console.log(`Socket ID: ${socket.id}`);
    socket.emit('socket-ID', socket.id);
  });

  // Creates a new room for a host, hands them the room code
  // Stores the room and user info in roomList
  socket.on('create-room', roomReq => {
    let newRoomCode = createRoom(socket.id, roomReq.roomURL);
    console.log(`Username: ${roomReq.username}`);
    console.log(`Room Code: ${roomReq.roomURL}`);
    console.log(`Room Code: ${newRoomCode}`);
    socket.emit('new-room-created', newRoomCode);
    socket.join(`${newRoomCode}`);
  });

  // Fetches the URL of the room to link people who are joining
  socket.on('get-URL', room => {
    socket.emit('room-URL', roomList[room].roomURL);
  });

  // Joins users to a room after the URL has been fetched and loaded
  socket.on('join-room', data => {
    roomList[data.roomCode].socketIDs.push(socket.id);
    socket.join(`${data.roomCode}`);
    socket.emit('room-joined', data.roomCode);
    socket.to(`${data.roomCode}`).emit('friend-joined', {
      username: data.username,
    });
  });

  // User message handler
  socket.on('user-message', userInfo => {
    console.log(`${userInfo.username}: ${userInfo.message}`);
    socket.to(`${userInfo.room}`).emit('chat-message', {
      username: userInfo.username,
      message: userInfo.message
    });
  });
});

// Route to handle people leaving the room
// Get request - :roomCode is the room they were in
//             - :socketID is the user's uniquesocketID
//             - :username is the user's username
app.get('/disconnected/:roomCode/:socketID/:username', function (req, res) {
  let roomCode = req.params.roomCode;
  let socketID = req.params.socketID;
  let username = req.params.username;

  // If the room exists, remove the socketID of the user from the room object
  if (roomList[roomCode]) {
    let index = roomList[roomCode].socketIDs.indexOf(socketID);
    roomList[roomCode].socketIDs.splice(index, 1);
  }

  // Get the socket and make them leave the room
  let usrSocket = io.sockets.connected[socketID];
  usrSocket.leave(`${roomCode}`);
  console.log(`${username} has left room ${roomCode}`);

  // For every Socket ID still in the room, send them a message saying someone left
  for (let i = 0; i < roomList[roomCode].socketIDs.length; i++ ) {
    io.to(roomList[roomCode].socketIDs[i]).emit('friend-left', {username: `${username}`});
  }

  // If there are no more people in the room, delete it
  if (roomList[roomCode].socketIDs.length == 0) {
    delete roomList[roomCode];
    console.log(`Room ${roomCode} was deleted`);
  }

  // Respond with a successful deletion
  res.send('Successfully disconnected');
})

// @param socketID: The socketID of the person making the room
// @param roomURL: The Video URL that the room is to be hosted in
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

// Generates a unique 7 digit room code
function generateRoomCode() {
  let charset = 'BCDFGHJKMNPQRSTVWXYZ23456789';
  let roomCode = '';
  for(let i = 0 ; i < 7; i++) {
    roomCode += charset.charAt(Math.floor((Math.random()*100)%28));
  }
  return roomCode;
}

/*
    The roomList object format

    roomList = { 
      roomCode1: {
        roomURL: 'https://somewebsite.com',
        users: [ 'user1', 'user2', 'user3' ]
      },
      roomCode2: {
        roomURL: 'https://otherwebsite.com',
        users: [ 'user1', 'user2' ]
      }
    }
*/