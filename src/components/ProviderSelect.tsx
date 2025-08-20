import React, { Fragment } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { ChevronDown, Check } from 'lucide-react';

export type Option = { id: string; name: string };

export default function ProviderSelect({
  options,
  value,
  onChange,
  className,
}: {
  options: Option[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
}) {
  const selected = options.find(o => o.id === value) ?? options[0];
  return (
    <Listbox value={selected} onChange={(opt: Option) => onChange(opt.id)}>
      {({ open }) => (
        <div className={className}>
          <div className="relative">
            <Listbox.Button className="input w-48 flex items-center justify-between pr-8">
              <span className="truncate">{selected?.name ?? 'Select'}</span>
              <ChevronDown className="h-4 w-4 opacity-70 absolute right-2" />
            </Listbox.Button>
            <Transition
              as={Fragment}
              show={open}
              enter="transition ease-out duration-100"
              enterFrom="opacity-0 translate-y-1"
              enterTo="opacity-100 translate-y-0"
              leave="transition ease-in duration-75"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-[var(--border)] bg-[var(--surface)] py-1 text-sm shadow-lg focus:outline-none">
                {options.map((opt) => (
                  <Listbox.Option
                    key={opt.id}
                    value={opt}
                    className={({ active, selected }) => `relative cursor-pointer select-none py-1.5 pl-8 pr-2 ${active ? 'bg-zinc-100 dark:bg-zinc-800' : ''} ${selected ? 'font-medium' : 'font-normal'}`}
                  >
                    {({ selected }) => (
                      <>
                        <span className="block truncate">{opt.name}</span>
                        {selected ? (
                          <span className="absolute inset-y-0 left-2 flex items-center text-blue-600 dark:text-blue-400">
                            <Check className="h-4 w-4" />
                          </span>
                        ) : null}
                      </>
                    )}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </Transition>
          </div>
        </div>
      )}
    </Listbox>
  );
}

