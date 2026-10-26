'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

const getTabs = () => [
  { href: '/', label: '首页', icon: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  )},
  { href: '/notes', label: '记事本', icon: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  )},
  { href: '/expenses', label: '杂费统计', icon: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
    </svg>
  )},
  { href: '/search', label: '搜索', icon: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  )},
  { href: '/income', label: '收入', icon: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )},
  { href: '/settings', label: '我的', icon: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  )},
];

export default function MobileNav() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  // 默认收起：只露出右下角的用户头像，点一下展开，再点一下还原
  const [expanded, setExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);

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
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setExpanded(false);
        setMenuOpen(false);
      }
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
    <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white text-[11px] font-bold">
      {user.username.charAt(0).toUpperCase()}
    </div>
  ) : (
    myTab.icon
  );

  // 悬浮头像按钮：始终存在。收起时显示头像，展开时变成向下的箭头，再点一下就还原。
  const toggleButton = (
    <button
      type="button"
      onClick={() => setExpanded((v) => !v)}
      aria-label={expanded ? '收起导航菜单' : '展开导航菜单'}
      aria-expanded={expanded}
      className="md:hidden fixed right-4 z-[60] w-12 h-12 rounded-full flex items-center justify-center bg-white/90 backdrop-blur-lg border border-gray-200 shadow-lg active:scale-90 transition-all duration-300"
      style={{ bottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}
    >
      {expanded ? (
        <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      ) : (
        avatar
      )}
    </button>
  );

  return (
    <>
      {toggleButton}

      {expanded && (
        <>
          {/* 点空白处收起 */}
          <div className="md:hidden fixed inset-0 z-[55] bg-black/10" onClick={collapse} />

          <nav
            ref={navRef}
            className="md:hidden fixed bottom-0 left-0 right-[4.5rem] z-[60] bg-white/95 backdrop-blur-lg border-t border-gray-200 safe-area-bottom animate-slideUp"
          >
            <div className="flex items-center justify-around h-14">
              {tabs.map((tab) => {
                const isActive = pathname === tab.href || (tab.href !== '/' && pathname.startsWith(tab.href));

                if (tab.href === '/settings') {
                  return (
                    <div key={tab.href} className="relative flex-1 min-w-0">
                      <button
                        onClick={() => (user ? setMenuOpen((v) => !v) : (window.location.href = '/login'))}
                        className={'w-full flex flex-col items-center justify-center h-full px-1.5 relative ' + (isActive ? 'text-blue-600' : 'text-gray-400')}
                      >
                        {/* 这里固定用描边人像，避免和右下角的头像开关混在一起 */}
                        <span className={isActive ? 'scale-110 transition-transform' : ''}>{tab.icon}</span>
                        <span className={'text-[10px] mt-0.5 font-medium ' + (isActive ? 'font-bold' : '')}>{tab.label}</span>
                        {isActive && <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-blue-600 rounded-full" />}
                      </button>

                      {menuOpen && user && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                          <div className="px-4 py-2 border-b border-gray-100">
                            <p className="text-sm font-medium text-gray-900">{user.name || user.username}</p>
                            <p className="text-xs text-gray-500">@{user.username}</p>
                          </div>
                          <Link
                            href="/settings"
                            onClick={collapse}
                            className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 min-h-[44px]"
                          >
                            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            账号设置
                          </Link>
                          <div className="border-t border-gray-100 mt-1" />
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
                    className={'flex-1 min-w-0 flex flex-col items-center justify-center h-full px-1.5 relative ' + (isActive ? 'text-blue-600' : 'text-gray-400')}
                  >
                    <span className={isActive ? 'scale-110 transition-transform' : ''}>{tab.icon}</span>
                    <span className={'text-[10px] mt-0.5 font-medium ' + (isActive ? 'font-bold' : '')}>{tab.label}</span>
                    {isActive && <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-blue-600 rounded-full" />}
                  </Link>
                );
              })}
            </div>
          </nav>
        </>
      )}
    </>
  );
}
