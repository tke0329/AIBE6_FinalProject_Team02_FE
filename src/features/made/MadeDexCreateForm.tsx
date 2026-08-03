import React, { useState } from 'react';
import { GlobeIcon, LockIcon } from 'lucide-react';
import { MADE_DEX_NAME_MAX } from './api';
import { MadeDexVisibility } from './types';

interface Props {
  onCreate: (name: string, visibility: MadeDexVisibility) => Promise<void>;
  onCancel: () => void;
}

const VISIBILITY_OPTIONS: Array<{
  value: MadeDexVisibility;
  label: string;
  Icon: typeof LockIcon;
}> = [
  { value: 'PRIVATE', label: '비공개', Icon: LockIcon },
  { value: 'PUBLIC', label: '공개', Icon: GlobeIcon },
];

export function MadeDexCreateForm({ onCreate, onCancel }: Props) {
  const [name, setName] = useState('');
  const [visibility, setVisibility] = useState<MadeDexVisibility>('PRIVATE');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await onCreate(name.trim(), visibility);
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : '도감을 만들지 못했어요. 잠시 후 다시 시도해 주세요.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-5 rounded-2xl border-2 border-orange-400 bg-surface-card p-4 shadow-card">
      <p className="font-display text-lg text-content-primary">
        새 도감 만들기
      </p>
      <input
        aria-label="새 도감 이름"
        placeholder="도감 이름을 입력하세요"
        value={name}
        maxLength={MADE_DEX_NAME_MAX}
        onChange={(event) => setName(event.target.value)}
        className="mt-3 w-full rounded-xl border border-edge-default px-3 py-3 text-sm outline-none focus:border-edge-active"
      />

      <fieldset className="mt-3">
        <legend className="text-xs text-content-secondary">
          공개 설정은 나중에도 바꿀 수 있어요
        </legend>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {VISIBILITY_OPTIONS.map(({ value, label, Icon }) => (
            <button
              key={value}
              type="button"
              aria-pressed={visibility === value}
              onClick={() => setVisibility(value)}
              className={`flex min-h-touch items-center justify-center gap-1 rounded-xl border text-sm font-medium ${
                visibility === value
                  ? 'border-edge-active bg-surface-accent text-content-link'
                  : 'border-edge-default text-content-secondary'
              }`}
            >
              <Icon size={15} aria-hidden />
              {label}
            </button>
          ))}
        </div>
      </fieldset>

      {error && <p className="mt-2 text-sm text-feedback-error">{error}</p>}

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="min-h-touch flex-1 rounded-xl border border-edge-default text-sm font-medium text-content-secondary"
        >
          취소
        </button>
        <button
          type="button"
          disabled={!name.trim() || submitting}
          onClick={submit}
          className="min-h-touch flex-1 rounded-xl bg-action-primary text-sm font-bold text-content-on-action disabled:bg-action-disabled-bg disabled:text-action-disabled-text"
        >
          {submitting ? '만드는 중…' : '만들기'}
        </button>
      </div>
    </div>
  );
}
