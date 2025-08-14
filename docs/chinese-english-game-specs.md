# Chinese-to-English Spelling Game Mode Specifications

## Game Mode: 汉字拼英文 (Chinese Character to English Spelling)

### Core Concept
A learning mode where users see Chinese characters/sentences and must construct the correct English translation by selecting and arranging word tokens, inspired by Earthworm's conjunction-based methodology.

## Game Mechanics

### 1. Basic Flow
```
1. Display Chinese sentence/phrase
2. Show scrambled English word tokens below
3. User drags/clicks tokens to build English sentence
4. Real-time validation with visual feedback
5. Submit for scoring and progression
6. SM-2 algorithm updates learning intervals
```

### 2. Difficulty Progression
- **Level 1**: Simple 3-4 word sentences (我很好 → I am fine)
- **Level 2**: Basic grammar patterns (我在学习 → I am studying)  
- **Level 3**: Complex sentences with conjunctions (我喜欢学习，因为很有趣 → I like studying because it's interesting)
- **Level 4**: Compound sentences with multiple clauses
- **Level 5**: Advanced grammar and idiomatic expressions

### 3. Token System
- **Word Tokens**: Individual English words
- **Phrase Tokens**: Common phrases (e.g., "are you", "would like")
- **Punctuation Tokens**: Periods, commas, question marks
- **Distractor Tokens**: 2-3 incorrect words for increased difficulty

### 4. Hint System (Progressive)
1. **Grammar Hint**: Shows sentence structure pattern (Subject + Verb + Object)
2. **Word Hint**: Highlights first word of correct answer
3. **Partial Hint**: Shows first half of sentence
4. **Full Reveal**: Complete answer (with learning penalty)

### 5. Scoring System
```javascript
Base Points = 100
Time Bonus = max(0, 60 - seconds_taken) 
Hint Penalty = hints_used * 15
Streak Multiplier = min(streak_count * 0.1, 2.0)
Difficulty Bonus = difficulty_level * 20

Final Score = (Base Points + Time Bonus + Difficulty Bonus - Hint Penalty) * Streak Multiplier
```

## Learning Integration

### 1. Earthworm Methodology Integration
- **Conjunction Building**: Start with simple conjunctions, build complexity
- **i+1 Input Theory**: Present content slightly above current level
- **Repetitive Practice**: Same sentence patterns with different vocabulary
- **Muscle Memory**: Repeated construction builds automatic response

### 2. Spaced Repetition (SM-2)
- **Success (3-5 rating)**: Increase interval based on ease factor
- **Partial Success (2 rating)**: Repeat in shorter interval
- **Failure (0-1 rating)**: Reset to shortest interval, adjust ease factor
- **Mastery Tracking**: Track progression through difficulty levels

### 3. Adaptive Learning
```javascript
// Dynamic difficulty adjustment
if (recent_accuracy > 85% && avg_time < 30s) {
  increase_difficulty();
}
if (recent_accuracy < 60% || avg_time > 60s) {
  decrease_difficulty();
  provide_additional_practice();
}
```

## Game Features

### 1. Interactive Elements
- **Drag & Drop**: Smooth token dragging with snap-to-place
- **Click to Build**: Alternative for mobile/accessibility
- **Keyboard Support**: Arrow keys for navigation, Enter to submit
- **Audio Playback**: TTS for Chinese pronunciation and English confirmation
- **Visual Feedback**: Color-coded tokens (correct/incorrect/misplaced)

### 2. Progress Visualization
- **Progress Bar**: Shows mastery level for current difficulty
- **Streak Counter**: Visual streak indicator with fire/ice effects
- **Accuracy Meter**: Real-time accuracy percentage
- **Level Badge**: Current difficulty level with unlock animations

### 3. Engagement Features
- **Daily Streaks**: Consecutive daily practice tracking
- **Achievement System**: Unlock badges for milestones
- **Leaderboard**: Weekly/monthly rankings
- **Study Reminders**: Smart notifications based on SM-2 schedule

## Content Structure

### 1. Sentence Categories
```json
{
  "categories": [
    "daily_conversation",
    "academic_writing", 
    "business_communication",
    "travel_phrases",
    "grammar_patterns",
    "idiomatic_expressions"
  ]
}
```

### 2. Grammar Patterns (Earthworm Style)
```json
{
  "patterns": [
    {
      "id": "present_simple",
      "template": "{subject} {verb} {object}",
      "examples": [
        {"chinese": "我喜欢苹果", "english": "I like apples"},
        {"chinese": "他读书", "english": "He reads books"}
      ]
    },
    {
      "id": "present_continuous", 
      "template": "{subject} {be_verb} {verb_ing} {object}",
      "examples": [
        {"chinese": "我正在学习", "english": "I am studying"},
        {"chinese": "她在工作", "english": "She is working"}
      ]
    }
  ]
}
```

### 3. Content Progression
- **HSK Level 1-2**: Basic vocabulary and patterns
- **HSK Level 3-4**: Intermediate grammar and expressions  
- **HSK Level 5-6**: Advanced structures and idioms
- **Custom Patterns**: Business, academic, specialized domains

## Technical Implementation

### 1. API Endpoints
```
GET  /api/chinese-english/next?userId={id}&difficulty={level}
POST /api/chinese-english/attempt
GET  /api/chinese-english/progress/{userId}
POST /api/chinese-english/hint
GET  /api/chinese-english/categories
```

### 2. Data Models
- **ChineseSentence**: Source content with metadata
- **ChineseAttempt**: User interaction tracking
- **ChineseProgress**: SM-2 progress and mastery
- **ConjunctionPattern**: Reusable sentence templates

### 3. Response Validation
```javascript
// Smart validation allowing for minor variations
function validateResponse(userInput, correctAnswer) {
  return {
    isCorrect: boolean,
    accuracy: number, // 0-1 score
    mistakes: Array,  // Position and type of errors
    suggestions: Array // Correction hints
  };
}
```

## Mobile Optimization

### 1. Touch Interface
- **Large Touch Targets**: Minimum 44px tokens
- **Gesture Support**: Swipe to rearrange, tap to select
- **Haptic Feedback**: Success/failure vibrations
- **Responsive Layout**: Adapts to screen size

### 2. Performance
- **Preload Content**: Cache next 5 sentences
- **Optimized Animations**: 60fps interactions
- **Offline Support**: Local storage for progress
- **Quick Loading**: <2s initial load time

## Accessibility

### 1. Screen Reader Support
- **ARIA Labels**: Comprehensive labeling
- **Keyboard Navigation**: Full functionality without mouse
- **Audio Descriptions**: TTS for all content
- **High Contrast**: Support for visual impairments

### 2. Learning Disabilities
- **Adjustable Speed**: Slower pacing options
- **Visual Cues**: Color and shape coding
- **Extended Time**: No time pressure mode
- **Simplified Interface**: Reduced cognitive load option

This specification provides a comprehensive framework for implementing the Chinese-to-English spelling game mode that integrates seamlessly with your existing Next.js architecture while incorporating proven learning methodologies from the Earthworm project.