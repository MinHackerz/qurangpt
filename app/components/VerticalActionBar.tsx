'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTheme } from '../contexts/ThemeContext';
import { ClockIcon, EyeIcon, UserIcon, SunIcon, MoonIcon, EnvelopeIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import { Shield, Monitor } from 'lucide-react';

interface IslamicData {
  currentPrayer: {
    name: string;
    endTime: string;
    endTimeString: string;
    isActive: boolean;
  } | null;
  nextPrayer: {
    name: string;
    time: string;
    timeString: string;
    isActive: boolean;
  };
  location: {
    city: string;
    region: string;
    country: string;
    timezone: string;
    timezoneAbbr: string;
  };
  eidFitr: {
    date: string;
    daysRemaining: number;
    dateString: string;
  };
  eidAdha: {
    date: string;
    daysRemaining: number;
    dateString: string;
  };
}

export default function VerticalActionBar() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [islamicData, setIslamicData] = useState<IslamicData | null>(null);
  const [now, setNow] = useState<Date>(new Date());
  const [activeButton, setActiveButton] = useState<string | null>('ask-quran');

  // Handle mounting and restore sidebar state from sessionStorage
  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('quran-gpt-sidebar-expanded');
      if (saved) {
        setIsExpanded(JSON.parse(saved));
      }
    }
  }, []);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Save sidebar state to sessionStorage whenever it changes
  useEffect(() => {
    if (isMounted && typeof window !== 'undefined') {
      sessionStorage.setItem('quran-gpt-sidebar-expanded', JSON.stringify(isExpanded));
    }
  }, [isExpanded, isMounted]);

  // Notify page about sidebar width so layout can shift
  useEffect(() => {
    const width = isExpanded ? 220 : 70; // collapsed is 70px (more breathing room), expanded is 220px
    const totalOffset = width;
    const event = new CustomEvent('qgpt:sidebar', { detail: { width: totalOffset } });
    window.dispatchEvent(event);
  }, [isExpanded]);

  // Dispatch initial layout event on mount to ensure proper layout on refresh
  useEffect(() => {
    const dispatchLayoutEvent = () => {
      const width = isExpanded ? 220 : 70;
      const totalOffset = width;
      const event = new CustomEvent('qgpt:sidebar', { detail: { width: totalOffset } });
      window.dispatchEvent(event);
    };

    dispatchLayoutEvent();
    requestAnimationFrame(dispatchLayoutEvent);
  }, [isExpanded]);

  useEffect(() => {
    const fetchIslamicData = async () => {
      try {
        const cachedData = localStorage.getItem('quran-gpt-islamic-data');
        const cacheTime = localStorage.getItem('quran-gpt-islamic-data-time');
        if (cachedData && cacheTime) {
          const cacheAge = Date.now() - parseInt(cacheTime);
          if (cacheAge < 5 * 60 * 1000) {
            setIslamicData(JSON.parse(cachedData));
            return;
          }
        }
        const res = await fetch('/api/islamic-data');
        if (res.ok) {
          const data = await res.json();
          setIslamicData(data);
          localStorage.setItem('quran-gpt-islamic-data', JSON.stringify(data));
          localStorage.setItem('quran-gpt-islamic-data-time', Date.now().toString());
        }
      } catch { }
    };
    fetchIslamicData();
  }, []);

  // Listen to component switch events to update active button state
  useEffect(() => {
    const onShowComponent = (e: any) => {
      const component = e?.detail?.component as string;
      if (component) {
        setActiveButton(component);
      }
    };

    const onResetToDefault = () => {
      setActiveButton('ask-quran');
    };

    const onToggleTime = (e: any) => {
      if (e?.detail?.open) {
        setActiveButton('time-dashboard');
      } else {
        setActiveButton(null);
      }
    };

    const onRequestSidebarWidth = () => {
      const width = isExpanded ? 220 : 70;
      const event = new CustomEvent('qgpt:sidebar', { detail: { width } });
      window.dispatchEvent(event);
    };

    window.addEventListener('qgpt:show-component', onShowComponent as EventListener);
    window.addEventListener('qgpt:reset-to-default', onResetToDefault as EventListener);
    window.addEventListener('qgpt:toggle-time-dashboard', onToggleTime as EventListener);
    window.addEventListener('qgpt:request-sidebar-width', onRequestSidebarWidth as EventListener);

    return () => {
      window.removeEventListener('qgpt:show-component', onShowComponent as EventListener);
      window.removeEventListener('qgpt:reset-to-default', onResetToDefault as EventListener);
      window.removeEventListener('qgpt:toggle-time-dashboard', onToggleTime as EventListener);
      window.removeEventListener('qgpt:request-sidebar-width', onRequestSidebarWidth as EventListener);
    };
  }, [isExpanded]);

  const MosqueIcon = ({ className }: { className?: string }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21H3V8.5L12 3L21 8.5V21Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21V12" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 21H21" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 21V15H15V21" />
    </svg>
  );

  if (!isMounted) {
    return (
      <div className="hidden sm:block fixed left-0 top-0 bottom-0 z-40 w-[70px] bg-white/50 dark:bg-black/20 backdrop-blur-xl">
        <div className="h-full flex flex-col pt-8 items-center">
          <div className="w-10 h-10 rounded-2xl bg-gray-200/50 dark:bg-gray-800/50 animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Sidebar Container */}
      <motion.div
        initial={false}
        animate={{ width: isExpanded ? 220 : 70 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="hidden sm:flex fixed left-0 top-0 bottom-0 z-50 flex-col bg-transparent backdrop-blur-xl"
      >
        {/* Top: Branding / Toggle */}
        {/* Top: Branding / Toggle */}
        {/* Top: Toggle Button (Replaces Logo) */}
        <div className={`h-20 flex items-center flex-shrink-0 pt-4 transition-all duration-300 ${isExpanded ? 'px-4 justify-start w-full' : 'justify-center w-full'}`}>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`flex items-center justify-center rounded-xl text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-all duration-200 hover:bg-gray-100 dark:hover:bg-white/10 ${isExpanded ? 'w-10 h-10' : 'w-10 h-10'}`}
            title={isExpanded ? "Close sidebar" : "Open sidebar"}
          >
            <svg width="24" height="24" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M6.83496 3.99992C6.38353 4.00411 6.01421 4.0122 5.69824 4.03801C5.31232 4.06954 5.03904 4.12266 4.82227 4.20012L4.62207 4.28606C4.18264 4.50996 3.81498 4.85035 3.55859 5.26848L3.45605 5.45207C3.33013 5.69922 3.25006 6.01354 3.20801 6.52824C3.16533 7.05065 3.16504 7.71885 3.16504 8.66301V11.3271C3.16504 12.2712 3.16533 12.9394 3.20801 13.4618C3.25006 13.9766 3.33013 14.2909 3.45605 14.538L3.55859 14.7216C3.81498 15.1397 4.18266 15.4801 4.62207 15.704L4.82227 15.79C5.03904 15.8674 5.31234 15.9205 5.69824 15.9521C6.01398 15.9779 6.383 15.986 6.83398 15.9902L6.83496 3.99992ZM18.165 11.3271C18.165 12.2493 18.1653 12.9811 18.1172 13.5702C18.0745 14.0924 17.9916 14.5472 17.8125 14.9648L17.7295 15.1415C17.394 15.8 16.8834 16.3511 16.2568 16.7353L15.9814 16.8896C15.5157 17.1268 15.0069 17.2285 14.4102 17.2773C13.821 17.3254 13.0893 17.3251 12.167 17.3251H7.83301C6.91071 17.3251 6.17898 17.3254 5.58984 17.2773C5.06757 17.2346 4.61294 17.1508 4.19531 16.9716L4.01855 16.8896C3.36014 16.5541 2.80898 16.0434 2.4248 15.4169L2.27051 15.1415C2.03328 14.6758 1.93158 14.167 1.88281 13.5702C1.83468 12.9811 1.83496 12.2493 1.83496 11.3271V8.66301C1.83496 7.74072 1.83468 7.00898 1.88281 6.41985C1.93157 5.82309 2.03329 5.31432 2.27051 4.84856L2.4248 4.57317C2.80898 3.94666 3.36012 3.436 4.01855 3.10051L4.19531 3.0175C4.61285 2.83843 5.06771 2.75548 5.58984 2.71281C6.17898 2.66468 6.91071 2.66496 7.83301 2.66496H12.167C13.0893 2.66496 13.821 2.66468 14.4102 2.71281C15.0069 2.76157 15.5157 2.86329 15.9814 3.10051L16.2568 3.25481C16.8833 3.63898 17.394 4.19012 17.7295 4.84856L17.8125 5.02531C17.9916 5.44285 18.0745 5.89771 18.1172 6.41985C18.1653 7.00898 18.165 7.74072 18.165 8.66301V11.3271ZM8.16406 15.995H12.167C13.1112 15.995 13.7794 15.9947 14.3018 15.9521C14.8164 15.91 15.1308 15.8299 15.3779 15.704L15.5615 15.6015C15.9797 15.3451 16.32 14.9774 16.5439 14.538L16.6299 14.3378C16.7074 14.121 16.7605 13.8478 16.792 13.4618C16.8347 12.9394 16.835 12.2712 16.835 11.3271V8.66301C16.835 7.71885 16.8347 7.05065 16.792 6.52824C16.7605 6.14232 16.7073 5.86904 16.6299 5.65227L16.5439 5.45207C16.32 5.01264 15.9796 4.64498 15.5615 4.3886L15.3779 4.28606C15.1308 4.16013 14.8165 4.08006 14.3018 4.03801C13.7794 3.99533 13.1112 3.99504 12.167 3.99504H8.16406C8.16407 3.99667 8.16504 3.99829 8.16504 3.99992L8.16406 15.995Z"></path>
            </svg>
          </button>
        </div>

        {/* Middle: Navigation Items */}
        <div className="flex-1 flex flex-col items-center gap-2 py-8 overflow-y-auto overflow-x-hidden w-full custom-scrollbar">

          <NavButton
            isActive={activeButton === 'ask-quran'}
            onClick={() => {
              const event = new CustomEvent('qgpt:reset-to-default');
              window.dispatchEvent(event);
            }}
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>}
            label="Ask Quran"
            isExpanded={isExpanded}
          />

          <NavButton
            isActive={activeButton === 'read-quran'}
            onClick={() => {
              const event = new CustomEvent('qgpt:show-component', { detail: { component: 'read-quran' } });
              window.dispatchEvent(event);
            }}
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}
            label="Read Quran"
            isExpanded={isExpanded}
          />

          <NavButton
            isActive={activeButton === 'mosque-finder'}
            onClick={() => {
              const event = new CustomEvent('qgpt:show-component', { detail: { component: 'mosque-finder' } });
              window.dispatchEvent(event);
            }}
            icon={<MosqueIcon className="w-5 h-5" />}
            label="Mosque Finder"
            isExpanded={isExpanded}
          />

          <NavButton
            isActive={activeButton === 'time-dashboard'}
            onClick={() => {
              const event = new CustomEvent('qgpt:toggle-time-dashboard', { detail: { open: true } });
              window.dispatchEvent(event);
            }}
            icon={<ClockIcon className="w-5 h-5" />}
            label="Prayer Times"
            isExpanded={isExpanded}
          />

          <NavButton
            isActive={activeButton === 'zakat-calculator'}
            onClick={() => {
              const event = new CustomEvent('qgpt:show-component', { detail: { component: 'zakat-calculator' } });
              window.dispatchEvent(event);
            }}
            icon={<CurrencyDollarIcon className="w-5 h-5" />}
            label="Zakat Calculator"
            isExpanded={isExpanded}
          />

        </div>

        {/* Bottom: Utilities & support */}
        <div className="flex flex-col items-center gap-2 py-8 flex-shrink-0">

          {/* Theme Toggle */}
          <button
            onClick={() => {
              const nextTheme = theme === 'dark' ? 'light' : 'dark';
              (window as any).dispatchEvent(new CustomEvent('qgpt:set-theme', { detail: { mode: nextTheme } }));
            }}
            title={!isExpanded ? "Toggle Theme" : undefined}
            className={`
              group flex items-center gap-4 rounded-xl transition-all duration-300 relative
              ${isExpanded ? 'w-[90%] px-4 py-3' : 'w-10 h-10 justify-center'}
              text-gray-400 dark:text-gray-500 hover:text-emerald-500 dark:hover:text-emerald-400 hover:bg-gray-50 dark:hover:bg-white/5
            `}
          >
            <div className="transition-transform duration-300 group-hover:scale-110">
              {theme === 'dark' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
            </div>
            {isExpanded && (
              <span className="text-sm tracking-wide whitespace-nowrap transition-colors font-normal">
                Theme
              </span>
            )}
          </button>

          {/* Transparency Link */}
          <Link
            href="/transparency"
            title={!isExpanded ? "Transparency" : undefined}
            className={`
              group flex items-center gap-4 rounded-xl transition-all duration-300 relative
              ${isExpanded ? 'w-[90%] px-4 py-3' : 'w-10 h-10 justify-center'}
              text-gray-400 dark:text-gray-500 hover:text-emerald-500 dark:hover:text-emerald-400 hover:bg-gray-50 dark:hover:bg-white/5
            `}
          >
            <div className="transition-transform duration-300 group-hover:scale-110">
              <EyeIcon className="w-5 h-5" />
            </div>
            {isExpanded && (
              <span className="text-sm tracking-wide whitespace-nowrap transition-colors font-normal">
                Transparency
              </span>
            )}
          </Link>

          {/* Contact Developer */}
          <button
            onClick={() => window.open('https://menajul.vercel.app', '_blank')}
            title={!isExpanded ? "Developer" : undefined}
            className={`
              group flex items-center gap-4 rounded-xl transition-all duration-300 relative
              ${isExpanded ? 'w-[90%] px-4 py-3' : 'w-10 h-10 justify-center'}
              text-gray-400 dark:text-gray-500 hover:text-emerald-500 dark:hover:text-emerald-400 hover:bg-gray-50 dark:hover:bg-white/5
            `}
          >
            <div className="transition-transform duration-300 group-hover:scale-110">
              <UserIcon className="w-5 h-5" />
            </div>
            {isExpanded && (
              <span className="text-sm tracking-wide whitespace-nowrap transition-colors font-normal">
                Developer
              </span>
            )}
          </button>

          {/* Support Button */}
          <button
            onClick={() => window.open('https://buymeacoffee.com/qurangpt', '_blank')}
            title={!isExpanded ? "Support" : undefined}
            className={`
              group flex items-center gap-4 rounded-xl transition-all duration-300 relative
              ${isExpanded ? 'w-[90%] px-4 py-3' : 'w-10 h-10 justify-center'}
              text-amber-500/80 dark:text-amber-500/60 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-gray-50 dark:hover:bg-white/5
            `}
          >
            <div className="transition-transform duration-300 group-hover:scale-110">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.216 6.415l-.132-.666c-.119-.598-.388-1.163-1.001-1.379-.197-.069-.42-.098-.57-.241-.152-.143-.196-.366-.231-.572-.065-.378-.125-.756-.192-1.133-.057-.325-.102-.69-.25-.987-.195-.4-.597-.634-.996-.788a5.723 5.723 0 00-.626-.194c-1-.263-2.05-.36-3.077-.416a25.834 25.834 0 00-3.7.062c-.915.083-1.88.184-2.75.5-.318.116-.646.256-.888.501-.297.302-.393.77-.177 1.146.154.267.415.456.692.58.36.162.737.284 1.123.366 1.075.238 2.189.331 3.287.37 1.218.05 2.437.01 3.65-.118.299-.033.598-.073.896-.119.352-.054.578-.513.474-.834-.124-.383-.457-.531-.834-.473-.466.074-.96.108-1.382.146-1.177.08-2.358.082-3.536.006a22.228 22.228 0 01-1.157-.107c-.086-.01-.18-.025-.258-.036-.243-.036-.484-.08-.724-.13-.111-.027-.111-.185 0-.212h.005c.277-.06.557-.108.838-.147h.002c.131-.009.263-.032.394-.048a25.076 25.076 0 013.426-.12c.674.019 1.347.067 2.017.144l.228.031c.267.04.533.088.798.145.392.085.895.113 1.07.542.055.137.08.288.111.431l.319 1.484a.237.237 0 01-.199.284h-.003c-.037.006-.075.01-.112.015a36.704 36.704 0 01-4.743.295 37.059 37.059 0 01-4.699-.304c-.14-.017-.293-.042-.417-.06-.326-.048-.649-.108-.973-.161-.393-.065-.768-.032-1.123.161-.29.16-.527.404-.675.701-.154.316-.199.66-.267 1-.069.34-.176.707-.135 1.056.087.753.613 1.365 1.37 1.502a39.69 39.69 0 0011.343.376.483.483 0 01.535.53l-.071.697-1.018 9.907c-.041.41-.047.832-.125 1.237-.122.637-.553 1.028-1.182 1.171-.577.131-1.165.2-1.756.205-.656.004-1.31-.025-1.966-.022-.699.004-1.556-.06-2.095-.58-.475-.458-.54-1.174-.605-1.793l-.731-7.013-.322-3.094c-.037-.351-.286-.695-.678-.678-.336.015-.718.3-.678.679l.228 2.185.949 9.112c.147 1.344 1.174 2.068 2.446 2.272.742.12 1.503.144 2.257.156.966.016 1.942.053 2.892-.122 1.408-.258 2.465-1.198 2.616-2.657.34-3.332.683-6.663 1.024-9.995l.215-2.087a.484.484 0 01.39-.426c.402-.078.787-.212 1.074-.518.455-.488.546-1.124.385-1.766zm-1.478.772c-.145.137-.363.201-.578.233-2.416.359-4.866.54-7.308.46-1.748-.06-3.477-.254-5.207-.498-.17-.024-.353-.055-.47-.18-.22-.236-.111-.71-.054-.995.052-.26.152-.609.463-.646.484-.057 1.046.148 1.526.22.577.088 1.156.159 1.737.212 2.48.226 5.002.19 7.472-.14.45-.06.899-.13 1.345-.21.399-.072.84-.206 1.08.206.166.281.188.657.162.974a.544.544 0 01-.169.364z" /></svg>
            </div>
            {isExpanded && (
              <span className="text-sm tracking-wide whitespace-nowrap transition-colors font-normal">
                Support
              </span>
            )}
          </button>

        </div>

      </motion.div>
    </>
  );
}

function NavButton({ isActive, onClick, icon, label, isExpanded }: { isActive: boolean, onClick: () => void, icon: React.ReactNode, label: string, isExpanded: boolean }) {
  return (
    <button
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClick(); }}
      title={!isExpanded ? label : undefined}
      className={`
                group flex items-center gap-4 rounded-xl transition-all duration-300 relative
                ${isExpanded ? 'w-[90%] px-4 py-3' : 'w-10 h-10 justify-center'}
                ${isActive
          ? 'text-emerald-500 dark:text-emerald-400'
          : 'text-gray-400 dark:text-gray-500 hover:text-emerald-500 dark:hover:text-emerald-400 hover:bg-gray-50 dark:hover:bg-white/5'}
            `}
    >
      <div className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
        {icon}
      </div>

      {isExpanded && (
        <span className={`text-sm tracking-wide whitespace-nowrap transition-colors ${isActive ? 'font-medium' : 'font-normal'}`}>
          {label}
        </span>
      )}

      {isActive && (
        <motion.div
          layoutId="activeNavIndicator"
          className={`absolute bg-emerald-500 rounded-full ${isExpanded ? 'left-0 h-full w-1 rounded-r-full' : 'bottom-0 w-1 h-1'}`}
        />
      )}
    </button>
  )
}
