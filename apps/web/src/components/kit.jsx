import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { estadoColor } from '@/lib/db';

export const inputCls =
    'w-full min-h-[44px] rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/60 focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50';

export const btn = {
    primary:
        'inline-flex min-h-[36px] items-center justify-center gap-2 rounded-md bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50',
    ghost:
        'inline-flex min-h-[36px] items-center justify-center gap-2 rounded-md border border-border bg-card px-3.5 py-2 text-sm font-medium text-foreground transition hover:bg-secondary active:scale-[0.98]',
    danger:
        'inline-flex min-h-[36px] items-center justify-center gap-2 rounded-md border border-critical/30 bg-critical/10 px-3.5 py-2 text-sm font-medium text-critical transition hover:bg-critical/15 active:scale-[0.98]',
    soft:
        'inline-flex min-h-[36px] items-center justify-center gap-2 rounded-md bg-muted px-3.5 py-2 text-sm font-semibold text-foreground transition hover:bg-accent active:scale-[0.98]',
};

export function Campo({ label, children, className = '' }) {
    return (
        <label className={`flex flex-col gap-1.5 ${className}`}>
            <span className="text-xs font-semibold text-muted-foreground">{label}</span>
            {children}
        </label>
    );
}

export function Texto({ label, value, onChange, type = 'text', className = '', ...rest }) {
    return (
        <Campo label={label} className={className}>
            <input
                type={type}
                className={inputCls}
                value={value ?? ''}
                onChange={(e) => onChange(e.target.value)}
                {...rest}
            />
        </Campo>
    );
}

export function AreaTexto({ label, value, onChange, rows = 3, className = '' }) {
    return (
        <Campo label={label} className={className}>
            <textarea
                rows={rows}
                className={inputCls}
                value={value ?? ''}
                onChange={(e) => onChange(e.target.value)}
            />
        </Campo>
    );
}

export function Selector({ label, value, onChange, options = [], placeholder = 'Seleccionar...', className = '' }) {
    return (
        <Campo label={label} className={className}>
            <select className={inputCls} value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
                <option value="">{placeholder}</option>
                {options.map((o) => {
                    const val = typeof o === 'string' ? o : o.value;
                    const lab = typeof o === 'string' ? o : o.label;
                    return (
                        <option key={val} value={val}>
                            {lab}
                        </option>
                    );
                })}
            </select>
        </Campo>
    );
}

export function Seccion({ title, actions, children, className = '' }) {
    return (
        <section className={`rounded-lg border border-border bg-card shadow-sm ${className}`}>
            {(title || actions) && (
                <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
                    <h3 className="font-display text-sm font-semibold text-foreground">{title}</h3>
                    <div className="flex flex-wrap items-center gap-2">{actions}</div>
                </header>
            )}
            <div className="p-4">{children}</div>
        </section>
    );
}

export function EstadoBadge({ estado }) {
    if (!estado) return <span className="text-muted-foreground">—</span>;
    return (
        <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${estadoColor(estado)}`}>
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
            {estado}
        </span>
    );
}

export function Modal({ open, title, onClose, children, wide = false }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-3 backdrop-blur-sm sm:p-6 lg:p-8">
            <div className={`w-full ${wide ? 'max-w-4xl' : 'max-w-xl'} rounded-lg border border-border bg-card shadow-xl`}>
                <header className="flex items-center justify-between border-b border-border px-4 py-3">
                    <h3 className="pr-2 font-display text-lg font-semibold text-foreground sm:text-xl">{title}</h3>
                    <button type="button" onClick={onClose} className="rounded p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground" aria-label="Cerrar">
                        <X className="h-5 w-5" />
                    </button>
                </header>
                <div className="max-h-[78vh] overflow-y-auto p-4 sm:p-5">{children}</div>
            </div>
        </div>
    );
}

export function Tabla({ columns, children, className = '' }) {
    return (
        <div className={`-mx-4 overflow-x-auto sm:mx-0 ${className}`}>
            <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                    <tr className="border-b border-border bg-secondary/60 text-xs text-muted-foreground">
                        {columns.map((c) => (
                            <th key={c} className="whitespace-nowrap px-3 py-2.5 font-semibold">
                                {c}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-border">{children}</tbody>
            </table>
        </div>
    );
}

export function Vacio({ mensaje = 'Sin registros' }) {
    return <p className="py-8 text-center text-sm text-muted-foreground">{mensaje}</p>;
}

export function Cargando() {
    return (
        <div className="space-y-2 py-4">
            {[0, 1, 2].map((i) => (
                <div key={i} className="h-8 animate-pulse rounded bg-secondary" />
            ))}
        </div>
    );
}

export function FirmaCanvas({ valor, onChange, label }) {
    const ref = useRef(null);
    const drawing = useRef(false);

    useEffect(() => {
        const canvas = ref.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (valor) {
            const img = new Image();
            img.onload = () => ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            img.src = valor;
        }
    }, [valor]);

    const pos = (e) => {
        const rect = ref.current.getBoundingClientRect();
        const t = e.touches ? e.touches[0] : e;
        return { x: t.clientX - rect.left, y: t.clientY - rect.top };
    };

    const start = (e) => {
        e.preventDefault();
        drawing.current = true;
        const ctx = ref.current.getContext('2d');
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#201f1e';
        const p = pos(e);
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
    };
    const move = (e) => {
        if (!drawing.current) return;
        e.preventDefault();
        const ctx = ref.current.getContext('2d');
        const p = pos(e);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
    };
    const end = () => {
        if (!drawing.current) return;
        drawing.current = false;
        onChange(ref.current.toDataURL('image/png'));
    };

    return (
        <div className="space-y-2">
            <span className="text-xs font-semibold text-muted-foreground">{label}</span>
            <canvas
                ref={ref}
                width={480}
                height={140}
                className="w-full touch-none rounded-md border border-dashed border-border bg-secondary/40"
                onMouseDown={start}
                onMouseMove={move}
                onMouseUp={end}
                onMouseLeave={end}
                onTouchStart={start}
                onTouchMove={move}
                onTouchEnd={end}
            />
            <button
                type="button"
                className={btn.ghost}
                onClick={() => {
                    const ctx = ref.current.getContext('2d');
                    ctx.clearRect(0, 0, ref.current.width, ref.current.height);
                    onChange('');
                }}
            >
                Limpiar firma
            </button>
        </div>
    );
}

export function useToastMsg() {
    const [msg, setMsg] = useState(null);
    useEffect(() => {
        if (!msg) return undefined;
        const t = setTimeout(() => setMsg(null), 2600);
        return () => clearTimeout(t);
    }, [msg]);
    const node = msg ? (
        <div className="fixed bottom-4 right-4 z-[60] rounded-md border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground shadow-xl">
            {msg}
        </div>
    ) : null;
    return [node, setMsg];
}
