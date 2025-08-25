import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 布局状态接口
interface LayoutState {
  // 侧边栏状态
  sidebarCollapsed: boolean;
  sidebarWidth: number;
  
  // 移动端菜单状态
  mobileMenuOpen: boolean;
  
  // 顶部导航状态
  topNavHeight: number;
  
  // 搜索状态
  searchQuery: string;
  searchFocused: boolean;
  
  // 主题相关
  isDarkMode: boolean;
  
  // 页面状态
  currentPage: string;
  breadcrumbs: { label: string; href: string }[];
}

// 布局操作接口
interface LayoutActions {
  // 侧边栏操作
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  
  // 移动端菜单操作
  toggleMobileMenu: () => void;
  closeMobileMenu: () => void;
  
  // 搜索操作
  setSearchQuery: (query: string) => void;
  setSearchFocused: (focused: boolean) => void;
  clearSearch: () => void;
  
  // 主题操作
  toggleDarkMode: () => void;
  setDarkMode: (isDark: boolean) => void;
  
  // 页面导航操作
  setCurrentPage: (page: string) => void;
  setBreadcrumbs: (breadcrumbs: { label: string; href: string }[]) => void;
  
  // 重置状态
  resetLayout: () => void;
}

// 合并状态和操作
type LayoutStore = LayoutState & LayoutActions;

// 默认状态
const defaultState: LayoutState = {
  sidebarCollapsed: true,
  sidebarWidth: 64,
  mobileMenuOpen: false,
  topNavHeight: 64,
  searchQuery: '',
  searchFocused: false,
  isDarkMode: true, // 默认深色模式
  currentPage: '首页',
  breadcrumbs: [{ label: '首页', href: '/dashboard' }],
};

// 创建布局状态存储
export const useLayoutStore = create<LayoutStore>()(
  persist(
    (set, get) => ({
      ...defaultState,
      
      // 侧边栏操作
      toggleSidebar: () => {
        set((state) => ({ 
          sidebarCollapsed: !state.sidebarCollapsed,
          sidebarWidth: state.sidebarCollapsed ? 280 : 64
        }));
      },
      
      setSidebarCollapsed: (collapsed: boolean) => {
        set({ 
          sidebarCollapsed: collapsed,
          sidebarWidth: collapsed ? 64 : 280
        });
      },
      
      // 移动端菜单操作
      toggleMobileMenu: () => {
        set((state) => ({ mobileMenuOpen: !state.mobileMenuOpen }));
      },
      
      closeMobileMenu: () => {
        set({ mobileMenuOpen: false });
      },
      
      // 搜索操作
      setSearchQuery: (query: string) => {
        set({ searchQuery: query });
      },
      
      setSearchFocused: (focused: boolean) => {
        set({ searchFocused: focused });
      },
      
      clearSearch: () => {
        set({ searchQuery: '', searchFocused: false });
      },
      
      // 主题操作
      toggleDarkMode: () => {
        set((state) => ({ isDarkMode: !state.isDarkMode }));
      },
      
      setDarkMode: (isDark: boolean) => {
        set({ isDarkMode: isDark });
      },
      
      // 页面导航操作
      setCurrentPage: (page: string) => {
        set({ currentPage: page });
      },
      
      setBreadcrumbs: (breadcrumbs: { label: string; href: string }[]) => {
        set({ breadcrumbs });
      },
      
      // 重置状态
      resetLayout: () => {
        set(defaultState);
      },
    }),
    {
      name: 'layout-storage', // 本地存储key
      version: 1, // 增加版本号，当版本变化时会重置存储
      partialize: (state) => ({ 
        sidebarCollapsed: state.sidebarCollapsed,
        isDarkMode: state.isDarkMode,
        searchQuery: state.searchQuery,
      }), // 只持久化部分状态
    }
  )
);

// 自定义hooks
export const useLayoutActions = () => {
  const actions = useLayoutStore((state) => ({
    toggleSidebar: state.toggleSidebar,
    setSidebarCollapsed: state.setSidebarCollapsed,
    toggleMobileMenu: state.toggleMobileMenu,
    closeMobileMenu: state.closeMobileMenu,
    setSearchQuery: state.setSearchQuery,
    setSearchFocused: state.setSearchFocused,
    clearSearch: state.clearSearch,
    toggleDarkMode: state.toggleDarkMode,
    setDarkMode: state.setDarkMode,
    setCurrentPage: state.setCurrentPage,
    setBreadcrumbs: state.setBreadcrumbs,
    resetLayout: state.resetLayout,
  }));
  
  return actions;
};

export const useLayoutState = () => {
  const state = useLayoutStore((state) => ({
    sidebarCollapsed: state.sidebarCollapsed,
    sidebarWidth: state.sidebarWidth,
    mobileMenuOpen: state.mobileMenuOpen,
    topNavHeight: state.topNavHeight,
    searchQuery: state.searchQuery,
    searchFocused: state.searchFocused,
    isDarkMode: state.isDarkMode,
    currentPage: state.currentPage,
    breadcrumbs: state.breadcrumbs,
  }));
  
  return state;
};