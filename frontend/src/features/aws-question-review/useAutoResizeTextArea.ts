import { useLayoutEffect, useRef } from 'react';

export function useAutoResizeTextArea(value: string, isVisible: boolean) {
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const textArea = textAreaRef.current;
    if (!isVisible || !textArea) {
      return;
    }

    textArea.style.height = 'auto';
    textArea.style.height = `${textArea.scrollHeight}px`;
  }, [isVisible, value]);

  return textAreaRef;
}
