chrome.runtime.onMessage.addListener(function (msg, sender, respond) {
  if (msg.popout === true) {
    var videoElement = document.querySelector('video')
    var videoId = location.href.split('v=')[1].split('&')[0]
    var embedUrl = 'https://www.youtube.com/embed/' + videoId + '?autoplay=1' +
      '&start=' + Math.round(videoElement.currentTime)

    videoElement.pause()
    respond({url: embedUrl})

    chrome.runtime.onMessage.addListener(function (msg, sender, respond) {
      if (msg && msg.action === 'resume') {
        videoElement.currentTime = msg.currentTime
        videoElement.play()
        respond({success: true})
      }
    })
  }
})
