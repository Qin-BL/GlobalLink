// src/lib/sm2.ts - SM2 间隔重复算法实现
interface SM2Data {
  easinessFactor: number // 难度因子 (1.3 - 2.5)
  repetitions: number    // 重复次数
  interval: number       // 间隔天数
  nextReviewDate: Date   // 下次复习日期
  quality: number        // 最后一次答题质量 (0-5)
}

interface SM2Card {
  id: string
  data: SM2Data
  lastReviewDate: Date
  createdDate: Date
}

export class SM2Algorithm {
  // 创建新的 SM2 卡片
  static createCard(id: string): SM2Card {
    const now = new Date()
    return {
      id,
      data: {
        easinessFactor: 2.5,
        repetitions: 0,
        interval: 1,
        nextReviewDate: new Date(now.getTime() + 24 * 60 * 60 * 1000), // 明天
        quality: 0
      },
      lastReviewDate: now,
      createdDate: now
    }
  }

  // 根据答题质量更新 SM2 数据
  static updateCard(card: SM2Card, quality: number): SM2Card {
    // 验证质量评分范围 (0-5)
    if (quality < 0 || quality > 5) {
      throw new Error('质量评分必须在 0-5 之间')
    }

    const newData = { ...card.data }
    const now = new Date()

    if (quality >= 3) {
      // 答对了
      if (newData.repetitions === 0) {
        newData.interval = 1
      } else if (newData.repetitions === 1) {
        newData.interval = 6
      } else {
        newData.interval = Math.round(newData.interval * newData.easinessFactor)
      }
      newData.repetitions++
    } else {
      // 答错了，重置重复次数
      newData.repetitions = 0
      newData.interval = 1
    }

    // 更新难度因子
    newData.easinessFactor = newData.easinessFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))

    // 限制难度因子范围
    if (newData.easinessFactor < 1.3) {
      newData.easinessFactor = 1.3
    }

    // 计算下次复习日期
    newData.nextReviewDate = new Date(now.getTime() + newData.interval * 24 * 60 * 60 * 1000)
    newData.quality = quality

    return {
      ...card,
      data: newData,
      lastReviewDate: now
    }
  }

  // 检查卡片是否需要复习
  static isCardDue(card: SM2Card): boolean {
    const now = new Date()
    return now >= card.data.nextReviewDate
  }

  // 获取到期的卡片列表
  static getDueCards(cards: SM2Card[]): SM2Card[] {
    return cards.filter(card => this.isCardDue(card))
  }

  // 计算卡片的掌握程度
  static getMasteryLevel(card: SM2Card): 'new' | 'learning' | 'mastered' {
    const { repetitions, easinessFactor, interval } = card.data

    if (repetitions === 0) {
      return 'new'
    }

    // 连续正确3次以上，间隔7天以上，难度因子较高，认为已掌握
    if (repetitions >= 3 && interval >= 7 && easinessFactor >= 2.0) {
      return 'mastered'
    }

    return 'learning'
  }

  // 计算下次复习的剩余时间（小时）
  static getTimeUntilReview(card: SM2Card): number {
    const now = new Date()
    const timeDiff = card.data.nextReviewDate.getTime() - now.getTime()
    return Math.max(0, Math.round(timeDiff / (1000 * 60 * 60))) // 转换为小时
  }

  // 获取学习统计信息
  static getStudyStats(cards: SM2Card[]): {
    total: number
    new: number
    learning: number
    mastered: number
    due: number
    averageEasiness: number
  } {
    const stats = {
      total: cards.length,
      new: 0,
      learning: 0,
      mastered: 0,
      due: 0,
      averageEasiness: 0
    }

    let totalEasiness = 0
    let easinessCount = 0

    cards.forEach(card => {
      const masteryLevel = this.getMasteryLevel(card)
      stats[masteryLevel]++

      if (this.isCardDue(card)) {
        stats.due++
      }

      if (card.data.repetitions > 0) {
        totalEasiness += card.data.easinessFactor
        easinessCount++
      }
    })

    stats.averageEasiness = easinessCount > 0 ? totalEasiness / easinessCount : 2.5

    return stats
  }

  // 生成学习计划
  static generateStudyPlan(cards: SM2Card[], dailyLimit: number = 20): {
    review: SM2Card[]
    new: SM2Card[]
    total: number
  } {
    const dueCards = this.getDueCards(cards)
    const newCards = cards.filter(card => card.data.repetitions === 0 && !this.isCardDue(card))

    // 优先安排复习卡片
    const reviewCards = dueCards.slice(0, Math.min(dailyLimit, dueCards.length))
    const remainingSlots = dailyLimit - reviewCards.length

    // 剩余名额分配给新卡片
    const newCardsForToday = newCards.slice(0, Math.max(0, remainingSlots))

    return {
      review: reviewCards,
      new: newCardsForToday,
      total: reviewCards.length + newCardsForToday.length
    }
  }

  // 导出学习数据（用于数据分析）
  static exportStudyData(cards: SM2Card[]): any[] {
    return cards.map(card => ({
      id: card.id,
      easinessFactor: card.data.easinessFactor,
      repetitions: card.data.repetitions,
      interval: card.data.interval,
      quality: card.data.quality,
      masteryLevel: this.getMasteryLevel(card),
      daysSinceCreated: Math.floor((Date.now() - card.createdDate.getTime()) / (1000 * 60 * 60 * 24)),
      daysSinceLastReview: Math.floor((Date.now() - card.lastReviewDate.getTime()) / (1000 * 60 * 60 * 24)),
      hoursUntilReview: this.getTimeUntilReview(card)
    }))
  }

  // 质量评分辅助函数
  static qualityFromBoolean(isCorrect: boolean, confidence: 'low' | 'medium' | 'high' = 'medium'): number {
    if (!isCorrect) {
      return confidence === 'low' ? 0 : confidence === 'medium' ? 1 : 2
    } else {
      return confidence === 'low' ? 3 : confidence === 'medium' ? 4 : 5
    }
  }

  // 从百分比准确率估算质量评分
  static qualityFromAccuracy(accuracy: number): number {
    if (accuracy >= 0.9) return 5
    if (accuracy >= 0.8) return 4
    if (accuracy >= 0.6) return 3
    if (accuracy >= 0.4) return 2
    if (accuracy >= 0.2) return 1
    return 0
  }
}