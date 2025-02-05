import { createRoot } from 'react-dom/client';
import DeleteButton from './modules/DeleteButton';
import React from 'react';

console.log('Content script works!');


const addedEventElements = new Set()
const observer = new MutationObserver((mutations, obs) => {
  const elements = document.querySelectorAll('a[href^="/c"]')
  elements.forEach(element => {
    const href = element.getAttribute('href')
    if (!addedEventElements.has(href)) {
      addedEventElements.add(href)
      console.log('this element does not add event');
      element.addEventListener('mouseenter', () => {
        console.log('mouse enter');
        const reactRootEl = document.createElement('div');
        reactRootEl.setAttribute('id', 'reactRoot')
        element.appendChild(reactRootEl)
        const reactRoot = createRoot(reactRootEl)
        reactRoot.render(<DeleteButton/>)
      })
      element.addEventListener('mouseleave', () => {
        document.getElementById('reactRoot').remove()
      })
    }
  })
});

observer.observe(document.body, { childList: true, subtree: true });

