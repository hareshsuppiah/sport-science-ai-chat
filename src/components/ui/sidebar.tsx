import React, { useState, createContext, useContext } from "react";
import { cn } from "../../lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";

interface Links {
  label: string;
  href?: string;
  icon: React.ReactNode;
  onClick?: () => void;
}

interface SidebarContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(undefined);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

export const Sidebar = ({
  children,
  open,
  setOpen,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const [openState, setOpenState] = useState(false);
  const openValue = open !== undefined ? open : openState;
  const setOpenValue = setOpen || setOpenState;

  return (
    <SidebarContext.Provider value={{ open: openValue, setOpen: setOpenValue }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const SidebarBody = ({ className, children }: { className?: string; children: React.ReactNode }) => {
  const { open, setOpen } = useSidebar();

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.div
        className={cn(
          "h-full px-4 py-4 hidden md:flex md:flex-col bg-gray-50/30 dark:bg-zinc-800/30 backdrop-blur-[1px] border-r border-black/10 dark:border-white/10",
          className
        )}
        initial={false}
        animate={{
          width: open ? "240px" : "60px",
        }}
        transition={{
          duration: 0.2,
          ease: "easeInOut"
        }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      >
        {children}
      </motion.div>

      {/* Mobile Sidebar */}
      <div className="md:hidden">
        <button
          onClick={() => setOpen(!open)}
          className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-gray-50/30 dark:bg-zinc-800/30 backdrop-blur-[1px] border border-black/10 dark:border-white/10"
        >
          <Menu className="w-5 h-5 text-black/70 dark:text-white/70" />
        </button>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-gray-50/30 dark:bg-zinc-800/30 backdrop-blur-[1px] border-r border-black/10 dark:border-white/10 w-[240px]"
            >
              <div className="p-4">
                <button
                  onClick={() => setOpen(false)}
                  className="absolute top-4 right-4 p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"
                >
                  <X className="w-5 h-5 text-black/70 dark:text-white/70" />
                </button>
                {children}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export const SidebarLink = ({
  link,
  className,
}: {
  link: Links;
  className?: string;
}) => {
  const { open } = useSidebar();
  
  return (
    <button
      onClick={link.onClick}
      className={cn(
        "flex items-center justify-start gap-2 w-full p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors",
        className
      )}
    >
      {link.icon}
      {open && (
        <span className="text-black/70 dark:text-white/70 text-sm whitespace-nowrap">
          {link.label}
        </span>
      )}
    </button>
  );
}; 