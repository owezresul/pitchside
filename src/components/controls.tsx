import { useState, type ReactNode } from 'react';

/** Number box you can type into. Commits while typing if the value is valid, and snaps back on blur. */
export function NumberField(props: {
  value: number; min: number; max: number; step?: number; label: string;
  onCommit: (n: number) => void; className?: string; id?: string; showZero?: boolean;
}) {
  const show = (v: number) => (v || props.showZero ? String(v) : '');
  const [text, setText] = useState(show(props.value));
  const [prev, setPrev] = useState(props.value);
  // Follow outside changes (the +/- buttons, normalisation) without an effect.
  if (prev !== props.value) { setPrev(props.value); setText(show(props.value)); }
  const commit = (raw: string) => {
    const n = Number(raw);
    if (raw.trim() !== '' && Number.isFinite(n) && n >= props.min && n <= props.max) props.onCommit(n);
  };
  return (
    <input id={props.id} className={props.className ?? 'input'} type="number" inputMode="decimal"
      min={props.min} max={props.max} step={props.step ?? 1} value={text} aria-label={props.label}
      onChange={(e) => { setText(e.target.value); commit(e.target.value); }}
      onBlur={() => setText(show(props.value))}
      onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()} />
  );
}

/** − [value] +  The value can also be typed. */
export function Stepper(props: {
  value: number; min: number; max: number; step?: number; label: string; onChange: (n: number) => void; showZero?: boolean;
}) {
  const step = props.step ?? 1;
  const clamp = (n: number) => Math.min(props.max, Math.max(props.min, n));
  return (
    <div className="stepper" role="group" aria-label={props.label}>
      <button type="button" className="stepper__btn" aria-label={`Decrease ${props.label}`}
        disabled={props.value <= props.min} onClick={() => props.onChange(clamp(props.value - step))}>−</button>
      <NumberField className="stepper__val" label={props.label} value={props.value} min={props.min} max={props.max}
        step={step} showZero={props.showZero} onCommit={props.onChange} />
      <button type="button" className="stepper__btn" aria-label={`Increase ${props.label}`}
        disabled={props.value >= props.max} onClick={() => props.onChange(clamp(props.value + step))}>+</button>
    </div>
  );
}

export function Switch(props: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={props.checked} aria-label={props.label}
      className="switch" onClick={() => props.onChange(!props.checked)} />
  );
}

export function Select<T extends string>(props: {
  value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; label: string;
}) {
  return (
    <select className="select" aria-label={props.label} value={props.value} onChange={(e) => props.onChange(e.target.value as T)}>
      {props.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

/** One row of settings: label (and optional help) on the left, a control on the right. */
export function Setting(props: { label: string; help?: string; children: ReactNode }) {
  return (
    <div className="setting">
      <span className="setting__label">
        {props.label}
        {props.help && <span className="setting__help">{props.help}</span>}
      </span>
      {props.children}
    </div>
  );
}
