'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import type { MoodCheckin, GratitudeEntry, Reflection, ThoughtRecord } from '@/lib/supabase';
import type { TodayReflect } from '@/app/dashboard/(app)/reflect/actions';
import { MoodCheckinCard } from './MoodCheckinCard';
import { GratitudeCard } from './GratitudeCard';
import { ExamenCard } from './ExamenCard';
import { ReframeCard } from './ReframeCard';

type Tab = 'today' | 'examen' | 'reframe';

const TABS: { id: Tab; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'examen', label: 'Examen' },
  { id: 'reframe', label: 'Reframe' },
];

interface ReflectPanelProps {
  today: TodayReflect;
  reframes: ThoughtRecord[];
}

export function ReflectPanel({ today, reframes }: ReflectPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('today');

  return (
    <div>
      {/* Tab bar */}
      <div className="mb-8 flex gap-1 border-b border-border-sub">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'relative pb-3 pr-4 text-[11px] font-medium uppercase tracking-[0.18em] transition-colors',
              activeTab === tab.id ? 'text-gold' : 'text-muted hover:text-silver',
            )}
          >
            {tab.label}
            {activeTab === tab.id && (
              <motion.span
                layoutId="reflect-tab-indicator"
                className="absolute bottom-[-1px] left-0 right-0 h-px bg-gold"
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Panel content */}
      <AnimatePresence mode="wait">
        {activeTab === 'today' && (
          <motion.div
            key="today"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="grid gap-6 md:grid-cols-2"
          >
            <MoodCheckinCard
              initialMood={today.mood}
              recentMoods={today.recentMoods}
            />
            <GratitudeCard initialGratitude={today.gratitude} />
          </motion.div>
        )}

        {activeTab === 'examen' && (
          <motion.div
            key="examen"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-2xl"
          >
            <ExamenCard initialExamen={today.examen} />
          </motion.div>
        )}

        {activeTab === 'reframe' && (
          <motion.div
            key="reframe"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <ReframeCard reframes={reframes} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
