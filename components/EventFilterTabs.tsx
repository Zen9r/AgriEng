// components/EventFilterTabs.tsx
"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface EventFilterTabsProps {
  categories: string[];
  activeFilter: string;
  setFilter: (filter: string) => void;
}

export function EventFilterTabs({ 
  categories, 
  activeFilter, 
  setFilter 
}: EventFilterTabsProps) {
  return (
    <div className="w-full overflow-x-auto pb-2">
      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {/* Updated background to use muted theme color */}
      <div className="flex w-max mx-auto space-x-1 rounded-xl bg-muted p-1 no-scrollbar">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setFilter(category)}
            className={cn(
              "relative rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", // Use ring color from theme
              "focus-visible:ring-offset-2 whitespace-nowrap",
              activeFilter === category ? "" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {activeFilter === category && (
              <motion.div
                layoutId="active-event-filter-pill"
                // Updated active pill to use primary theme color
                className="absolute inset-0 bg-primary"
                style={{ borderRadius: 8 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
            <span className={cn(
              "relative z-10",
              // Updated active text to use primary-foreground theme color
              activeFilter === category ? "text-primary-foreground" : ""
            )}>
              {category === "all" ? "الكل" : category}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
