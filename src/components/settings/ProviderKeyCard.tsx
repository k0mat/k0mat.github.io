import React from 'react';
import { useSecretsStore } from '../../store/secretsStore';
import { validateOpenRouterKey } from '../../providers/validate';
import { toast } from 'sonner';

export default function ProviderKeyCard({
  providerId,
  title,
  placeholder,
  help,
}: {
  providerId: string;
  title: string;
  placeholder: string;
  help?: string;
}) {
  const { getKey, setKey, clearKey } = useSecretsStore();
  const secrets = useSecretsStore(s => s.secrets);
  const [value, setValue] = React.useState<string>(getKey(providerId) ?? '');
  const [validating, setValidating] = React.useState(false);
  const [validationMsg, setValidationMsg] = React.useState<string | null>(null);
  const [validationOk, setValidationOk] = React.useState<boolean | null>(null);

  // Update input when relevant store slices change (including rehydration)
  React.useEffect(() => {
    setValue(getKey(providerId) ?? '');
    setValidationMsg(null);
    setValidationOk(null);
  }, [providerId, getKey, secrets]);

  // Also respond explicitly to persist hydration finish (for safety)
  React.useEffect(() => {
    const persistApi: any = (useSecretsStore as any).persist;
    const onFinish = persistApi?.onFinishHydration?.(() => {
      setValue(getKey(providerId) ?? '');
    });
    if (persistApi?.hasHydrated?.()) {
      setValue(getKey(providerId) ?? '');
    }
    return () => { if (typeof onFinish === 'function') onFinish(); };
  }, [providerId, getKey]);

  const saved = Boolean(getKey(providerId));
  const status = saved ? 'Saved' : 'Not saved';

  async function onValidate() {
    setValidationMsg(null);
    setValidationOk(null);
    if (!value.trim()) { setValidationOk(false); setValidationMsg('Enter a key to validate.'); toast.error('Enter a key to validate'); return; }
    setValidating(true);
    try {
      if (providerId === 'openrouter') {
        const res = await validateOpenRouterKey(value.trim());
        setValidationOk(res.ok);
        setValidationMsg(res.message);
        res.ok ? toast.success('OpenRouter key is valid') : toast.error(res.message);
      } else {
        setValidationOk(false);
        const msg = 'Validation not available for this provider in the browser.';
        setValidationMsg(msg);
        toast(msg);
      }
    } catch (e) {
      const msg = (e as Error).message || 'Validation failed';
      setValidationOk(false);
      setValidationMsg(msg);
      toast.error(msg);
    } finally {
      setValidating(false);
    }
  }

  function onSave() {
    setKey(providerId, value.trim() || null);
    toast.success('Saved API key');
  }
  function onClear() {
    setValue('');
    clearKey(providerId);
    setValidationMsg(null);
    setValidationOk(null);
    toast('Cleared API key');
  }

  return (
    <div className="card space-y-2">
      <div className="flex items-center justify-between">
        <div className="font-medium">{title}</div>
        <div className="flex items-center gap-2">
          <div className="badge">{status}</div>
          {validationMsg && (
            <div className={`badge ${validationOk ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200' : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200'}`}>{validationMsg}</div>
          )}
        </div>
      </div>
      <input
        type="password"
        className="input w-full"
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <div className="flex gap-2">
        <button className="btn btn-primary" onClick={onSave}>Save</button>
        <button className="btn btn-outline" onClick={onClear}>Clear</button>
        <button className="btn btn-outline" onClick={onValidate} disabled={validating} title="Validate API key">
          {validating ? 'Validating…' : 'Validate'}
        </button>
      </div>
      {help && <div className="text-xs text-zinc-500">{help}</div>}
    </div>
  );
}
