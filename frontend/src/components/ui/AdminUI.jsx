export function PageHero({ eyebrow, title, body, actions }) {
  return (
    <div className="market-panel p-6 md:p-7">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          {eyebrow ? (
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#2d9e63]">{eyebrow}</p>
          ) : null}
          <h2 className="mt-2 text-3xl font-bold text-slate-900 md:text-4xl">{title}</h2>
          {body ? <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">{body}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
      </div>
    </div>
  );
}

export function StatCard({ icon, label, value, sub, color = 'green' }) {
  const toneMap = {
    green: 'bg-[#e8f5ee] text-[#1a7a4a]',
    blue: 'bg-sky-50 text-sky-700',
    orange: 'bg-orange-50 text-orange-700',
    red: 'bg-red-50 text-red-700',
    purple: 'bg-violet-50 text-violet-700',
    gray: 'bg-slate-100 text-slate-700',
  };

  return (
    <div className="market-panel p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-bold text-slate-900">{value}</p>
          {sub ? <p className="mt-2 text-xs text-slate-500">{sub}</p> : null}
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl text-xl ${toneMap[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export function SectionCard({ title, action, children }) {
  return (
    <div className="market-panel overflow-hidden">
      {(title || action) ? (
        <div className="flex items-center justify-between gap-3 border-b border-[#dce7df] px-5 py-4">
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          {action}
        </div>
      ) : null}
      <div className="p-5">{children}</div>
    </div>
  );
}

export function Badge({ text, color = 'gray' }) {
  const toneMap = {
    green: 'bg-[#e8f5ee] text-[#1a7a4a]',
    blue: 'bg-sky-50 text-sky-700',
    orange: 'bg-orange-50 text-orange-700',
    red: 'bg-red-50 text-red-700',
    yellow: 'bg-amber-50 text-amber-700',
    purple: 'bg-violet-50 text-violet-700',
    gray: 'bg-slate-100 text-slate-700',
  };

  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${toneMap[color]}`}>{text}</span>;
}

export function Table({ headers, children, empty }) {
  const hasRows = Array.isArray(children) ? children.length > 0 : Boolean(children);

  return (
    <div className="market-panel overflow-hidden">
      {hasRows ? (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-[#dce7df] bg-[#f3f7f4]">
              <tr>
                {headers.map(header => (
                  <th
                    key={header}
                    className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.16em] text-slate-500"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#edf2ee]">{children}</tbody>
          </table>
        </div>
      ) : (
        <div className="py-16 text-center text-slate-400">
          <div className="mb-3 text-4xl">{empty?.icon || '·'}</div>
          <p className="font-medium">{empty?.text || 'Chưa có dữ liệu'}</p>
        </div>
      )}
    </div>
  );
}

export function Modal({ title, onClose, children, size = 'md' }) {
  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-3xl', xl: 'max-w-5xl' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
      <div className={`max-h-[90vh] w-full overflow-y-auto rounded-[28px] bg-white shadow-2xl ${sizes[size]}`}>
        <div className="flex items-center justify-between border-b border-[#dce7df] px-6 py-4">
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <button onClick={onClose} className="text-2xl leading-none text-slate-400 hover:text-slate-600">
            ×
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export function Input({ label, className = '', ...props }) {
  return (
    <div>
      {label ? <label className="mb-2 block text-sm font-medium text-slate-700">{label}</label> : null}
      <input
        className={`w-full rounded-2xl border border-[#dce7df] bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#2d9e63] focus:outline-none focus:ring-2 focus:ring-[#e8f5ee] ${className}`}
        {...props}
      />
    </div>
  );
}

export function Select({ label, children, className = '', ...props }) {
  return (
    <div>
      {label ? <label className="mb-2 block text-sm font-medium text-slate-700">{label}</label> : null}
      <select
        className={`w-full rounded-2xl border border-[#dce7df] bg-white px-4 py-3 text-sm text-slate-800 focus:border-[#2d9e63] focus:outline-none focus:ring-2 focus:ring-[#e8f5ee] ${className}`}
        {...props}
      >
        {children}
      </select>
    </div>
  );
}

export function Btn({ children, variant = 'primary', size = 'md', className = '', ...props }) {
  const base = 'inline-flex items-center gap-2 rounded-2xl font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-60';
  const variants = {
    primary: 'bg-[#1a7a4a] text-white hover:bg-[#14633b]',
    danger: 'bg-red-50 text-red-600 hover:bg-red-100',
    orange: 'bg-[#e85d04] text-white hover:bg-[#cf5408]',
    outline: 'border border-[#dce7df] bg-white text-slate-700 hover:bg-[#f3f7f4]',
    ghost: 'bg-[#f3f7f4] text-slate-700 hover:bg-[#e8f5ee] hover:text-[#1a7a4a]',
  };
  const sizes = { sm: 'px-3 py-2 text-xs', md: 'px-4 py-2.5 text-sm', lg: 'px-5 py-3 text-sm' };

  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function Pagination({ page, total, limit, onChange }) {
  const pages = Math.ceil(total / limit);
  if (pages <= 1) return null;

  const visible = Array.from({ length: pages }, (_, index) => index + 1).slice(
    Math.max(0, page - 3),
    Math.max(0, page - 3) + 5
  );

  return (
    <div className="mt-5 flex justify-center gap-2">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        className="h-10 w-10 rounded-2xl border border-[#dce7df] bg-white text-slate-500 hover:bg-[#f3f7f4] disabled:opacity-40"
      >
        ‹
      </button>
      {visible.map(item => (
        <button
          key={item}
          onClick={() => onChange(item)}
          className={`h-10 min-w-[40px] rounded-2xl px-3 text-sm font-semibold ${
            item === page ? 'bg-[#1a7a4a] text-white' : 'border border-[#dce7df] bg-white text-slate-700 hover:bg-[#f3f7f4]'
          }`}
        >
          {item}
        </button>
      ))}
      <button
        onClick={() => onChange(page + 1)}
        disabled={page === pages}
        className="h-10 w-10 rounded-2xl border border-[#dce7df] bg-white text-slate-500 hover:bg-[#f3f7f4] disabled:opacity-40"
      >
        ›
      </button>
    </div>
  );
}

export function SearchBar({ value, onChange, placeholder = 'Tìm kiếm...' }) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">🔎</span>
      <input
        value={value}
        onChange={event => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-[#dce7df] bg-white py-3 pl-9 pr-4 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#2d9e63] focus:outline-none focus:ring-2 focus:ring-[#e8f5ee] md:w-80"
      />
    </div>
  );
}

export function Loading() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#2d9e63] border-t-transparent" />
    </div>
  );
}
