export function StatCard({ icon, label, value, sub, color = 'green' }) {
  const colors = {
    green: 'border-green-100 bg-green-50 text-green-600',
    blue: 'border-blue-100 bg-blue-50 text-blue-600',
    orange: 'border-orange-100 bg-orange-50 text-orange-600',
    red: 'border-red-100 bg-red-50 text-red-600',
    purple: 'border-purple-100 bg-purple-50 text-purple-600',
    gray: 'border-gray-100 bg-gray-50 text-gray-600',
  };

  return (
    <div className={`flex items-center gap-4 rounded-2xl border bg-white p-5 shadow-sm ${colors[color]}`}>
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl ${colors[color]}`}>{icon}</div>
      <div>
        <p className="text-xs font-medium text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
        {sub && <p className="mt-0.5 text-xs text-gray-400">{sub}</p>}
      </div>
    </div>
  );
}

export function Badge({ text, color = 'gray' }) {
  const colors = {
    green: 'bg-green-100 text-green-700',
    blue: 'bg-blue-100 text-blue-700',
    orange: 'bg-orange-100 text-orange-700',
    red: 'bg-red-100 text-red-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    purple: 'bg-purple-100 text-purple-700',
    gray: 'bg-gray-100 text-gray-600',
  };

  return <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${colors[color]}`}>{text}</span>;
}

export function Table({ headers, children, empty }) {
  const hasRows = Array.isArray(children) ? children.length > 0 : Boolean(children);

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      {hasRows ? (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                {headers.map(header => (
                  <th key={header} className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">{children}</tbody>
          </table>
        </div>
      ) : (
        <div className="py-14 text-center text-gray-400">
          <div className="mb-2 text-4xl">{empty?.icon || '📄'}</div>
          <p className="font-medium">{empty?.text || 'Chưa có dữ liệu'}</p>
        </div>
      )}
    </div>
  );
}

export function Modal({ title, onClose, children, size = 'md' }) {
  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className={`max-h-[90vh] w-full overflow-y-auto rounded-2xl bg-white shadow-2xl ${sizes[size]}`}>
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-base font-bold text-gray-800">{title}</h2>
          <button onClick={onClose} className="text-2xl leading-none text-gray-400 transition-colors hover:text-gray-600">
            ×
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export function Input({ label, ...props }) {
  return (
    <div>
      {label && <label className="mb-1.5 block text-sm font-medium text-gray-700">{label}</label>}
      <input
        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm transition-all focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100"
        {...props}
      />
    </div>
  );
}

export function Select({ label, children, ...props }) {
  return (
    <div>
      {label && <label className="mb-1.5 block text-sm font-medium text-gray-700">{label}</label>}
      <select
        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-green-500 focus:outline-none"
        {...props}
      >
        {children}
      </select>
    </div>
  );
}

export function Btn({ children, variant = 'primary', size = 'md', className = '', ...props }) {
  const base = 'flex items-center gap-1.5 rounded-xl font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60';
  const variants = {
    primary: 'bg-green-600 text-white shadow-sm hover:bg-green-700',
    danger: 'bg-red-600 text-white shadow-sm hover:bg-red-700',
    orange: 'bg-orange-500 text-white shadow-sm hover:bg-orange-600',
    outline: 'border border-gray-200 text-gray-700 hover:bg-gray-50',
    ghost: 'text-gray-600 hover:bg-gray-100',
  };
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-sm',
  };

  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function Pagination({ page, total, limit, onChange }) {
  const pages = Math.ceil(total / limit);
  if (pages <= 1) return null;

  const start = Math.max(1, page - 2);
  const end = Math.min(pages, start + 4);
  const visiblePages = Array.from({ length: end - start + 1 }, (_, index) => start + index);

  return (
    <div className="mt-5 flex justify-center gap-1.5">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        className="h-8 w-8 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40"
      >
        ‹
      </button>
      {visiblePages.map(current => (
        <button
          key={current}
          onClick={() => onChange(current)}
          className={`h-8 w-8 rounded-lg text-sm font-medium transition-colors ${
            page === current ? 'bg-green-600 text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          {current}
        </button>
      ))}
      <button
        onClick={() => onChange(page + 1)}
        disabled={page === pages}
        className="h-8 w-8 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40"
      >
        ›
      </button>
    </div>
  );
}

export function SearchBar({ value, onChange, placeholder = 'Tìm kiếm...' }) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">🔍</span>
      <input
        value={value}
        onChange={event => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-64 rounded-xl border border-gray-200 py-2 pl-9 pr-4 text-sm focus:border-green-500 focus:outline-none"
      />
    </div>
  );
}

export function Loading() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-600 border-t-transparent" />
    </div>
  );
}
