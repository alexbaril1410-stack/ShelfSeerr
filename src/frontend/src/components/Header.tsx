import { useState, useRef, useMemo, forwardRef, useImperativeHandle } from 'react';

import { useLanguage } from '../contexts/LanguageContext';
import { useDismiss } from '../hooks/useDismiss';
import { useMountEffect } from '../hooks/useMountEffect';
import type {
  ContentType,
  ActingAsUserSelection,
  MetadataSearchField,
  QueryTargetOption,
} from '../types';
import { formatActingAsUserName } from '../utils/actingAsUser';
import type { ActivityStatusCounts } from '../utils/activityBadge';
import { getActivityBadgeState } from '../utils/activityBadge';
import { withBasePath } from '../utils/basePath';
import { isRecord } from '../utils/objectHelpers';
import { DropdownList } from './DropdownList';
import type { SearchBarHandle } from './SearchBar';
import { SearchBar } from './SearchBar';

interface HeaderHandle {
  submitSearch: () => void;
}

interface HeaderProps {
  calibreWebUrl?: string;
  audiobookLibraryUrl?: string;
  debug?: boolean;
  logoUrl?: string;
  showSearch?: boolean;
  searchInput?: string | number | boolean;
  searchInputLabel?: string;
  onSearchChange?: (value: string | number | boolean, label?: string) => void;
  onSearch?: () => void;
  onAdvancedToggle?: () => void;
  isAdvancedActive?: boolean;
  isLoading?: boolean;
  onDownloadsClick?: () => void;
  onSettingsClick?: () => void;
  isAdmin?: boolean;
  canAccessSettings?: boolean;
  statusCounts?: ActivityStatusCounts;
  onLogoClick?: () => void;
  onHomeClick?: () => void;
  onNavigateContentType?: (type: ContentType) => void;
  onNavigatePage?: (path: string) => void;
  currentPath?: string;
  authRequired?: boolean;
  isAuthenticated?: boolean;
  username?: string | null;
  displayName?: string | null;
  actingAsUser?: ActingAsUserSelection | null;
  onActingAsUserChange?: (user: ActingAsUserSelection | null) => void;
  adminUsers?: ActingAsUserSelection[];
  isAdminUsersLoading?: boolean;
  adminUsersError?: string | null;
  hasLoadedAdminUsers?: boolean;
  onLoadAdminUsers?: () => Promise<void> | void;
  onLogout?: () => void;
  onShowToast?: (
    message: string,
    type: 'success' | 'error' | 'info',
    persistent?: boolean,
  ) => string;
  onRemoveToast?: (id: string) => void;
  contentType?: ContentType;
  onContentTypeChange?: (type: ContentType) => void;
  allowedContentTypes?: ContentType[];
  combinedMode?: boolean;
  combinedModeLocked?: boolean;
  onCombinedModeChange?: (enabled: boolean) => void;
  queryTargets?: QueryTargetOption[];
  activeQueryTarget?: string;
  onQueryTargetChange?: (target: string) => void;
  activeQueryField?: MetadataSearchField | null;
}

const applyTheme = (preference: string): void => {
  let effective = preference;
  if (preference === 'auto') {
    effective = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  document.documentElement.setAttribute('data-theme', effective);
  document.documentElement.style.colorScheme = effective;
};

const DEFAULT_STATUS_COUNTS: ActivityStatusCounts = {
  ongoing: 0,
  completed: 0,
  errored: 0,
  pendingRequests: 0,
};
const EMPTY_ADMIN_USERS: ActingAsUserSelection[] = [];
const EMPTY_QUERY_TARGETS: QueryTargetOption[] = [];

export const Header = forwardRef<HeaderHandle, HeaderProps>(
  (
    {
      calibreWebUrl,
      audiobookLibraryUrl,
      debug,
      logoUrl,
      showSearch = false,
      searchInput = '',
      searchInputLabel,
      onSearchChange,
      onSearch,
      onAdvancedToggle,
      isAdvancedActive = false,
      isLoading = false,
      onDownloadsClick,
      onSettingsClick,
      isAdmin = false,
      canAccessSettings,
      statusCounts = DEFAULT_STATUS_COUNTS,
      onLogoClick,
      onHomeClick,
      onNavigateContentType,
      onNavigatePage,
      currentPath = '/',
      authRequired = false,
      isAuthenticated = false,
      username,
      displayName,
      actingAsUser = null,
      onActingAsUserChange,
      adminUsers = EMPTY_ADMIN_USERS,
      isAdminUsersLoading = false,
      adminUsersError = null,
      hasLoadedAdminUsers = false,
      onLoadAdminUsers,
      onLogout,
      onShowToast,
      onRemoveToast,
      contentType = 'ebook',
      onContentTypeChange,
      allowedContentTypes,
      combinedMode,
      combinedModeLocked,
      onCombinedModeChange,
      queryTargets = EMPTY_QUERY_TARGETS,
      activeQueryTarget = 'general',
      onQueryTargetChange,
      activeQueryField = null,
    },
    ref,
  ) => {
    const { t } = useLanguage();
    const activityBadge = getActivityBadgeState(statusCounts, isAdmin);
    const settingsEnabled = canAccessSettings ?? isAdmin;
    const searchBarRef = useRef<SearchBarHandle>(null);

    useImperativeHandle(ref, () => ({
      submitSearch: () => {
        searchBarRef.current?.submit();
      },
    }));
    const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [shouldAnimateIn, setShouldAnimateIn] = useState(false);
    let dropdownAnimationClass = '';
    if (isClosing) {
      dropdownAnimationClass = 'animate-fade-out-up';
    } else if (shouldAnimateIn) {
      dropdownAnimationClass = 'animate-fade-in-down';
    }
    const dropdownRef = useRef<HTMLDivElement>(null);

    const actingAsOptions = useMemo(
      () => [
        { value: '', label: t('Myself') },
        ...adminUsers.map((user) => {
          const displayLabel = formatActingAsUserName(user);
          return {
            value: String(user.id),
            label: displayLabel,
            description: displayLabel !== user.username ? `@${user.username}` : undefined,
          };
        }),
      ],
      [adminUsers, t],
    );

    const selectedActingAsValue = actingAsUser ? String(actingAsUser.id) : '';
    const dropdownPanelWidthClass = 'w-48';

    useMountEffect(() => {
      const saved = localStorage.getItem('preferred-theme') || 'auto';
      applyTheme(saved);

      // Remove preload class and inline theme-init styles now that the
      // external CSS is loaded and React has mounted.
      requestAnimationFrame(() => {
        document.documentElement.classList.remove('preload');
        document.getElementById('theme-init')?.remove();
      });
    });

    useMountEffect(() => {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = (e: MediaQueryListEvent) => {
        if (localStorage.getItem('preferred-theme') === 'auto') {
          const effective = e.matches ? 'dark' : 'light';
          document.documentElement.setAttribute('data-theme', effective);
          document.documentElement.style.colorScheme = effective;
        }
      };
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    });

    // Helper function to close dropdown with animation
    const closeDropdown = () => {
      setIsClosing(true);
      setTimeout(() => {
        setIsDropdownOpen(false);
        setIsClosing(false);
      }, 150); // Match the animation duration
    };

    useDismiss(isDropdownOpen && !isClosing, [dropdownRef], closeDropdown);

    const handleLogout = () => {
      closeDropdown();
      onLogout?.();
    };

    const toggleDropdown = () => {
      if (isDropdownOpen) {
        closeDropdown();
      } else {
        if (isAdmin && !hasLoadedAdminUsers && !isAdminUsersLoading) {
          void onLoadAdminUsers?.();
        }
        setShouldAnimateIn(true);
        setIsDropdownOpen(true);
        // Reset animation flag after animation completes
        setTimeout(() => setShouldAnimateIn(false), 200);
      }
    };

    const handleHeaderSearch = () => {
      onSearch?.();
    };

    const handleSearchChange = (value: string | number | boolean, label?: string) => {
      onSearchChange?.(value, label);
    };

    const handleActingAsChange = (nextValue: string[] | string) => {
      if (Array.isArray(nextValue)) {
        return;
      }

      if (nextValue === '') {
        onActingAsUserChange?.(null);
        return;
      }

      const selectedUser = adminUsers.find((user) => String(user.id) === nextValue);
      if (!selectedUser) {
        return;
      }

      onActingAsUserChange?.(selectedUser);
    };

    const handleDebugDownload = async () => {
      closeDropdown();
      // Show persistent toast while gathering logs
      const loadingToastId = onShowToast?.(
        t('Gathering debug logs... This may take a minute.'),
        'info',
        true,
      );
      try {
        const response = await fetch(withBasePath('/api/debug'), {
          method: 'GET',
          credentials: 'include',
        });

        // Remove the loading toast
        if (loadingToastId) onRemoveToast?.(loadingToastId);

        if (!response.ok) {
          const errorData: unknown = await response.json().catch(() => null);
          const errorMessage =
            isRecord(errorData) && typeof errorData.error === 'string'
              ? errorData.error
              : response.statusText;
          onShowToast?.(
            t('Debug download failed: {error}').replace('{error}', errorMessage),
            'error',
          );
          return;
        }

        // Get the filename from Content-Disposition header or use default
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = 'debug.zip';
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
          if (filenameMatch && filenameMatch[1]) {
            filename = filenameMatch[1].replace(/['"]/g, '');
          }
        }

        // Create blob and trigger download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();

        onShowToast?.(t('Debug logs downloaded successfully'), 'success');
      } catch (error) {
        // Remove the loading toast on error too
        if (loadingToastId) onRemoveToast?.(loadingToastId);
        console.error('Debug download error:', error);
        onShowToast?.(t('Debug download failed. Check console for details.'), 'error');
      }
    };

    // Determine if we should show icons only (both URLs configured)
    const showIconsOnly = Boolean(calibreWebUrl && audiobookLibraryUrl);

    const renderSettingsButton = (variant: 'nav' | 'menu') => {
      if (!onSettingsClick) return null;
      const isNav = variant === 'nav';
      return (
        <button
          type="button"
          onClick={
            settingsEnabled
              ? () => {
                  if (!isNav) closeDropdown();
                  onSettingsClick();
                }
              : undefined
          }
          disabled={!settingsEnabled}
          className={
            isNav
              ? `hover-action relative rounded-full p-2 text-gray-900 transition-colors dark:text-gray-100 ${
                  settingsEnabled ? '' : 'cursor-not-allowed opacity-40'
                }`
              : `flex w-full items-center gap-3 px-4 py-2 text-left transition-colors ${
                  settingsEnabled ? 'hover-surface' : 'cursor-not-allowed opacity-40'
                }`
          }
          aria-label={t('Settings')}
          title={isNav ? t('Settings') : undefined}
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4.5 12a7.5 7.5 0 0 0 15 0m-15 0a7.5 7.5 0 1 1 15 0m-15 0H3m16.5 0H21m-1.5 0H12m-8.457 3.077 1.41-.513m14.095-5.13 1.41-.513M5.106 17.785l1.15-.964m11.49-9.642 1.149-.964M7.501 19.795l.75-1.3m7.5-12.99.75-1.3m-6.063 16.658.26-1.477m2.605-14.772.26-1.477m0 17.726-.26-1.477M10.698 4.614l-.26-1.477M16.5 19.794l-.75-1.299M7.5 4.205 12 12m6.894 5.785-1.149-.964M6.256 7.178l-1.15-.964m15.352 8.864-1.41-.513M4.954 9.435l-1.41-.514M12.002 12l-3.75 6.495"/></svg>
            {!showIconsOnly && <span className="text-sm font-medium">{t('Go To Library')}</span>}
          </a>
        )}

        {/* Audiobook Library Button */}
        {audiobookLibraryUrl && (
          <a
            href={audiobookLibraryUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover-action flex items-center gap-2 rounded-full px-3 py-2 text-gray-900 transition-all duration-200 dark:text-gray-100"
            aria-label={t('Open audiobook library')}
            title={t(showIconsOnly ? 'Audiobook Library' : 'Go To Library')}
          >
            <svg
              className="h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z"
              />
            </svg>
            {!showIconsOnly && <span className="text-sm font-medium">{t('Go To Library')}</span>}
          </a>
        )}

        {/* User Menu Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={toggleDropdown}
            className={`hover-action relative rounded-full p-2 transition-colors ${
              isDropdownOpen ? 'bg-(--hover-action)' : ''
            }`}
            aria-label={t('User menu')}
            aria-expanded={isDropdownOpen}
            aria-haspopup="true"
          >
            <svg
              className="h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 6.75a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.118a7.5 7.5 0 0115 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.5-1.632z"
              />
            </svg>
            {actingAsUser && (
              <span
                className="absolute top-1 right-1 h-2 w-2 rounded-full border border-(--bg) bg-sky-500"
                title={t('Downloading as {user}').replace(
                  '{user}',
                  formatActingAsUserName(actingAsUser),
                )}
              />
            )}
          </button>

          {/* Dropdown Menu */}
          {(isDropdownOpen || isClosing) && (
            <div
              className={`absolute right-0 mt-2 ${dropdownPanelWidthClass} z-50 rounded-lg border shadow-lg ${
                dropdownAnimationClass
              }`}
              style={{
                background: 'var(--bg)',
                borderColor: 'var(--border-muted)',
              }}
            >
              <div className="py-1">
                {onDownloadsClick && (
                  <button
                    type="button"
                    onClick={() => {
                      closeDropdown();
                      onDownloadsClick();
                    }}
                    className="hover-surface flex w-full items-center gap-3 px-4 py-2 text-left transition-colors"
                  >
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                    </svg>
                    <span>{t('Activity')}</span>
                    {activityBadge && <span className={`ml-auto rounded-full px-2 py-0.5 text-xs font-semibold text-white ${activityBadge.colorClass}`}>{activityBadge.total}</span>}
                  </button>
                )}
                {renderSettingsButton('menu')}
                <a
                  href="https://github.com/calibrain/shelfmark/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover-surface flex w-full items-center gap-3 px-4 py-2 text-left text-slate-700 transition-colors dark:text-slate-200"
                  title={t('Submit a bug report')}
                >
                  <svg
                    className="h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5"
                    />
                  </svg>
                  <span>{t('Report a Bug')}</span>
                </a>

                {/* Debug Buttons */}
                {debug && (
                  <>
                    <button
                      type="button"
                      className="hover-surface flex w-full items-center gap-3 px-4 py-2 text-left text-orange-600 transition-colors dark:text-orange-400"
                      onClick={() => void handleDebugDownload()}
                    >
                      <svg
                        className="h-5 w-5"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 12.75c1.148 0 2.278.08 3.383.237 1.037.146 1.866.966 1.866 2.013 0 3.728-2.35 6.75-5.25 6.75S6.75 18.728 6.75 15c0-1.046.83-1.867 1.866-2.013A24.204 24.204 0 0112 12.75zm0 0c2.883 0 5.647.508 8.207 1.44a23.91 23.91 0 01-1.152 6.06M12 12.75c-2.883 0-5.647.508-8.208 1.44.125 2.104.52 4.136 1.153 6.06M12 12.75a2.25 2.25 0 002.248-2.354M12 12.75a2.25 2.25 0 01-2.248-2.354M12 8.25c.995 0 1.971-.08 2.922-.236.403-.066.74-.358.795-.762a3.778 3.778 0 00-.399-2.25M12 8.25c-.995 0-1.97-.08-2.922-.236-.402-.066-.74-.358-.795-.762a3.734 3.734 0 01.4-2.253M12 8.25a2.25 2.25 0 00-2.248 2.146M12 8.25a2.25 2.25 0 012.248 2.146M8.683 5a6.032 6.032 0 01-1.155-1.002c.07-.63.27-1.222.574-1.747m.581 2.749A3.75 3.75 0 0115.318 5m0 0c.427-.283.815-.62 1.155-.999a4.471 4.471 0 00-.575-1.752M4.921 6a24.048 24.048 0 00-.392 3.314c1.668.546 3.416.914 5.223 1.082M19.08 6c.205 1.08.337 2.187.392 3.314a23.882 23.882 0 01-5.223 1.082"
                        />
                      </svg>
                      <span>{t('Debug')}</span>
                    </button>
                    <form action={withBasePath('/api/restart')} method="get" className="w-full">
                      <button
                        className="hover-surface flex w-full items-center gap-3 px-4 py-2 text-left text-orange-600 transition-colors dark:text-orange-400"
                        type="submit"
                      >
                        <svg
                          className="h-5 w-5"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="1.5"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
                          />
                        </svg>
                        <span>{t('Restart')}</span>
                      </button>
                    </form>
                  </>
                )}

                {/* User Footer */}
                {authRequired && isAuthenticated && username && (
                  <div className="border-t" style={{ borderColor: 'var(--border-muted)' }}>
                    <div className="flex items-center gap-2.5 px-4 py-3">
                      <span
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold uppercase"
                        style={{ backgroundColor: 'var(--hover-surface)', color: 'var(--text)' }}
                      >
                        {(displayName || username).slice(0, 2)}
                      </span>
                      <div className="min-w-0 flex-1 truncate text-sm font-medium">
                        {displayName || username}
                      </div>
                      {onLogout && (
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="hover-action shrink-0 rounded-full p-2 text-red-600 transition-colors dark:text-red-400"
                          title={t('Sign Out')}
                          aria-label={t('Sign Out')}
                        >
                          <svg
                            className="h-5 w-5"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth="1.5"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
                            />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {isAdmin && onActingAsUserChange && (
                  <div
                    className="space-y-2 border-t px-4 py-3"
                    style={{ borderColor: 'var(--border-muted)' }}
                  >
                    <div className="text-xs font-medium tracking-wide uppercase opacity-70">
                      {t('Download as')}
                    </div>
                    <div className={isAdminUsersLoading ? 'pointer-events-none opacity-60' : ''}>
                      <DropdownList
                        options={actingAsOptions}
                        value={selectedActingAsValue}
                        onChange={handleActingAsChange}
                        placeholder={t('Myself')}
                        widthClassName="w-full"
                        buttonClassName="rounded-lg text-sm"
                      />
                    </div>
                    {isAdminUsersLoading && (
                      <div className="text-xs opacity-70">{t('Loading users...')}</div>
                    )}
                    {adminUsersError && (
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-xs text-red-600 dark:text-red-400">
                          {adminUsersError}
                        </div>
                        <button
                          type="button"
                          onClick={() => void onLoadAdminUsers?.()}
                          className="text-xs font-medium text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300"
                        >
                          {t('Retry')}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );

    return (
      <header
        className="shelfseerr-header sticky top-0 z-40 w-full"
        style={{ background: 'var(--bg)', paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="shelfseerr-header-inner mx-auto max-w-full px-4 py-4 sm:px-6 lg:px-8">
          {/* When search is active: stack on mobile, side-by-side on desktop */}
          {showSearch && (
            <div className="animate-pop-up flex flex-col gap-3 lg:relative lg:flex-row lg:items-center lg:justify-center">
              {/* Logo + Icon buttons - appear first on mobile (above search), last on desktop (right side) */}
              <div className="hidden w-full items-center justify-between lg:absolute lg:right-0 lg:top-1/2 lg:flex lg:w-auto lg:-translate-y-1/2 lg:justify-end">
                {/* Logo - visible on mobile only, aligned left */}
                {logoUrl &&
                  (onLogoClick ? (
                    <button
                      type="button"
                      onClick={onLogoClick}
                      className="shrink-0 cursor-pointer border-0 bg-transparent p-0 lg:hidden"
                      aria-label={t('Reset search')}
                    >
                      <img src={logoUrl} alt="" className="h-10 w-10" />
                    </button>
                  ) : (
                    <img
                      src={logoUrl}
                      alt="ShelfSeerr logo"
                      className="h-10 w-10 shrink-0 lg:hidden"
                    />
                  ))}

                {iconButtonsNode}
              </div>

              {/* Search bar - appear second on mobile (below logo+icons), first on desktop (left side) */}
              <div className="flex w-full flex-1 items-center gap-4 lg:mx-auto lg:max-w-[min(720px,70vw)] lg:flex-none">
                {/* Logo - visible on desktop only, aligned with search */}
                {logoUrl &&
                  (onLogoClick ? (
                    <button
                      type="button"
                      onClick={onLogoClick}
                      className="hidden shrink-0 cursor-pointer border-0 bg-transparent p-0 lg:block"
                      aria-label={t('Reset search')}
                    >
                      <img src={withBasePath('/shelfseerr-desktop-logo-transparent.png.PNG')} alt="ShelfSeerr" className="h-12 w-auto max-w-[240px]" />
                    </button>
                  ) : (
                    <img
                      src={withBasePath('/shelfseerr-desktop-logo-transparent.png.PNG')}
                      alt="ShelfSeerr"
                      className="hidden h-12 w-auto max-w-[240px] shrink-0 lg:block"
                    />
                  ))}
                <SearchBar
                  ref={searchBarRef}
                  className="w-full flex-1"
                  value={searchInput}
                  valueLabel={searchInputLabel}
                  onChange={handleSearchChange}
                  onSubmit={handleHeaderSearch}
                  onAdvancedToggle={onAdvancedToggle}
                  isAdvancedActive={isAdvancedActive}
                  isLoading={isLoading}
                  contentType={contentType}
                  onContentTypeChange={onContentTypeChange}
                  allowedContentTypes={allowedContentTypes}
                  combinedMode={combinedMode}
                  combinedModeLocked={combinedModeLocked}
                  onCombinedModeChange={onCombinedModeChange}
                  queryTargets={queryTargets}
                  activeQueryTarget={activeQueryTarget}
                  onQueryTargetChange={onQueryTargetChange}
                  activeQueryField={activeQueryField}
                  optionsLayout="popover"
                />
              </div>
            </div>
          )}

          {/* When search is NOT active: show icon buttons only on the right */}
          {!showSearch && (
            <div className="flex min-h-[48px] items-center justify-end">{iconButtonsNode}</div>
          )}

          <nav
            aria-label={t('Main navigation')}
            className="shelfseerr-primary-nav mt-3 hidden items-center gap-2 overflow-x-auto border-t pt-3 lg:flex"
            style={{ borderColor: 'var(--border-muted)' }}
          >
            <button type="button" onClick={() => { onHomeClick?.(); onNavigatePage?.('/discover'); }} className="hover-surface rounded-lg px-3 py-2 text-sm font-medium transition-colors" aria-label={t('Discover')} aria-current={currentPath === '/' || currentPath === '/discover' ? 'page' : undefined}>{t('Discover')}</button>
            {(!allowedContentTypes || allowedContentTypes.includes('ebook')) && <button type="button" onClick={() => (onNavigateContentType ?? onContentTypeChange)?.('ebook')} className={`hover-surface rounded-lg px-3 py-2 text-sm font-medium transition-colors ${currentPath === '/books' ? 'bg-(--hover-action)' : ''}`} aria-current={currentPath === '/books' ? 'page' : undefined}>{t('Books')}</button>}
            {(!allowedContentTypes || allowedContentTypes.includes('audiobook')) && <button type="button" onClick={() => (onNavigateContentType ?? onContentTypeChange)?.('audiobook')} className={`hover-surface rounded-lg px-3 py-2 text-sm font-medium transition-colors ${currentPath === '/audiobooks' ? 'bg-(--hover-action)' : ''}`} aria-current={currentPath === '/audiobooks' ? 'page' : undefined}>{t('Audiobooks')}</button>}
            <button type="button" onClick={() => onNavigatePage?.('/requests')} className="hover-surface rounded-lg px-3 py-2 text-sm font-medium transition-colors">{t('Requests')}</button>
            <button type="button" onClick={() => onNavigatePage?.('/blocks')} className="hover-surface rounded-lg px-3 py-2 text-sm font-medium transition-colors">{t('Blocklist')}</button>
            <button type="button" onClick={() => onNavigatePage?.('/issues')} className="hover-surface rounded-lg px-3 py-2 text-sm font-medium transition-colors">{t('Issues')}</button>
            <button type="button" onClick={() => onNavigatePage?.('/users')} className="hover-surface rounded-lg px-3 py-2 text-sm font-medium transition-colors">{t('Users')}</button>
            <button type="button" onClick={onSettingsClick} className="hover-surface rounded-lg px-3 py-2 text-sm font-medium transition-colors">{t('Settings')}</button>
          </nav>

          <nav aria-label={t('Main navigation')} className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-around border-t px-2 pt-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] shadow-[0_-8px_24px_rgba(0,0,0,0.18)] lg:hidden" style={{ background: 'var(--bg)', borderColor: 'var(--border-muted)' }}>
            <button type="button" onClick={() => { onHomeClick?.(); onNavigatePage?.('/discover'); }} aria-label={t('Discover')} aria-current={currentPath === '/' || currentPath === '/discover' ? 'page' : undefined} className={`flex min-w-0 flex-1 items-center justify-center rounded-xl py-1.5 ${currentPath === '/' || currentPath === '/discover' ? 'text-violet-400' : 'text-(--text-muted)'}`}>
              <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z"/></svg>
            </button>
            {(!allowedContentTypes || allowedContentTypes.includes('ebook')) && <button type="button" onClick={() => (onNavigateContentType ?? onContentTypeChange)?.('ebook')} aria-label={t('Books')} aria-current={currentPath === '/books' ? 'page' : undefined} className={`flex min-w-0 flex-1 items-center justify-center rounded-xl py-1.5 ${currentPath === '/books' ? 'text-violet-400' : 'text-(--text-muted)'}`}>
              <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3.5 5.5A2.5 2.5 0 0 1 6 3h12.5v17H6a2.5 2.5 0 0 0-2.5 2V5.5Z"/><path d="M3.5 5.5V22M7.5 7h7M7.5 11h7"/></svg>
            </button>}
            {(!allowedContentTypes || allowedContentTypes.includes('audiobook')) && <button type="button" onClick={() => (onNavigateContentType ?? onContentTypeChange)?.('audiobook')} aria-label={t('Audiobooks')} aria-current={currentPath === '/audiobooks' ? 'page' : undefined} className={`flex min-w-0 flex-1 items-center justify-center rounded-xl py-1.5 ${currentPath === '/audiobooks' ? 'text-violet-400' : 'text-(--text-muted)'}`}>
              <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3.5 6A2.5 2.5 0 0 1 6 3.5h12v16H6A2.5 2.5 0 0 0 3.5 22V6Z"/><path d="M3.5 6V22M7.5 7.5h6M7.5 11h6"/><path d="M6 5.5V5a7 7 0 0 1 14 0v3"/><rect x="5" y="7" width="3" height="5" rx="1.3"/><rect x="18" y="7" width="3" height="5" rx="1.3"/></svg>
            </button>}
            <button type="button" onClick={() => onNavigatePage?.('/requests')} aria-label={t('Requests')} aria-current={currentPath === '/requests' ? 'page' : undefined} className={`flex min-w-0 flex-1 items-center justify-center rounded-xl py-1.5 ${currentPath === '/requests' ? 'text-violet-400' : 'text-(--text-muted)'}`}>
              <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg>
            </button>
            <div className="relative flex min-w-0 flex-1 justify-center">
              {isMoreMenuOpen && <div className="fixed inset-x-0 bottom-[calc(3.25rem+env(safe-area-inset-bottom))] z-[70] w-full overflow-hidden border-t px-4 py-3 shadow-2xl" style={{ background: 'var(--bg)', borderColor: 'var(--border-muted)' }}>
                <div className="flex flex-col gap-1">
                  <button type="button" onClick={() => { setIsMoreMenuOpen(false); onHomeClick?.(); onNavigatePage?.('/discover'); }} className="hover-surface flex min-h-12 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium">
                    <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z"/></svg>
                    <span>{t('Discover')}</span>
                  </button>
                  {(!allowedContentTypes || allowedContentTypes.includes('ebook')) && <button type="button" onClick={() => { setIsMoreMenuOpen(false); (onNavigateContentType ?? onContentTypeChange)?.('ebook'); }} className="hover-surface flex min-h-12 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium">
                    <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3.5 5.5A2.5 2.5 0 0 1 6 3h12.5v17H6a2.5 2.5 0 0 0-2.5 2V5.5Z"/><path d="M3.5 5.5V22M7.5 7h7M7.5 11h7"/></svg>
                    <span>{t('Books')}</span>
                  </button>}
                  {(!allowedContentTypes || allowedContentTypes.includes('audiobook')) && <button type="button" onClick={() => { setIsMoreMenuOpen(false); (onNavigateContentType ?? onContentTypeChange)?.('audiobook'); }} className="hover-surface flex min-h-12 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium">
                    <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3.5 6A2.5 2.5 0 0 1 6 3.5h12v16H6A2.5 2.5 0 0 0 3.5 22V6Z"/><path d="M3.5 6V22M7.5 7.5h6M7.5 11h6"/><path d="M6 5.5V5a7 7 0 0 1 14 0v3"/><rect x="5" y="7" width="3" height="5" rx="1.3"/><rect x="18" y="7" width="3" height="5" rx="1.3"/></svg>
                    <span>{t('Audiobooks')}</span>
                  </button>}
                  <button type="button" onClick={() => { setIsMoreMenuOpen(false); onNavigatePage?.('/requests'); }} className="hover-surface flex min-h-12 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium">
                    <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg>
                    <span>{t('Requests')}</span>
                  </button>
                  <button type="button" onClick={() => { setIsMoreMenuOpen(false); onNavigatePage?.('/blocks'); }} className="hover-surface flex min-h-12 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium">
                    <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"/></svg>
                    <span>{t('Blocklist')}</span>
                  </button>
                  <button type="button" onClick={() => { setIsMoreMenuOpen(false); onNavigatePage?.('/issues'); }} className="hover-surface flex min-h-12 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium">
                    <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"/></svg>
                    <span>{t('Issues')}</span>
                  </button>
                  <button type="button" onClick={() => { setIsMoreMenuOpen(false); onNavigatePage?.('/users'); }} className="hover-surface flex min-h-12 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium">
                    <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"/></svg>
                    <span>{t('Users')}</span>
                  </button>
                  {onSettingsClick && <button type="button" onClick={() => { setIsMoreMenuOpen(false); onSettingsClick(); }} className="hover-surface flex min-h-12 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium">
                    <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4.5 12a7.5 7.5 0 0 0 15 0m-15 0a7.5 7.5 0 1 1 15 0m-15 0H3m16.5 0H21m-1.5 0H12m-8.457 3.077 1.41-.513m14.095-5.13 1.41-.513M5.106 17.785l1.15-.964m11.49-9.642 1.149-.964M7.501 19.795l.75-1.3m7.5-12.99.75-1.3m-6.063 16.658.26-1.477m2.605-14.772.26-1.477m0 17.726-.26-1.477M10.698 4.614l-.26-1.477M16.5 19.794l-.75-1.299M7.5 4.205 12 12m6.894 5.785-1.149-.964M6.256 7.178l-1.15-.964m15.352 8.864-1.41-.513M4.954 9.435l-1.41-.514M12.002 12l-3.75 6.495"/></svg>
                    <span>{t('Settings')}</span>
                  </button>}
                </div>
              </div>}
              <button type="button" onClick={() => setIsMoreMenuOpen((open) => !open)} aria-label={t('More')} aria-expanded={isMoreMenuOpen} className={`flex min-w-0 flex-1 items-center justify-center rounded-xl py-1.5 ${isMoreMenuOpen ? 'text-violet-400' : 'text-(--text-muted)'}`}>
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>
              </button>
            </div>
          </nav>
        </div>
      </header>
    );
  },
);

