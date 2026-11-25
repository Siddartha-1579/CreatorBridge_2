import { useEffect, useState, useRef } from 'react';

export interface ThemeOption {
  id: string;
  name: string;
  mode: 'light' | 'dark';
  bg: string;
  accent: string;
}

const THEMES: ThemeOption[] = [
  { id: 'mist-light', name: 'Deep Teal Mist (Light)', mode: 'light', bg: '#F4F7F7', accent: '#0F4C5C' },
  { id: 'deep-teal', name: 'Abyssal Teal (Dark)', mode: 'dark', bg: '#060D10', accent: '#2DD4BF' },
  { id: 'obsidian-gold', name: 'Obsidian & Gold', mode: 'dark', bg: '#09090B', accent: '#D4AF37' },
  { id: 'carbon-crimson', name: 'Carbon & Crimson', mode: 'dark', bg: '#0A0A0C', accent: '#F43F5E' },
  { id: 'nordic-slate', name: 'Nordic Slate', mode: 'dark', bg: '#0F172A', accent: '#38BDF8' },
];

export function applyTheme(themeId: string) {
  const theme = THEMES.find((t) => t.id === themeId) || THEMES[1];
  const root = document.documentElement;

  root.setAttribute('data-theme', theme.id);
  if (theme.mode === 'dark') {
    root.classList.add('dark');
    root.style.colorScheme = 'dark';
  } else {
    root.classList.remove('dark');
    root.style.colorScheme = 'light';
  }

  localStorage.setItem('creatorbridge_theme', theme.id);
}

interface ThemeToggleProps {
  showLabel?: boolean;
  className?: string;
}

export function ThemeToggle({ showLabel = false, className = '' }: ThemeToggleProps) {
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState<string>(
    () => localStorage.getItem('creatorbridge_theme') || 'deep-teal'
  );
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    applyTheme(activeId);
  }, [activeId]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const current = THEMES.find((t) => t.id === activeId) || THEMES[1];

  return (
    <div className={`relative ${className}`} ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium"
        style={{
          backgroundColor: 'var(--bg-subtle)',
          borderColor: 'var(--border-subtle)',
          color: 'var(--text-primary)',
        }}
        title="Switch Theme"
      >
        <span
          className="w-3 h-3 rounded-full border border-white/20"
          style={{ backgroundColor: current.accent }}
        />
        <span className={showLabel ? 'inline' : 'hidden sm:inline'}>Theme</span>
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-56 rounded-xl border p-1.5 shadow-xl z-50"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <div
            className="px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wider"
            style={{ color: 'var(--text-muted)' }}
          >
            Select Theme
          </div>

          {THEMES.map((theme) => {
            const isSelected = theme.id === activeId;
            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => {
                  setActiveId(theme.id);
                  setOpen(false);
                }}
                className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-sm text-left"
                style={{
                  backgroundColor: isSelected ? 'var(--accent-soft)' : 'transparent',
                  color: isSelected ? 'var(--accent-primary)' : 'var(--text-primary)',
                  fontWeight: isSelected ? 600 : 400,
                }}
              >
                <span className="flex items-center gap-2.5">
                  <span
                    className="w-4 h-4 rounded-full border flex items-center justify-center"
                    style={{ backgroundColor: theme.bg, borderColor: theme.accent }}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: theme.accent }}
                    />
                  </span>
                  {theme.name}
                </span>
                {isSelected && <span>✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ThemeToggle;