'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

export function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-[#0a0a15]/95 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.3)] py-3' : 'bg-[#0f0f23]/90 backdrop-blur-sm py-4'}`}>
      <div className="max-w-[1400px] mx-auto px-6 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-3 transition-transform hover:-translate-y-1">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] flex items-center justify-center text-xl shadow-[0_4px_15px_var(--color-glow)] font-bold text-white">
            N
          </div>
          <div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] leading-tight">
              NEXALO
            </h1>
            <p className="text-xs text-[var(--color-text-secondary)]">Institutional Logic</p>
          </div>
        </Link>

        <nav className="hidden md:block">
          <ul className="flex gap-8 list-none m-0 p-0">
            <li>
              <Link href="#comprar" className="text-[var(--color-text-secondary)] font-medium text-[0.95rem] transition-colors hover:text-[var(--color-primary)]">
                Comprar
              </Link>
            </li>
            <li>
              <Link href="#account" className="text-[var(--color-text-secondary)] font-medium text-[0.95rem] transition-colors hover:text-[var(--color-primary)]">
                Mi Cuenta
              </Link>
            </li>
            <li>
              <Link href="#inversor" className="text-[var(--color-text-secondary)] font-medium text-[0.95rem] transition-colors hover:text-[var(--color-primary)]">
                Inversores
              </Link>
            </li>
            <li>
              <Link href="#staking" className="text-[var(--color-text-secondary)] font-medium text-[0.95rem] transition-colors hover:text-[var(--color-primary)]">
                Staking
              </Link>
            </li>
            <li>
              <Link href="#tesoreria" className="text-[var(--color-text-secondary)] font-medium text-[0.95rem] transition-colors hover:text-[var(--color-primary)]">
                Tesorería
              </Link>
            </li>
            <li>
              <Link href="#faq" className="text-[var(--color-text-secondary)] font-medium text-[0.95rem] transition-colors hover:text-[var(--color-primary)]">
                FAQ
              </Link>
            </li>
            <li>
              <Link
                href="/whitepaper"
                className="text-[0.85rem] font-semibold px-3 py-1.5 rounded-lg border border-[var(--color-primary)]/30 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 transition-all"
              >
                Whitepaper
              </Link>
            </li>
          </ul>
        </nav>

        {/* AppKit Connect Button Web Component */}
        <appkit-button balance="show" />
      </div>
    </header>
  );
}
