(function (window) {
  var videoElement = document.querySelector('video')
  videoElement.addEventListener('timeupdate', function (e) {
    chrome.runtime.sendMessage({
      action: 'timeUpdate',
      currentTime: e.target.currentTime,
      url: location.href
    })
  })
  videoElement.play()
  chrome.runtime.sendMessage({
    action: 'open',
    url: location.href
  })
})(this)
