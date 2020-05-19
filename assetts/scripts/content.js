// Main DOM manipulation script
// Also referred to as the content script

const socket = io('https://host.streamwithme.net', { secure: true });

var partyOpen = false;
var overAnHour = false;
var username = '';
var currRoomCode = '';
var socketID = '';

// @param message: Takes a string and sends that string
// from thi Content script to the extension
function sendMessage(message) {
  chrome.runtime.sendMessage(message);
}

// Sends message to pop-up upon loading to initiate chat start.
// Logic to determine if the join request should be accepted is in popup.js
sendMessage('Send join request');

// Receives actions (as strings) from media buttons
chrome.runtime.onMessage.addListener(
  function(message) {
    if (message.message == 'HOST') {
      openSidebar(message);
    } else if (message.message == 'JOIN') {
      console.log(`JOIN: ${message.roomCode}`);
      openSidebar(message);
    } else {
      console.log(message.message);
    }
  }
);

// Opens the initial sidebar, first step
function openSidebar(message) {
  // Create the chat window div
  let chatWindow = document.createElement('div');
  chatWindow.id = 'swm-chatWindow';
  chatWindow.style = 'align-items:flex-end !important;background-color:lightgray !important;display:grid !important;grid-template-rows:18fr 1fr;height:100vh !important;justify-items:center !important;position:fixed !important;right:0px !important;top:0px !important;width:20vw !important;z-index:99999 !important;';
  
  // Grab the page body and append these elements
  let body = document.querySelectorAll('body')[0];
  body.insertBefore(chatWindow, body.childNodes[0]);

  partyOpen = true;
  getUserCreateLink(message);
}

// Gets the user's name, second step
function getUserCreateLink(message) {
  // Grab the chat window, create a child element for it to hold
  // the user input and prompt text
  let chat = document.getElementById('swm-chatWindow');
  let enterName = document.createElement('div');
  enterName.id = 'swm-enterNameWrapper';
  enterName.style = 'align-self: center !important;text-align:center;width: 70%;';

  // Create a new element to hold the name prompt text
  let nameText = document.createElement('p');
  nameText.style = 'font-size: 1.5em;';
  nameText.innerHTML = "Enter your name:";

  // Create a new element for the user name input
  let nameForm = document.createElement('form');
  nameForm.id = 'swm-nameForm';
  nameForm.style = 'margin-top:10px;'
  let nameInp = document.createElement('input');
  nameInp.id = 'swm-nameInput';
  nameInp.type = 'text';
  nameInp.style = 'border-radius: 5px;font-size: 1.5em;padding: 5px 8px;width: calc(100% - 16px);';
  nameForm.appendChild(nameInp);

  // Add them all to each other
  enterName.appendChild(nameText);
  enterName.appendChild(nameForm);

  chat.appendChild(enterName);

  let nameFormE = document.getElementById('swm-nameForm');
  nameFormE.addEventListener('submit', e => {
    e.preventDefault();
    let nameInpE = document.getElementById('swm-nameInput');
    username = nameInpE.value;
    nameInpE.value = '';
    startChat(message);
  });
}

// Closes initial question UI and starts chatting
function startChat(message) {
  let nameWrapper = document.getElementById('swm-enterNameWrapper');
  nameWrapper.style = 'display: none !important;';
  let chatWindow = document.getElementById('swm-chatWindow');

  // Create the area where user messages will appear
  let msgArea = document.createElement('ul');
  msgArea.id = 'swm-msgArea';
  msgArea.style = 'justify-self:flex-start;margin-left: 5%;font-size: 1.35em;width: 94.6%;overflow-y: scroll;flex-direction: column;display: flex;height: auto;max-height: calc(100% - 50px);';

  // Create the message input for the bottom
  let msgForm = document.createElement('form');
  msgForm.id = 'swm-msgForm';
  msgForm.style = 'width:90% !important'

  let msgInput = document.createElement('input');
  msgInput.id = 'swm-msgInput';
  msgInput.type = 'text !important';
  msgInput.name = 'message !important';
  msgInput.autocomplete = 'off';
  msgInput.spellcheck = 'false';
  msgInput.style = 'border:none !important;border-radius:3px !important;font-size:1.3em !important;    margin-bottom:10px;padding:3px 8px 1px 8px !important;height:25px !important;width:calc(100% - 16px) !important;';
  msgForm.appendChild(msgInput);
  chatWindow.appendChild(msgArea);
  chatWindow.appendChild(msgForm);

  // Handle the user messages
  msgForm.addEventListener('submit', e => {
    e.preventDefault();
    let usrMessage = msgInput.value;
    emitMessage(usrMessage);
    appendMessage('You', usrMessage);
    msgInput.value = '';
  });

  // Determines now if it's a host or join since setup is the same before this
  if (message.message == 'HOST') {
    createRoom();
    let giveLink = document.createElement('p');
    giveLink.id = 'hostLink';
    chatWindow.insertBefore(giveLink, chatWindow.childNodes[0]);
  } else if (message.message == 'JOIN') {
    joinRoom(message.roomCode);
    let giveLink = document.createElement('p');
    giveLink.id = 'hostLink';
    chatWindow.insertBefore(giveLink, chatWindow.childNodes[0]);
  }
}

// Closes the chat window and stops Stream with Me party
function stopParty() {
  let videoUI = document.getElementsByClassName('webPlayerContainer')[0].childNodes[0];
  videoUI.style = 'height: 100%; width: 100%;';

  let chatWindow = document.getElementById('swm-chatWindow');
  chatWindow.style = 'display:none !important;';

  partyOpen = false;
}

// @Param User: The user sending the message
// @Param Message: The message to append
// Appends the inputted mesasge to the chat window
function appendMessage(user, message) {
  let msgArea = document.getElementById('swm-msgArea');
  let messageElem = document.createElement('li');
  messageElem.style = 'list-style-type: none;margin-bottom: 5px;';
  // let currTimeVal = document.getElementById('player0').currentTime;
  let currTimeVal = 0;
  messageElem.innerHTML = `<span style="color:gray;cursor:pointer;" onclick="document.getElementById('videoPlayer').currentTime = ${currTimeVal}">${convertTime(currTimeVal)}</span> ${user}: ${message}`;
  msgArea.appendChild(messageElem);
  msgArea.scrollTop = msgArea.scrollHeight;
}

// Similar to appendMessage, but for system messages
// such as a user joining/leaving, or some alert like a pause
function systemMessage(message) {
  let msgArea = document.getElementById('swm-msgArea');
  let messageElem = document.createElement('li');
  messageElem.style = 'list-style-type: none;margin-bottom: 5px;';
  messageElem.innerHTML = `<span style="color:gray;font-style:italic;">${message}</span>`;
  msgArea.appendChild(messageElem);
  msgArea.scrollTop = msgArea.scrollHeight;
}

// @Param inptSeconds: Raw number of seconds to convert to MM:SS or HH:MM:SS
// Converts seconds to 00:00:00 or 00:00 depending on length
function convertTime(inptSeconds) {
  let hours = Math.floor((inptSeconds/60)/60);
  inptSeconds -= (hours * 60 * 60);
  let minutes = Math.floor(inptSeconds / 60);
  inptSeconds -= (minutes * 60);
  let seconds = Math.floor(inptSeconds);
  
  // Format the numbers
  hours = ("0" + hours).slice(-2);
  minutes = ("0" + minutes).slice(-2);
  seconds = ("0" + seconds).slice(-2);

  let convertedTime = `${minutes}:${seconds}`;

  if (overAnHour) {
    convertedTime = `${hours}:${minutes}:${seconds}`;
  }

  return convertedTime
}


/* Below is all of the WebSocket functionality */

// Stores Socket-ID to help determine when the user disconnects.
// Can't access the Window.onbeforeunload from content script so
// a script with that event is being injected with the Socket-ID instead
socket.on('socket-ID', serverID => {
  console.log(`Socket ID: ${serverID}`);
  socketID = serverID;
  let unloadScript = document.createElement('script');
  unloadScript.id = 'swm-unloadScript';
  unloadScript.textContent = 
  `window.addEventListener('beforeunload', () => {
     fetch('https://host.streamwithme.net/disconnected/${currRoomCode}/${socketID}/${username}').then(res => console.log(res));
   });`;
  document.body.appendChild(unloadScript);
});

// Send off the socket emission to create a room with username and current URL
function createRoom() {
  socket.emit('create-room', { 
    username: username,
    roomURL: location.href
  });
}

// Response from the server after the room is created for the host
socket.on('new-room-created', newRoomCode => {
  let giveLink = document.getElementById('hostLink');
  giveLink.innerHTML = `<b style="color:black;font-size:1.1em;">Room Code:</b> ${newRoomCode}`;
  giveLink.style = 'font-size:1.3em;position: absolute;top: 20px;';
  currRoomCode = newRoomCode;
  
  systemMessage('Room has been created');

  // Request the socket ID from the server to signal disconnection later
  socket.emit('get-socket-ID', {message: 'socketRequest'});
});

// Sends a request to join an existing room
function joinRoom(roomCode) {
  socket.emit('join-room', { 
    roomCode: roomCode,
    username: username
  });
}

// Receive room joined confirmation for guests
socket.on('room-joined', newRoomCode => {
  let giveLink = document.getElementById('hostLink');
  giveLink.innerHTML = `<b style="color:black;font-size:1.1em;">Room Code:</b> ${newRoomCode}`;
  giveLink.style = 'font-size:1.3em;position: absolute;top: 20px;';
  currRoomCode = newRoomCode;
  
  systemMessage('You joined the room');

  // Request the socket ID from the server to signal disconnection later
  socket.emit('get-socket-ID', {message: 'socketRequest'});
});

// Sends user's message to the server
function emitMessage(message) {
  socket.emit('user-message', {username: username, message: message, room: currRoomCode});
}

// Appends a message received from other users
socket.on('chat-message', userInfo => {
  appendMessage(userInfo.username, userInfo.message);
});

// Appends a message when a friend has joined the room
socket.on('friend-joined', name => {
  systemMessage(`${name.username} has joined the room`);
});

// Appends a message when a friend has left the room
socket.on('friend-left', name => {
  systemMessage(`${name.username} has left the room`);
})