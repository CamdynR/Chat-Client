// Script document for the popup page

let hostBtn = document.getElementById('hostButton');
let joinBtn = document.getElementById('joinButton');
let roomCodeForm = document.getElementById('roomCodeForm');

var port = chrome.extension.connect({
  name: "Background Communication"
});

port.onMessage.addListener(function(msg) {
  if (msg == 'Link Open') {
    let roomCodeInput = document.getElementById('roomCode');
    sendMessage({ message: 'JOIN', roomCode: roomCodeInput.value });
    console.log(`JOIN: ${roomCode}`);
    //window.close();
  }
});

// Sends off a message saying it has been opened, this is to
// received a message to see if the video player is playing or
// not
window.addEventListener('DOMContentLoaded', () => {
  // sendMessage({ message: 'POPUP OPENED' });
});

// Event listener for the start button
hostBtn.addEventListener('click', () => {
  sendMessage({ message: 'HOST' });
});

joinBtn.addEventListener('click', () => {
  let joinText = document.getElementById('joinText');
  if (roomCodeForm.getAttribute('data-display') == 'none') {
    roomCodeForm.style.display = 'grid';
    joinText.innerHTML = 'CANCEL';
    roomCodeForm.setAttribute('data-display', 'grid');
  } else {
    roomCodeForm.style.display = 'none';
    joinText.innerHTML = 'JOIN';
    roomCodeForm.setAttribute('data-display', 'none');
  }
});

roomCodeForm.addEventListener('submit', e => {
  e.preventDefault();
  let roomCodeInput = document.getElementById('roomCode');
  let roomCode = roomCodeInput.value;
  sendMessage({ message: 'OPENLINK', roomCode: roomCode });
})

// @param message: Sends the given message from the extention to the current tab
// (only if that current tab has the URL *://*.amazon.com/*/video/*)
function sendMessage(data) {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, data);
  });
}

// Message handler for messages from the current tab
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    port.postMessage(request.roomURL);
  }
);