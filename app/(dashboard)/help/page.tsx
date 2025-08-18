'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HelpCircle,
  Search,
  Book,
  MessageCircle,
  Lightbulb,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Mail,
  Phone,
  Clock,
  Users,
  Star,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';

// FAQ 数据类型
interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  tags: string[];
}

// 帮助文档类型
interface HelpDoc {
  id: string;
  title: string;
  description: string;
  category: string;
  readTime: number;
  icon: React.ComponentType<any>;
}

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);

  // FAQ 数据
  const faqData: FAQItem[] = [
    {
      id: '1',
      question: '如何开始我的英语学习之旅？',
      answer: '首先，您需要完成水平测试来确定您的英语程度。然后系统会为您推荐合适的学习内容和练习模式。建议从基础单词和简单句型开始，每天保持15-30分钟的学习时间。',
      category: 'getting-started',
      tags: ['新手', '开始', '学习']
    },
    {
      id: '2',
      question: '如何使用键盘练习功能？',
      answer: '键盘练习功能可以帮助您提高英语打字速度和准确率。进入键盘练习页面后，选择适合的练习文本和模式，然后开始输入。系统会实时显示您的WPM（每分钟单词数）和准确率。',
      category: 'features',
      tags: ['键盘', '打字', '练习']
    },
    {
      id: '3',
      question: '学习进度会自动保存吗？',
      answer: '是的，您的学习进度会自动保存在本地浏览器中。如果您注册了账户，进度还会同步到云端，确保在不同设备上都能继续学习。',
      category: 'account',
      tags: ['进度', '保存', '同步']
    },
    {
      id: '4',
      question: '如何参与排行榜？',
      answer: '排行榜功能会根据您的学习时长、准确率、连续学习天数等多个维度计算分数。只要开始学习并完成练习，您就会自动出现在排行榜中。可以在设置中选择是否公开显示您的学习成绩。',
      category: 'features',
      tags: ['排行榜', '竞争', '分数']
    },
    {
      id: '5',
      question: '支持哪些学习模式？',
      answer: '我们提供多种学习模式：百词斩（词汇练习）、汉英对照（翻译练习）、连词造句（语法练习）、键盘练习（打字练习）和口语练习。每种模式都针对不同的学习需求设计。',
      category: 'features',
      tags: ['模式', '功能', '练习']
    },
    {
      id: '6',
      question: '如何切换深色模式？',
      answer: '您可以在页面右上角找到主题切换按钮，或者在设置页面中调整界面主题。系统还支持跟随系统主题自动切换。',
      category: 'settings',
      tags: ['主题', '深色模式', '界面']
    },
    {
      id: '7',
      question: '忘记学习进度怎么办？',
      answer: '如果您清除了浏览器数据或更换设备，本地进度可能会丢失。建议注册账户并开启云端同步功能，这样可以在任何设备上恢复学习进度。',
      category: 'troubleshooting',
      tags: ['进度', '恢复', '问题']
    },
    {
      id: '8',
      question: '如何提高学习效果？',
      answer: '建议制定规律的学习计划，每天固定时间学习。多使用不同的学习模式，重点练习错误的内容。可以开启每日提醒，保持学习连续性。',
      category: 'tips',
      tags: ['效果', '建议', '技巧']
    }
  ];

  // 帮助文档数据
  const helpDocs: HelpDoc[] = [
    {
      id: 'quick-start',
      title: '快速入门指南',
      description: '5分钟了解如何使用本平台的主要功能',
      category: 'getting-started',
      readTime: 5,
      icon: Lightbulb
    },
    {
      id: 'learning-modes',
      title: '学习模式详解',
      description: '深入了解各种学习模式的使用方法和最佳实践',
      category: 'features',
      readTime: 10,
      icon: Book
    },
    {
      id: 'progress-tracking',
      title: '学习进度管理',
      description: '如何查看和管理您的学习进度与成绩',
      category: 'features',
      readTime: 7,
      icon: Users
    },
    {
      id: 'settings-guide',
      title: '设置配置指南',
      description: '个性化配置您的学习环境和偏好',
      category: 'settings',
      readTime: 8,
      icon: HelpCircle
    }
  ];

  // 分类配置
  const categories = [
    { id: 'all', label: '全部', count: faqData.length },
    { id: 'getting-started', label: '新手入门', count: faqData.filter(item => item.category === 'getting-started').length },
    { id: 'features', label: '功能使用', count: faqData.filter(item => item.category === 'features').length },
    { id: 'account', label: '账户相关', count: faqData.filter(item => item.category === 'account').length },
    { id: 'settings', label: '设置问题', count: faqData.filter(item => item.category === 'settings').length },
    { id: 'troubleshooting', label: '故障排除', count: faqData.filter(item => item.category === 'troubleshooting').length },
    { id: 'tips', label: '学习技巧', count: faqData.filter(item => item.category === 'tips').length }
  ];

  // 过滤 FAQ
  const filteredFAQs = faqData.filter(item => {
    const matchesSearch = searchQuery === '' || 
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

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
                <HelpCircle size={24} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">帮助中心</h1>
                <p className="text-gray-600 dark:text-gray-400">寻找答案，解决问题</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* 搜索和筛选 */}
        <div className="mb-8">
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="搜索问题、关键词..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* 分类筛选 */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedCategory === category.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {category.label} ({category.count})
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 主要内容区 */}
          <div className="lg:col-span-2">
            {/* 常见问题 */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">
                常见问题
                {filteredFAQs.length !== faqData.length && (
                  <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
                    ({filteredFAQs.length} 个结果)
                  </span>
                )}
              </h2>
              
              <div className="space-y-4">
                {filteredFAQs.map((faq) => (
                  <motion.div
                    key={faq.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden"
                  >
                    <button
                      onClick={() => setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)}
                      className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 pr-4">
                        {faq.question}
                      </h3>
                      <motion.div
                        animate={{ rotate: expandedFAQ === faq.id ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown size={20} className="text-gray-500 dark:text-gray-400" />
                      </motion.div>
                    </button>
                    
                    <AnimatePresence>
                      {expandedFAQ === faq.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="px-6 pb-4 border-t border-gray-200 dark:border-gray-700">
                            <div className="pt-4">
                              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                                {faq.answer}
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {faq.tags.map((tag) => (
                                  <span
                                    key={tag}
                                    className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>

              {filteredFAQs.length === 0 && (
                <div className="text-center py-12">
                  <HelpCircle size={48} className="text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    没有找到相关问题
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    试试使用其他关键词搜索，或者查看下方的帮助文档
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('all');
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    清除筛选条件
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 侧边栏 */}
          <div className="lg:col-span-1">
            {/* 帮助文档 */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                帮助文档
              </h3>
              <div className="space-y-3">
                {helpDocs.map((doc) => {
                  const Icon = doc.icon;
                  return (
                    <Link
                      key={doc.id}
                      href={`/help/docs/${doc.id}`}
                      className="block p-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <Icon size={20} className="text-blue-600 dark:text-blue-400 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                            {doc.title}
                          </h4>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            {doc.description}
                          </p>
                          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500 dark:text-gray-400">
                            <Clock size={12} />
                            <span>{doc.readTime} 分钟阅读</span>
                          </div>
                        </div>
                        <ExternalLink size={16} className="text-gray-400" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* 联系支持 */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                联系我们
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <MessageCircle size={20} className="text-blue-600 dark:text-blue-400" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">在线客服</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">工作日 9:00-18:00</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail size={20} className="text-green-600 dark:text-green-400" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">邮件支持</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">support@example.com</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone size={20} className="text-purple-600 dark:text-purple-400" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">电话咨询</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">400-123-4567</p>
                  </div>
                </div>
              </div>
              <button className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                提交反馈
              </button>
            </div>

            {/* 用户评价 */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                用户评价
              </h3>
              <div className="space-y-4">
                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} size={14} className="text-yellow-400 fill-current" />
                      ))}
                    </div>
                    <span className="text-xs text-gray-600 dark:text-gray-400">张同学</span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    "界面很清晰，功能很实用，特别是键盘练习功能帮助很大！"
                  </p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} size={14} className="text-yellow-400 fill-current" />
                      ))}
                    </div>
                    <span className="text-xs text-gray-600 dark:text-gray-400">李老师</span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    "学生们都很喜欢这个平台，游戏化的学习方式很有效果。"
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}