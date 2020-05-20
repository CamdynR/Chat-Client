// Main DOM manipulation script
// Also referred to as the content script

const socket = io("https://host.streamwithme.net", { secure: true });

var partyOpen = false;
var overAnHour = false;
var username = "";
var currRoomCode = "";
var socketID = "";

// @param message: Takes a string and sends that string
// from thi Content script to the extension
function sendMessage(message) {
  chrome.runtime.sendMessage(message);
}

// Sends message to pop-up upon loading to initiate chat start.
// Logic to determine if the join request should be accepted is in popup.js
sendMessage("Send join request");

// Receives actions (as strings) from media buttons
chrome.runtime.onMessage.addListener(function (message) {
  if (message.message == "OPEN") {
    sendMessage({ open: partyOpen });
  } else if (message.message == "HOST") {
    openSidebar(message);
  } else if (message.message == "JOIN") {
    console.log(`JOIN: ${message.roomCode}`);
    openSidebar(message);
  } else if (message.message == "END") {
    leaveParty();
  } else {
    console.log(message.message);
  }
});

// Opens the initial sidebar, first step
function openSidebar(message) {
  // Apply styles to make crunchyroll go "fullscreen"
  let path = chrome.extension.getURL(
    "assetts/styles/crunchyroll-fullscreen.css"
  );
  let link = document.createElement("link");
  link.id = "swm-fullscreenStyles";
  link.rel = "stylesheet";
  link.type = "text/css";
  link.href = path;
  document.head.appendChild(link);

  // Create the chat window div
  let chatWindow = document.createElement("div");
  chatWindow.id = "swm-chatWindow";

  // Grab the page body and append these elements
  let body = document.querySelectorAll("body")[0];
  body.insertBefore(chatWindow, body.childNodes[0]);

  // Scroll to the top
  window.scrollTo(0, 0);

  hideMainScrollBarAtTop();

  partyOpen = true;
  getUserCreateLink(message);
}

// Gets the user's name, second step
function getUserCreateLink(message) {
  // Grab the chat window, create a child element for it to hold
  // the user input and prompt text
  let chat = document.getElementById("swm-chatWindow");
  let enterName = document.createElement("div");
  enterName.id = "swm-enterNameWrapper";

  // Create a new element to hold the name prompt text
  let logoText = document.createElement("img");
  logoText.id = "swm-logoText";
  logoText.alt = "Stream with Me";
  logoText.src = chrome.extension.getURL(
    "assetts/images/logos/stream-with-me-large.png"
  );

  // Create a new element for the user name input
  let nameForm = document.createElement("form");
  nameForm.id = "swm-nameForm";
  let nameInp = document.createElement("input");
  nameInp.id = "swm-nameInput";
  nameInp.type = "text";
  nameInp.autocomplete = "off";
  nameInp.spellcheck = "false";
  nameInp.placeholder = "Enter your name...";
  nameForm.appendChild(nameInp);

  // Add them all to each other
  enterName.appendChild(logoText);
  enterName.appendChild(nameForm);

  chat.appendChild(enterName);

  let nameFormE = document.getElementById("swm-nameForm");
  nameFormE.addEventListener("submit", (e) => {
    e.preventDefault();
    let nameInpE = document.getElementById("swm-nameInput");
    username = nameInpE.value;
    nameInpE.value = "";
    startChat(message);
  });
}

// Closes initial question UI and starts chatting
function startChat(message) {
  let nameWrapper = document.getElementById("swm-enterNameWrapper");
  nameWrapper.style = "display: none !important;";
  let chatWindow = document.getElementById("swm-chatWindow");

  // Create the area where user messages will appear
  let msgArea = document.createElement("ul");
  msgArea.id = "swm-msgArea";

  // Create the message input for the bottom
  let msgForm = document.createElement("form");
  msgForm.id = "swm-msgForm";

  let msgInput = document.createElement("input");
  msgInput.id = "swm-msgInput";
  msgInput.type = "text";
  msgInput.name = "message";
  msgInput.autocomplete = "off";
  msgInput.spellcheck = "false";
  msgInput.placeholder = "Send a message...";
  msgForm.appendChild(msgInput);
  chatWindow.appendChild(msgArea);
  chatWindow.appendChild(msgForm);

  // Handle the user messages
  msgForm.addEventListener("submit", (e) => {
    e.preventDefault();
    let usrMessage = msgInput.value;
    emitMessage(usrMessage);
    appendMessage("You", usrMessage);
    msgInput.value = "";
  });

  // Determines now if it's a host or join since setup is the same before this
  if (message.message == "HOST") {
    createRoom();
  } else if (message.message == "JOIN") {
    joinRoom(message.roomCode);
  }
  let giveLink = document.createElement("p");
  giveLink.id = "hostLink";
  chatWindow.insertBefore(giveLink, chatWindow.childNodes[0]);

  // Create a new element to hold the name prompt text
  let logoText = document.createElement("img");
  logoText.id = "swm-logoTextTop";
  logoText.alt = "Stream with Me";
  logoText.src = chrome.extension.getURL(
    "assetts/images/logos/stream-with-me-large.png"
  );
  chatWindow.insertBefore(logoText, chatWindow.childNodes[0]);
}

// Closes the chat window and leaves Stream with Me party
function leaveParty() {
  let chatWindow = document.getElementById("swm-chatWindow");
  let unloadScript = document.getElementById("swm-unloadScript");
  let fullscreenStyles = document.getElementById("swm-fullscreenStyles");
  let videoBackdrop = document.getElementById("swm-videoBackdrop");
  let scrollDetectScript = document.getElementById("swm-scrollDetectScript");

  if (chatWindow) {
    chatWindow.parentNode.removeChild(chatWindow);
  }

  if (unloadScript) {
    unloadScript.parentNode.removeChild(unloadScript);
  }

  if (fullscreenStyles) {
    fullscreenStyles.parentNode.removeChild(fullscreenStyles);
  }

  if (videoBackdrop) {
    videoBackdrop.parentNode.removeChild(videoBackdrop);
  }

  if (scrollDetectScript) {
    scrollDetectScript.parentNode.removeChild(scrollDetectScript);
  }

  partyOpen = false;

  if (username != "" && currRoomCode != "" && socketID != "") {
    fetch(
      `https://host.streamwithme.net/disconnected/${currRoomCode}/${socketID}/${username}`
    ).then((res) => console.log(res));
  }
}

// @Param User: The user sending the message
// @Param Message: The message to append
// Appends the inputted mesasge to the chat window
function appendMessage(user, message) {
  let msgArea = document.getElementById("swm-msgArea");
  let messageElem = document.createElement("li");
  messageElem.classList.add("swm-userMsg");
  // let currTimeVal = document.getElementById('player0').currentTime;
  let currTimeVal = 0;

  let userClass = "swm-friendMessage";
  if (user == "You") {
    userClass = "swm-yourMessage";
  }

  messageElem.innerHTML = `<span class="swm-msgTime" onclick="document.getElementById('videoPlayer').currentTime = ${currTimeVal}">${convertTime(
    currTimeVal
  )}</span> <span class="${userClass}">${user}</span><b>:</b> <span class="swm-displayMsg">${message}</span>`;
  msgArea.appendChild(messageElem);
  msgArea.scrollTop = msgArea.scrollHeight;

  ifScrollableShowScrollbar();
}

// Similar to appendMessage, but for system messages
// such as a user joining/leaving, or some alert like a pause
function systemMessage(message) {
  let msgArea = document.getElementById("swm-msgArea");
  let messageElem = document.createElement("li");
  messageElem.classList.add("swm-sysMsg");
  messageElem.innerHTML = `<span class="swm-sysMsgContent">${message}</span>`;
  msgArea.appendChild(messageElem);
  msgArea.scrollTop = msgArea.scrollHeight;

  ifScrollableShowScrollbar();
}

// Checks the messageArea div to see if its scrollable, if it is it displays the scrollbar
function ifScrollableShowScrollbar() {
  let msgArea = document.getElementById("swm-msgArea");

  var curOverflow = msgArea.style.overflow;

  if (!curOverflow || curOverflow === "visible") {
    msgArea.style.overflow = "hidden";
  }

  var isOverflowing =
    msgArea.clientWidth < msgArea.scrollWidth ||
    msgArea.clientHeight < msgArea.scrollHeight;

  msgArea.style.overflow = curOverflow;

  if (isOverflowing) {
    msgArea.classList.add("swm-msgAreaShowScrollbar");
  }
}

// Hides the main scroll bar when the user is scrolled to the very top
// This is to give a better viewing situation for "fullscreen"
function hideMainScrollBarAtTop() {
  let scrollDetectScript = document.createElement("script");
  scrollDetectScript.id = "swm-scrollDetectScript";
  scrollDetectScript.textContent = `document.body.classList.add('swm-hideBodyScrollbar');
  window.addEventListener('scroll', () => {
     if (window.scrollY == 0) {
       document.body.classList.add('swm-hideBodyScrollbar');
     } else {
       document.body.classList.remove('swm-hideBodyScrollbar');
     }
   });`;
  document.body.appendChild(scrollDetectScript);
}

// @Param inptSeconds: Raw number of seconds to convert to MM:SS or HH:MM:SS
// Converts seconds to 00:00:00 or 00:00 depending on length
function convertTime(inptSeconds) {
  let hours = Math.floor(inptSeconds / 60 / 60);
  inptSeconds -= hours * 60 * 60;
  let minutes = Math.floor(inptSeconds / 60);
  inptSeconds -= minutes * 60;
  let seconds = Math.floor(inptSeconds);

  // Format the numbers
  hours = ("0" + hours).slice(-2);
  minutes = ("0" + minutes).slice(-2);
  seconds = ("0" + seconds).slice(-2);

  let convertedTime = `${minutes}:${seconds}`;

  if (overAnHour) {
    convertedTime = `${hours}:${minutes}:${seconds}`;
  }

  return convertedTime;
}

/* Below is all of the WebSocket functionality */

// Stores Socket-ID to help determine when the user disconnects.
// Can't access the Window.onbeforeunload from content script so
// a script with that event is being injected with the Socket-ID instead
socket.on("socket-ID", (serverID) => {
  console.log(`Socket ID: ${serverID}`);
  socketID = serverID;
  let unloadScript = document.createElement("script");
  unloadScript.id = "swm-unloadScript";
  unloadScript.textContent = `window.addEventListener('beforeunload', () => {
     fetch('https://host.streamwithme.net/disconnected/${currRoomCode}/${socketID}/${username}').then(res => console.log(res));
   });`;
  document.body.appendChild(unloadScript);
});

// Send off the socket emission to create a room with username and current URL
function createRoom() {
  socket.emit("create-room", {
    username: username,
    roomURL: location.href,
  });
}

// Response from the server after the room is created for the host
socket.on("new-room-created", (newRoomCode) => {
  let giveLink = document.getElementById("hostLink");
  giveLink.id = "swm-giveLink";
  giveLink.innerHTML = `<span id="swm-roomCode">Room Code:</span> 
  <span id="swm-roomCodeText" 
  onclick="navigator.clipboard.writeText('${newRoomCode}').then(function() {
        console.log('Successfully copied ${newRoomCode} to the clipboard');
        document.getElementById('swm-roomCodeText').classList.add('swm-copiedToast');
        setTimeout(() => 
        {  
          document.getElementById('swm-roomCodeText').classList.remove('swm-copiedToast');
        }, 1000);
      }, function() {
        console.log('Failed to copy ${newRoomCode} to the clipboard');
      });"
  tooltip="Copy to clipboard" >
  ${newRoomCode}</span>`;
  currRoomCode = newRoomCode;

  systemMessage("Room has been created");

  // Request the socket ID from the server to signal disconnection later
  socket.emit("get-socket-ID", { message: "socketRequest" });
});

// Sends a request to join an existing room
function joinRoom(roomCode) {
  socket.emit("join-room", {
    roomCode: roomCode,
    username: username,
  });
}

// Receive room joined confirmation for guests
socket.on("room-joined", (newRoomCode) => {
  let giveLink = document.getElementById("hostLink");
  giveLink.id = "swm-giveLink";
  giveLink.innerHTML = `<span id="swm-roomCode">Room Code:</span> 
  <span id="swm-roomCodeText" 
  onclick="navigator.clipboard.writeText('${newRoomCode}').then(function() {
        console.log('Successfully copied ${newRoomCode} to the clipboard');
        document.getElementById('swm-roomCodeText').classList.add('swm-copiedToast');
        setTimeout(() => 
        {  
          document.getElementById('swm-roomCodeText').classList.remove('swm-copiedToast');
        }, 1000);
      }, function() {
        console.log('Failed to copy ${newRoomCode} to the clipboard');
      });"
  tooltip="Copy to clipboard" >
  ${newRoomCode}</span>`;
  currRoomCode = newRoomCode;

  systemMessage("You joined the room");

  // Request the socket ID from the server to signal disconnection later
  socket.emit("get-socket-ID", { message: "socketRequest" });
});

// Sends user's message to the server
function emitMessage(message) {
  socket.emit("user-message", {
    username: username,
    message: message,
    room: currRoomCode,
  });
}

// Appends a message received from other users
socket.on("chat-message", (userInfo) => {
  appendMessage(userInfo.username, userInfo.message);
});

// Appends a message when a friend has joined the room
socket.on("friend-joined", (name) => {
  systemMessage(`${name.username} has joined the room`);
});

// Appends a message when a friend has left the room
socket.on("friend-left", (name) => {
  systemMessage(`${name.username} has left the room`);
});
