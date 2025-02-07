import { createRoot } from 'react-dom/client';
import DeleteButton from './modules/DeleteButton';
import React from 'react';
import DownloadVoiceButton from './modules/DownloadVoiceButton';
import '../../main.css';

console.log('Content script works!');

const addedEventConversations = new Set();
const addedEventMessages = new Set();
const observer = new MutationObserver((mutations, obs) => {
  const conversations = document.querySelectorAll('a[href^="/c"]');
  conversations.forEach((element) => {
    const href = element.getAttribute('href');
    if (!addedEventConversations.has(href)) {
      addedEventConversations.add(href);
      element.addEventListener('mouseenter', () => {
        const reactRootEl = document.createElement('div');
        reactRootEl.setAttribute('id', 'deleteBtnRoot');
        element.appendChild(reactRootEl);
        const reactRoot = createRoot(reactRootEl);
        reactRoot.render(<DeleteButton href={href} element={element} />);
      });
      element.addEventListener('mouseleave', () => {
        document.getElementById('deleteBtnRoot')?.remove();
      });
    }
  });

  const messages = document.querySelectorAll(
    'article div[data-message-author-role="assistant"]'
  );
  messages.forEach((message) => {
    const messageId = message.getAttribute('data-message-id');
    if (!addedEventMessages.has(messageId)) {
      addedEventMessages.add(messageId);
      const article = message.closest('article');
      if (!article.querySelector('#downloadVoiceBtnRoot')) {
        article.addEventListener('pointerenter', () => {
          const toolbar =
            message.parentElement?.nextElementSibling?.childNodes[0]?.childNodes[0];
          if (toolbar) {
            if (document.querySelector('#downloadVoiceBtnRoot') === null) {
              const reactRootEl = document.createElement('div');
              reactRootEl.setAttribute('id', 'downloadVoiceBtnRoot');
              toolbar.appendChild(reactRootEl);
              const reactRoot = createRoot(reactRootEl);
              reactRoot.render(
                <DownloadVoiceButton messageId={messageId} />
              );
            }
          }
        });
        article.addEventListener('pointerleave', () => {
          document.querySelectorAll('#downloadVoiceBtnRoot').forEach(it => it.remove())
        });
      }
    }
  });
});

observer.observe(document.body, { childList: true, subtree: true });
