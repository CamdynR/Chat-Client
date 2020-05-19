// @param message: Takes a string and sends that string
// from thi Content script to the extension
// function sendMessage(message) {
//   chrome.runtime.sendMessage(message);
// }


// @param videoPlayer: Takes in a video DOM element
// Adds listeners to see if the video player is playing or not
// function addVideoListeners(videoPlayer) {
//   // If the video player is playing, tell the extension
//   videoPlayer.addEventListener('play', () => { 
//     console.log('PLAY');
//   });

//   // Similarly, if the video player is paused, tell the extension
//   videoPlayer.addEventListener('pause', () => {
//      console.log('PAUSE');
//   });
// }