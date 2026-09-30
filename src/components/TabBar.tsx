import type { ReactNode } from 'react';

export type AppTab = 'listen' | 'records' | 'settings';

const TABS: { id: AppTab; label: string; icon: ReactNode }[] = [
  {
    id: 'listen',
    label: '聴く',
    icon: <path d="M4 15v-3a8 8 0 0 1 16 0v3M4 15a2 2 0 0 1 2-2h1v7H6a2 2 0 0 1-2-2v-3Zm16 0a2 2 0 0 0-2-2h-1v7h1a2 2 0 0 0 2-2v-3Z" />,
  },
  {
    id: 'records',
    label: '記録',
    icon: <path d="M5 20V11M12 20V5M19 20v-6" />,
  },
  {
    id: 'settings',
    label: '設定',
    icon: (
      <>
        <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
        <circle cx="16" cy="7" r="2" />
        <circle cx="10" cy="17" r="2" />
      </>
    ),
  },
];

type TabBarProps = {
  current: AppTab;
  onChange: (tab: AppTab) => void;
};

export function TabBar({ current, onChange }: TabBarProps) {
  return (
    <nav className="tab-bar" aria-label="画面の切り替え">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          aria-current={current === tab.id ? 'page' : undefined}
          className="tab-button"
          type="button"
          onClick={() => onChange(tab.id)}
        >
          <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            {tab.icon}
          </svg>
          <span>{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
