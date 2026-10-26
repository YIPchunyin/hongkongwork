'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

const getTabs = () => [
  { href: '/', label: '首页', icon: (
    <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  )},
  { href: '/notes', label: '记事本', icon: (
    <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  )},
  { href: '/expenses', label: '杂费', icon: (
    <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
    </svg>
  )},
  { href: '/search', label: '搜索', icon: (
    <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  )},
  { href: '/income', label: '收入', icon: (
    <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )},
  { href: '/settings', label: '我的', icon: (
    <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  )},
];

export default function MobileNav() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  // 默认收起：只露出右下角的用户头像，点开展开，再点还原
  const [expanded, setExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  const collapse = () => {
    setExpanded(false);
    setMenuOpen(false);
  };

  // 切换路由后自动收起
  useEffect(() => {
    setExpanded(false);
    setMenuOpen(false);
  }, [pathname]);

  // 展开时：点空白处或按 Esc 收起
  useEffect(() => {
    if (!expanded) return;
    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      // 点在开关自己身上时交给它的 onClick 处理，否则会「先收起又被 toggle 打开」
      if (toggleRef.current?.contains(target)) return;
      if (navRef.current?.contains(target)) return;
      setExpanded(false);
      setMenuOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setExpanded(false);
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [expanded]);

  const tabs = getTabs();
  const myTab = tabs[tabs.length - 1];

  const avatar = user ? (
    <div className="w-[30px] h-[30px] bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-[12px] font-bold shadow-sm">
      {user.username.charAt(0).toUpperCase()}
    </div>
  ) : (
    <span className="text-slate-400">{myTab.icon}</span>
  );

  const bottomOffset = 'calc(0.75rem + env(safe-area-inset-bottom, 0px))';

  return (
    <>
      {/* 展开时点击空白处收起 */}
      {expanded && (
        <div
          className="md:hidden fixed inset-0 z-[55] bg-slate-900/25 backdrop-blur-[2px] animate-fadeIn"
          onClick={collapse}
        />
      )}

      {/* 折叠态：悬浮卡片 */}
      <nav
        ref={navRef}
        aria-hidden={!expanded}
        style={{ bottom: bottomOffset, right: 'calc(4.75rem + env(safe-area-inset-right, 0px))' }}
        className={
          'md:hidden fixed left-3 z-[60] h-16 rounded-2xl origin-bottom-right ' +
          'bg-white/90 backdrop-blur-xl ring-1 ring-slate-900/[0.06] ' +
          'shadow-[0_16px_40px_-12px_rgba(15,23,42,0.30)] ' +
          'transition-[opacity,transform] duration-200 ease-out ' +
          (expanded
            ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 scale-95 translate-y-2 pointer-events-none')
        }
      >
        <div className="flex items-stretch h-full p-1 gap-0.5">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href || (tab.href !== '/' && pathname.startsWith(tab.href));
            const base =
              'flex-1 min-w-0 flex flex-col items-center justify-center gap-0.5 rounded-xl transition-colors duration-200 ' +
              (isActive ? 'bg-blue-50 text-blue-600' : 'text-slate-400 active:bg-slate-50');

            if (tab.href === '/settings') {
              return (
                <div key={tab.href} className="relative flex-1 min-w-0">
                  <button
                    onClick={() => (user ? setMenuOpen((v) => !v) : (window.location.href = '/login'))}
                    className={base + ' w-full h-full'}
                  >
                    <span className={isActive ? 'scale-105 transition-transform duration-200' : ''}>{tab.icon}</span>
                    <span className={'text-[10px] leading-none ' + (isActive ? 'font-bold' : 'font-medium')}>{tab.label}</span>
                  </button>

                  {menuOpen && user && (
                    <div className="absolute bottom-full right-0 mb-2 w-48 bg-white rounded-2xl ring-1 ring-slate-900/[0.06] shadow-[0_16px_40px_-12px_rgba(15,23,42,0.30)] py-1 overflow-hidden">
                      <div className="px-4 py-2.5 border-b border-slate-100">
                        <p className="text-sm font-semibold text-slate-900 truncate">{user.name || user.username}</p>
                        <p className="text-xs text-slate-400 truncate">@{user.username}</p>
                      </div>
                      <Link
                        href="/settings"
                        onClick={collapse}
                        className="flex items-center px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 min-h-[44px]"
                      >
                        <svg className="w-4 h-4 mr-2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        账号设置
                      </Link>
                      <div className="border-t border-slate-100 mt-1" />
                      <button
                        onClick={() => { logout(); collapse(); }}
                        className="flex items-center w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 min-h-[44px]"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        退出登录
                      </button>
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={tab.href}
                href={tab.href}
                onClick={collapse}
                tabIndex={expanded ? 0 : -1}
                className={base}
              >
                <span className={isActive ? 'scale-105 transition-transform duration-200' : ''}>{tab.icon}</span>
                <span className={'text-[10px] leading-none ' + (isActive ? 'font-bold' : 'font-medium')}>{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* 悬浮圆形开关：始终可见，图标交叉淡入淡出 */}
      <button
        ref={toggleRef}
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-label={expanded ? '收起导航菜单' : '展开导航菜单'}
        aria-expanded={expanded}
        style={{ bottom: bottomOffset, right: 'calc(0.75rem + env(safe-area-inset-right, 0px))' }}
        className="md:hidden fixed z-[60] w-14 h-14 rounded-full bg-white/90 backdrop-blur-xl ring-1 ring-slate-900/[0.06] shadow-[0_10px_30px_-8px_rgba(15,23,42,0.28)] active:scale-95 transition-transform duration-200 flex items-center justify-center overflow-hidden"
      >
        <span
          className={
            'absolute inset-0 flex items-center justify-center transition-all duration-300 ease-out ' +
            (expanded ? 'opacity-0 scale-75 rotate-90' : 'opacity-100 scale-100 rotate-0')
          }
        >
          {avatar}
        </span>
        <span
          className={
            'absolute inset-0 flex items-center justify-center transition-all duration-300 ease-out ' +
            (expanded ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-75 -rotate-90')
          }
        >
          <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>
    </>
  );
}
