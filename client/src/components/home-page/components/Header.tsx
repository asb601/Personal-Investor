import { useRef, useState, useEffect } from 'react';
import { ChevronDown, LogOut, Settings, CalendarDays } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useRouter, usePathname } from 'next/navigation';

const PAGE_TITLES: Record<string, string> = {
  '/home': 'Expenses',
  '/home/analytics': 'Analytics',
  '/home/card-analytics': 'Card Analytics',
  '/home/stock-analytics': 'Stock Analytics',
};

export function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const pageTitle = PAGE_TITLES[pathname] ?? 'Dashboard';

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setShowMenu(false);
      }
    }

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  return (
    <header className="sticky top-0 z-20 bg-card/95 border-b border-border backdrop-blur-sm">
      <div className="px-4 sm:px-6 py-3 flex items-center justify-between">
        {/* Page title */}
        <h1 className="text-base sm:text-lg font-semibold truncate">
          {pageTitle}
        </h1>

        {/* Profile + Dropdown */}
        <div ref={menuRef} className="relative flex items-center gap-2 shrink-0">
          <div className="hidden sm:block text-right mr-2">
            <p className="text-sm font-medium leading-tight truncate max-w-[120px]">
              {user?.name ?? 'User'}
            </p>
          </div>

          <button
            onClick={() => setShowMenu((prev) => !prev)}
            className="flex items-center gap-1.5 rounded-full p-0.5 hover:ring-2 hover:ring-accent transition-all"
          >
            <img
              src={user?.avatar ?? '/avatar.png'}
              alt="profile"
              className="w-8 h-8 rounded-full border border-border"
            />
            <ChevronDown
              className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${
                showMenu ? 'rotate-180' : ''
              }`}
            />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-11 w-44 bg-card border border-border rounded-lg shadow-lg z-50 animate-in fade-in zoom-in-95 duration-150 py-1">
              <button
                onClick={() => setShowMenu(false)}
                className="w-full text-left px-4 py-2 text-sm hover:bg-accent flex items-center gap-2"
              >
                <Settings className="w-3.5 h-3.5" />
                Settings
              </button>

              <div className="h-px bg-border mx-2 my-1" />

              <button
                onClick={() => {
                  logout();
                  router.push('/');
                }}
                className="w-full text-left px-4 py-2 text-sm hover:bg-accent text-destructive flex items-center gap-2"
              >
                <LogOut className="w-3.5 h-3.5" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}