// Script document for the popup page

let playBtn = document.getElementById('playButton');
let pauseBtn = document.getElementById('pauseButton');
let skipTen = document.getElementById('skipForward');
let backTen = document.getElementById('skipBack');
let startBtn = document.querySelectorAll('#streamWM #buttonRow>button')[0];

// Event listener for the play button
playBtn.addEventListener('click', () => {
  playBtn.style.display = 'none';
  pauseBtn.style.display = 'block';
  sendMessage('PLAY');
});

// Event listener for the pause button
pauseBtn.addEventListener('click', () => {
  pauseBtn.style.display = 'none';
  playBtn.style.display = 'block';
  sendMessage('PAUSE');
});

// Event listener for the skip forward button
skipTen.addEventListener('click', () => {
  sendMessage('SKIP');
});

// Event listener for the skip backward button
backTen.addEventListener('click', () => {
  sendMessage('BACK');
});

// Event listener for the start button
startBtn.addEventListener('click', () => {
  let text = document.getElementById('startButtonText');
  if(text.innerHTML == 'START') {
    sendMessage('START');
    text.innerHTML = 'STOP'
  } else {
    sendMessage('STOP');
    text.innerHTML = 'START'
  }
});

// @param message: Sends the given message from the extention to the current tab
// (only if that current tab has the URL *://*.amazon.com/*/video/*)
function sendMessage(message) {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {
      message: message
    });
  });
}

// Message handler for messages from the current tab
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    // Detects if the web player is playing or not, 
    // and toggles the play/pause buttons
    if(request == 'PLAY') {
      playBtn.style.display = 'none';
      pauseBtn.style.display = 'block';
    } else if (request == 'PAUSE') {
      playBtn.style.display = 'block';
      pauseBtn.style.display = 'none';
    }
  }
);