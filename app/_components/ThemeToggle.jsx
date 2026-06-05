'use client';
import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

function ThemeToggle() {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const isDark =
      localStorage.getItem('theme') === 'dark' ||
      (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setDark(isDark);
    setMounted(true);
    document.documentElement.classList.toggle('dark', isDark);
  }, []);

  const toggleTheme = (checked) => {
    setDark(checked);
    localStorage.setItem('theme', checked ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', checked);
  };

  return (
    <div className="flex items-center gap-2">
      {mounted && (
        <>
          <Sun
            className={`h-4 w-4 ${dark ? 'text-gray-400' : 'text-yellow-500'}`}
            aria-hidden="true"
          />
          <Switch
            checked={dark}
            onCheckedChange={toggleTheme}
            aria-label="Toggle dark mode"
          />
          <Moon
            className={`h-4 w-4 ${dark ? 'text-yellow-500' : 'text-gray-400'}`}
            aria-hidden="true"
          />
        </>
      )}
    </div>
  );
}

export default ThemeToggle;
