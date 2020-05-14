const socket = io('https://host.streamwithme.net', { secure: true });
var currTabId = '';
var currRoomURL = '';
var activeSession = false;

chrome.extension.onConnect.addListener(function(port) {
  console.log('Connected with Popup');
  port.onMessage.addListener(function(roomURL) {
    socket.emit('get-URL', roomURL);
  });
});

socket.on('room-URL', roomURL => {
  activeSession = true;
  currRoomURL = roomURL;
  chrome.tabs.update(null, {url: roomURL});
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if (activeSession) {
    chrome.tabs.get(tabId, function(tab) {
      if (tab.url == currRoomURL) {
        currTabId = tabId;
      }
    });
    if (currTabId != '' && currTabId == tabId) {
      chrome.tabs.sendMessage(currTabId, {message: 'UNLOAD'});
    }
  }
});

chrome.tabs.onRemoved.addListener(function(tabId, removeInfo) {
  console.log({
    tabId: tabId,
    removeInfo: removeInfo
  });
});