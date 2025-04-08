import React, { useEffect, useMemo, useRef, useState } from 'react';
import Select from 'react-select';
import Spin from '../../components/spin/Spin';
import Mask from '../../components/mask/Mask';
import { MessageItem } from '../../types';
import { getMessageIds } from '../../util';

const Popup = () => {
  const voices = ['breeze', 'juniper', 'ember', 'cove'];
  const [voice, setVoice] = useState('breeze');
  const [loading, setLoading] = useState(false);
  const [messageItems, setMessageItems] = useState<MessageItem[]>([]);
  const [messageIds, setMessageIds] = useState<string[]>([]);
  const [error, setError] = useState<string | undefined>(undefined);
  const conversationIdRef = useRef()

  const zipAudios = useMemo(() => {
    return messageItems.filter(it => it.status === 'finished').length === messageIds.length
  }, [messageItems, messageIds])

  async function handleDownloadAllVoices() {
    setLoading(true);
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'downloadAllVoices',
      });
      if (response.ok) {
        console.log(response);
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
        conversationId: conversationIdRef.current
      });
      if (response.ok) {
        console.log('zip voice success');
      } else {
        setError('打包失败，请稍后重试');
        console.log('zip voice error');
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    chrome.storage.local.get(['voice']).then(async (res) => {
      if (!res.voice) {
        await chrome.storage.local.set({ voice });
      }
    });
  }, []);

  useEffect(() => {
    async function getMessages() {
      const storage = await chrome.storage.local.get(['conversationId', 'jwt']);
      const conversationId = storage.conversationId;
      conversationIdRef.current = conversationId
      const jwt = storage.jwt;
      if (!storage.conversationId || !storage.jwt) {
        return;
      }
      const messageIds = await getMessageIds(conversationId, jwt);
      setMessageIds(messageIds)
      const messageItems: MessageItem[] = messageIds.map((it: any, index) => ({
        id: (index + 1).toString(),
        status: 'pending',
      }));
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
            defaultValue={{ label: voice, value: voice }}
            placeholder="选择声音"
            className="max-w-xs"
            options={voices.map((it) => {
              return {
                value: it,
                label: it,
              };
            })}
            onChange={async (e: any) => {
              setVoice(e.value);
              await chrome.storage.local.set({ voice: e.value });
            }}
          ></Select>
          <button
            className={`text-white border-none rounded-sm px-0.5 py-2 bg-[#171717] w-[100px] self-center cursor-pointer flex justify-around`}
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
                <span className="text-gray-700">{it.id}</span>
                <span
                  className={`text-sm font-medium ${
                    it.status === 'pending' ? 'text-gray-500' : it.status === 'finished' ? 'text-green-500' : 'text-red-500'
                  }`}
                >
                  {it.status === 'pending' ? '未完成' : '已完成'}
                </span>
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
