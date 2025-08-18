'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  GitBranch,
  Code,
  Eye,
  Download,
  Clock,
  User,
  Star,
  MessageSquare,
  ArrowLeft,
  Zap,
  Shield,
  BookOpen
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { PageContainer } from '@/components/layout/MainContent';
import { useLayoutStore } from '@/store/layout';
import toast from 'react-hot-toast';

// 课程数据接口
interface CourseData {
  title: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  cefr?: string;
  author: string;
  version: string;
  exercises: Exercise[];
  metadata: {
    estimatedDuration: string;
    tags: string[];
    targetAudience: string[];
  };
}

interface Exercise {
  id: string;
  type: 'word-match' | 'sentence-build' | 'pronunciation' | 'listening';
  prompt: string;
  answer: string;
  options?: string[];
  audioUrl?: string;
  hints?: string[];
}

// 提交状态
interface SubmissionStatus {
  status: 'idle' | 'validating' | 'submitted' | 'approved' | 'rejected';
  submittedAt?: string;
  reviewedAt?: string;
  feedback?: string;
  reviewer?: string;
}

// 文件上传组件
interface FileUploadProps {
  onFileSelect: (file: File) => void;
  accept: string;
  disabled?: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, accept, disabled = false }) => {
  const [dragOver, setDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const validFile = files.find(file => file.type === 'application/json' || file.name.endsWith('.json'));
    
    if (validFile) {
      onFileSelect(validFile);
    } else {
      toast.error('请上传JSON格式的课程文件');
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <div
      className={`
        border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300
        ${dragOver 
          ? 'border-info bg-info/10 shadow-glow' 
          : 'border-border-color bg-secondary-dark hover:border-info/50'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => !disabled && document.getElementById('file-input')?.click()}
    >
      <input
        id="file-input"
        type="file"
        accept={accept}
        onChange={handleFileInput}
        className="hidden"
        disabled={disabled}
      />
      
      <div className="flex flex-col items-center gap-4">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
          dragOver ? 'bg-info text-white' : 'bg-hover text-text-muted'
        }`}>
          <Upload size={32} />
        </div>
        
        <div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">
            {dragOver ? '松开鼠标上传文件' : '上传课程文件'}
          </h3>
          <p className="text-text-secondary">
            拖拽JSON文件到此处，或者点击选择文件
          </p>
          <p className="text-xs text-text-muted mt-2">
            支持格式：JSON (.json) | 最大文件大小：5MB
          </p>
        </div>
      </div>
    </div>
  );
};

// 课程预览组件
interface CoursePreviewProps {
  courseData: CourseData | null;
  onEdit: () => void;
}

const CoursePreview: React.FC<CoursePreviewProps> = ({ courseData, onEdit }) => {
  if (!courseData) return null;

  const difficultyColors = {
    beginner: 'text-success',
    intermediate: 'text-warning',
    advanced: 'text-error'
  };

  return (
    <motion.div
      className="bg-card-dark border border-border-color rounded-xl p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-text-primary">课程预览</h3>
        <button
          onClick={onEdit}
          className="px-4 py-2 bg-secondary-dark border border-border-color rounded-lg text-text-secondary hover:text-text-primary hover:border-info transition-all"
        >
          <Eye size={16} className="inline mr-2" />
          编辑
        </button>
      </div>

      {/* 基本信息 */}
      <div className="space-y-4 mb-6">
        <div>
          <h4 className="text-lg font-semibold text-text-primary">{courseData.title}</h4>
          <p className="text-text-secondary mt-1">{courseData.description}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-secondary-dark rounded-lg p-3">
            <div className="text-sm text-text-muted">难度</div>
            <div className={`font-semibold ${difficultyColors[courseData.difficulty]}`}>
              {courseData.difficulty === 'beginner' ? '初级' : 
               courseData.difficulty === 'intermediate' ? '中级' : '高级'}
              {courseData.cefr && ` (${courseData.cefr})`}
            </div>
          </div>

          <div className="bg-secondary-dark rounded-lg p-3">
            <div className="text-sm text-text-muted">分类</div>
            <div className="font-semibold text-text-primary">{courseData.category}</div>
          </div>

          <div className="bg-secondary-dark rounded-lg p-3">
            <div className="text-sm text-text-muted">练习数</div>
            <div className="font-semibold text-info">{courseData.exercises.length}</div>
          </div>

          <div className="bg-secondary-dark rounded-lg p-3">
            <div className="text-sm text-text-muted">时长</div>
            <div className="font-semibold text-warning">{courseData.metadata.estimatedDuration}</div>
          </div>
        </div>
      </div>

      {/* 标签 */}
      {courseData.metadata.tags.length > 0 && (
        <div className="mb-6">
          <h5 className="text-sm font-semibold text-text-primary mb-2">标签</h5>
          <div className="flex flex-wrap gap-2">
            {courseData.metadata.tags.map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-hover rounded-full text-xs text-text-secondary"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 练习示例 */}
      <div>
        <h5 className="text-sm font-semibold text-text-primary mb-3">练习示例</h5>
        <div className="space-y-3 max-h-48 overflow-y-auto">
          {courseData.exercises.slice(0, 3).map((exercise, index) => (
            <div key={exercise.id} className="bg-secondary-dark rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-info">
                  {exercise.type === 'word-match' ? '单词匹配' : 
                   exercise.type === 'sentence-build' ? '句子构建' :
                   exercise.type === 'pronunciation' ? '发音练习' : '听力理解'}
                </span>
                <span className="text-xs text-text-muted">#{index + 1}</span>
              </div>
              <div className="text-sm text-text-primary mb-1">{exercise.prompt}</div>
              <div className="text-xs text-text-secondary">答案: {exercise.answer}</div>
            </div>
          ))}
          {courseData.exercises.length > 3 && (
            <div className="text-center py-2">
              <span className="text-xs text-text-muted">
                还有 {courseData.exercises.length - 3} 个练习...
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// 提交历史组件
const SubmissionHistory: React.FC = () => {
  const [submissions] = useState([
    {
      id: '1',
      title: '商务英语对话基础',
      status: 'approved' as const,
      submittedAt: '2024-01-15',
      reviewedAt: '2024-01-16',
      reviewer: 'Sarah Chen',
      feedback: '课程设计优秀，练习多样化，已通过审核。'
    },
    {
      id: '2',
      title: '英语语音入门',
      status: 'rejected' as const,
      submittedAt: '2024-01-10',
      reviewedAt: '2024-01-12',
      reviewer: 'Mike Johnson',
      feedback: '练习难度不够循序渐进，建议重新组织内容结构。'
    },
    {
      id: '3',
      title: '日常英语表达',
      status: 'submitted' as const,
      submittedAt: '2024-01-20',
      feedback: '正在审核中...'
    }
  ]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle size={16} className="text-success" />;
      case 'rejected':
        return <XCircle size={16} className="text-error" />;
      case 'submitted':
        return <Clock size={16} className="text-warning" />;
      default:
        return <AlertTriangle size={16} className="text-text-muted" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return '已通过';
      case 'rejected':
        return '已拒绝';
      case 'submitted':
        return '审核中';
      default:
        return '未知';
    }
  };

  return (
    <motion.div
      className="bg-card-dark border border-border-color rounded-xl p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h3 className="text-xl font-semibold text-text-primary mb-6 flex items-center gap-2">
        <GitBranch size={20} />
        提交历史
      </h3>

      <div className="space-y-4">
        {submissions.map((submission) => (
          <div key={submission.id} className="bg-secondary-dark rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-text-primary">{submission.title}</h4>
              <div className="flex items-center gap-2">
                {getStatusIcon(submission.status)}
                <span className="text-sm font-medium text-text-secondary">
                  {getStatusText(submission.status)}
                </span>
              </div>
            </div>

            <div className="text-sm text-text-secondary mb-3">
              提交时间: {submission.submittedAt}
              {submission.reviewedAt && (
                <span className="ml-4">审核时间: {submission.reviewedAt}</span>
              )}
            </div>

            {submission.reviewer && (
              <div className="text-sm text-text-secondary mb-2 flex items-center gap-2">
                <User size={14} />
                审核人: {submission.reviewer}
              </div>
            )}

            <div className="bg-hover rounded-lg p-3">
              <div className="text-sm text-text-primary">{submission.feedback}</div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

// 主组件
export default function CourseUploadPage() {
  const router = useRouter();
  const { setBreadcrumbs } = useLayoutStore();
  
  // 状态管理
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [courseData, setCourseData] = useState<CourseData | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [submissionStatus, setSubmissionStatus] = useState<SubmissionStatus>({ status: 'idle' });
  const [activeTab, setActiveTab] = useState<'upload' | 'history'>('upload');

  // 设置面包屑
  useEffect(() => {
    setBreadcrumbs([
      { label: '首页', href: '/' },
      { label: '课程上传', href: '/upload' }
    ]);
  }, [setBreadcrumbs]);

  // 处理文件选择
  const handleFileSelect = async (file: File) => {
    setSelectedFile(file);
    setValidationErrors([]);
    setCourseData(null);

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      // 验证数据结构
      const errors = validateCourseData(data);
      setValidationErrors(errors);
      
      if (errors.length === 0) {
        setCourseData(data);
        toast.success('课程文件验证成功！');
      } else {
        toast.error(`发现 ${errors.length} 个验证错误`);
      }
    } catch (error) {
      const errorMsg = 'JSON文件格式错误，请检查文件内容';
      setValidationErrors([errorMsg]);
      toast.error(errorMsg);
    }
  };

  // 验证课程数据
  const validateCourseData = (data: any): string[] => {
    const errors: string[] = [];

    if (!data.title || typeof data.title !== 'string') {
      errors.push('缺少或无效的课程标题');
    }

    if (!data.description || typeof data.description !== 'string') {
      errors.push('缺少或无效的课程描述');
    }

    if (!data.exercises || !Array.isArray(data.exercises)) {
      errors.push('缺少或无效的练习列表');
    } else if (data.exercises.length === 0) {
      errors.push('练习列表不能为空');
    } else {
      data.exercises.forEach((exercise: any, index: number) => {
        if (!exercise.id) {
          errors.push(`练习 ${index + 1}: 缺少ID`);
        }
        if (!exercise.prompt) {
          errors.push(`练习 ${index + 1}: 缺少题目`);
        }
        if (!exercise.answer) {
          errors.push(`练习 ${index + 1}: 缺少答案`);
        }
      });
    }

    if (data.difficulty && !['beginner', 'intermediate', 'advanced'].includes(data.difficulty)) {
      errors.push('无效的难度级别');
    }

    return errors;
  };

  // 提交课程
  const handleSubmit = async () => {
    if (!courseData || !selectedFile) {
      toast.error('请先选择并验证课程文件');
      return;
    }

    setSubmissionStatus({ status: 'validating' });

    try {
      // 模拟提交过程
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setSubmissionStatus({
        status: 'submitted',
        submittedAt: new Date().toISOString().split('T')[0]
      });
      
      toast.success('课程提交成功！请等待审核。');
    } catch (error) {
      setSubmissionStatus({ status: 'idle' });
      toast.error('提交失败，请重试');
    }
  };

  return (
    <PageContainer>
      {/* 页面头部 */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()}
            className="p-2 bg-card-dark border border-border-color rounded-lg hover:border-info transition-colors"
          >
            <ArrowLeft size={20} className="text-text-secondary" />
          </button>
          
          <div>
            <h1 className="text-3xl font-bold text-text-primary mb-2">
              课程上传
            </h1>
            <p className="text-lg text-text-secondary">
              分享您的英语学习内容
            </p>
          </div>
        </div>

        {/* 帮助链接 */}
        <div className="flex items-center gap-2">
          <a
            href="#"
            className="px-4 py-2 bg-secondary-dark border border-border-color rounded-lg text-text-secondary hover:text-info hover:border-info transition-all flex items-center gap-2"
          >
            <BookOpen size={16} />
            上传指南
          </a>
        </div>
      </div>

      {/* 标签页 */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => setActiveTab('upload')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            activeTab === 'upload'
              ? 'bg-gradient-primary text-white'
              : 'bg-secondary-dark text-text-secondary hover:text-text-primary'
          }`}
        >
          <Upload size={16} className="inline mr-2" />
          上传课程
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            activeTab === 'history'
              ? 'bg-gradient-primary text-white'
              : 'bg-secondary-dark text-text-secondary hover:text-text-primary'
          }`}
        >
          <GitBranch size={16} className="inline mr-2" />
          提交历史
        </button>
      </div>

      {/* 内容区域 */}
      <AnimatePresence mode="wait">
        {activeTab === 'upload' ? (
          <motion.div
            key="upload"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-8"
          >
            {/* 上传要求 */}
            <motion.div
              className="bg-card-dark border border-border-color rounded-xl p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                <Shield size={20} />
                上传要求
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-text-primary mb-2">文件格式</h4>
                  <ul className="space-y-1 text-sm text-text-secondary">
                    <li>• 必须是JSON格式 (.json)</li>
                    <li>• 文件大小不超过5MB</li>
                    <li>• 使用UTF-8编码</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold text-text-primary mb-2">内容要求</h4>
                  <ul className="space-y-1 text-sm text-text-secondary">
                    <li>• 至少包含10个练习</li>
                    <li>• 内容原创或已获授权</li>
                    <li>• 符合社区准则</li>
                  </ul>
                </div>
              </div>
              
              <div className="mt-4 p-4 bg-info/10 border border-info/30 rounded-lg">
                <div className="flex items-start gap-3">
                  <Zap size={16} className="text-info mt-0.5" />
                  <div>
                    <div className="font-semibold text-info mb-1">提示</div>
                    <div className="text-sm text-text-primary">
                      提交的课程将由我们的教育专家团队审核，通过后将发布到课程库供所有用户学习。
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* 文件上传 */}
            <FileUpload
              onFileSelect={handleFileSelect}
              accept=".json"
              disabled={submissionStatus.status === 'validating'}
            />

            {/* 验证错误 */}
            {validationErrors.length > 0 && (
              <motion.div
                className="bg-error/10 border border-error/30 rounded-xl p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h3 className="text-lg font-semibold text-error mb-4 flex items-center gap-2">
                  <XCircle size={20} />
                  验证错误
                </h3>
                <ul className="space-y-2">
                  {validationErrors.map((error, index) => (
                    <li key={index} className="text-sm text-error flex items-start gap-2">
                      <span className="text-error">•</span>
                      {error}
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}

            {/* 课程预览 */}
            {courseData && (
              <CoursePreview
                courseData={courseData}
                onEdit={() => toast('编辑功能即将推出')}
              />
            )}

            {/* 提交按钮 */}
            {courseData && validationErrors.length === 0 && (
              <motion.div
                className="flex justify-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <button
                  onClick={handleSubmit}
                  disabled={submissionStatus.status === 'validating'}
                  className="px-8 py-3 bg-gradient-primary rounded-xl text-white font-semibold hover:shadow-lg transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submissionStatus.status === 'validating' ? (
                    <>
                      <div className="loading-spinner w-4 h-4" />
                      提交中...
                    </>
                  ) : (
                    <>
                      <Upload size={16} />
                      提交审核
                    </>
                  )}
                </button>
              </motion.div>
            )}

            {/* 提交成功状态 */}
            {submissionStatus.status === 'submitted' && (
              <motion.div
                className="bg-success/10 border border-success/30 rounded-xl p-6 text-center"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <CheckCircle size={48} className="mx-auto mb-4 text-success" />
                <h3 className="text-lg font-semibold text-success mb-2">
                  课程提交成功！
                </h3>
                <p className="text-text-secondary">
                  您的课程已提交审核，我们会在3-5个工作日内完成审核并通知您结果。
                </p>
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="history"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <SubmissionHistory />
          </motion.div>
        )}
      </AnimatePresence>
    </PageContainer>
  );
}