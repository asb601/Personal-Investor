import { useRef, useState, useEffect } from 'react';
import { Wallet, ChevronDown } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';

export function Header() {
  const { data: session } = useSession();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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
    <div className="sticky top-0 z-20 bg-card/95 border-b border-border backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">

        {/* Logo */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary text-primary-foreground rounded-lg flex items-center justify-center shadow-md">
            <Wallet className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h1 className="text-lg sm:text-2xl font-bold">Expense Wallet</h1>
            <p className="text-xs sm:text-sm text-muted-foreground font-mono hidden sm:block">
              Track every rupee
            </p>
          </div>
        </div>

        {/* Profile + Dropdown */}
        <div ref={menuRef} className="relative flex items-center gap-2">
          <img
            src={session?.user?.image ?? '/avatar.png'}
            alt="profile"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-border"
          />

          <button
            onClick={() => setShowMenu((prev) => !prev)}
            className="p-1 rounded-md hover:bg-accent transition-colors"
          >
            <ChevronDown
              className={`w-4 h-4 text-muted-foreground transition-transform ${
                showMenu ? 'rotate-180' : ''
              }`}
            />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-12 w-44 bg-card border border-border rounded-lg shadow-lg z-50 animate-in fade-in zoom-in-95 duration-150">
              <button
                onClick={() => setShowMenu(false)}
                className="w-full text-left px-4 py-2 text-sm hover:bg-accent"
              >
                This Month
              </button>

              <button
                onClick={() => setShowMenu(false)}
                className="w-full text-left px-4 py-2 text-sm hover:bg-accent"
              >
                Settings
              </button>

              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="w-full text-left px-4 py-2 text-sm hover:bg-accent text-destructive"
              >
                Logout
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}