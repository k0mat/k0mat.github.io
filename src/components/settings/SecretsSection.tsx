import React from 'react';
import ProviderKeyCard from './ProviderKeyCard';
import { useSecretsStore } from '../../store/secretsStore';
import { toast } from 'sonner';

export default function SecretsSection() {
  const {
    encryptedBlob,
    isUnlocked,
    hasEncryptedData,
    encryptAll,
    unlock,
    changePassphrase,
    lock,
    clearAll,
  } = useSecretsStore();

  const [newPass, setNewPass] = React.useState('');
  const [confirmPass, setConfirmPass] = React.useState('');
  const [unlockPass, setUnlockPass] = React.useState('');
  const [changeOld, setChangeOld] = React.useState('');
  const [changeNew, setChangeNew] = React.useState('');
  const [changeConfirm, setChangeConfirm] = React.useState('');
  const [err, setErr] = React.useState<string | null>(null);
  const [msg, setMsg] = React.useState<string | null>(null);

  async function handleEnableEncrypt() {
    setErr(null); setMsg(null);
    if (!newPass || newPass !== confirmPass) { setErr('Passphrase and confirmation must match.'); return; }
    try {
      await encryptAll(newPass);
      setMsg('Secrets encrypted.');
      toast.success('Secrets encrypted');
      setNewPass(''); setConfirmPass('');
    } catch (e) {
      const m = (e as Error).message;
      setErr(m); toast.error(m);
    }
  }

  async function handleUnlock() {
    setErr(null); setMsg(null);
    try {
      await unlock(unlockPass);
      setMsg('Unlocked for this session.');
      toast.success('Unlocked for this session');
      setUnlockPass('');
    } catch (e) { const m = (e as Error).message; setErr(m); toast.error(m); }
  }

  async function handleChangePass() {
    setErr(null); setMsg(null);
    if (!changeNew || changeNew !== changeConfirm) { setErr('New passphrase and confirmation must match.'); return; }
    const ok = window.confirm('Change passphrase and re-encrypt secrets now?');
    if (!ok) return;
    try {
      await changePassphrase(changeOld, changeNew);
      setMsg('Passphrase changed.');
      toast.success('Passphrase changed');
      setChangeOld(''); setChangeNew(''); setChangeConfirm('');
    } catch (e) { const m = (e as Error).message; setErr(m); toast.error(m); }
  }

  function handleLock() {
    lock();
    setMsg('Locked.');
    toast('Locked');
  }

  function handleClearAll() {
    const ok = window.confirm('Clear all saved secrets and encryption data? This cannot be undone.');
    if (!ok) return;
    clearAll();
    setMsg('Cleared all secrets.');
    toast('Cleared all secrets');
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-zinc-600 dark:text-zinc-300">Keys are stored locally. You can optionally encrypt them at rest with a passphrase.</div>

      <ProviderKeyCard
        providerId="openrouter"
        title="OpenRouter"
        placeholder="sk-or-v1-..."
        help="OpenRouter lets you access many models with one key."
      />

      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <div className="font-medium">Passphrase & Encryption</div>
          <div className="flex gap-2">
            <span className="badge">{hasEncryptedData ? 'Encrypted' : 'Not encrypted'}</span>
            <span className="badge">{isUnlocked ? 'Unlocked' : 'Locked'}</span>
          </div>
        </div>

        {!hasEncryptedData && (
          <div className="space-y-2">
            <div className="text-xs text-zinc-500">Enable encryption at rest with a passphrase.</div>
            <div className="grid gap-2 md:grid-cols-2">
              <input type="password" className="input" placeholder="New passphrase" value={newPass} onChange={e=>setNewPass(e.target.value)} />
              <input type="password" className="input" placeholder="Confirm passphrase" value={confirmPass} onChange={e=>setConfirmPass(e.target.value)} />
            </div>
            <button className="btn btn-primary" onClick={handleEnableEncrypt}>Encrypt now</button>
          </div>
        )}

        {hasEncryptedData && !isUnlocked && (
          <div className="space-y-2">
            <div className="text-xs text-zinc-500">Unlock secrets for this session.</div>
            <div className="grid gap-2 md:grid-cols-2">
              <input type="password" className="input" placeholder="Passphrase" value={unlockPass} onChange={e=>setUnlockPass(e.target.value)} />
            </div>
            <button className="btn btn-primary" onClick={handleUnlock}>Unlock</button>
          </div>
        )}

        {hasEncryptedData && isUnlocked && (
          <div className="space-y-3">
            <div className="grid gap-2 md:grid-cols-3">
              <input type="password" className="input" placeholder="Current passphrase" value={changeOld} onChange={e=>setChangeOld(e.target.value)} />
              <input type="password" className="input" placeholder="New passphrase" value={changeNew} onChange={e=>setChangeNew(e.target.value)} />
              <input type="password" className="input" placeholder="Confirm new" value={changeConfirm} onChange={e=>setChangeConfirm(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <button className="btn btn-warning" onClick={handleLock}>Lock</button>
              <button className="btn btn-primary" onClick={handleChangePass}>Change passphrase</button>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <button className="btn btn-outline text-red-600 border-red-500 hover:bg-red-50 dark:hover:bg-zinc-800" onClick={handleClearAll}>Clear all</button>
        </div>

        {err && <div className="text-xs text-red-600">{err}</div>}
        {msg && <div className="text-xs text-emerald-600">{msg}</div>}
      </div>
    </div>
  );
}
