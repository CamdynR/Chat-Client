chrome.extension.onConnect.addListener(function(port) {
  console.log("Connected with Popup");
  port.onMessage.addListener(function(roomURL) {
    chrome.tabs.create({url: roomURL});
    port.postMessage('Link Open');
  });
})