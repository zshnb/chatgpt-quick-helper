import React, { useState } from 'react';
import Spin from '../spin/Spin';

export type LoadingButtonProps = {
  className: string;
  handleEvent: () => Promise<any>;
  children?: React.ReactNode;
  loadingText: string;
};
export default function LoadingButton(props: LoadingButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      await props.handleEvent();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      className={props.className}
      onClick={handleClick}
      disabled={loading}
    >
      {loading && (
        <>
          <Spin />
          <span>{props.loadingText}</span>
        </>
      )}
      {
        !loading && props.children
      }
    </button>
  );
}
