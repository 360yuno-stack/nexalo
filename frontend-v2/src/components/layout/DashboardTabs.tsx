"use client";

import React, { useState } from 'react';
import { NexumGrid } from '@/components/sections/NexumGrid';
import { TreasurySection } from '@/components/sections/TreasurySection';
import { StakingSection } from '@/components/sections/StakingSection';
import { AccountSection } from '@/components/sections/AccountSection';
import { InvestorSection } from '@/components/sections/InvestorSection';
import { FAQSection } from '@/components/sections/FAQSection';
import { LayoutDashboard, Wallet, LineChart, Coins, HelpCircle, Building2 } from 'lucide-react';

const TABS = [
  { id: 'account', label: 'Mi Cuenta', icon: Wallet, component: AccountSection },
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, component: NexumGrid },
  { id: 'investor', label: 'Inversor', icon: LineChart, component: InvestorSection },
  { id: 'staking', label: 'Staking NXL', icon: Coins, component: StakingSection },
  { id: 'treasury', label: 'Tesorería', icon: Building2, component: TreasurySection },
  { id: 'faq', label: 'FAQ & Soporte', icon: HelpCircle, component: FAQSection },
];

export function DashboardTabs() {
  const [activeTab, setActiveTab] = useState(TABS[0].id);

  return (
    <div className="max-w-[1400px] mx-auto px-4 md:px-8 pb-20">
      {/* Tabs Navigation */}
      <div className="flex overflow-x-auto hide-scrollbar border-b border-white/10 mb-8 mt-12 bg-[#0A0A0E]/50 backdrop-blur-md rounded-t-2xl p-2 sticky top-24 z-40">
        <div className="flex gap-2 min-w-max">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 rounded-xl font-medium transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] text-white shadow-lg shadow-primary/20'
                    : 'text-[var(--color-text-secondary)] hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-white' : 'text-current'} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Tab Content */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
        {TABS.map((tab) => (
          <div key={tab.id} className={activeTab === tab.id ? 'block' : 'hidden'}>
            <tab.component />
          </div>
        ))}
      </div>
    </div>
  );
}
