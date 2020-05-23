let videoPlayer = document.getElementById('player0');
addVideoListeners(videoPlayer);

// @param message: Takes a string and sends that string
// from the Content script to the background script
function sendMessage(message) {
  chrome.runtime.sendMessage(message);
}

// Listens for messages
chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
  /* If the received message has the expected format... */
  if (msg.to && (msg.to == 'video_js')) {
    console.log(`Video Script: ${msg.msg}`);
    if (msg.msg == 'PAUSE') {
      videoPlayer.pause();
    } else if (msg.msg == 'PLAY') {
      videoPlayer.play();
    }
  }
});

// @param videoPlayer: Takes in a video DOM element
// Adds listeners to see if the video player is playing or not
function addVideoListeners(videoPlayer) {
  // If the video player is playing, tell the extension
  videoPlayer.addEventListener('playing', () => { 
    sendMessage({from: 'video', msg: 'PLAY'});
  });

  // Similarly, if the video player is paused, tell the extension
  videoPlayer.addEventListener('pause', () => {
    sendMessage({from: 'video', msg: 'PAUSE'});
  });

  // If the video player is waiting (loading, stuttering, etc), tell the extension
  videoPlayer.addEventListener('waiting', () => {
    sendMessage({from: 'video', msg: 'WAITING', time: videoPlayer.currentTime});
  });

  // If the user changes the current time, tell the extension
  videoPlayer.addEventListener('ratechange', () => {
    sendMessage({from: 'video', msg: 'TIMECHANGE', time: videoPlayer.currentTime});
  });
}