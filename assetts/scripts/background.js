var videoTabID = "";
var videoTabURL = "";
var contentTabID = "";

var currRoomURL = "";

// Listener for messages from the popup
chrome.extension.onConnect.addListener(function (port) {
  console.log("Connected with Popup");
  port.onMessage.addListener(function (roomURL) {
    fetch(`https://host.streamwithme.net/roomURL/${roomURL}`)
      .then((res) => {
        res.json()
        .then((res) => {
          chrome.tabs.update(null, { url: res.url });
        });
      })
      .catch((err) => {
        console.log(err);
      });
  });
});

// Listener for video / content script
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.from == 'video') {
    console.log(request);
    if (videoTabID == "") {
      console.log(`Video Tab ID: ${sender.tab.id}`);
      console.log(`Video Tab URL: ${sender.tab.url}`);
      videoTabID = sender.tab.id;
      videoTabURL = sender.tab.url;
    }
    //chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.sendMessage(videoTabID, {
      to: 'content_js',
      msg: request.msg
    });
    //});
  } else if (request.from == 'content') {
    console.log(request);
    if (contentTabID == "") {
      console.log(`Content Tab ID: ${sender.tab.id}`);
      contentTabID = sender.tab.id;
    }
    //chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.sendMessage(contentTabID, {
      to: 'video_js',
      msg: request.msg
    });
    //});
  }
});

// Resets the videoTabID/contentTabID if the tab is deleted
chrome.tabs.onRemoved.addListener(function(tabId, info) {
  if (tabId == videoTabID) {
    console.log('Tab deleted, deleting videoTabID and contentTabID...');
    videoTabID = "";
    videoTabURL = "";
    contentTabID = "";
  }
});

// Resets the videoTabID/contentTabID if the tab url is changed
chrome.tabs.onUpdated.addListener(function(tabId, info, tab) {
  if (info.url && info.url != "") {
    console.log(info.url);
    if ((tabId == videoTabID && info.url != videoTabURL)) {
      console.log('Tab URL updated, deleting videoTabID and contentTabID...');
      console.log(info.url);
      videoTabID = "";
      videoTabURL = "";
      contentTabID = "";
    }
  }
});