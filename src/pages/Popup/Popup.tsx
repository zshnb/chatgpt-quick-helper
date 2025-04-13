import React, { useEffect, useMemo, useRef, useState } from 'react';
import Select from 'react-select';
import Spin from '../../components/spin/Spin';
import Mask from '../../components/mask/Mask';
import { MessageItem, Voice } from '../../types';
import { getMessageIds } from '../../util';
import LoadingButton from '../../components/button/LoadingButton';

const Popup = () => {
  const voices: Voice[] = [
    { display: 'Sol', value: 'glimmer' },
    {
      display: 'Spruce',
      value: 'orbit',
    },
    { display: 'Maple', value: 'maple' },
    { display: 'Vale', value: 'vale' },
    { display: 'Arbor', value: 'fathom' },
    {
      display: 'Breeze',
      value: 'breeze',
    },
    { display: 'Juniper', value: 'juniper' },
    { display: 'Ember', value: 'ember' },
    { display: 'Cove', value: 'cove' },
    { display: 'Monday', value: 'shade' },
  ];
  const [voice, setVoice] = useState({display: 'Breeze', value: 'breeze'});
  const [loading, setLoading] = useState(false);
  const [messageItems, setMessageItems] = useState<MessageItem[]>([]);
  const [messageIds, setMessageIds] = useState<string[]>([]);
  const [error, setError] = useState<string | undefined>(undefined);
  const conversationIdRef = useRef();

  const zipAudios = useMemo(() => {
    return (
      messageItems.filter((it) => it.status === 'finished').length ===
      messageIds.length
    );
  }, [messageItems, messageIds]);

  async function handleDownloadAllVoices() {
    setLoading(true);
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'downloadAllVoices',
      });
      if (response.ok) {
        setMessageItems(response.messageItems);
        console.log('download voice success');
      } else {
        setError('下载失败，请稍后重试');
        console.log('download voice error');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleZipAudios() {
    setLoading(true);
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'zipAudios',
        conversationId: conversationIdRef.current,
      });
      if (response.ok) {
        console.log('zip audios success');
      } else {
        setError('打包失败，请稍后重试');
        console.log('zip audios error');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleReDownloadAudio({
    messageId,
    index,
  }: {
    messageId: string;
    index: number;
  }) {
    const response = await chrome.runtime.sendMessage({
      type: 'reDownloadAudio',
      conversationId: conversationIdRef.current,
      messageId,
      index,
    });
    const item = messageItems.find((it) => it.index === index);
    if (item) {
      item.status = 'finished';
      setMessageItems([...messageItems]);
    }
    if (response.ok) {
      console.log('re download audio success');
    } else {
      setError('下载失败，请稍后重试');
      console.log('re download error');
    }
  }

  useEffect(() => {
    chrome.storage.local.get(['voice']).then(async (res) => {
      if (!res.voice) {
        await chrome.storage.local.set({ voice: voice.value });
      }
    });
  }, []);

  useEffect(() => {
    async function getMessages() {
      const storage = await chrome.storage.local.get(['conversationId', 'jwt']);
      const conversationId = storage.conversationId;
      conversationIdRef.current = conversationId;
      const jwt = storage.jwt;
      if (!storage.conversationId || !storage.jwt) {
        return;
      }
      const messageIds = await getMessageIds(conversationId, jwt);
      setMessageIds(messageIds);
      const messageItems: MessageItem[] = messageIds.map(
        (it: string, index) => ({
          id: it,
          index,
          status: 'pending',
        })
      );
      setMessageItems(messageItems);
    }

    getMessages();
  }, []);

  const [validPage, setValidPage] = useState(true);
  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs.length > 0) {
        const tab = tabs[0];
        if (tab.url) {
          const url = new URL(tab.url);
          if (url.hostname !== 'chatgpt.com') {
            setValidPage(false);
          }
        } else {
          setValidPage(false);
        }
      }
    });
  }, []);
  return (
    <div className="w-96 h-96 p-10">
      {validPage && (
        <form className={'flex flex-col gap-y-2 relative'}>
          <h1 className={'text-center text-xl'}>ChatGPT音频下载器</h1>
          <Select
            defaultValue={{ label: voice.display, value: voice.value }}
            placeholder="选择声音"
            className="max-w-xs"
            options={voices.map((it) => {
              return {
                value: it.value,
                label: it.display,
              };
            })}
            onChange={async (e: any) => {
              setVoice(e.value);
              await chrome.storage.local.set({ voice: e.value });
            }}
          ></Select>
          <button
            className={`text-white border-none rounded-sm px-0.5 py-2 bg-[#171717] w-[100px] self-center cursor-pointer flex justify-center gap-x-2`}
            onClick={zipAudios ? handleZipAudios : handleDownloadAllVoices}
            disabled={loading}
          >
            {loading && <Spin />}
            <span>{zipAudios ? '打包' : '下载全部'}</span>
          </button>
          {error && (
            <p className={'text-sm text-red-500 text-center'}>{error}</p>
          )}
          <ul className={'space-y-3 max-h-64 overflow-y-auto'}>
            <li className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
              <span className="text-gray-700">序号</span>
              <span className="text-sm font-medium text-gray-700">状态</span>
            </li>
            {messageItems.map((it) => (
              <li className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                <span className="text-gray-700">{it.index + 1}</span>
                {it.status === 'error' ? (
                  <LoadingButton
                    className={`text-slate-950 border-none rounded-sm px-0.5 py-1 bg-zinc-50 w-[80px] self-center cursor-pointer flex justify-around`}
                    handleEvent={() =>
                      handleReDownloadAudio({
                        messageId: it.id,
                        index: it.index,
                      })
                    }
                    loadingText={'下载中'}
                  >
                    <span>重新下载</span>
                  </LoadingButton>
                ) : (
                  <span
                    className={`text-sm font-medium ${
                      it.status === 'pending'
                        ? 'text-gray-500'
                        : it.status === 'finished'
                        ? 'text-green-500'
                        : 'text-red-500'
                    }`}
                  >
                    {it.status === 'pending' ? '未完成' : '已完成'}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </form>
      )}
      {!validPage && <Mask />}
    </div>
  );
};

export default Popup;
