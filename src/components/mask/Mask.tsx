import React from 'react';

export default function Mask() {
  return (
    <div className={'absolute top-0 left-0 w-full h-full flex justify-center items-center bg-gray-300'}>
      <p className={'text-white text-3xl'}>请在ChatGPT页面打开</p>
    </div>
  )
}