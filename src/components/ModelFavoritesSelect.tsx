import React from 'react';
import type { Provider } from '../providers/adapters';
import { useModelsStore } from '../store/modelsStore';

export default function ModelFavoritesSelect({ providerId, onSelect }: { providerId: Provider['id']; onSelect: (model: string) => void; }) {
  const { byProvider } = useModelsStore();
  const favs = byProvider[providerId]?.favorites ?? [];
  const [value, setValue] = React.useState<string>('');

  React.useEffect(() => { setValue(''); }, [providerId]);

  if (!favs.length) return null;

  return (
    <select
      className="select"
      value={value}
      onChange={(e) => {
        const v = e.target.value;
        setValue('');
        if (v) onSelect(v);
      }}
      title="Pick a favorite model"
      aria-label="Pick a favorite model"
    >
      <option value="" disabled>Favorites</option>
      {favs.map((m) => (
        <option key={m} value={m}>{m}</option>
      ))}
    </select>
  );
}

