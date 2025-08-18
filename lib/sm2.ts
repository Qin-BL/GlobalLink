/**
 * SM-2算法实现 - SuperMemo 2间隔重复算法
 * 用于智能安排学习内容的复习时间
 */

export interface SM2Item {
  repetitions: number;
  interval: number;
  easeFactor: number;
  nextDue: Date;
}

export interface SM2Result {
  repetitions: number;
  interval: number;
  easeFactor: number;
  nextDue: Date;
}

/**
 * SM-2算法核心函数
 * @param item 当前学习项目状态
 * @param quality 答题质量评分 (0-5)
 *   0: 完全错误，需要重新学习
 *   1: 错误，但有些印象
 *   2: 错误，勉强记得
 *   3: 正确，但费力
 *   4: 正确，有些犹豫
 *   5: 正确，轻松回答
 * @returns 更新后的学习状态
 */
export function calculateSM2(item: SM2Item, quality: number): SM2Result {
  let { repetitions, interval, easeFactor } = item;
  
  // 质量评分必须在0-5之间
  quality = Math.max(0, Math.min(5, quality));
  
  // 如果质量低于3，重置重复次数和间隔
  if (quality < 3) {
    repetitions = 0;
    interval = 0;
  } else {
    // 增加重复次数
    repetitions += 1;
    
    // 根据重复次数计算间隔
    if (repetitions === 1) {
      interval = 1; // 第一次正确：1天后复习
    } else if (repetitions === 2) {
      interval = 6; // 第二次正确：6天后复习
    } else {
      // 第三次及以后：间隔 = 上次间隔 × 容易因子
      interval = Math.round(interval * easeFactor);
    }
  }
  
  // 更新容易因子
  easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  
  // 容易因子最小值为1.3
  if (easeFactor < 1.3) {
    easeFactor = 1.3;
  }
  
  // 计算下次复习时间
  const nextDue = new Date();
  nextDue.setDate(nextDue.getDate() + Math.max(1, interval));
  
  return {
    repetitions,
    interval,
    easeFactor: Math.round(easeFactor * 100) / 100, // 保留两位小数
    nextDue
  };
}

/**
 * 创建新的学习项目
 * @param quality 首次答题质量
 * @returns 初始化的学习状态
 */
export function createSM2Item(quality: number = 5): SM2Result {
  const baseItem: SM2Item = {
    repetitions: 0,
    interval: 0,
    easeFactor: 2.5,
    nextDue: new Date()
  };
  
  return calculateSM2(baseItem, quality);
}

/**
 * 判断是否需要复习
 * @param nextDue 下次复习时间
 * @returns 是否到了复习时间
 */
export function shouldReview(nextDue: Date): boolean {
  return new Date() >= nextDue;
}

/**
 * 获取复习优先级评分
 * 越小优先级越高（越需要复习）
 * @param nextDue 下次复习时间
 * @param easeFactor 容易因子
 * @returns 优先级评分
 */
export function getReviewPriority(nextDue: Date, easeFactor: number): number {
  const now = new Date();
  const overdueDays = Math.max(0, (now.getTime() - nextDue.getTime()) / (1000 * 60 * 60 * 24));
  
  // 逾期天数越多，容易因子越小（越困难），优先级越高
  return -(overdueDays * 10 + (3 - easeFactor) * 5);
}

/**
 * 根据答题表现转换为SM-2质量评分
 * @param isCorrect 是否正确
 * @param responseTime 响应时间（毫秒）
 * @param hintsUsed 使用提示次数
 * @returns SM-2质量评分 (0-5)
 */
export function convertToSM2Quality(
  isCorrect: boolean, 
  responseTime?: number, 
  hintsUsed: number = 0
): number {
  if (!isCorrect) {
    // 错误答案：0-2分
    if (hintsUsed > 2) return 0; // 使用太多提示
    if (hintsUsed > 0) return 1; // 使用了提示但仍错误
    return 2; // 没用提示但错误
  }
  
  // 正确答案：3-5分
  let quality = 5; // 默认最高分
  
  // 根据提示使用情况降分
  if (hintsUsed > 0) {
    quality -= hintsUsed; // 每使用一次提示减1分
  }
  
  // 根据响应时间调整（如果提供）
  if (responseTime) {
    const timeInSeconds = responseTime / 1000;
    if (timeInSeconds > 30) quality -= 1; // 超过30秒降1分
    else if (timeInSeconds > 15) quality -= 0.5; // 超过15秒降0.5分
  }
  
  return Math.max(3, Math.min(5, Math.round(quality)));
}

/**
 * 计算掌握程度百分比
 * @param repetitions 重复次数
 * @param easeFactor 容易因子
 * @returns 掌握程度百分比 (0-100)
 */
export function calculateMasteryLevel(repetitions: number, easeFactor: number): number {
  // 基础掌握度：重复次数贡献
  let mastery = Math.min(repetitions * 20, 80); // 最多4次重复贡献80%
  
  // 容易因子贡献：越容易掌握度越高
  const factorBonus = Math.max(0, (easeFactor - 1.3) / (3.0 - 1.3)) * 20; // 最多贡献20%
  mastery += factorBonus;
  
  return Math.min(100, Math.round(mastery));
}

/**
 * 获取学习统计信息
 * @param items 所有学习项目
 * @returns 统计信息
 */
export function getLearningStats(items: SM2Item[]) {
  const now = new Date();
  
  const total = items.length;
  const dueForReview = items.filter(item => shouldReview(item.nextDue)).length;
  const mastered = items.filter(item => 
    item.repetitions >= 4 && item.easeFactor >= 2.5
  ).length;
  
  const avgEaseFactor = items.length > 0 
    ? items.reduce((sum, item) => sum + item.easeFactor, 0) / items.length 
    : 2.5;
  
  const avgInterval = items.length > 0
    ? items.reduce((sum, item) => sum + item.interval, 0) / items.length
    : 0;
  
  return {
    total,
    dueForReview,
    mastered,
    masteryRate: total > 0 ? Math.round((mastered / total) * 100) : 0,
    avgEaseFactor: Math.round(avgEaseFactor * 100) / 100,
    avgInterval: Math.round(avgInterval)
  };
}