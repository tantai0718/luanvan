const colorMap = {
  green: 'bg-primary-fixed text-on-primary-fixed-variant',
  blue: 'bg-sky-50 text-sky-700',
  orange: 'bg-orange-50 text-orange-700',
  red: 'bg-red-50 text-red-700',
  yellow: 'bg-amber-50 text-amber-700',
  purple: 'bg-violet-50 text-violet-700',
  gray: 'bg-surface-container-high text-on-surface-variant',
};

export function PageHero({ eyebrow, title, body, actions }) {
  return (
    <div className="bg-surface rounded-3xl p-lg md:p-xl border border-outline-variant organic-shadow">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          {eyebrow && <p className="text-label-sm font-label-sm uppercase tracking-[0.18em] text-primary">{eyebrow}</p>}
          <h2 className="mt-2 text-headline-lg font-headline-lg text-on-surface md:text-display-lg">{title}</h2>
          {body && <p className="mt-3 max-w-3xl text-body-md font-body-md text-on-surface-variant leading-relaxed">{body}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
      </div>
    </div>
  );
}

export function StatCard({ icon, label, value, sub, color = 'green' }) {
  return (
    <div className="bg-surface rounded-3xl p-lg border border-outline-variant organic-shadow">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-label-sm font-label-sm uppercase tracking-[0.16em] text-on-surface-variant">{label}</p>
          <p className="mt-3 text-display-lg font-display-lg text-on-surface">{value}</p>
          {sub && <p className="mt-2 text-label-sm text-on-surface-variant">{sub}</p>}
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl text-xl ${colorMap[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export function SectionCard({ title, action, children }) {
  return (
    <div className="bg-surface rounded-3xl border border-outline-variant organic-shadow overflow-hidden">
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 border-b border-outline-variant px-lg py-4">
          <h3 className="text-title-md font-title-md text-on-surface">{title}</h3>
          {action}
        </div>
      )}
      <div className="p-lg">{children}</div>
    </div>
  );
}

export function Badge({ text, color = 'gray' }) {
  return <span className={`rounded-full px-3 py-1 text-label-xs font-label-xs ${colorMap[color]}`}>{text}</span>;
}

export function Table({ headers, children, empty }) {
  const hasRows = Array.isArray(children) ? children.length > 0 : Boolean(children);

  return (
    <div className="bg-surface rounded-3xl border border-outline-variant organic-shadow overflow-hidden">
      {hasRows ? (
        <div className="overflow-x-auto">
          <table className="min-w-full text-body-md font-body-md">
            <thead className="border-b border-outline-variant bg-surface-container-low">
              <tr>
                {headers.map(header => (
                  <th key={header} className="px-4 py-3 text-left text-label-sm font-label-sm uppercase tracking-[0.16em] text-on-surface-variant">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/50">{children}</tbody>
          </table>
        </div>
      ) : (
        <div className="py-16 text-center text-on-surface-variant">
          <div className="mb-3 text-4xl">{empty?.icon || '·'}</div>
          <p className="font-body-md text-body-md">{empty?.text || 'Chưa có dữ liệu'}</p>
        </div>
      )}
    </div>
  );
}

export function Modal({ title, onClose, children, size = 'md' }) {
  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-3xl', xl: 'max-w-5xl' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
      <div className={`max-h-[90vh] w-full overflow-y-auto rounded-[28px] bg-surface border border-outline-variant shadow-2xl ${sizes[size]}`}>
        <div className="flex items-center justify-between border-b border-outline-variant px-lg py-4">
          <h2 className="text-title-md font-title-md text-on-surface">{title}</h2>
          <button onClick={onClose} className="text-2xl leading-none text-on-surface-variant hover:text-on-surface">×</button>
        </div>
        <div className="p-lg">{children}</div>
      </div>
    </div>
  );
}

export function Input({ label, className = '', ...props }) {
  return (
    <div>
      {label && <label className="mb-2 block text-body-md font-body-md text-on-surface-variant">{label}</label>}
      <input className={`w-full rounded-2xl border border-outline-variant bg-surface px-4 py-3 text-body-md text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-fixed ${className}`} {...props} />
    </div>
  );
}

export function Select({ label, children, className = '', ...props }) {
  return (
    <div>
      {label && <label className="mb-2 block text-body-md font-body-md text-on-surface-variant">{label}</label>}
      <select className={`w-full rounded-2xl border border-outline-variant bg-surface px-4 py-3 text-body-md text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-fixed ${className}`} {...props}>{children}</select>
    </div>
  );
}

export function Btn({ children, variant = 'primary', size = 'md', className = '', ...props }) {
  const base = 'inline-flex items-center gap-2 rounded-2xl font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-60 active:scale-95';
  const variants = {
    primary: 'bg-primary text-on-primary hover:bg-on-primary-fixed-variant',
    danger: 'bg-error-container text-on-error-container hover:bg-error-container/80',
    orange: 'bg-secondary-container text-on-secondary-container hover:bg-secondary-fixed',
    outline: 'border border-outline-variant bg-surface text-on-surface hover:bg-surface-container-high',
    ghost: 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest',
  };
  const sizes = { sm: 'px-3 py-2 text-label-sm', md: 'px-4 py-2.5 text-body-md', lg: 'px-5 py-3 text-body-md' };

  return <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>{children}</button>;
}

export function Pagination({ page, total, limit, onChange }) {
  const pages = Math.ceil(total / limit);
  if (pages <= 1) return null;

  const visible = Array.from({ length: pages }, (_, i) => i + 1).slice(Math.max(0, page - 3), Math.max(0, page - 3) + 5);

  return (
    <div className="mt-5 flex justify-center gap-2">
      <button onClick={() => onChange(page - 1)} disabled={page === 1} className="h-10 w-10 rounded-2xl border border-outline-variant bg-surface text-on-surface-variant hover:bg-surface-container-high disabled:opacity-40">‹</button>
      {visible.map(item => (
        <button key={item} onClick={() => onChange(item)} className={`h-10 min-w-[40px] rounded-2xl px-3 text-body-md font-semibold ${
          item === page ? 'bg-primary text-on-primary' : 'border border-outline-variant bg-surface text-on-surface hover:bg-surface-container-high'
        }`}>{item}</button>
      ))}
      <button onClick={() => onChange(page + 1)} disabled={page === pages} className="h-10 w-10 rounded-2xl border border-outline-variant bg-surface text-on-surface-variant hover:bg-surface-container-high disabled:opacity-40">›</button>
    </div>
  );
}

export function SearchBar({ value, onChange, placeholder = 'Tìm kiếm...' }) {
  return (
    <div className="relative">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-body-md text-on-surface-variant material-symbols-outlined">search</span>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full rounded-2xl border border-outline-variant bg-surface py-3 pl-10 pr-4 text-body-md text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-fixed md:w-80" />
    </div>
  );
}

export function Loading() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}
