console.log('running');
chrome.webRequest.onSendHeaders.addListener(async (details) => {
  const headers = details.requestHeaders
  const auth = headers.find(it => it.name === 'Authorization')
  await chrome.storage.local.set({ jwt: auth.value })
  console.log('get jwt success');
}, {urls: ['https://chatgpt.com/backend-api/me']}, ['requestHeaders'])