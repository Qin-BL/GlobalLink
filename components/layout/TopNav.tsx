'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Menu, 
  Bell, 
  Settings, 
  User, 
  Moon, 
  Sun,
  Home,
  ChevronRight,
  X,
  Filter,
  TrendingUp,
  Clock,
  Star
} from 'lucide-react';
import { useLayoutStore } from '@/store/layout';
import { useTheme } from '@/components/theme-provider';

// 搜索建议数据
const searchSuggestions = [
  { id: '1', type: 'course', title: '基础英语语法', category: '语法课程', popularity: 95 },
  { id: '2', type: 'game', title: '单词记忆游戏', category: '游戏模式', popularity: 88 },
  { id: '3', type: 'lesson', title: '日常对话练习', category: '口语练习', popularity: 92 },
  { id: '4', type: 'exercise', title: '连词造句训练', category: '语法练习', popularity: 85 },
  { id: '5', type: 'vocabulary', title: '高频词汇表', category: '词汇学习', popularity: 90 },
];

// 通知数据
const notifications = [
  {
    id: '1',
    type: 'achievement',
    title: '恭喜获得新成就！',
    message: '完成连续7天学习',
    time: '2分钟前',
    unread: true,
  },
  {
    id: '2',
    type: 'course',
    title: '新课程推荐',
    message: '适合您水平的高级语法课程',
    time: '1小时前',
    unread: true,
  },
  {
    id: '3',
    type: 'reminder',
    title: '学习提醒',
    message: '今天还没有完成学习目标',
    time: '3小时前',
    unread: false,
  },
];

// 面包屑组件
interface BreadcrumbProps {
  items: { label: string; href: string }[];
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => {
  return (
    <nav className="flex items-center space-x-2 text-sm">
      {items.map((item, index) => (
        <div key={item.href} className="flex items-center">
          {index > 0 && (
            <ChevronRight size={14} className="mx-2 text-text-muted" />
          )}
          {index === items.length - 1 ? (
            <span className="text-text-primary font-medium">{item.label}</span>
          ) : (
            <a 
              href={item.href}
              className="text-text-secondary hover:text-text-primary transition-colors"
            >
              {item.label}
            </a>
          )}
        </div>
      ))}
    </nav>
  );
};

// 搜索下拉组件
interface SearchDropdownProps {
  isOpen: boolean;
  query: string;
  onClose: () => void;
}

const SearchDropdown: React.FC<SearchDropdownProps> = ({ isOpen, query, onClose }) => {
  const filteredSuggestions = query 
    ? searchSuggestions.filter(item => 
        item.title.toLowerCase().includes(query.toLowerCase())
      )
    : searchSuggestions.slice(0, 5);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="absolute top-full left-0 right-0 mt-2 bg-card-dark border border-border-color rounded-xl shadow-xl z-50 overflow-hidden"
        >
          {/* 搜索结果标题 */}
          <div className="px-4 py-3 border-b border-border-color">
            <h3 className="text-sm font-medium text-text-primary">
              {query ? `"${query}" 的搜索结果` : '热门推荐'}
            </h3>
          </div>
          
          {/* 搜索建议列表 */}
          <div className="max-h-80 overflow-y-auto">
            {filteredSuggestions.length > 0 ? (
              filteredSuggestions.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="px-4 py-3 hover:bg-hover cursor-pointer transition-colors group"
                  onClick={onClose}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-text-primary group-hover:text-white">
                        {item.title}
                      </h4>
                      <p className="text-xs text-text-muted mt-1">
                        {item.category}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <TrendingUp size={12} className="text-success" />
                        <span className="text-xs text-text-muted">{item.popularity}%</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="px-4 py-8 text-center">
                <p className="text-text-muted">未找到相关内容</p>
              </div>
            )}
          </div>
          
          {/* 搜索底部 */}
          <div className="px-4 py-3 border-t border-border-color bg-secondary-dark">
            <button className="text-sm text-info hover:text-white transition-colors">
              查看所有搜索结果 →
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// 通知下拉组件
interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ isOpen, onClose }) => {
  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="absolute top-full right-0 mt-2 w-80 bg-card-dark border border-border-color rounded-xl shadow-xl z-50 overflow-hidden"
        >
          {/* 通知标题 */}
          <div className="px-4 py-3 border-b border-border-color flex items-center justify-between">
            <h3 className="text-sm font-medium text-text-primary">
              通知中心
            </h3>
            {unreadCount > 0 && (
              <span className="px-2 py-1 text-xs bg-gradient-secondary rounded-full text-white">
                {unreadCount} 条未读
              </span>
            )}
          </div>
          
          {/* 通知列表 */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.map((notification, index) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`px-4 py-3 hover:bg-hover cursor-pointer transition-colors border-l-2 ${
                  notification.unread ? 'border-l-info bg-info/5' : 'border-l-transparent'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    notification.unread ? 'bg-info' : 'bg-border-color'
                  }`} />
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-text-primary">
                      {notification.title}
                    </h4>
                    <p className="text-xs text-text-secondary mt-1">
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-1 mt-2">
                      <Clock size={10} className="text-text-muted" />
                      <span className="text-xs text-text-muted">{notification.time}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          
          {/* 通知底部 */}
          <div className="px-4 py-3 border-t border-border-color bg-secondary-dark text-center">
            <button className="text-sm text-info hover:text-white transition-colors">
              查看所有通知
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// 主要顶部导航栏组件
const TopNav: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  
  const { 
    sidebarCollapsed, 
    sidebarWidth, 
    searchQuery, 
    searchFocused,
    currentPage,
    breadcrumbs,
    mobileMenuOpen 
  } = useLayoutStore();
  
  const { 
    toggleSidebar, 
    setSearchQuery, 
    setSearchFocused,
    toggleMobileMenu 
  } = useLayoutStore();
  
  const { theme, toggleTheme } = useTheme();

  // 本地状态
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  
  // 处理屏幕尺寸变化
  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    
    // 初始化
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // 关闭所有下拉菜单
  const closeAllDropdowns = () => {
    setSearchFocused(false);
    setNotificationOpen(false);
    setUserMenuOpen(false);
  };

  // 处理搜索输入
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // 处理搜索焦点
  const handleSearchFocus = () => {
    setSearchFocused(true);
    setNotificationOpen(false);
    setUserMenuOpen(false);
  };

  return (
    <header 
      className="fixed top-0 right-0 z-50 h-16 backdrop-blur transition-all duration-300"
      style={{
        left: isDesktop ? `${sidebarWidth}px` : '0',
        background: 'var(--secondary-dark)',
        borderBottom: '1px solid var(--border-color)',
      }}
    >
      <div className="h-full flex items-center px-4">
        {/* 移动端菜单按钮 */}
        <button
          onClick={toggleMobileMenu}
          className="lg:hidden p-2 rounded-lg hover:bg-hover transition-colors mr-3"
        >
          <Menu size={20} className="text-text-secondary" />
        </button>
        
        {/* 面包屑导航 */}
        <div className="hidden md:flex items-center flex-1">
          <Breadcrumb items={breadcrumbs} />
        </div>
        
        {/* 移动端页面标题 */}
        <div className="md:hidden flex-1">
          <h1 className="text-lg font-semibold text-text-primary">{currentPage}</h1>
        </div>
        
        {/* 右侧操作区 */}
        <div className="flex items-center gap-3">
          {/* 搜索框 */}
          <div className="relative hidden sm:block">
            <div className="relative">
              <Search 
                size={16} 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted" 
              />
              <input
                type="text"
                placeholder="搜索课程、游戏..."
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={handleSearchFocus}
                className="w-64 pl-10 pr-4 py-2 bg-secondary-dark border border-border-color rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:border-info focus:ring-1 focus:ring-info/20 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-muted hover:text-text-primary"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            
            {/* 搜索下拉 */}
            <SearchDropdown
              isOpen={searchFocused}
              query={searchQuery}
              onClose={closeAllDropdowns}
            />
          </div>
          
          {/* 移动端搜索按钮 */}
          <button className="sm:hidden p-2 rounded-lg hover:bg-hover transition-colors">
            <Search size={20} className="text-text-secondary" />
          </button>
          
          {/* 主题切换 */}
          <motion.button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-hover transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {theme === 'dark' ? (
              <Sun size={20} className="text-text-secondary" />
            ) : (
              <Moon size={20} className="text-text-secondary" />
            )}
          </motion.button>
          
          {/* 通知按钮 */}
          <div className="relative">
            <motion.button
              onClick={() => {
                setNotificationOpen(!notificationOpen);
                setSearchFocused(false);
                setUserMenuOpen(false);
              }}
              className="relative p-2 rounded-lg hover:bg-hover transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Bell size={20} className="text-text-secondary" />
              {/* 未读通知徽章 */}
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-secondary rounded-full flex items-center justify-center text-xs text-white font-semibold">
                2
              </span>
            </motion.button>
            
            {/* 通知下拉 */}
            <NotificationDropdown
              isOpen={notificationOpen}
              onClose={closeAllDropdowns}
            />
          </div>
          
          {/* 用户头像 */}
          <div className="relative">
            <motion.button
              onClick={() => {
                setUserMenuOpen(!userMenuOpen);
                setNotificationOpen(false);
                setSearchFocused(false);
              }}
              className="flex items-center gap-2 p-1 rounded-lg hover:bg-hover transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="w-8 h-8 bg-gradient-secondary rounded-full flex items-center justify-center">
                <User size={16} className="text-white" />
              </div>
              <span className="hidden md:block text-sm text-text-primary font-medium">
                学习者
              </span>
            </motion.button>
            
            {/* 用户菜单下拉 - 后续实现 */}
          </div>
        </div>
      </div>
      
      {/* 点击外部关闭下拉菜单 */}
      {(searchFocused || notificationOpen || userMenuOpen) && (
        <div
          className="fixed inset-0 z-40"
          onClick={closeAllDropdowns}
        />
      )}
    </header>
  );
};

export default TopNav;