const chrome = require('sinon-chrome')

beforeEach(() => {
  window.chrome = chrome
  require('./background')
})

describe('toggleBrowserAction', () => {
  it('call browserAction.enable() if youtube video url', () => {
    chrome.tabs.get.yields({url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'})
    chrome.tabs.onActivated.trigger({tabId: 1})
    expect(chrome.browserAction.enable.called).toBe(true)
  })

  it('call browserAction.disable() if not a youtube video url', () => {
    chrome.tabs.get.yields({url: 'https://www.google.com'})
    chrome.tabs.onActivated.trigger({tabId: 2})
    expect(chrome.browserAction.disable.called).toBe(true)
  })
})

it('should call chrome.tabs.get when chrome.tabs.onActivated', () => {
  chrome.tabs.get.reset()

  chrome.tabs.onActivated.trigger({tabId: 2})
  expect(chrome.tabs.get.called).toBe(true)
})
