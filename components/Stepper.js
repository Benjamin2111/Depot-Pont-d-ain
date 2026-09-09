'use client';
export default function Stepper({ value, onChange, min = 1, max }) {
  function set(v) {
    let n = v;
    if (isNaN(n)) n = min;
    if (n < min) n = min;
    if (typeof max === 'number' && n > max) n = max;
    onChange(n);
  }
  return (
    <div className="qty-stepper">
      <button type="button" onClick={() => set(value - 1)}>−</button>
      <input
        type="number"
        inputMode="numeric"
        value={value}
        onChange={(e) => set(parseInt(e.target.value, 10))}
      />
      <button type="button" onClick={() => set(value + 1)}>+</button>
    </div>
  );
}
