// Script document for the popup page

let hostBtn = document.getElementById('hostButton');
let joinBtn = document.getElementById('joinButton');
let endBtn = document.getElementById('endSession');
let btnRow = document.getElementById('buttonRow');
let roomCodeForm = document.getElementById('roomCodeForm');
let joinRequestOpen = false;

// Open a port of communication with the background script
var port = chrome.extension.connect({
  name: "Background Communication"
});

// Pings to check if the chat window is open
window.addEventListener('DOMContentLoaded', () => {
  sendMessage({ message: 'OPEN' });
});

// Event listener for the start button
hostBtn.addEventListener('click', () => {
  sendMessage({ message: 'HOST' });
  window.close();
});

// Event listener for the join button
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

// Event listener for the "LEAVE ROOM" button
endBtn.addEventListener('click', () => {
  sendMessage({ message: 'END' });
  window.close();
});

// Event listener for the room code form submission
roomCodeForm.addEventListener('submit', e => {
  e.preventDefault();
  let roomCodeInput = document.getElementById('roomCode');
  let roomCode = roomCodeInput.value;
  joinRequestOpen = true;
  port.postMessage(roomCode);
})

// @param message: Sends the given message from the extention to the current tab
function sendMessage(data) {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, data);
  });
}

// Message handler for messages from the current tab
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.open) {
      hostBtn.style.display = 'none';
      joinBtn.style.display = 'none';
      endBtn.style.display = 'block';
      btnRow.classList.add('buttonRowAreas');
    } else if (joinRequestOpen && request == 'Send join request') {
      let roomCodeInput = document.getElementById('roomCode');
      sendMessage({ message: 'JOIN', roomCode: roomCodeInput.value });
      console.log(`JOIN: ${roomCodeInput.value}`);
      window.close();
    }
  }
);