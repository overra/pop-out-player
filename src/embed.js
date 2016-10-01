import {onReady, storage} from './helpers'
import throttle from 'lodash.throttle'

onReady(initEmbedScript)

let currentPosition = {}
let currentDimensions = {}

async function initEmbedScript() {
  const {position, dimensions} = await storage.get(['position', 'dimensions'])
  const videoElement = document.querySelector('video')
  let firstStart = true

  currentPosition = position
  currentDimensions = dimensions

  videoElement.addEventListener('timeupdate', function (e) {
    if (firstStart) {
      firstStart = false
      videoElement.pause()
      chrome.runtime.sendMessage({
        action: 'popoutLoaded',
        url: location.href
      })
    }

    chrome.runtime.sendMessage({
      action: 'timeUpdate',
      currentTime: e.target.currentTime,
      url: location.href
    })
  })

  chrome.runtime.sendMessage({
    action: 'opened',
    url: location.href
  })

  chrome.runtime.onMessage.addListener(function (msg, sender, respond) {
    if (msg.action === 'continueAt') {
      videoElement.currentTime = msg.currentTime
      videoElement.play()
    }
  })

  if (window === window.parent) {
    // popout window created
    watchWindow()
  } else {
    // is iframe
    // TODO: make embedded videos popout
  }
}

const updateStorage = throttle(() => {
  currentPosition = {
    left: window.screenX,
    top: window.screenY
  }
  currentDimensions = {
    width: window.outerWidth,
    height: window.outerHeight
  }

  storage.set({
    dimensions: currentDimensions,
    position: currentPosition
  }).then(() => {
    requestAnimationFrame(watchWindow)
  })
}, 1000)

function watchWindow() {
  const {left, top} = currentPosition
  const {width, height} = currentDimensions

  if (
    window.screenX !== left ||
    window.screenY !== top ||
    window.outerWidth !== width ||
    window.outerHeight !== height
  ) {
    updateStorage()
  } else {
    requestAnimationFrame(watchWindow)
  }
}
