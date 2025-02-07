import { convertBlobToDownloadable, downloadVoice } from '../../../utils/downloadUtil';
import JSZip from 'jszip';

console.log('running');
chrome.webRequest.onSendHeaders.addListener(async (details) => {
  const headers = details.requestHeaders
  const auth = headers.find(it => it.name === 'Authorization')
  await chrome.storage.local.set({ jwt: auth.value })
  console.log('get jwt success');
}, {urls: ['https://chatgpt.com/backend-api/me']}, ['requestHeaders'])

chrome.webRequest.onCompleted.addListener(async (details) => {
  const url = details.url
  const conversationId = getConversationId()
  if (conversationId) {
    await chrome.storage.local.set({ conversationId })
  }

  function getConversationId() {
    const pattern = /(?<=conversation\/).{36}/
    const matchResult = pattern.exec(url)
    if (matchResult) {
      return matchResult[0]
    } else {
      return undefined
    }
  }
}, {urls: ['https://chatgpt.com/backend-api/conversation/*']})

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('received request');
  if (request.type === 'download') {
    handleDownload({ messageId: request.messageId, sendResponse });
  } else if (request.type === 'downloadAll') {

  }
  return true
})

async function handleDownload({messageId, sendResponse}) {
  const result = await chrome.storage.local.get(['jwt', 'conversationId', 'voice'])
  const conversationId = result.conversationId
  const jwt = result.jwt
  const voice = result.voice || 'breeze'

  if (conversationId) {
    const voiceBlob = await downloadVoice({
      messageId, conversationId, jwt, voice
    })

    const downloadBlob = await convertBlobToDownloadable({
      blob: voiceBlob,
      type: 'audio/aac'
    })
    await chrome.downloads.download({
      url: downloadBlob,
      filename: `voice_${messageId}.aac`
    });
    sendResponse({
      ok: result
    })
  }
}

async function handleDownloadAll({messageId}) {
  const result = await chrome.storage.local.get(['jwt', 'conversationId', 'voice'])
  const conversationId = result.conversationId
  const jwt = result.jwt
  const voice = result.voice
  const response = await fetch(`https://chatgpt.com/backend-api/conversation/${conversationId}`, {
    method: 'GET',
    headers: {
      Authorization: jwt,
      'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36'
    }
  })
  if (!response.ok) {
    console.log('get conversation error')
  }

  const conversationResponse = (await response.json())
  const messageIds = Object.values(conversationResponse.mapping).filter(it => {
    return it.message !== null && it.message.author.role === 'assistant'
  }).map(it => it.message.id)

  const zip = new JSZip();
  const folderName = conversationResponse.title;
  const folder = zip.folder(folderName);

  const promises = messageIds.map(async (it, index) => {
    try {
      let blob = await downloadVoice({
        messageId: it,
        conversationId,
        jwt,
        voice
      });
      folder.file(`${index}_${it}.aac`, blob, {binary: true})
      return ''
    } catch (err) {}
  })

  await Promise.all(promises)

  const zipBlob = await zip.generateAsync({ type: "blob" });

  const downloadZipBlob = await convertBlobToDownloadable({
    blob: zipBlob,
    type: 'application/zip'
  })
  const zipFileName =`${conversationResponse.title}.zip`

  await chrome.downloads.download({
    url: downloadZipBlob,
    filename: zipFileName
  });
}