'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  BookOpen, 
  Gamepad2, 
  Trophy, 
  Settings, 
  User,
  ChevronLeft,
  ChevronRight,
  Search,
  Target,
  Puzzle,
  MessageSquare,
  Keyboard,
  Library,
  Award,
  BarChart3,
  HelpCircle
} from 'lucide-react';
import { useLayoutStore } from '@/store/layout';
import { ThemeToggle } from '@/components/theme-toggle';

// 导航菜单数据
const navigationGroups = [
  {
    id: 'main',
    label: '主要功能',
    items: [
      {
        id: 'home',
        label: '首页',
        href: '/dashboard',
        icon: Home,
        badge: null,
      },
      {
        id: 'courses',
        label: '课程中心',
        href: '/courses',
        icon: Library,
        badge: null,
      },
      {
        id: 'learning',
        label: '学习中心',
        href: '/learn',
        icon: BookOpen,
        badge: null,
      },
    ],
  },
  {
    id: 'games',
    label: '游戏模式',
    items: [
      {
        id: 'word-blitz',
        label: '百词斩',
        href: '/play/word-blitz',
        icon: Target,
        badge: null,
      },
      {
        id: 'chinese-english',
        label: '汉英对照',
        href: '/play/chinese-english',
        icon: MessageSquare,
        badge: null,
      },
      {
        id: 'sentence-builder',
        label: '连词造句',
        href: '/learn/sentence-builder',
        icon: Puzzle,
        badge: null,
      },
      {
        id: 'keyboard-practice',
        label: '键盘练习',
        href: '/play/keyboard-practice',
        icon: Keyboard,
        badge: 'NEW',
      },
    ],
  },
  {
    id: 'progress',
    label: '进度统计',
    items: [
      {
        id: 'leaderboard',
        label: '排行榜',
        href: '/leaderboard',
        icon: Trophy,
        badge: null,
      },
      {
        id: 'analytics',
        label: '学习统计',
        href: '/analytics',
        icon: BarChart3,
        badge: null,
      },
      {
        id: 'achievements',
        label: '成就系统',
        href: '/achievements',
        icon: Award,
        badge: null,
      },
    ],
  },
  {
    id: 'personal',
    label: '个人中心',
    items: [
      {
        id: 'profile',
        label: '个人资料',
        href: '/profile',
        icon: User,
        badge: null,
      },
      {
        id: 'settings',
        label: '系统设置',
        href: '/settings',
        icon: Settings,
        badge: null,
      },
      {
        id: 'help',
        label: '帮助中心',
        href: '/help',
        icon: HelpCircle,
        badge: null,
      },
    ],
  },
];

// 导航项组件
interface NavItemProps {
  item: {
    id: string;
    label: string;
    href: string;
    icon: React.ComponentType<any>;
    badge?: string | null;
  };
  isCollapsed: boolean;
  isActive: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ item, isCollapsed, isActive }) => {
  const Icon = item.icon;
  
  return (
    <Link href={item.href as any}>
      <motion.div
        className={`
          relative group flex items-center gap-3 px-3 py-2 mx-2 rounded-lg
          transition-all duration-200 cursor-pointer
          ${isActive 
            ? 'bg-gradient-primary text-white shadow-lg border-0' 
            : 'text-text-secondary hover:text-text-primary hover:bg-hover-bg border border-transparent hover:border-info'
          }
        `}
        style={{
          background: isActive ? 'var(--gradient-primary)' : undefined,
          color: isActive ? 'white' : 'var(--text-secondary)',
        }}
        whileHover={{ x: 2 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* 图标 */}
        <div className="flex-shrink-0">
          <Icon 
            size={18} 
            className={`${isActive ? 'text-white' : 'text-current'}`}
          />
        </div>
        
        {/* 文本标签 - 展开状态显示 */}
        <AnimatePresence>
          {!isCollapsed && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="flex-1 text-sm font-medium whitespace-nowrap"
            >
              {item.label}
            </motion.span>
          )}
        </AnimatePresence>
        
        {/* 徽章 */}
        {item.badge && !isCollapsed && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="px-1.5 py-0.5 text-xs font-semibold rounded-full bg-gradient-secondary text-white"
          >
            {item.badge}
          </motion.span>
        )}
        
        {/* 折叠状态的工具提示 */}
        {isCollapsed && (
          <div className="absolute left-full ml-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 whitespace-nowrap">
            <span className="text-sm text-gray-900 dark:text-gray-100">{item.label}</span>
            {item.badge && (
              <span className="ml-2 px-2 py-0.5 text-xs font-semibold rounded-full bg-gradient-secondary text-white">
                {item.badge}
              </span>
            )}
          </div>
        )}
      </motion.div>
    </Link>
  );
};

// 导航组组件
interface NavGroupProps {
  group: {
    id: string;
    label: string;
    items: any[];
  };
  isCollapsed: boolean;
  pathname: string;
}

const NavGroup: React.FC<NavGroupProps> = ({ group, isCollapsed, pathname }) => {
  return (
    <div className="mb-4">
      {/* 组标题 - 展开状态显示 */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="px-4 mb-2"
          >
            <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              {group.label}
            </h3>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* 导航项列表 */}
      <nav className="space-y-0.5">
        {group.items.map((item) => (
          <NavItem
            key={item.id}
            item={item}
            isCollapsed={isCollapsed}
            isActive={pathname === item.href}
          />
        ))}
      </nav>
    </div>
  );
};

// 主要侧边栏组件
const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { sidebarCollapsed, sidebarWidth } = useLayoutStore();
  const { toggleSidebar } = useLayoutStore();
  
  return (
    <>
      {/* 桌面端侧边栏 */}
      <motion.aside
        animate={{ 
          width: sidebarWidth,
        }}
        transition={{ 
          duration: 0.3,
          ease: [0.4, 0.0, 0.2, 1],
        }}
        className="hidden lg:flex flex-col"
        style={{
          background: 'var(--secondary-dark)',
          borderRight: '1px solid var(--border-color)',
        }}
      >
        {/* 头部 - Logo区域 */}
        <div className="flex items-center justify-between h-16 px-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
          <AnimatePresence>
            {!sidebarCollapsed ? (
              <Link href="/">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--gradient-primary)' }}>
                    <BookOpen size={20} className="text-white" />
                  </div>
                  <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                    English Learning
                  </h1>
                </motion.div>
              </Link>
            ) : (
              <Link href="/">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto cursor-pointer hover:opacity-80 transition-opacity"
                  style={{ background: 'var(--gradient-primary)' }}
                >
                  <BookOpen size={20} className="text-white" />
                </motion.div>
              </Link>
            )}
          </AnimatePresence>
          
          {/* 折叠按钮 */}
          <motion.button
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg transition-colors duration-200"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--hover-bg)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {sidebarCollapsed ? (
              <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
            ) : (
              <ChevronLeft size={16} style={{ color: 'var(--text-muted)' }} />
            )}
          </motion.button>
        </div>
        
        {/* 导航内容 */}
        <div className="flex-1 overflow-y-auto py-2 hide-scrollbar">
          {navigationGroups.map((group) => (
            <NavGroup
              key={group.id}
              group={group}
              isCollapsed={sidebarCollapsed}
              pathname={pathname}
            />
          ))}
        </div>
        
        {/* 底部用户信息和主题切换 */}
        <div className="p-4 space-y-4" style={{ borderTop: '1px solid var(--border-color)' }}>
          {/* 主题切换按钮 */}
          <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
            <AnimatePresence>
              {!sidebarCollapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="text-sm font-medium"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  主题
                </motion.span>
              )}
            </AnimatePresence>
            <ThemeToggle />
          </div>
          
          {/* 用户信息 */}
          <div className={`flex items-center gap-3 ${sidebarCollapsed ? 'justify-center' : ''}`}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--gradient-secondary)' }}>
              <User size={16} className="text-white" />
            </div>
            <AnimatePresence>
              {!sidebarCollapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="flex-1"
                >
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>学习者</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>等级: 初学者</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.aside>
      
      {/* 移动端侧边栏 - 暂时隐藏，后续实现 */}
      {/* TODO: 实现移动端抽屉式侧边栏 */}
    </>
  );
};

export default Sidebar;