import React, { useEffect, useState } from 'react';
import Select from 'react-select';
import Spin from '../../components/spin/Spin';
import Mask from '../../components/mask/Mask';

const Popup = () => {
  const voices = ['breeze', 'juniper', 'ember', 'cove'];
  const [voice, setVoice] = useState('breeze');
  const [loading, setLoading] = useState(false);

  async function handleDownloadAllVoices() {
    setLoading(true);
    try {
      console.log('click');
      const response = await chrome.runtime.sendMessage({
        type: 'downloadAllVoices',
      });
      if (response.ok) {
        console.log('download voice success');
      } else {
        console.log('download voice error');
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    chrome.storage.local.get(['voice']).then(async (res) => {
      if (!res) {
        await chrome.storage.local.set({ voice: voices[0] });
        setVoice(voices[0]);
      } else {
        setVoice(res.voice);
      }
    });
  }, []);

  const [validPage, setValidPage] = useState(true);
  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs.length > 0) {
        const tab = tabs[0];
        if (tab.url) {
          const url = new URL(tab.url);
          if (url.hostname !== 'chatgpt.com') {
            setValidPage(false)
          }
        } else {
          setValidPage(false)
        }
      }
    })
  }, [])
  return (
    <div className="w-96 h-96 p-10">
      {
        validPage && (
          <form className={'flex flex-col gap-y-2 relative'}>
            <h1 className={'text-center text-xl'}>ChatGPT音频下载器</h1>
            <Select
              defaultValue={{label: voices[0], value: voices[0]}}
              placeholder="选择声音"
              className="max-w-xs"
              options={voices.map((it) => {
                return {
                  value: it,
                  label: it,
                };
              })}
              onChange={async (e) => {
                console.log(e);
                setVoice(e.value);
                await chrome.storage.local.set({ voice: e.value });
              }}
            ></Select>
            <button className={`text-white border-none rounded-sm px-0.5 py-2 bg-[#171717] w-[100px] self-center cursor-pointer flex justify-around`}
                    onClick={handleDownloadAllVoices}
                    disabled={loading}
            >
              {loading && <Spin/>}
              <span>
            下载所有
          </span>
            </button>
          </form>
        )
      }
      {
        !validPage && <Mask/>
      }
    </div>
  );
};

export default Popup;
