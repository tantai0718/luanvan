import { Search, X, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

const colorMap = {
  green: 'bg-emerald-50 text-emerald-700',
  blue: 'bg-sky-50 text-sky-700',
  orange: 'bg-amber-50 text-amber-700',
  red: 'bg-red-50 text-red-700',
  yellow: 'bg-yellow-50 text-yellow-700',
  purple: 'bg-violet-50 text-violet-700',
  gray: 'bg-gray-100 text-gray-600',
};

export function PageHero({ eyebrow, title, body, actions }) {
  return (
    <div className="bg-card rounded-card p-5 md:p-8 shadow-card border border-border">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          {eyebrow && <p className="text-caption font-medium uppercase tracking-wider text-primary">{eyebrow}</p>}
          <h2 className="mt-2 text-h2 text-text-primary">{title}</h2>
          {body && <p className="mt-3 max-w-3xl text-body text-text-secondary leading-relaxed">{body}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
      </div>
    </div>
  );
}

export function StatCard({ icon, label, value, sub, color = 'green' }) {
  return (
    <div className="bg-card rounded-card p-5 shadow-card border border-border transition-all duration-200 hover:shadow-card-hover">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-caption font-medium uppercase tracking-wider text-text-secondary">{label}</p>
          <p className="mt-3 text-h1 text-text-primary">{value}</p>
          {sub && <p className="mt-2 text-caption text-text-secondary">{sub}</p>}
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-card text-xl ${colorMap[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export function SectionCard({ title, action, children }) {
  return (
    <div className="bg-card rounded-card shadow-card border border-border overflow-hidden">
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
          <h3 className="text-h3 text-text-primary">{title}</h3>
          {action}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}

export function Badge({ text, color = 'gray' }) {
  return <span className={`inline-block rounded-full px-3 py-1 text-caption font-medium ${colorMap[color]}`}>{text}</span>;
}

export function Table({ headers, children, empty }) {
  const hasRows = Array.isArray(children) ? children.length > 0 : Boolean(children);

  return (
    <div className="bg-card rounded-card shadow-card border border-border overflow-hidden">
      {hasRows ? (
        <div className="overflow-x-auto">
          <table className="min-w-full text-body">
            <thead className="table-header">
              <tr>
                {headers.map(header => (
                  <th key={header} className="px-4 py-3 text-left text-caption font-semibold uppercase tracking-wider">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">{children}</tbody>
          </table>
        </div>
      ) : (
        <div className="py-16 text-center text-text-secondary">
          <p className="text-body">{empty?.text || 'Chưa có dữ liệu'}</p>
        </div>
      )}
    </div>
  );
}

export function Modal({ title, onClose, children, size = 'md' }) {
  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-3xl', xl: 'max-w-5xl' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className={`max-h-[90vh] w-full overflow-y-auto rounded-card bg-card border border-border shadow-xl ${sizes[size]}`}>
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-h3 text-text-primary">{title}</h2>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-btn text-text-secondary hover:bg-background hover:text-text-primary transition-all">
            <X size={20} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function Input({ label, className = '', ...props }) {
  return (
    <div>
      {label && <label className="label-base">{label}</label>}
      <input className={`input-field ${className}`} {...props} />
    </div>
  );
}

export function Select({ label, children, className = '', ...props }) {
  return (
    <div>
      {label && <label className="label-base">{label}</label>}
      <select className={`select-field ${className}`} {...props}>{children}</select>
    </div>
  );
}

export function Btn({ children, variant = 'primary', size = 'md', className = '', ...props }) {
  const base = 'inline-flex items-center gap-2 rounded-btn font-medium transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-primary text-white hover:bg-primary-dark shadow-sm hover:shadow-md',
    danger: 'bg-danger text-white hover:bg-red-600 shadow-sm hover:shadow-md',
    orange: 'bg-amber-500 text-white hover:bg-amber-600 shadow-sm hover:shadow-md',
    outline: 'border border-border bg-card text-text-primary hover:bg-background hover:shadow-sm',
    ghost: 'bg-background text-text-primary hover:bg-border/30',
  };
  const sizes = { sm: 'px-3 py-2 text-caption', md: 'px-5 py-3 text-body', lg: 'px-6 py-3.5 text-body' };

  return <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>{children}</button>;
}

export function Pagination({ page, total, limit, onChange }) {
  const pages = Math.ceil(total / limit);
  if (pages <= 1) return null;

  const visible = Array.from({ length: pages }, (_, i) => i + 1).slice(Math.max(0, page - 3), Math.max(0, page - 3) + 5);

  return (
    <div className="mt-5 flex justify-center gap-2">
      <button onClick={() => onChange(page - 1)} disabled={page === 1} className="h-10 w-10 rounded-btn border border-border bg-card text-text-secondary hover:bg-background disabled:opacity-40 flex items-center justify-center transition-all">
        <ChevronLeft size={18} />
      </button>
      {visible.map(item => (
        <button key={item} onClick={() => onChange(item)} className={`h-10 min-w-[40px] rounded-btn px-3 text-body font-semibold transition-all ${
          item === page ? 'bg-primary text-white' : 'border border-border bg-card text-text-primary hover:bg-background'
        }`}>{item}</button>
      ))}
      <button onClick={() => onChange(page + 1)} disabled={page === pages} className="h-10 w-10 rounded-btn border border-border bg-card text-text-secondary hover:bg-background disabled:opacity-40 flex items-center justify-center transition-all">
        <ChevronRight size={18} />
      </button>
    </div>
  );
}

export function SearchBar({ value, onChange, placeholder = 'Tìm kiếm...' }) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="input-field pl-10 md:w-80" />
    </div>
  );
}

export function Loading() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
