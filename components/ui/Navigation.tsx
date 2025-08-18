'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  Menu, 
  X, 
  Github, 
  Home, 
  Trophy, 
  Brain 
} from 'lucide-react';

interface NavigationProps {
  className?: string;
}

export const Navigation: React.FC<NavigationProps> = ({ className = '' }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: '首页', icon: Home },
    { href: '/learn', label: '学习中心', icon: Brain },
    { href: '/leaderboard', label: '排行榜', icon: Trophy },
  ];

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className={`nav-container ${className}`}>
      <div className="container">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <BookOpen className="w-8 h-8" style={{ color: 'var(--info-color)' }} />
            <span className="text-xl font-bold text-gradient">英语学习平台</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link 
                  key={item.href}
                  href={item.href as any} 
                  className={`nav-link flex items-center space-x-2 ${isActive(item.href) ? 'active' : ''}`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
            <a 
              href="https://github.com/your-repo/next-english-app-sm2" 
              target="_blank" 
              rel="noopener noreferrer"
              className="nav-link flex items-center space-x-2"
            >
              <Github className="w-4 h-4" />
              <span>GitHub</span>
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-md"
            style={{ color: 'var(--text-primary)' }}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden mt-4 pb-4 border-t"
              style={{ borderColor: 'var(--border-color)' }}
            >
              <div className="flex flex-col space-y-2 mt-4">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link 
                      key={item.href}
                      href={item.href as any} 
                      className={`nav-link flex items-center space-x-2 ${isActive(item.href) ? 'active' : ''}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
                <a 
                  href="https://github.com/your-repo/next-english-app-sm2" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="nav-link flex items-center space-x-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Github className="w-4 h-4" />
                  <span>GitHub</span>
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
};