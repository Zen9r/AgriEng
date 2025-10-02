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

      {/* Updated background with animation */}
      <motion.div 
        className="flex w-max mx-auto space-x-1 rounded-xl bg-muted p-1 no-scrollbar"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <motion.div
          className="flex items-center"
          style={{ gap: '4px' }}
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.08,
                delayChildren: 0.1
              }
            }
          }}
        >
          {categories.map((category, index) => (
            <motion.button
              key={category}
              onClick={() => setFilter(category)}
              className={cn(
                "relative rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                "focus-visible:ring-offset-2 whitespace-nowrap",
                activeFilter === category ? "" : "text-muted-foreground hover:text-foreground"
              )}
              variants={{
                hidden: { opacity: 0, y: 20, scale: 0.9 },
                visible: { 
                  opacity: 1, 
                  y: 0, 
                  scale: 1,
                  transition: {
                    type: "spring",
                    stiffness: 200,
                    damping: 20
                  }
                }
              }}
              whileHover={{ 
                scale: 1.05,
                y: -2,
                transition: { 
                  duration: 0.2,
                  type: "spring",
                  stiffness: 300,
                  damping: 15
                }
              }}
              whileTap={{ 
                scale: 0.95,
                y: 0,
                transition: { 
                  duration: 0.1,
                  type: "spring",
                  stiffness: 400,
                  damping: 20
                }
              }}
            >
              {activeFilter === category && (
                <motion.div
                  layoutId="active-event-filter-pill"
                  className="absolute inset-0 bg-primary rounded-lg"
                  transition={{ 
                    type: "spring", 
                    stiffness: 400, 
                    damping: 25,
                    duration: 0.5
                  }}
                />
              )}
              <span className={cn(
                "relative z-10",
                activeFilter === category ? "text-primary-foreground" : ""
              )}>
                {category === "all" ? "الكل" : category}
              </span>
            </motion.button>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
