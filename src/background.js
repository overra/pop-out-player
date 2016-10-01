import {onReady, storage} from './helpers'

if (window.DEV) {
  require('../reload')
}

onReady(initBackgroundScript)

const TARGET_SITES = [{
    pattern: /www\.youtube\.com\/watch/,
    pageAction (tabs, tab) {
      let currentTab = tabs[tab.id]
      if (!currentTab) {
        currentTab = tabs[tab.id] = {}
      }

      if (!currentTab.injected) {
        tabs[tab.id].injected = true
        chrome.tabs.executeScript(tab.id, {file: 'watch.js'})
      } else {
        chrome.tabs.sendMessage(tab.id, {action: 'popout'})
      }
    }
  }, {
    pattern: /www\.netflix\.com\/watch/,
    pageAction (tabs, tab) {
      chrome.tabs.executeScript(tab.id, {code: 'window.history.back()'})
      createPopout(tab.url)
    }
  }
]

export async function initBackgroundScript() {
  const {dimensions, position} = await storage.get(['dimensions', 'position'])

  if (!dimensions) {
    await storage.set({
      dimensions: {
        width: 495,
        height: 300
      }
    })
  }

  if (!position) {
    const {dimensions: {width, height}} = await storage.get('dimensions')
    await storage.set({
      position: {
        left: window.screen.width - width,
        top: window.screen.height - height
      }
    })
  }

  const tabs = {}

  // toggle pageAction on tab change
  chrome.tabs.onActivated.addListener((details) => {
    chrome.tabs.get(details.tabId, togglePageAction)
  })

  // toggle pageAction on tab update
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    togglePageAction(tab)
  })

  // execute script on pageAction click
  chrome.pageAction.onClicked.addListener((tab) => {
    // TODO: refactor to support more than one video site
    TARGET_SITES.forEach(site => {
      if (site.pattern.test(tab.url)) {
        site.pageAction(tabs, tab)
      }
    })
  })

  // attempt to resume origin video when popout is closed
  chrome.windows.onRemoved.addListener(windowId => {
    var tabId = tabIndexWhere(tabs, {windowId: windowId})

    if (tabId) {
      chrome.tabs.sendMessage(tabId, {
        action: 'resume',
        currentTime: tabs[tabId].currentTime
      }, (response) => {
        if (response.success === true) {
          chrome.pageAction.show(tabId)
        }
      })
    }
  })

  // listen to and relay messages
  chrome.runtime.onMessage.addListener(function (msg, sender, respond) {
    if (!msg) {
      return
    }

    if (msg.action === 'opened') {
      const tabId = tabIndexWhere(tabs, {url: msg.url})
      tabs[tabId].windowId = sender.tab.windowId
    } else if (msg.action === 'timeUpdate') {
      const tabId = tabIndexWhere(tabs, {url: msg.url})
      tabs[tabId].currentTime = msg.currentTime
      tabs[tabId].newTabId = sender.tab.id
    } else if (msg.action === 'popout') {
      tabs[sender.tab.id].url = msg.url
      createPopout(msg.url)
    } else if (msg.action === 'popoutLoaded') {
      const tabId = tabIndexWhere(tabs, {url: msg.url})
      chrome.tabs.sendMessage(tabId, {action: 'pause'}, response => {
        chrome.tabs.sendMessage(tabs[tabId].newTabId, {
          action: 'continueAt',
          currentTime: response.currentTime
        })
      })
    }
  })
}

const createPopout = async (url) => {
  const {dimensions: {width, height}} = await storage.get('dimensions')
  const {position: {left, top}} = await storage.get('position')
  chrome.windows.create({type: 'detached_panel', url, left, top, width, height})
}

function tabIndexWhere(tabs, props) {
  for (var tabId in tabs) {
    const isSubset = Object.keys(props).every(function (key) {
      return tabs[tabId][key] === props[key]
    })
    if (isSubset) {
      return parseInt(tabId)
    }
  }
}

function togglePageAction (tab) {
  if (tab.url && TARGET_SITES.some(site => site.pattern.test(tab.url))) {
    chrome.pageAction.show(tab.id)
  } else {
    chrome.pageAction.hide(tab.id)
  }
}
