const ws = new WebSocket('ws://localhost:34343')

ws.onopen = () => console.log('Live reload connected..')
ws.onmessage = msg => (msg.data === 'reload') ? chrome.runtime.reload() : null
