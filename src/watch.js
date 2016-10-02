import {onReady} from './helpers'

onReady(initWatchScript)

function embedUrl (videoId, currentTime) {
  return 'https://www.youtube.com/embed/' + videoId + '?autoplay=1' +
    '&start=' + Math.round(currentTime)
}

function getMetadata() {
  const videoElement = document.querySelector('video')
  const videoId = location.href.split('v=')[1].split('&')[0]

  return [videoId, videoElement]
}

function initWatchScript() {
  const [videoId, videoElement] = getMetadata()

  chrome.runtime.sendMessage({
    action: 'popout',
    url: embedUrl(videoId, videoElement.currentTime)
  })

  chrome.runtime.onMessage.addListener(function (msg, sender, respond) {
    if (!msg) return

    if (msg.action === 'popout') {
      const [videoId, videoElement] = getMetadata()
      chrome.runtime.sendMessage({
        action: 'popout',
        url: embedUrl(videoId, videoElement.currentTime)
      })
    } else if (msg.action === 'resume') {
      videoElement.currentTime = msg.currentTime
      videoElement.play()
      respond({success: true})
    } else if (msg.action === 'pause') {
      videoElement.pause()
      respond({currentTime: videoElement.currentTime})
    }
  })

}
