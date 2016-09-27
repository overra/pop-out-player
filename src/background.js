if (window.DEV) {
  require('../reload')
}

var tabs = {}
var height = parseInt(300)
var width = parseInt(1.65 * height)
var windowLeft = parseInt(window.screen.width - width)
var windowTop = parseInt(window.screen.height - height)

function toggleBrowserAction (tab) {
  if (tab.url && tab.url.startsWith('https://www.youtube.com/watch?')) {
    chrome.browserAction.enable()
  } else {
    chrome.browserAction.disable()
  }
}

function tabIndexWhere(props) {
  for (var tabId in tabs) {
    if (Object.keys(props).every(function (key) {
      return tabs[tabId][key] === props[key]
    })) {
      return parseInt(tabId)
    }
  }
}

chrome.tabs.onActivated.addListener(function (details) {
  chrome.tabs.get(details.tabId, toggleBrowserAction)
})

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  toggleBrowserAction(tab)
})

chrome.browserAction.onClicked.addListener(function (tab) {
  chrome.tabs.sendMessage(tab.id, {popout: true}, function (details) {
    tabs[tab.id] = {
      url: details.url,
      currentTime: details.currentTime
    }
    chrome.windows.create({
      type: 'detached_panel',
      url: details.url,
      left: windowLeft,
      top: windowTop,
      width,
      height
    })
  })
})

chrome.windows.onRemoved.addListener(function (windowId) {
  var tabId = tabIndexWhere({windowId: windowId})
  if (tabId) {
    chrome.tabs.sendMessage(tabId, {
      action: 'resume',
      currentTime: tabs[tabId].currentTime
    }, function (response) {
      if (response.success === true) {
        chrome.browserAction.enable()
      }
    })
  }
})

chrome.runtime.onMessage.addListener(function (msg, sender) {
  if (msg && msg.action === 'open') {
    var tabId = tabIndexWhere({url: msg.url})
    tabs[tabId].windowId = sender.tab.windowId
  }
  if (msg && msg.action === 'timeUpdate') {
    var tabId = tabIndexWhere({url: msg.url})
    tabs[tabId].currentTime = msg.currentTime
  }
})
