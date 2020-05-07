// Main DOM manipulation script
// Also referred to as the content script

let webPlayers = {
  amazon: '.webPlayerContainer video',
  crunchyroll: 'player0'
};

let currWebsite = window.location.hostname.replace('www.','');
currWebsite = currWebsite.replace('.com','');

// @param message: Takes a string and sends that string
// from thi Content script to the extension
function sendMessage(message) {
  chrome.runtime.sendMessage(message);
}

// Waits for page to load so the video player can be found
window.addEventListener('load', () => {
  // Used to send which URL the current tab is upon loading
  sendMessage({message: 'Content Loaded'});

  setTimeout(() => {
    // Grabs the video player element
    let videoPlayer = document.querySelectorAll(webPlayers[`${currWebsite}`])[0];
    if(currWebsite == 'crunchyroll') {
      videoPlayer = document.getElementById(`${webPlayers[`${currWebsite}`]}`);
    }

    // If the video player is playing, tell the extension
    videoPlayer.addEventListener('play', () => { 
      console.log('PLAY');
      sendMessage('PLAY');
    });

    // Similarly, if the video player is paused, tell the extension
    videoPlayer.addEventListener('pause', () => {
       console.log('PAUSE');
       sendMessage('PAUSE');
    });
  }, 2000);
});

// Receives actions (as strings) from media buttons
chrome.runtime.onMessage.addListener(
  function(message, sender, sendResponse) {
    // Grabs the video player element
    let videoPlayer = document.querySelectorAll(webPlayers[`${currWebsite}`])[0];
    if(currWebsite == 'crunchyroll') {
      videoPlayer = document.querySelector(`${webPlayers[`${currWebsite}`]}`);
    }
  
    // Controls the video player based on the received actions
    if(message.message == 'PLAY') {
      videoPlayer.play();
      sendMessage('PLAY');
    } else if(message.message == 'PAUSE') {
      videoPlayer.pause();
      sendMessage('PAUSE');
    } else if(message.message == 'SKIP') {
      videoPlayer.currentTime += 10;
      sendMessage('SKIP');
    } else if(message.message == 'BACK') {
      videoPlayer.currentTime -= 10;
      sendMessage('BACK');
    } else if(message.message == 'START') {
      startParty();
    } else if(message.message == 'STOP') {
      stopParty();
    } else {
      console.log(message.message);
    }
  }
);

// Opens the party side window
function startParty() {
  // Create the chat window div
  let chatWindow = document.createElement('div');
  chatWindow.id = 'swm-chatWindow';
  chatWindow.style.alignItems = 'flex-end';
  chatWindow.style.backgroundColor = 'lightgray';
  chatWindow.style.display = 'grid';
  chatWindow.style.height = '100vh';
  chatWindow.style.justifyItems = 'center';
  chatWindow.style.position = 'absolute';
  chatWindow.style.right = '0';
  chatWindow.style.width = '20vw';
  chatWindow.style.zIndex = '99999';

  // Create the message input for the bottom
  let msgInput = document.createElement('input');
  msgInput.type = 'text';
  msgInput.name = 'message';
  msgInput.style.border = 'none';
  msgInput.style.borderRadius = '3px !important';
  msgInput.style.fontSize = '1.3em !important';
  msgInput.style.marginBottom = '10px';
  msgInput.style.padding = '8px !important';
  msgInput.style.height = '25px !important';
  msgInput.style.width = '90% !important';
  chatWindow.appendChild(msgInput);
  
  // Grab the page body and append these elements
  let body = document.querySelectorAll('body')[0];
  body.insertBefore(chatWindow, body.childNodes[0]);

  let amazonPlayer = document.getElementById('dv-web-player');
  amazonPlayer.style.width = 'calc(100% - 20vw) !important';
  amazonPlayer.style.position = "absolute !important";
  amazonPlayer.style.left = "0 !important";
}

// Closes Side Window
function stopParty() {
  let amazonPlayer = document.getElementById('dv-web-player');
  amazonPlayer.style.width = '100% !important;';

  let chatWindow = document.getElementById('swm-chatWindow');
  chatWindow.style.display = 'none';
}