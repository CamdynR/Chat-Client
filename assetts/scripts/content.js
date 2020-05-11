// Main DOM manipulation script
// Also referred to as the content script

var videoPlayerElem = '';
var partyOpen = false;
var overAnHour = false;
var username = '';

// Code used from MDN MutationObserver Example here
// URL: https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver
// Listens to see when the video element is added to the page,
// since it's added with a script some time after load
const targetNode = document.body;
const config = { childList: true, subtree: true };
const callback = function (mutationsList, observer) {
  for (let mutation of mutationsList) {
    if (mutation.type === 'childList') {
      if (mutation.addedNodes.length > 0) {
        if (mutation.addedNodes[0].localName == 'video') {
          addVideoListeners(mutation.addedNodes[0]);
          videoPlayerElem = mutation.addedNodes[0];
          videoPlayerElem.id = 'videoPlayer';
          if (videoPlayer.duration >= 3600) {
            overAnHour = true;
          }
          observer.disconnect();
        }
      }
    }
  }
};
const observer = new MutationObserver(callback);
observer.observe(targetNode, config);

// @param message: Takes a string and sends that string
// from thi Content script to the extension
function sendMessage(message) {
  chrome.runtime.sendMessage(message);
}

// @param videoPlayer: Takes in a video DOM element
// Adds listeners to see if the video player is playing or not
function addVideoListeners(videoPlayer) {
  // If the video player is playing, tell the extension
  videoPlayer.addEventListener('play', () => { 
    console.log('PLAY');
  });

  // Similarly, if the video player is paused, tell the extension
  videoPlayer.addEventListener('pause', () => {
     console.log('PAUSE');
  });
}

// Receives actions (as strings) from media buttons
chrome.runtime.onMessage.addListener(
  function(message, sender, sendResponse) {
    if(videoPlayerElem != '') {
      // Controls the video player based on the received actions
      // if (message.message == 'PLAY') {
      //   videoPlayerElem.play();
      // } else if (message.message == 'PAUSE') {
      //   videoPlayerElem.pause();
      // } else if (message.message == 'SKIP') {
      //   videoPlayerElem.currentTime += 10;
      // } else if (message.message == 'BACK') {
      //   videoPlayerElem.currentTime -= 10;
      // } else 
      if (message.message == 'HOST') {
        openSidebar('HOST');
      } else if (message.message == 'JOIN') {
        openSidebar('JOIN');
      } else if(message.message == 'POPUP OPENED') {
        sendMessage({
          paused: videoPlayerElem.paused,
          partyOpen: partyOpen
        });
      } else {
        console.log(message.message);
      }
    } else {
      console.error('Video player element has not yet loaded');
    }
  }
);

// Opens the initial sidebar, first step
function openSidebar(participant) {
  let videoUI = document.getElementsByClassName('webPlayerContainer')[0].childNodes[0];
  videoUI.style = 'height: 100%; width: calc(100% - 20vw);';

  // Create the chat window div
  let chatWindow = document.createElement('div');
  chatWindow.id = 'swm-chatWindow';
  chatWindow.style = 'align-items:flex-end !important;background-color:lightgray !important;display:grid !important;grid-template-rows:18fr 1fr;height:100vh !important;justify-items:center !important;position:fixed !important;right:0px !important;top:0px !important;width:20vw !important;z-index:99999 !important;';
  
  // Grab the page body and append these elements
  let body = document.querySelectorAll('body')[0];
  body.insertBefore(chatWindow, body.childNodes[0]);

  partyOpen = true;
  getUserCreateLink(participant);
}

// Gets the user's name, second step
function getUserCreateLink(participant) {
  // Grab the chat window, create a child element for it to hold
  // the user input and prompt text
  let chat = document.getElementById('swm-chatWindow');
  let enterName = document.createElement('div');
  enterName.id = 'swm-enterNameWrapper';
  enterName.style = 'align-self: center !important;text-align:center';

  // Create a new element to hold the name prompt text
  let nameText = document.createElement('p');
  nameText.innerHTML = "Enter your name:";

  // Create a new element for the user name input
  let nameForm = document.createElement('form');
  nameForm.id = 'swm-nameForm';
  let nameInp = document.createElement('input');
  nameInp.id = 'swm-nameInput';
  nameInp.type = 'text';
  nameForm.appendChild(nameInp);

  // Add them all to each other
  enterName.appendChild(nameText);
  enterName.appendChild(nameForm);

  if (participant == 'HOST') {
    let url = getSessionURL();
    let giveLink = document.createElement('p');
    giveLink.innerHTML = `Use this link to let people join:<br>${url}`;
    giveLink.style = 'margin-top: 60px';
    enterName.appendChild(giveLink);
  }
  
  chat.appendChild(enterName);

  let nameFormE = document.getElementById('swm-nameForm');
  nameFormE.addEventListener('submit', e => {
    e.preventDefault();
    let nameInpE = document.getElementById('swm-nameInput');
    username = nameInpE.value;
    nameInpE.value = '';
    startChat();
  });
}

// Closes initial question UI and starts chatting
function startChat() {
  let nameWrapper = document.getElementById('swm-enterNameWrapper');
  nameWrapper.style = 'display: none !important;';
  let chatWindow = document.getElementById('swm-chatWindow');

  // Create the area where user messages will appear
  let msgArea = document.createElement('ul');
  msgArea.id = 'swm-msgArea';
  msgArea.style = 'justify-self:flex-start;margin-left: 5%;font-size: 1.35em;width: 94.6%;overflow-y: scroll;flex-direction: column;display: flex;height: auto;max-height: 100%;';

  // Create the message input for the bottom
  let msgForm = document.createElement('form');
  msgForm.id = 'swm-msgForm';
  msgForm.style = 'width:90% !important'

  // Handle the user messages
  msgForm.addEventListener('submit', e => {
    e.preventDefault();
    appendMessage('You');
  });

  let msgInput = document.createElement('input');
  msgInput.id = 'swm-msgInput';
  msgInput.type = 'text !important';
  msgInput.name = 'message !important';
  msgInput.autocomplete = 'off';
  msgInput.style = 'border:none !important;border-radius:3px !important;font-size:1.3em !important;padding:8px !important;height:25px !important;width:100% !important;';
  msgForm.appendChild(msgInput);
  chatWindow.appendChild(msgArea);
  chatWindow.appendChild(msgForm);
}

// Closes the chat window and stops Stream with Me party
function stopParty() {
  let videoUI = document.getElementsByClassName('webPlayerContainer')[0].childNodes[0];
  videoUI.style = 'height: 100%; width: 100%;';

  let chatWindow = document.getElementById('swm-chatWindow');
  chatWindow.style = 'display:none !important;';

  partyOpen = false;
}

// Adds event listeners to the chat window to parse user messages
function appendMessage(user) {
  let msgArea = document.getElementById('swm-msgArea');
  let msgInput = document.getElementById('swm-msgInput');
  
  let message = msgInput.value;
  let messageElem = document.createElement('li');
  messageElem.style = 'list-style-type: none;margin-bottom: 5px;';
  let currTimeVal = videoPlayerElem.currentTime;
  messageElem.innerHTML = `<span style="color:gray;cursor:pointer;" onclick="document.getElementById('videoPlayer').currentTime = ${currTimeVal}">${convertTime(currTimeVal)}</span> ${user}: ${message}`;
  msgArea.appendChild(messageElem);
  msgInput.value = '';

  msgArea.scrollTop = msgArea.scrollHeight;
}

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

// Creates a unique session URL to join for the party
function getSessionURL() {
  return 'http://127.5.2.43:3000/A82M1SY';
  // TODO
}