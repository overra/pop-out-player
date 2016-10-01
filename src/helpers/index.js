export function onReady (fn) {
  if (document.readyState === 'complete' || document.readyState === 'loaded') {
    fn()
  } else {
    document.addEventListener('DOMContentLoaded', fn)
  }
}

export const storage = {
  async get (key) {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.get(key,resolve)
    })
  },
  async set (items) {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.set(items, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError)
        } else {
          resolve()
        }
      })
    })
  }
}
