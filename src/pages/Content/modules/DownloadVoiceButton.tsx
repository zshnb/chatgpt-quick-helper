import {type MouseEvent, useState} from "react";
import {Download} from "lucide-react";
import React from 'react';
import Spin from './Spin';

export default function DownloadVoiceButton({messageId}: {messageId: string}) {
  const [loading, setLoading] = useState<boolean>(false);
  async function handleDownload(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault()
    setLoading(true)
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'download',
        messageId
      })
      if (response.ok) {
        console.log('download voice success');
      } else {
        console.log('download voice error');
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {
        loading && <Spin/>
      }
      {!loading && (
        <button onClick={handleDownload} className={'p-0 min-w-4'}>
          {!loading && <Download size={14}/>}
        </button>
      )}
    </>
  )
}
