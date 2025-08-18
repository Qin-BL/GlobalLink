'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Settings as SettingsIcon,
  User,
  Bell,
  Globe,
  Volume2,
  Monitor,
  Palette,
  Database,
  Shield,
  Info,
  ArrowLeft,
  Check,
  X
} from 'lucide-react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle';

// 设置分类
interface SettingsSection {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  items: SettingItem[];
}

interface SettingItem {
  id: string;
  title: string;
  description: string;
  type: 'toggle' | 'select' | 'range' | 'input';
  value: any;
  options?: { label: string; value: any }[];
  min?: number;
  max?: number;
  step?: number;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    // 个人资料设置
    username: '学习者',
    email: 'learner@example.com',
    level: 'beginner',
    
    // 通知设置
    enableNotifications: true,
    dailyReminder: true,
    achievementNotifications: true,
    weeklyReport: false,
    
    // 学习设置
    difficultyLevel: 'intermediate',
    autoPlay: true,
    repeatIncorrect: true,
    showTranslation: true,
    practiceTime: 30,
    
    // 界面设置
    language: 'zh-CN',
    fontSize: 16,
    animationSpeed: 'normal',
    
    // 音频设置
    voiceVolume: 80,
    effectVolume: 60,
    autoPlayAudio: true,
    
    // 数据设置
    saveProgress: true,
    syncCloud: false,
    autoBackup: true,
    
    // 隐私设置
    analytics: true,
    personalizedContent: true,
    shareProgress: false,
  });

  // 更新设置
  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    // TODO: 保存到本地存储或服务器
  };

  // 设置配置
  const settingsSections: SettingsSection[] = [
    {
      id: 'profile',
      title: '个人资料',
      description: '管理您的个人信息和学习偏好',
      icon: User,
      items: [
        {
          id: 'username',
          title: '用户名',
          description: '您在平台上显示的名称',
          type: 'input',
          value: settings.username
        },
        {
          id: 'email',
          title: '邮箱地址',
          description: '用于接收通知和找回密码',
          type: 'input',
          value: settings.email
        },
        {
          id: 'level',
          title: '学习水平',
          description: '选择您当前的英语水平',
          type: 'select',
          value: settings.level,
          options: [
            { label: '初学者', value: 'beginner' },
            { label: '初级', value: 'elementary' },
            { label: '中级', value: 'intermediate' },
            { label: '中高级', value: 'upper-intermediate' },
            { label: '高级', value: 'advanced' },
            { label: '专家', value: 'expert' }
          ]
        }
      ]
    },
    {
      id: 'notifications',
      title: '通知设置',
      description: '控制各种通知和提醒',
      icon: Bell,
      items: [
        {
          id: 'enableNotifications',
          title: '启用通知',
          description: '接收学习提醒和成就通知',
          type: 'toggle',
          value: settings.enableNotifications
        },
        {
          id: 'dailyReminder',
          title: '每日学习提醒',
          description: '每天提醒您完成学习任务',
          type: 'toggle',
          value: settings.dailyReminder
        },
        {
          id: 'achievementNotifications',
          title: '成就通知',
          description: '获得新成就时收到通知',
          type: 'toggle',
          value: settings.achievementNotifications
        },
        {
          id: 'weeklyReport',
          title: '每周学习报告',
          description: '每周发送学习进度总结',
          type: 'toggle',
          value: settings.weeklyReport
        }
      ]
    },
    {
      id: 'learning',
      title: '学习设置',
      description: '自定义学习体验和难度',
      icon: Globe,
      items: [
        {
          id: 'difficultyLevel',
          title: '默认难度',
          description: '新内容的默认难度级别',
          type: 'select',
          value: settings.difficultyLevel,
          options: [
            { label: '简单', value: 'easy' },
            { label: '中等', value: 'intermediate' },
            { label: '困难', value: 'hard' },
            { label: '自适应', value: 'adaptive' }
          ]
        },
        {
          id: 'autoPlay',
          title: '自动播放',
          description: '自动播放下一个练习项目',
          type: 'toggle',
          value: settings.autoPlay
        },
        {
          id: 'repeatIncorrect',
          title: '重复错题',
          description: '自动重复答错的题目',
          type: 'toggle',
          value: settings.repeatIncorrect
        },
        {
          id: 'showTranslation',
          title: '显示翻译',
          description: '在练习中显示中文翻译',
          type: 'toggle',
          value: settings.showTranslation
        },
        {
          id: 'practiceTime',
          title: '每日练习时间',
          description: '建议的每日学习时间（分钟）',
          type: 'range',
          value: settings.practiceTime,
          min: 10,
          max: 120,
          step: 5
        }
      ]
    },
    {
      id: 'interface',
      title: '界面设置',
      description: '自定义应用外观和布局',
      icon: Palette,
      items: [
        {
          id: 'language',
          title: '界面语言',
          description: '选择应用界面显示语言',
          type: 'select',
          value: settings.language,
          options: [
            { label: '简体中文', value: 'zh-CN' },
            { label: '繁體中文', value: 'zh-TW' },
            { label: 'English', value: 'en-US' }
          ]
        },
        {
          id: 'fontSize',
          title: '字体大小',
          description: '调整文本显示大小',
          type: 'range',
          value: settings.fontSize,
          min: 12,
          max: 24,
          step: 2
        },
        {
          id: 'animationSpeed',
          title: '动画速度',
          description: '界面动画和过渡效果速度',
          type: 'select',
          value: settings.animationSpeed,
          options: [
            { label: '慢速', value: 'slow' },
            { label: '正常', value: 'normal' },
            { label: '快速', value: 'fast' },
            { label: '关闭', value: 'none' }
          ]
        }
      ]
    },
    {
      id: 'audio',
      title: '音频设置',
      description: '调整音量和音频播放选项',
      icon: Volume2,
      items: [
        {
          id: 'voiceVolume',
          title: '语音音量',
          description: '调整语音播放音量',
          type: 'range',
          value: settings.voiceVolume,
          min: 0,
          max: 100,
          step: 5
        },
        {
          id: 'effectVolume',
          title: '音效音量',
          description: '调整按钮和通知音效音量',
          type: 'range',
          value: settings.effectVolume,
          min: 0,
          max: 100,
          step: 5
        },
        {
          id: 'autoPlayAudio',
          title: '自动播放音频',
          description: '显示内容时自动播放发音',
          type: 'toggle',
          value: settings.autoPlayAudio
        }
      ]
    },
    {
      id: 'data',
      title: '数据管理',
      description: '管理学习数据和备份设置',
      icon: Database,
      items: [
        {
          id: 'saveProgress',
          title: '保存学习进度',
          description: '本地保存学习进度和成绩',
          type: 'toggle',
          value: settings.saveProgress
        },
        {
          id: 'syncCloud',
          title: '云端同步',
          description: '将数据同步到云端（需要登录）',
          type: 'toggle',
          value: settings.syncCloud
        },
        {
          id: 'autoBackup',
          title: '自动备份',
          description: '定期自动备份学习数据',
          type: 'toggle',
          value: settings.autoBackup
        }
      ]
    },
    {
      id: 'privacy',
      title: '隐私设置',
      description: '控制数据收集和分享选项',
      icon: Shield,
      items: [
        {
          id: 'analytics',
          title: '使用情况分析',
          description: '帮助改进应用功能（匿名数据）',
          type: 'toggle',
          value: settings.analytics
        },
        {
          id: 'personalizedContent',
          title: '个性化内容',
          description: '根据学习习惯推荐内容',
          type: 'toggle',
          value: settings.personalizedContent
        },
        {
          id: 'shareProgress',
          title: '分享学习进度',
          description: '在排行榜中显示学习成绩',
          type: 'toggle',
          value: settings.shareProgress
        }
      ]
    }
  ];

  // 渲染设置项
  const renderSettingItem = (item: SettingItem) => {
    switch (item.type) {
      case 'toggle':
        return (
          <button
            onClick={() => updateSetting(item.id, !item.value)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              item.value ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                item.value ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        );

      case 'select':
        return (
          <select
            value={item.value}
            onChange={(e) => updateSetting(item.id, e.target.value)}
            className="mt-1 block w-32 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          >
            {item.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'range':
        return (
          <div className="flex items-center gap-4">
            <input
              type="range"
              min={item.min}
              max={item.max}
              step={item.step}
              value={item.value}
              onChange={(e) => updateSetting(item.id, parseInt(e.target.value))}
              className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100 w-12 text-right">
              {item.value}{item.id.includes('Volume') ? '%' : item.id === 'practiceTime' ? 'min' : item.id === 'fontSize' ? 'px' : ''}
            </span>
          </div>
        );

      case 'input':
        return (
          <input
            type={item.id === 'email' ? 'email' : 'text'}
            value={item.value}
            onChange={(e) => updateSetting(item.id, e.target.value)}
            className="mt-1 block w-64 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 页面头部 */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <Link 
              href="/"
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-600 dark:text-gray-400" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <SettingsIcon size={24} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">系统设置</h1>
                <p className="text-gray-600 dark:text-gray-400">个性化您的学习体验</p>
              </div>
            </div>
          </div>
          
          {/* 主题切换 */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">深色模式</span>
            <ThemeToggle />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="space-y-8">
          {settingsSections.map((section) => {
            const Icon = section.icon;
            return (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                {/* 分区头部 */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <Icon size={20} className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {section.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {section.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 设置项列表 */}
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {section.items.map((item) => (
                    <div key={item.id} className="px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 pr-6">
                          <div className="flex items-center gap-3">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {item.title}
                            </h4>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {item.description}
                          </p>
                        </div>
                        <div className="flex-shrink-0">
                          {renderSettingItem(item)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}

          {/* 危险操作区域 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-xl border border-red-200 dark:border-red-800 overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <Shield size={20} className="text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-red-900 dark:text-red-100">
                    危险操作
                  </h3>
                  <p className="text-sm text-red-600 dark:text-red-400">
                    这些操作无法撤销，请谨慎操作
                  </p>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    清除所有学习数据
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    删除所有学习进度、成绩和个人设置
                  </p>
                </div>
                <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors">
                  清除数据
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    重置所有设置
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    将所有设置恢复为默认值
                  </p>
                </div>
                <button className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors">
                  重置设置
                </button>
              </div>
            </div>
          </motion.div>

          {/* 版本信息 */}
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            <p>English Learning App v1.0.0</p>
            <p className="mt-1">© 2024 学习平台. 保留所有权利.</p>
          </div>
        </div>
      </div>
    </div>
  );
}