import React, { useEffect, useState } from 'react';

export default function DeleteButton({ href, element }: { href: string, element: Element }) {
  const [jwt, setJwt] = useState('');

  function getConversationId() {
    const array = href.split('/');
    return array[array.length - 1];
  }

  useEffect(() => {
    chrome.storage.local.get(['jwt']).then((result) => {
      setJwt(result.jwt);
    });
  }, []);

  async function handleDelete(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault()
    element.parentElement?.remove();
    (document.querySelector('button[aria-label="New chat"]') as HTMLButtonElement).click();
    const response = await fetch(
      `https://chatgpt.com/backend-api/conversation/${getConversationId()}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: jwt,
          'user-agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
        },
        body: JSON.stringify({ is_visible: false }),
      }
    );
    if (response.ok) {
      console.log('delete success');
    }
  }

  return (
    <button
      style={{
        color: '#f93a37',
      }}
      onClick={handleDelete}
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5 shrink-0"
      >
        <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M10.5555 4C10.099 4 9.70052 4.30906 9.58693 4.75114L9.29382 5.8919H14.715L14.4219 4.75114C14.3083 4.30906 13.9098 4 13.4533 4H10.5555ZM16.7799 5.8919L16.3589 4.25342C16.0182 2.92719 14.8226 2 13.4533 2H10.5555C9.18616 2 7.99062 2.92719 7.64985 4.25342L7.22886 5.8919H4C3.44772 5.8919 3 6.33961 3 6.8919C3 7.44418 3.44772 7.8919 4 7.8919H4.10069L5.31544 19.3172C5.47763 20.8427 6.76455 22 8.29863 22H15.7014C17.2354 22 18.5224 20.8427 18.6846 19.3172L19.8993 7.8919H20C20.5523 7.8919 21 7.44418 21 6.8919C21 6.33961 20.5523 5.8919 20 5.8919H16.7799ZM17.888 7.8919H6.11196L7.30423 19.1057C7.3583 19.6142 7.78727 20 8.29863 20H15.7014C16.2127 20 16.6417 19.6142 16.6958 19.1057L17.888 7.8919ZM10 10C10.5523 10 11 10.4477 11 11V16C11 16.5523 10.5523 17 10 17C9.44772 17 9 16.5523 9 16V11C9 10.4477 9.44772 10 10 10ZM14 10C14.5523 10 15 10.4477 15 11V16C15 16.5523 14.5523 17 14 17C13.4477 17 13 16.5523 13 16V11C13 10.4477 13.4477 10 14 10Z"
          fill="currentColor"
        ></path>
      </svg>
    </button>
  );
}
