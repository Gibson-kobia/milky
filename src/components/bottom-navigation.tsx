'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, BarChart3, Gift, Wallet } from 'lucide-react';

export function BottomNavigation() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/farmers', label: 'Farmers', icon: Users },
    { href: '/reports', label: 'Reports', icon: BarChart3 },
    { href: '/advances', label: 'Advances', icon: Gift },
    { href: '/monthly-payouts', label: 'Payouts', icon: Wallet },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white/95 backdrop-blur sm:hidden">
      <div className="flex h-16 items-center justify-between px-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href === '/' && pathname.startsWith('/?'));
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center justify-center gap-1 rounded-lg px-2 py-2 text-center transition-colors duration-200 ${
                isActive
                  ? 'text-milk-green-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[11px] font-medium leading-none">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
