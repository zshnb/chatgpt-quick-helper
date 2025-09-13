export type DownloadVoiceParams = {
  messageId: string
  conversationId: string
  jwt: string
  voice: string
}

export async function downloadVoice({messageId, conversationId, jwt, voice}: DownloadVoiceParams): Promise<Blob> {
  const response = await fetch(`https://chatgpt.com/backend-api/synthesize?message_id=${messageId}&conversation_id=${conversationId}&voice=${voice}&format=aac`, {
    method: 'GET',
    headers: {
      Authorization: jwt,
      'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36'
    }
  })
  if (!response.ok) {
    console.log(`download voice: ${messageId} error`)
    throw new Error('download voice error')
  }

  return response.blob()
}

export type DownloadBlobParams = {
  blob: Blob
  type: string
}

export function convertBlobToDownloadable({blob, type}: DownloadBlobParams): Promise<string> {
  const localBlob = new Blob([blob], {type});
  const reader = new FileReader();
  return new Promise((resolve) => {
    reader.onload = async function () {
      if (reader.result) {
        resolve(reader.result.toString())
      }
    };

    reader.readAsDataURL(localBlob);
  })
}