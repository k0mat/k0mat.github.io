import type { Provider, SendMessageArgs } from './adapters';

function sleep(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const id = setTimeout(resolve, ms);
    const onAbort = () => { clearTimeout(id); reject(new DOMException('Aborted', 'AbortError')); };
    if (signal) {
      if (signal.aborted) return onAbort();
      signal.addEventListener('abort', onAbort, { once: true });
    }
  });
}

export const echoProvider: Provider = {
  id: 'echo',
  name: 'Echo (demo)',
  meta: { browserSafe: true, supportsStreaming: true },
  async *sendMessageStream(args: SendMessageArgs) {
    const last = args.messages[args.messages.length - 1];
    const base = last?.content || '';
    const pre = `Echoing (${args.model}): `;
    const chunks = (pre + base).split(/(\s+)/);

    for (const ch of chunks) {
      if (args.signal?.aborted) throw new DOMException('Aborted', 'AbortError');
      await sleep(30 + Math.random() * 90, args.signal);
      yield ch;
    }
    yield '\n\n— end —';
  },
};

