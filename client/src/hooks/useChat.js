import { useCallback, useRef, useState } from 'react';
import { streamChat } from '../lib/api.js';

const newId = () => Math.random().toString(36).slice(2);

/**
 * Owns the conversation: the message list, whether a reply is streaming, and
 * the handle to cancel it. Components below just render what this returns.
 *
 * @param getEditorState  () => ({ code, language }) — read at send time so the
 *                        model always sees the latest version of the file.
 * @param onReplyComplete (fullReply) => void — fires once a reply has finished.
 */
export function useChat({ getEditorState, onReplyComplete }) {
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  const send = useCallback(
    async (prompt) => {
      const content = prompt.trim();
      if (!content || isStreaming) return;

      setError(null);

      const question = { id: newId(), role: 'user', content };
      const replyId = newId();

      // Snapshot the history before adding the empty assistant bubble — the
      // model should never see its own blank message.
      const history = [...messages, question].map(({ role, content }) => ({ role, content }));

      setMessages((current) => [...current, question, { id: replyId, role: 'assistant', content: '' }]);
      setIsStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;

      let reply = '';

      try {
        const { code, language } = getEditorState();

        await streamChat({
          messages: history,
          code,
          language,
          signal: controller.signal,
          onToken: (token) => {
            reply += token;
            setMessages((current) =>
              current.map((message) =>
                message.id === replyId ? { ...message, content: reply } : message,
              ),
            );
          },
        });

        onReplyComplete?.(reply);
      } catch (err) {
        if (err.name === 'AbortError') return; // the user pressed Stop; keep what arrived

        setError(err.message);
        // Remove the assistant bubble if it never received anything.
        setMessages((current) =>
          current.filter((message) => message.id !== replyId || message.content),
        );
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [messages, isStreaming, getEditorState, onReplyComplete],
  );

  const stop = useCallback(() => abortRef.current?.abort(), []);

  const clear = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return { messages, isStreaming, error, send, stop, clear };
}
