// app/dashboard/community/page.tsx - 学习社区页面
'use client'

import { useState, useEffect } from 'react'
import { UserAnalytics } from '@/src/lib/analytics'

interface CommunityUser {
  id: string
  username: string
  avatar: string
  level: number
  wordsLearned: number
  streakDays: number
  isOnline: boolean
  lastActive: string
}

interface StudyGroup {
  id: string
  name: string
  description: string
  memberCount: number
  category: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  isJoined: boolean
}

interface ForumPost {
  id: string
  title: string
  content: string
  author: CommunityUser
  replies: number
  likes: number
  isLiked: boolean
  createdAt: string
  category: string
}

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'groups' | 'forum'>('leaderboard')
  const [leaderboard, setLeaderboard] = useState<CommunityUser[]>([])
  const [studyGroups, setStudyGroups] = useState<StudyGroup[]>([])
  const [forumPosts, setForumPosts] = useState<ForumPost[]>([])
  const [onlineUsers, setOnlineUsers] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCommunityData()
  }, [activeTab])

  // 加载社区数据
  const loadCommunityData = async () => {
    try {
      setLoading(true)
      
      // 模拟社区数据（实际项目中从 API 获取）
      if (activeTab === 'leaderboard') {
        const mockLeaderboard: CommunityUser[] = [
          {
            id: '1',
            username: '英语小达人',
            avatar: '/avatars/user1.jpg',
            level: 15,
            wordsLearned: 1250,
            streakDays: 45,
            isOnline: true,
            lastActive: '刚刚'
          },
          {
            id: '2',
            username: '学霸君',
            avatar: '/avatars/user2.jpg',
            level: 12,
            wordsLearned: 980,
            streakDays: 32,
            isOnline: false,
            lastActive: '2分钟前'
          },
          {
            id: '3',
            username: '词汇王者',
            avatar: '/avatars/user3.jpg',
            level: 18,
            wordsLearned: 1580,
            streakDays: 28,
            isOnline: true,
            lastActive: '刚刚'
          }
        ]
        setLeaderboard(mockLeaderboard)
      }

      if (activeTab === 'groups') {
        const mockGroups: StudyGroup[] = [
          {
            id: '1',
            name: '每日单词打卡',
            description: '每天学习20个新单词，互相监督，共同进步',
            memberCount: 128,
            category: '词汇学习',
            difficulty: 'intermediate',
            isJoined: true
          },
          {
            id: '2',
            name: '托福备考群',
            description: '专门针对托福考试的词汇和阅读练习',
            memberCount: 89,
            category: '考试备考',
            difficulty: 'advanced',
            isJoined: false
          },
          {
            id: '3',
            name: '英语初学者',
            description: '适合零基础学习者，从最基础的单词开始',
            memberCount: 234,
            category: '基础学习',
            difficulty: 'beginner',
            isJoined: false
          }
        ]
        setStudyGroups(mockGroups)
      }

      if (activeTab === 'forum') {
        const mockPosts: ForumPost[] = [
          {
            id: '1',
            title: '如何快速记忆英语单词？分享我的经验',
            content: '经过一年的学习，我总结了几个非常有效的单词记忆方法...',
            author: {
              id: '1',
              username: '英语小达人',
              avatar: '/avatars/user1.jpg',
              level: 15,
              wordsLearned: 1250,
              streakDays: 45,
              isOnline: true,
              lastActive: '刚刚'
            },
            replies: 23,
            likes: 45,
            isLiked: false,
            createdAt: '2024-01-16T10:30:00Z',
            category: '学习方法'
          },
          {
            id: '2',
            title: '托福词汇备考计划，求指导',
            content: '距离考试还有3个月，目前词汇量大概4000，想请教一下...',
            author: {
              id: '2',
              username: '学霸君',
              avatar: '/avatars/user2.jpg',
              level: 12,
              wordsLearned: 980,
              streakDays: 32,
              isOnline: false,
              lastActive: '2分钟前'
            },
            replies: 8,
            likes: 12,
            isLiked: true,
            createdAt: '2024-01-15T16:20:00Z',
            category: '考试备考'
          }
        ]
        setForumPosts(mockPosts)
      }

      // 获取在线用户数
      const analytics = UserAnalytics.getInstance()
      const onlineStats = await analytics.getOnlineUserStats()
      if (onlineStats) {
        setOnlineUsers(onlineStats.onlineUsers || 0)
      }
    } catch (error) {
      console.error('加载社区数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 加入学习小组
  const joinGroup = async (groupId: string) => {
    try {
      const token = localStorage.getItem('token')
      await fetch(`/api/community/groups/${groupId}/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      setStudyGroups(prev =>
        prev.map(group =>
          group.id === groupId
            ? { ...group, isJoined: true, memberCount: group.memberCount + 1 }
            : group
        )
      )
    } catch (error) {
      console.error('加入小组失败:', error)
    }
  }

  // 点赞帖子
  const likePost = async (postId: string) => {
    try {
      const token = localStorage.getItem('token')
      await fetch(`/api/community/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      setForumPosts(prev =>
        prev.map(post =>
          post.id === postId
            ? { 
                ...post, 
                isLiked: !post.isLiked,
                likes: post.isLiked ? post.likes - 1 : post.likes + 1
              }
            : post
        )
      )
    } catch (error) {
      console.error('点赞失败:', error)
    }
  }

  const tabs = [
    { key: 'leaderboard', label: '排行榜', icon: '🏆' },
    { key: 'groups', label: '学习小组', icon: '👥' },
    { key: 'forum', label: '讨论区', icon: '💬' }
  ] as const

  return (
    <div className="p-6 space-y-6">
      {/* 页面标题和在线统计 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">学习社区</h1>
          <p className="text-gray-600 mt-2">与其他学习者交流，共同进步</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center bg-green-50 border border-green-200 rounded-lg px-4 py-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
            <span className="text-green-700 font-medium">{onlineUsers} 人在线</span>
          </div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            发布帖子
          </button>
        </div>
      </div>

      {/* 标签导航 */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* 标签内容 */}
      <div>
        {loading ? (
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        ) : (
          <>
            {/* 排行榜 */}
            {activeTab === 'leaderboard' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900">学习排行榜</h2>
                  <select className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option>本周排行</option>
                    <option>本月排行</option>
                    <option>总排行</option>
                  </select>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* 排行榜列表 */}
                  <div className="space-y-3">
                    {leaderboard.map((user, index) => (
                      <div
                        key={user.id}
                        className="flex items-center p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                      >
                        <div className="flex-shrink-0">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                            index === 0 ? 'bg-yellow-100 text-yellow-800' :
                            index === 1 ? 'bg-gray-100 text-gray-800' :
                            index === 2 ? 'bg-orange-100 text-orange-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {index + 1}
                          </div>
                        </div>
                        
                        <div className="flex items-center ml-4 flex-1">
                          <img
                            src={user.avatar}
                            alt={user.username}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          <div className="ml-3 flex-1">
                            <div className="flex items-center">
                              <h3 className="font-medium text-gray-900">{user.username}</h3>
                              {user.isOnline && (
                                <div className="w-2 h-2 bg-green-500 rounded-full ml-2"></div>
                              )}
                            </div>
                            <p className="text-sm text-gray-500">等级 {user.level} · {user.lastActive}</p>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-lg font-semibold text-blue-600">
                              {user.wordsLearned}
                            </div>
                            <div className="text-xs text-gray-500">学会单词</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* 个人统计 */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">我的排名</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-gray-600">当前排名</span>
                        <span className="font-semibold text-blue-600">#15</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">学会单词</span>
                        <span className="font-semibold">156 个</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">连续天数</span>
                        <span className="font-semibold">12 天</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">本周进步</span>
                        <span className="font-semibold text-green-600">+3 名</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 学习小组 */}
            {activeTab === 'groups' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900">学习小组</h2>
                  <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                    创建小组
                  </button>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {studyGroups.map((group) => (
                    <div
                      key={group.id}
                      className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{group.name}</h3>
                          <p className="text-sm text-gray-600 mt-1">{group.description}</p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          group.difficulty === 'beginner' ? 'bg-green-100 text-green-800' :
                          group.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {group.difficulty === 'beginner' && '初级'}
                          {group.difficulty === 'intermediate' && '中级'}
                          {group.difficulty === 'advanced' && '高级'}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>👥 {group.memberCount} 成员</span>
                          <span>📚 {group.category}</span>
                        </div>
                        
                        <button
                          onClick={() => !group.isJoined && joinGroup(group.id)}
                          disabled={group.isJoined}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            group.isJoined
                              ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          {group.isJoined ? '已加入' : '加入小组'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 讨论区 */}
            {activeTab === 'forum' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900">讨论区</h2>
                  <div className="flex space-x-2">
                    <select className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option>全部分类</option>
                      <option>学习方法</option>
                      <option>考试备考</option>
                      <option>经验分享</option>
                    </select>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {forumPosts.map((post) => (
                    <div
                      key={post.id}
                      className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start space-x-4">
                        <img
                          src={post.author.avatar}
                          alt={post.author.username}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <h3 className="font-semibold text-gray-900">{post.author.username}</h3>
                              <span className="text-sm text-gray-500">
                                等级 {post.author.level}
                              </span>
                              {post.author.isOnline && (
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              )}
                            </div>
                            <span className="text-sm text-gray-500">
                              {new Date(post.createdAt).toLocaleDateString('zh-CN')}
                            </span>
                          </div>
                          
                          <h4 className="text-lg font-medium text-gray-900 mb-2">{post.title}</h4>
                          <p className="text-gray-600 mb-4">{post.content}</p>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <button
                                onClick={() => likePost(post.id)}
                                className={`flex items-center space-x-1 px-3 py-1 rounded-lg transition-colors ${
                                  post.isLiked
                                    ? 'bg-red-50 text-red-600'
                                    : 'text-gray-500 hover:bg-gray-50'
                                }`}
                              >
                                <span>{post.isLiked ? '❤️' : '🤍'}</span>
                                <span>{post.likes}</span>
                              </button>
                              
                              <button className="flex items-center space-x-1 text-gray-500 hover:bg-gray-50 px-3 py-1 rounded-lg transition-colors">
                                <span>💬</span>
                                <span>{post.replies}</span>
                              </button>
                            </div>
                            
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                              {post.category}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}