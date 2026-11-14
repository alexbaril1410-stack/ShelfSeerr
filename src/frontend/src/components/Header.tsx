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
              d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          {!isNav && <span>{t('Settings')}</span>}
        </button>
      );
    };

    // Icon buttons - reused for both states
    const iconButtonsNode = (
      <div className="flex items-center gap-2">
        {/* Book Library Button */}
        {calibreWebUrl && (
          <a
            href={calibreWebUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover-action flex items-center gap-2 rounded-full px-3 py-2 text-gray-900 transition-all duration-200 dark:text-gray-100"
            aria-label={t('Open book library')}
            title={t(showIconsOnly ? 'Book Library' : 'Go To Library')}
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
                d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
              />
            </svg>
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
            className="flex h-10 w-10 items-center justify-center rounded-full border border-(--border-muted) bg-[#cbb69a] text-lg font-semibold text-white shadow-sm transition hover:brightness-110"
            aria-label={t('User menu')}
            aria-expanded={isDropdownOpen}
            aria-haspopup="true"
          >
            {(displayName || username || '?').trim().slice(0, 1).toUpperCase()}
            {actingAsUser && (
              <span
                className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full border-2 border-(--bg) bg-sky-500"
                title={t('Downloading as {user}').replace(
                  '{user}',
                  formatActingAsUserName(actingAsUser),
                )}
              />
            )}
          </button>

          {/* Seerr-style account menu */}
          {(isDropdownOpen || isClosing) && (
            <div
              className={`absolute right-0 mt-2 w-[min(360px,calc(100vw-24px))] z-50 overflow-hidden rounded-xl border shadow-2xl ${dropdownAnimationClass}`}
              style={{
                background: '#1d2938',
                borderColor: '#344153',
                color: '#e7ebf2',
              }}
            >
              {authRequired && isAuthenticated && username && (
                <div className="flex items-center gap-3 border-b px-4 py-4" style={{ borderColor: '#344153' }}>
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#cbb69a] text-xl font-semibold text-white">
                    {(displayName || username).trim().slice(0, 1).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-lg font-semibold">{displayName || username}</div>
                    <div className="truncate text-sm opacity-65">@{username}</div>
                  </div>
                </div>
              )}
              <div className="py-2">
                <button
                  type="button"
                  onClick={() => { closeDropdown(); onSettingsClick?.(); }}
                  className="flex w-full items-center gap-3 px-5 py-2.5 text-left text-sm font-medium transition hover:bg-white/5"
                >
                  <svg className="h-5 w-5 opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>
                  <span>{t('Profile')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => { closeDropdown(); onNavigatePage?.('/requests'); }}
                  className="flex w-full items-center gap-3 px-5 py-2.5 text-left text-sm font-medium transition hover:bg-white/5"
                >
                  <svg className="h-5 w-5 opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
                  <span>{t('Requests')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => { closeDropdown(); onSettingsClick?.(); }}
                  className="flex w-full items-center gap-3 px-5 py-2.5 text-left text-sm font-medium transition hover:bg-white/5"
                >
                  <svg className="h-5 w-5 opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-1.7 2.94-.08-.03a1.7 1.7 0 0 0-1.83.28l-.07.06h-3.4l-.05-.08a1.7 1.7 0 0 0-1.56-.85 1.7 1.7 0 0 0-.4.05l-.09.02-1.7-2.94.06-.06A1.7 1.7 0 0 0 9.3 14.5v-.1l-1.7-2.94.08-.03a1.7 1.7 0 0 0 .9-1.5 1.7 1.7 0 0 0-.05-.4l-.02-.09 2.94-1.7.06.06a1.7 1.7 0 0 0 1.88.34l.06-.03h3.4l.05.08a1.7 1.7 0 0 0 1.56.85 1.7 1.7 0 0 0 .4-.05l.09-.02 1.7 2.94-.06.06A1.7 1.7 0 0 0 20.3 13v.1z"/></svg>
                  <span>{t('Settings')}</span>
                </button>
              </div>
              {isAdmin && onActingAsUserChange && (
                <div className="space-y-2 border-t px-5 py-3" style={{ borderColor: '#344153' }}>
                  <div className="text-xs font-semibold uppercase tracking-wide opacity-70">{t('Download as')}</div>
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
                  {isAdminUsersLoading && <div className="text-xs opacity-70">{t('Loading users...')}</div>}
                  {adminUsersError && (
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-xs text-red-400">{adminUsersError}</div>
                      <button type="button" onClick={() => void onLoadAdminUsers?.()} className="text-xs font-medium text-sky-300">{t('Retry')}</button>
                    </div>
                  )}
                </div>
              )}
              {onDownloadsClick && (
                <button
                  type="button"
                  onClick={() => { closeDropdown(); onDownloadsClick(); }}
                  className="flex w-full items-center gap-3 border-t px-5 py-2.5 text-left text-sm font-medium transition hover:bg-white/5"
                  style={{ borderColor: '#344153' }}
                >
                  <svg className="h-5 w-5 opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"/></svg>
                  <span>{t('Activity')}</span>
                  {activityBadge && <span className="ml-auto rounded-full bg-violet-600 px-2 py-0.5 text-xs font-semibold text-white">{activityBadge.total}</span>}
                </button>
              )}
              {onLogout && (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 border-t px-5 py-3 text-left text-sm font-medium transition hover:bg-white/5"
                  style={{ borderColor: '#344153' }}
                >
                  <svg className="h-5 w-5 opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10 17l5-5-5-5M15 12H3"/><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6"/></svg>
                  <span>{t('Sign Out')}</span>
                </button>
              )}
            </div>
          )}}
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
                {/* ShelfSeerr brand aligned with the global search bar */}
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

          <nav aria-label={t('Main navigation')} className="shelfseerr-primary-nav mt-3 hidden items-center gap-2 overflow-x-auto border-t pt-3 lg:flex" style={{ borderColor: 'var(--border-muted)' }}>
            <button type="button" onClick={() => { onHomeClick?.(); onNavigatePage?.('/discover'); }} aria-label={t('Discover')} aria-current={currentPath === '/' || currentPath === '/discover' ? 'page' : undefined} className={`shelfseerr-nav-link ${currentPath === '/' || currentPath === '/discover' ? 'is-active' : ''}`}><svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z"/><path d="m19 14 .9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9L19 14Z"/><path d="m5 15 .7 1.3L7 17l-1.3.7L5 19l-.7-1.3L3 17l1.3-.7L5 15Z"/></svg><span>{t('Discover')}</span></button>
            {(!allowedContentTypes || allowedContentTypes.includes('ebook')) && <button type="button" onClick={() => (onNavigateContentType ?? onContentTypeChange)?.('ebook')} aria-label={t('Books')} aria-current={currentPath === '/books' ? 'page' : undefined} className={`shelfseerr-nav-link ${currentPath === '/books' ? 'is-active' : ''}`}><svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3.5 5.5A2.5 2.5 0 0 1 6 3h12.5v17H6a2.5 2.5 0 0 0-2.5 2V5.5Z"/><path d="M3.5 5.5V22M7.5 7h7M7.5 11h7"/></svg><span>{t('Books')}</span></button>}
            {(!allowedContentTypes || allowedContentTypes.includes('audiobook')) && <button type="button" onClick={() => (onNavigateContentType ?? onContentTypeChange)?.('audiobook')} aria-label={t('Audiobooks')} aria-current={currentPath === '/audiobooks' ? 'page' : undefined} className={`shelfseerr-nav-link ${currentPath === '/audiobooks' ? 'is-active' : ''}`}><svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 13v-1a9 9 0 0 1 18 0v1"/><rect x="2.5" y="12" width="4" height="7" rx="2"/><rect x="17.5" y="12" width="4" height="7" rx="2"/><path d="M21.5 17v1a3 3 0 0 1-3 3H16"/></svg><span>{t('Audiobooks')}</span></button>}
            <button type="button" onClick={() => onNavigatePage?.('/requests')} aria-label={t('Requests')} aria-current={currentPath === '/requests' ? 'page' : undefined} className={`shelfseerr-nav-link ${currentPath === '/requests' ? 'is-active' : ''}`}><svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg><span>{t('Requests')}</span></button>
            <button type="button" onClick={() => onNavigatePage?.('/blocks')} aria-label={t('Blocklist')}><svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 3l18 18"/><path d="M10.6 10.6a2 2 0 0 0 2.8 2.8"/><path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c5 0 8.5 4.5 9.5 7-.4 1.1-1.2 2.3-2.3 3.4M6.2 6.2C3.8 7.6 2.7 10 2.5 12c1 2.5 4.5 7 9.5 7 1.1 0 2.1-.2 3-.6"/></svg><span>{t('Blocklist')}</span></button>
            <button type="button" onClick={() => onNavigatePage?.('/issues')} aria-label={t('Scoring')}><svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 19V5"/><path d="M4 19h16"/><path d="m7 15 3-4 3 2 5-7"/><path d="M15 6h3v3"/></svg><span>{t('Scoring')}</span></button>
            <button type="button" onClick={() => onNavigatePage?.('/users')} aria-label={t('Users')} className="shelfseerr-nav-link"><svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M16 21v-1.5a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4V21"/><circle cx="9" cy="7" r="4"/><path d="M20 21v-1.5a4 4 0 0 0-3-3.9M16 3.2a4 4 0 0 1 0 7.6"/></svg><span>{t('Users')}</span></button>
            <button type="button" onClick={onSettingsClick} aria-label={t('Settings')} aria-current={currentPath === '/settings' ? 'page' : undefined} className={`shelfseerr-nav-link ${currentPath === '/settings' ? 'is-active' : ''}`}><svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"/><path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/></svg><span>{t('Settings')}</span></button>
          </nav>

          <nav aria-label={t('Main navigation')} className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-around border-t px-2 pt-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] shadow-[0_-8px_24px_rgba(0,0,0,0.18)] lg:hidden" style={{ background: 'var(--bg)', borderColor: 'var(--border-muted)' }}>
            <button type="button" onClick={() => { onHomeClick?.(); onNavigatePage?.('/discover'); }} aria-label={t('Discover')} aria-current={currentPath === '/' || currentPath === '/discover' ? 'page' : undefined} className={`flex min-w-0 flex-1 items-center justify-center rounded-xl py-1.5 ${currentPath === '/' || currentPath === '/discover' ? 'text-violet-400' : 'text-(--text-muted)'}`}><svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z"/><path d="m19 14 .9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9L19 14Z"/><path d="m5 15 .7 1.3L7 17l-1.3.7L5 19l-.7-1.3L3 17l1.3-.7L5 15Z"/></svg></button>
            {(!allowedContentTypes || allowedContentTypes.includes('ebook')) && <button type="button" onClick={() => (onNavigateContentType ?? onContentTypeChange)?.('ebook')} aria-label={t('Books')} aria-current={currentPath === '/books' ? 'page' : undefined} className={`flex min-w-0 flex-1 items-center justify-center rounded-xl py-1.5 ${currentPath === '/books' ? 'text-violet-400' : 'text-(--text-muted)'}`}><svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3.5 5.5A2.5 2.5 0 0 1 6 3h12.5v17H6a2.5 2.5 0 0 0-2.5 2V5.5Z"/><path d="M3.5 5.5V22M7.5 7h7M7.5 11h7"/></svg></button>}
            {(!allowedContentTypes || allowedContentTypes.includes('audiobook')) && <button type="button" onClick={() => (onNavigateContentType ?? onContentTypeChange)?.('audiobook')} aria-label={t('Audiobooks')} aria-current={currentPath === '/audiobooks' ? 'page' : undefined} className={`flex min-w-0 flex-1 items-center justify-center rounded-xl py-1.5 ${currentPath === '/audiobooks' ? 'text-violet-400' : 'text-(--text-muted)'}`}><svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 13v-1a9 9 0 0 1 18 0v1"/><rect x="2.5" y="12" width="4" height="7" rx="2"/><rect x="17.5" y="12" width="4" height="7" rx="2"/><path d="M21.5 17v1a3 3 0 0 1-3 3H16"/></svg></button>}
            <button type="button" onClick={() => onNavigatePage?.('/requests')} aria-label={t('Requests')} aria-current={currentPath === '/requests' ? 'page' : undefined} className={`flex min-w-0 flex-1 items-center justify-center rounded-xl py-1.5 ${currentPath === '/requests' ? 'text-violet-400' : 'text-(--text-muted)'}`}><svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg></button>
            <div className="relative flex min-w-0 flex-1 justify-center">
              {isMoreMenuOpen && <div className="fixed inset-x-0 bottom-[calc(2.5rem+env(safe-area-inset-bottom))] z-[70] max-h-[75dvh] w-full overflow-y-auto border-t px-3 py-2 shadow-2xl" style={{ background: 'var(--bg)', borderColor: 'var(--border-muted)' }}>
                <div className="flex flex-col gap-1">
                  <button type="button" onClick={() => { setIsMoreMenuOpen(false); onHomeClick?.(); onNavigatePage?.('/discover'); }} className="hover-surface flex min-h-12 w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium"><svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z"/><path d="m19 14 .9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9L19 14Z"/><path d="m5 15 .7 1.3L7 17l-1.3.7L5 19l-.7-1.3L3 17l1.3-.7L5 15Z"/></svg><span>{t('Discover')}</span></button>
                  {!allowedContentTypes || allowedContentTypes.includes('ebook') && (<button type="button" onClick={() => { setIsMoreMenuOpen(false); (onNavigateContentType ?? onContentTypeChange)?.('ebook'); }} className="hover-surface flex min-h-12 w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium"><svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3.5 5.5A2.5 2.5 0 0 1 6 3h12.5v17H6a2.5 2.5 0 0 0-2.5 2V5.5Z"/><path d="M3.5 5.5V22M7.5 7h7M7.5 11h7"/></svg><span>{t('Books')}</span></button>)}
                  {!allowedContentTypes || allowedContentTypes.includes('audiobook') && (<button type="button" onClick={() => { setIsMoreMenuOpen(false); (onNavigateContentType ?? onContentTypeChange)?.('audiobook'); }} className="hover-surface flex min-h-12 w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium"><svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 13v-1a9 9 0 0 1 18 0v1"/><rect x="2.5" y="12" width="4" height="7" rx="2"/><rect x="17.5" y="12" width="4" height="7" rx="2"/><path d="M21.5 17v1a3 3 0 0 1-3 3H16"/></svg><span>{t('Audiobooks')}</span></button>)}
                  <button type="button" onClick={() => { setIsMoreMenuOpen(false); onNavigatePage?.('/requests'); }} className="hover-surface flex min-h-12 w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium"><svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg><span>{t('Requests')}</span></button>
                  <button type="button" onClick={() => { setIsMoreMenuOpen(false); onNavigatePage?.('/blocks'); }} className="hover-surface flex min-h-12 w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium"><svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 3l18 18"/><path d="M10.6 10.6a2 2 0 0 0 2.8 2.8"/><path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c5 0 8.5 4.5 9.5 7-.4 1.1-1.2 2.3-2.3 3.4M6.2 6.2C3.8 7.6 2.7 10 2.5 12c1 2.5 4.5 7 9.5 7 1.1 0 2.1-.2 3-.6"/></svg><span>{t('Blocklist')}</span></button>
                  <button type="button" onClick={() => { setIsMoreMenuOpen(false); onNavigatePage?.('/issues'); }} className="hover-surface flex min-h-12 w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium"><svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10.3 3.8 2.6 17.2A2 2 0 0 0 4.3 20h15.4a2 2 0 0 0 1.7-2.8L13.7 3.8a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 16.5h.01"/></svg><span>{t('Issues')}</span></button>
                  <button type="button" onClick={() => { setIsMoreMenuOpen(false); onNavigatePage?.('/users'); }} className="hover-surface flex min-h-12 w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium"><svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M16 21v-1.5a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4V21"/><circle cx="9" cy="7" r="4"/><path d="M20 21v-1.5a4 4 0 0 0-3-3.9M16 3.2a4 4 0 0 1 0 7.6"/></svg><span>{t('Users')}</span></button>
                  {onSettingsClick && (<button type="button" onClick={() => { setIsMoreMenuOpen(false); onSettingsClick?.(); }} className="hover-surface flex min-h-12 w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium"><svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"/><path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/></svg><span>{t('Settings')}</span></button>)}
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

