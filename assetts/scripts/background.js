var currTabId = "";
var currRoomURL = "";

chrome.extension.onConnect.addListener(function (port) {
  const socket = io("https://host.streamwithme.net", { secure: true });
  console.log("Connected with Popup");
  port.onMessage.addListener(function (roomURL) {
    socket.emit("get-URL", roomURL);
  });

  socket.on("room-URL", (roomURL) => {
    currRoomURL = roomURL;
    chrome.tabs.update(null, { url: roomURL });
  });
});
