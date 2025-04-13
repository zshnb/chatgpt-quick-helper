import { convertBlobToDownloadable, downloadVoice } from '../../../utils/downloadUtil';
import JSZip from 'jszip';
import { getMessageIds } from '../../util';

console.log('running');
const conversationWithBlobs = {}
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
  console.log('received request', request);
  if (request.type === 'download') {
    handleDownload({ messageId: request.messageId, sendResponse });
  } else if (request.type === 'downloadAllVoices') {
    handleDownloadAll({sendResponse});
  } else if (request.type === 'zipAudios') {
    handleZipAudios({conversationId: request.conversationId, sendResponse});
  } else if (request.type === 'reDownloadAudio') {
    handleReDownloadInPopUp({...request, sendResponse});
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
      ok: true
    })
  }
}

async function handleReDownloadInPopUp({conversationId, messageId, index, sendResponse}) {
  const conversationInfo = conversationWithBlobs[conversationId]
  if (!conversationInfo) {
    console.log(`no conversation[${conversationId} info, skip re-download message[${messageId}]`);
    return
  }
  const result = await chrome.storage.local.get(['jwt'])
  const jwt = result.jwt
  const voice = conversationInfo.voice
  try {
    const blob = await downloadVoice({messageId, conversationId, jwt, voice})
    const blobInfo = conversationInfo.blobs.find(it => it.index === index)
    blobInfo.blob = blob
    blobInfo.status = 'finished'
    sendResponse({
      ok: true
    })
  } catch (e) {
    sendResponse({
      ok: false
    })
  }
}

async function handleDownloadAll({sendResponse}) {
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
    sendResponse({
      ok: false,
    })
  }

  const conversationResponse = (await response.json())
  const conversationInfo = {
    title: conversationResponse.title,
    voice,
    blobs: []
  }
  conversationWithBlobs[conversationId] = conversationInfo
  const messageIds = await getMessageIds(conversationId, jwt)

  const promises = messageIds.map(async (it, index) => {
    try {
      let blob = await downloadVoice({
        messageId: it,
        conversationId,
        jwt,
        voice
      });
      conversationInfo.blobs.push({
        messageId: it,
        blob,
        index,
        status: 'finished'
      })
    } catch (err) {
      conversationInfo.blobs.push({
        index,
        messageId: it,
        status: 'error',
      })
    }
  })

  await Promise.all(promises)
  console.log('conversationInfo', conversationInfo);
  conversationInfo.blobs = conversationInfo.blobs.sort((a, b) => a.index - b.index)
  sendResponse({
    ok: true,
    messageItems: conversationInfo.blobs.map((it, index) => ({
      id: it.messageId,
      index,
      status: it.status
    })).sort((a, b) => a.id - b.id)
  })
}

async function handleZipAudios({conversationId, sendResponse}) {
  const title = conversationWithBlobs[conversationId].title
  const zip = new JSZip();
  const folder = zip.folder(title);

  const blobs = conversationWithBlobs[conversationId].blobs
  for (let i = 0; i < blobs.length; i++) {
    folder.file(`${i + 1}.aac`, blobs[i].blob, {binary: true})
  }

  const zipBlob = await zip.generateAsync({ type: "blob" });

  const downloadZipBlob = await convertBlobToDownloadable({
    blob: zipBlob,
    type: 'application/zip'
  })
  const zipFileName =`${title}.zip`

  await chrome.downloads.download({
    url: downloadZipBlob,
    filename: zipFileName
  });
  sendResponse({
    ok: true,
  })
}
