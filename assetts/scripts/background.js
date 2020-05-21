var currTabId = "";
var currRoomURL = "";

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
