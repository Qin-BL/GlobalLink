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
import { useGameFlowContext } from '@/contexts/GameFlowContext';

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
  const [isHovered, setIsHovered] = React.useState(false);
  const [tooltipRef, setTooltipRef] = React.useState<HTMLDivElement | null>(null);
  const { startGameFlow } = useGameFlowContext();
  
  // 判断是否是游戏模式
  const isGameMode = ['word-blitz', 'chinese-english', 'sentence-builder', 'keyboard-practice', 'listening-practice'].includes(item.id);
  
  // 游戏模式数据映射
  const getGameModeData = (id: string) => {
    const gameModes: { [key: string]: any } = {
      'word-blitz': {
        id: 'word-blitz',
        title: '百词斩',
        subtitle: 'Word Blitz',
        description: '快速记忆单词，提升词汇量。通过图片联想记忆，让单词学习更有趣',
        icon: <Target size={24} className="text-white" />,
        difficulty: '简单',
        duration: '5-10分钟',
        popularity: 95,
        features: ['图片记忆', '快速刷题', '词汇测试'],
        gradient: 'from-blue-500 to-cyan-500',
        href: '/play/word-blitz'
      },
      'chinese-english': {
        id: 'chinese-english',
        title: '汉英对照',
        subtitle: 'Chinese to English',
        description: '中英文对照练习，加强理解。看中文翻译英文，提升语言转换能力',
        icon: <MessageSquare size={24} className="text-white" />,
        difficulty: '中等',
        duration: '10-15分钟',
        popularity: 88,
        features: ['语言转换', '句子翻译', '语法应用'],
        gradient: 'from-purple-500 to-pink-500',
        href: '/play/chinese-english'
      },
      'sentence-builder': {
        id: 'sentence-builder',
        title: '连词造句',
        subtitle: 'Sentence Builder',
        description: '拖拽单词组成句子，学习语法。通过拖拽操作练习句子结构',
        icon: <Puzzle size={24} className="text-white" />,
        difficulty: '中等',
        duration: '8-12分钟',
        popularity: 92,
        features: ['拖拽操作', '语法练习', '句型训练'],
        gradient: 'from-green-500 to-emerald-500',
        href: '/learn/sentence-builder'
      },
      'keyboard-practice': {
        id: 'keyboard-practice',
        title: '键盘练习',
        subtitle: 'Typing Practice',
        description: '提升英文打字速度和准确性。专业的打字训练系统',
        icon: <Keyboard size={24} className="text-white" />,
        difficulty: '简单',
        duration: '15-20分钟',
        popularity: 76,
        features: ['打字训练', '速度测试', '准确性练习'],
        gradient: 'from-indigo-500 to-purple-500',
        href: '/play/keyboard-practice'
      }
    };
    return gameModes[id];
  };
  
  const handleClick = (e: React.MouseEvent) => {
    if (isGameMode) {
      e.preventDefault();
      const gameData = getGameModeData(item.id);
      if (gameData) {
        startGameFlow(gameData);
      }
    }
  };
  
  return (
    <div 
      className="relative" 
      ref={setTooltipRef}
      onMouseEnter={() => {
        setIsHovered(true);
      }}
      onMouseLeave={() => {
        setIsHovered(false);
      }}
    >
      {isGameMode ? (
        <motion.div
          onClick={handleClick}
          className={`
            relative flex items-center gap-3 px-3 py-2 mx-2 rounded-lg
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
        </motion.div>
      ) : (
        <Link href={item.href as any}>
          <motion.div
            className={`
              relative flex items-center gap-3 px-3 py-2 mx-2 rounded-lg
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
          </motion.div>
        </Link>
      )}
      
      {/* 悬浮提示 - 美化样式 */}
      {isCollapsed && isHovered && tooltipRef && (
        <div 
          className="fixed px-3 py-2 rounded-lg text-sm font-medium text-white shadow-xl z-[9999] transition-all duration-200 ease-out"
          style={{
            left: '65px',
            top: tooltipRef.getBoundingClientRect().top + (tooltipRef.getBoundingClientRect().height / 2) - 16,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)',
            pointerEvents: 'none',
            transform: 'scale(1)',
            animation: 'tooltipFadeIn 0.2s ease-out'
          }}
        >
          <div className="relative">
            {item.label}
            {/* 气泡箭头 */}
            <div 
              className="absolute w-0 h-0"
              style={{
                right: '100%',
                top: '50%',
                transform: 'translateY(-50%)',
                borderTop: '6px solid transparent',
                borderBottom: '6px solid transparent',
                borderRight: '6px solid #667eea'
              }}
            />
          </div>
        </div>
      )}
    </div>
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
        className="hidden lg:flex flex-col relative"
        style={{
          background: 'var(--secondary-dark)',
          borderRight: '1px solid var(--border-color)',
          overflowX: 'visible',
        }}
      >
        {/* 头部 - Logo区域 */}
        <div className={`${sidebarCollapsed ? 'h-16' : 'h-16'} px-3 flex items-center justify-center`} style={{ borderBottom: '1px solid var(--border-color)' }}>
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
                  className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                  style={{ background: 'var(--gradient-primary)' }}
                >
                  <BookOpen size={20} className="text-white" />
                </motion.div>
              </Link>
            )}
          </AnimatePresence>
        </div>
        
        {/* 导航内容 */}
        <div className="flex-1 overflow-y-auto py-2 hide-scrollbar" style={{ overflowX: 'visible' }}>
          {navigationGroups.map((group) => (
            <NavGroup
              key={group.id}
              group={group}
              isCollapsed={sidebarCollapsed}
              pathname={pathname}
            />
          ))}
        </div>
        
        {/* 边缘展开/收起按钮 */}
        <motion.button
          onClick={toggleSidebar}
          className="absolute top-1/2 -right-6 w-6 h-12 rounded-r-lg transition-colors duration-200 hover:bg-white/10 flex items-center justify-center z-10"
          style={{ 
            color: 'var(--text-muted)',
            background: 'var(--secondary-dark)',
            borderTop: '1px solid var(--border-color)',
            borderRight: '1px solid var(--border-color)',
            borderBottom: '1px solid var(--border-color)'
          }}
          initial={{ y: '-50%' }}
          animate={{ y: '-50%' }}
          whileHover={{ scale: 1.05, y: '-50%' }}
          whileTap={{ scale: 0.95, y: '-50%' }}
          title={sidebarCollapsed ? "展开侧边栏" : "收缩侧边栏"}
        >
          {sidebarCollapsed ? (
            <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
          ) : (
            <ChevronLeft size={14} style={{ color: 'var(--text-muted)' }} />
          )}
        </motion.button>
        
        {/* 底部用户信息和主题切换 */}
        <div className="p-4 space-y-4" style={{ borderTop: '1px solid var(--border-color)' }}>
          {/* 主题切换按钮 */}
          <div className={`flex items-center ${sidebarCollapsed ? 'justify-center px-2' : 'justify-between'}`}>
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
            <div className={sidebarCollapsed ? 'scale-75' : ''}>
              <ThemeToggle />
            </div>
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