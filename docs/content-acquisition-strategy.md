# Content Acquisition and Import Strategy

## Overview
This document outlines the strategy for acquiring and importing content from various sources to build a comprehensive question bank for the enhanced English learning platform.

## 1. Content Sources

### Primary Sources
1. **HSK Vocabulary Lists** - Structured by difficulty levels
2. **Common English Sentence Patterns** - Grammar-focused content
3. **Daily Conversation Phrases** - Practical communication
4. **Academic Writing Structures** - Advanced learners
5. **Business English Expressions** - Professional contexts

### Secondary Sources  
1. **Open Educational Resources** - Free learning materials
2. **Public Domain Literature** - Classic texts for reading comprehension
3. **News Articles** - Current affairs vocabulary
4. **Technical Documentation** - Specialized vocabulary

## 2. Content Structure Standards

### Chinese-English Sentence Pairs
```json
{
  "sentence": {
    "id": "unique_identifier",
    "chinese": "我每天早上七点起床。",
    "english": "I wake up at seven o'clock every morning.",
    "pinyin": "wǒ měi tiān zǎo shang qī diǎn qǐ chuáng",
    "difficulty": 2,
    "grammar_pattern": "present_simple_habit",
    "topic": "daily_routine",
    "tokens": ["I", "wake", "up", "at", "seven", "o'clock", "every", "morning", "."],
    "distractors": ["get", "usually", "always"],
    "hints": [
      "这是描述日常习惯的句子",
      "使用一般现在时",
      "'wake up' 表示起床"
    ],
    "audio_cn": "/audio/sentences/cn_001.mp3",
    "audio_en": "/audio/sentences/en_001.mp3",
    "tags": ["time", "daily_life", "verbs"],
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

### Grammar Pattern Templates
```json
{
  "pattern": {
    "id": "present_simple_statement",
    "name": "Present Simple Statement",
    "chinese_name": "一般现在时陈述句",
    "structure": "{subject} {verb} {object}",
    "explanation": "用于描述经常发生的动作或状态",
    "difficulty": 1,
    "examples": [
      {
        "chinese": "我喜欢苹果。",
        "english": "I like apples.",
        "components": {
          "subject": "I",
          "verb": "like", 
          "object": "apples"
        }
      }
    ],
    "practice_sentences": ["sentence_id_1", "sentence_id_2"],
    "related_patterns": ["present_continuous", "present_perfect"]
  }
}
```

## 3. Content Import Pipeline

### Stage 1: Data Collection
```bash
# Collection scripts
scripts/
├── collect-hsk-vocab.ts      # HSK 1-6 vocabulary extraction
├── collect-grammar-patterns.ts # Common grammar structures
├── collect-daily-phrases.ts   # Conversational expressions
└── collect-business-english.ts # Professional vocabulary
```

### Stage 2: Data Processing
```typescript
// Content processing pipeline
interface ContentProcessor {
  validate(rawData: any): boolean;
  transform(rawData: any): SentenceData;
  enrichWithAudio(sentence: SentenceData): Promise<SentenceData>;
  generateDistractors(sentence: SentenceData): string[];
  calculateDifficulty(sentence: SentenceData): number;
}

class SentenceProcessor implements ContentProcessor {
  validate(rawData: any): boolean {
    return (
      typeof rawData.chinese === 'string' &&
      typeof rawData.english === 'string' &&
      rawData.chinese.length > 0 &&
      rawData.english.length > 0
    );
  }

  transform(rawData: any): SentenceData {
    return {
      chinese: rawData.chinese.trim(),
      english: rawData.english.trim(),
      tokens: this.tokenize(rawData.english),
      difficulty: this.calculateDifficulty(rawData),
      grammar_pattern: this.detectGrammarPattern(rawData.english),
      topic: this.classifyTopic(rawData.chinese, rawData.english)
    };
  }

  tokenize(sentence: string): string[] {
    return sentence
      .replace(/[,.!?;:]/g, ' $& ')
      .split(/\s+/)
      .filter(token => token.length > 0);
  }

  generateDistractors(sentence: SentenceData): string[] {
    // Generate 2-3 plausible but incorrect words
    const wordCategories = this.categorizeWords(sentence.tokens);
    return this.selectDistractors(wordCategories, 3);
  }

  calculateDifficulty(sentence: SentenceData): number {
    let difficulty = 1;
    
    // Sentence length factor
    if (sentence.tokens.length > 10) difficulty++;
    if (sentence.tokens.length > 15) difficulty++;
    
    // Grammar complexity
    if (this.hasComplexGrammar(sentence.english)) difficulty++;
    
    // Vocabulary difficulty (HSK level)
    const vocabLevel = this.getVocabularyLevel(sentence.chinese);
    difficulty += Math.floor(vocabLevel / 2);
    
    return Math.min(difficulty, 5);
  }
}
```

### Stage 3: Quality Assurance
```typescript
// Quality checks before import
interface QualityChecker {
  checkTranslationAccuracy(chinese: string, english: string): Promise<number>;
  validateGrammar(sentence: string): boolean;
  checkDuplicates(sentence: SentenceData): boolean;
  reviewDifficulty(sentence: SentenceData): boolean;
}

class AIQualityChecker implements QualityChecker {
  async checkTranslationAccuracy(chinese: string, english: string): Promise<number> {
    // Use translation API to verify accuracy (0-1 score)
    // Return confidence score
  }

  validateGrammar(sentence: string): boolean {
    // Check for grammatical correctness
    // Use grammar checking API
  }
}
```

## 4. Import Scripts

### Comprehensive Import Script
```typescript
// scripts/import-comprehensive-content.ts
import { PrismaClient } from '@prisma/client';
import { SentenceProcessor, QualityChecker } from '../lib/content-processing';

const prisma = new PrismaClient();
const processor = new SentenceProcessor();
const qualityChecker = new AIQualityChecker();

interface ImportConfig {
  source: string;
  batchSize: number;
  qualityThreshold: number;
  skipDuplicates: boolean;
}

async function importContent(filePath: string, config: ImportConfig) {
  const rawData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  console.log(`Starting import from ${config.source}...`);
  console.log(`Processing ${rawData.length} sentences`);

  let processed = 0;
  let imported = 0;
  let skipped = 0;

  for (let i = 0; i < rawData.length; i += config.batchSize) {
    const batch = rawData.slice(i, i + config.batchSize);
    
    const processedBatch = await Promise.all(
      batch.map(async (item: any) => {
        try {
          // Validate input
          if (!processor.validate(item)) {
            skipped++;
            return null;
          }

          // Transform data
          const sentence = processor.transform(item);
          
          // Quality check
          const accuracy = await qualityChecker.checkTranslationAccuracy(
            sentence.chinese, 
            sentence.english
          );
          
          if (accuracy < config.qualityThreshold) {
            console.log(`Skipping low quality: ${sentence.chinese} -> ${sentence.english}`);
            skipped++;
            return null;
          }

          // Check for duplicates
          if (config.skipDuplicates && await qualityChecker.checkDuplicates(sentence)) {
            skipped++;
            return null;
          }

          processed++;
          return sentence;
        } catch (error) {
          console.error(`Error processing item:`, error);
          skipped++;
          return null;
        }
      })
    );

    // Import valid sentences
    const validSentences = processedBatch.filter(Boolean);
    
    if (validSentences.length > 0) {
      await prisma.chineseSentence.createMany({
        data: validSentences.map(sentence => ({
          chinese: sentence.chinese,
          english: sentence.english,
          difficulty: sentence.difficulty,
          grammar: sentence.grammar_pattern,
          topic: sentence.topic,
          tokens: JSON.stringify(sentence.tokens),
          hints: JSON.stringify(sentence.hints || [])
        }))
      });
      
      imported += validSentences.length;
    }

    console.log(`Progress: ${i + batch.length}/${rawData.length} | Imported: ${imported} | Skipped: ${skipped}`);
  }

  console.log(`Import completed: ${imported} sentences imported, ${skipped} skipped`);
}

// Usage
const config: ImportConfig = {
  source: 'HSK_Sentences',
  batchSize: 50,
  qualityThreshold: 0.85,
  skipDuplicates: true
};

importContent('./data/hsk-sentences.json', config);
```

### Specialized Import Scripts

#### HSK Vocabulary Import
```typescript
// scripts/import-hsk-vocab.ts
async function importHSKVocabulary() {
  const hskData = await fetchHSKData(); // From API or local file
  
  for (const level of [1, 2, 3, 4, 5, 6]) {
    const words = hskData[`hsk${level}`];
    
    for (const word of words) {
      // Create practice sentences for each word
      const sentences = generatePracticeSentences(word, level);
      
      await prisma.chineseSentence.createMany({
        data: sentences.map(sentence => ({
          chinese: sentence.chinese,
          english: sentence.english,
          difficulty: level <= 2 ? 1 : level <= 4 ? 2 : 3,
          grammar: sentence.pattern,
          topic: 'vocabulary_practice',
          tokens: JSON.stringify(sentence.tokens)
        }))
      });
    }
  }
}
```

#### Business English Import
```typescript
// scripts/import-business-english.ts
async function importBusinessEnglish() {
  const businessPhrases = [
    {
      category: 'meetings',
      sentences: [
        { cn: '让我们开始会议吧。', en: 'Let\'s start the meeting.' },
        { cn: '你对这个提案有什么看法？', en: 'What do you think about this proposal?' }
      ]
    },
    {
      category: 'emails',
      sentences: [
        { cn: '感谢您的邮件。', en: 'Thank you for your email.' },
        { cn: '请尽快回复。', en: 'Please reply as soon as possible.' }
      ]
    }
  ];

  for (const category of businessPhrases) {
    await prisma.chineseSentence.createMany({
      data: category.sentences.map(sentence => ({
        chinese: sentence.cn,
        english: sentence.en,
        difficulty: 4, // Business English is advanced
        grammar: 'business_communication',
        topic: category.category,
        tokens: JSON.stringify(sentence.en.split(' '))
      }))
    });
  }
}
```

## 5. Content Management System

### Admin Interface for Content Review
```typescript
// Admin tools for content management
interface ContentAdmin {
  reviewPendingContent(): Promise<SentenceData[]>;
  approveContent(id: string): Promise<void>;
  rejectContent(id: string, reason: string): Promise<void>;
  editContent(id: string, updates: Partial<SentenceData>): Promise<void>;
  bulkOperations(ids: string[], operation: string): Promise<void>;
}

// Content statistics and analytics
async function getContentStats() {
  return {
    totalSentences: await prisma.chineseSentence.count(),
    byDifficulty: await prisma.chineseSentence.groupBy({
      by: ['difficulty'],
      _count: true
    }),
    byTopic: await prisma.chineseSentence.groupBy({
      by: ['topic'], 
      _count: true
    }),
    recentlyAdded: await prisma.chineseSentence.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      }
    })
  };
}
```

## 6. Audio Content Generation

### Text-to-Speech Integration
```typescript
// Audio generation for sentences
class AudioGenerator {
  async generateAudio(text: string, language: 'zh' | 'en'): Promise<string> {
    // Use cloud TTS service (Google, Azure, AWS)
    const audioBuffer = await this.synthesizeSpeech(text, language);
    const filename = `${language}_${this.hash(text)}.mp3`;
    const path = `public/audio/sentences/${filename}`;
    
    await fs.writeFile(path, audioBuffer);
    return `/audio/sentences/${filename}`;
  }

  async batchGenerateAudio(sentences: SentenceData[]) {
    const audioTasks = [];
    
    for (const sentence of sentences) {
      audioTasks.push(
        this.generateAudio(sentence.chinese, 'zh'),
        this.generateAudio(sentence.english, 'en')
      );
    }

    const audioPaths = await Promise.all(audioTasks);
    
    // Update database with audio paths
    for (let i = 0; i < sentences.length; i++) {
      await prisma.chineseSentence.update({
        where: { id: sentences[i].id },
        data: {
          extras: JSON.stringify({
            audio_cn: audioPaths[i * 2],
            audio_en: audioPaths[i * 2 + 1]
          })
        }
      });
    }
  }
}
```

## 7. Execution Timeline

### Phase 1: Foundation (Week 1)
- Set up data processing pipeline
- Create import scripts for basic content
- Import HSK 1-3 vocabulary sentences (≈500 sentences)

### Phase 2: Content Expansion (Week 2)  
- Import HSK 4-6 vocabulary sentences (≈800 sentences)
- Add daily conversation phrases (≈300 sentences)
- Implement quality checking system

### Phase 3: Advanced Content (Week 3)
- Business English phrases (≈200 sentences)
- Academic writing structures (≈150 sentences)
- Grammar pattern templates (≈50 patterns)

### Phase 4: Enhancement (Week 4)
- Audio generation for all content
- Content admin interface
- Performance optimization

## 8. Success Metrics

### Content Quality Metrics
- Translation accuracy > 90%
- Grammar correctness > 95%
- Difficulty progression consistency
- User feedback scores > 4.0/5.0

### Content Coverage Metrics
- HSK 1-6 vocabulary coverage > 80%
- Grammar pattern coverage for beginner-intermediate levels
- Topic diversity across 10+ categories
- Sentence length variety (3-20 words)

This comprehensive content acquisition strategy ensures a rich, diverse, and high-quality question bank that supports effective learning progression for Chinese speakers learning English.