import { useEffect, useMemo, useRef, useState } from 'react';

export default function FontSelect({ fonts, value, onChange }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const groups = useMemo(() => {
    const out = [];
    for (const f of fonts) {
      if (q && !f.name.toLowerCase().includes(q.toLowerCase())) continue;
      let g = out.find((x) => x[0] === f.group);
      if (!g) { g = [f.group, []]; out.push(g); }
      g[1].push(f);
    }
    return out;
  }, [fonts, q]);

  const fam = (n) => `'${n}', Arial, sans-serif`;

  return (
    <div className="fontsel" ref={ref}>
      <button type="button" className="fontsel-btn" onClick={() => setOpen(!open)}>
        <span style={{ fontFamily: fam(value) }}>{value}</span>
        <span className="chev">▾</span>
      </button>
      {open && (
        <div className="fontsel-pop">
          <input
            autoFocus
            type="text"
            placeholder="Search fonts..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <div className="fontsel-list">
            {groups.length === 0 && <div className="muted" style={{ padding: 8 }}>No fonts found</div>}
            {groups.map(([group, items]) => (
              <div key={group}>
                <div className="fontsel-group">{group}</div>
                {items.map((f) => (
                  <div
                    key={f.name}
                    className={'fontsel-item' + (f.name === value ? ' sel' : '')}
                    style={{ fontFamily: fam(f.name) }}
                    onClick={() => { onChange(f.name); setOpen(false); setQ(''); }}
                  >
                    {f.name}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}