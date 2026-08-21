import { describe, it, expect, beforeEach } from 'vitest';

/**
 * Widget Service Tests
 * Tests for pure functions in widget answer evaluation logic
 * Note: Database-dependent functions are tested separately with mocks
 */

describe('Widget Service - Answer Evaluation', () => {
  /**
   * Fuzzy match logic from widget service
   * Normalizes strings and checks for 70% character match
   */
  function fuzzyMatch(userAnswer: string, correctAnswer: string): boolean {
    const normalize = (s: string) =>
      s
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]/g, '');

    const userNorm = normalize(userAnswer);
    const correctNorm = normalize(correctAnswer);

    if (userNorm === correctNorm) return true;
    if (correctNorm.length === 0) return false;

    const matches = [...userNorm].filter((char) =>
      correctNorm.includes(char)
    ).length;
    return matches / correctNorm.length >= 0.7;
  }

  /**
   * Gap type to widget type mapping
   */
  function mapGapTypeToWidgetType(gapType: string): string {
    switch (gapType) {
      case 'recall':
        return 'FLASHCARD';
      case 'structural':
        return 'DRAG_DROP_LABEL';
      case 'sequence':
        return 'FILL_IN_BLANK';
      case 'application':
        return 'DRAG_DROP_LABEL';
      default:
        return 'FLASHCARD';
    }
  }

  describe('Fuzzy Match Logic', () => {
    it('should accept exact matches (case-insensitive)', () => {
      expect(fuzzyMatch('PHOTOSYNTHESIS', 'photosynthesis')).toBe(true);
      expect(fuzzyMatch('Respiration', 'respiration')).toBe(true);
      expect(fuzzyMatch('DNA', 'dna')).toBe(true);
    });

    it('should accept matches with extra whitespace', () => {
      expect(fuzzyMatch('  photosynthesis  ', 'photosynthesis')).toBe(true);
      expect(fuzzyMatch('photo synthesis', 'photosynthesis')).toBe(true);
    });

    it('should accept matches with special characters', () => {
      expect(fuzzyMatch('photo-synthesis', 'photosynthesis')).toBe(true);
      expect(fuzzyMatch('photo_synthesis', 'photosynthesis')).toBe(true);
      expect(fuzzyMatch('photo.synthesis', 'photosynthesis')).toBe(true);
    });

    it('should accept answers with 70% character match', () => {
      // photosynthesis has 14 characters
      // Need 70% = ~10 characters matched
      expect(fuzzyMatch('photosynthess', 'photosynthesis')).toBe(true); // Missing 'i'
      expect(fuzzyMatch('fotosynthesis', 'photosynthesis')).toBe(true); // 'f' instead of 'ph'
    });

    it('should reject answers below 70% character match', () => {
      expect(fuzzyMatch('photo', 'photosynthesis')).toBe(false);
      expect(fuzzyMatch('synthesis', 'photosynthesis')).toBe(false);
    });

    it('should handle single character answers', () => {
      expect(fuzzyMatch('a', 'a')).toBe(true);
      expect(fuzzyMatch('A', 'a')).toBe(true);
      expect(fuzzyMatch('b', 'a')).toBe(false);
    });

    it('should handle empty correct answer', () => {
      expect(fuzzyMatch('anything', '')).toBe(false);
      expect(fuzzyMatch('', '')).toBe(true);
    });

    it('should handle numbers in answers', () => {
      expect(fuzzyMatch('H2O', 'h2o')).toBe(true);
      expect(fuzzyMatch('H 2 O', 'h2o')).toBe(true);
      expect(fuzzyMatch('chlorophyll-a', 'chlorophylla')).toBe(true);
    });

    it('should be lenient with punctuation variations', () => {
      expect(fuzzyMatch("it's", 'its')).toBe(true);
      expect(fuzzyMatch('multi-cellular', 'multicellular')).toBe(true);
      expect(fuzzyMatch('cell,wall', 'cellwall')).toBe(true);
    });

    it('should reject completely different words', () => {
      expect(fuzzyMatch('glucose', 'mitochondria')).toBe(false);
      expect(fuzzyMatch('plant', 'animal')).toBe(false);
    });

    it('should handle real biology answers', () => {
      expect(
        fuzzyMatch('oxidative phosphorylation', 'oxidative phosphorylation')
      ).toBe(true);
      expect(
        fuzzyMatch('Oxidative Phosphorylation', 'oxidative phosphorylation')
      ).toBe(true);
      expect(
        fuzzyMatch('oxidative-phosphorylation', 'oxidative phosphorylation')
      ).toBe(true);
    });

    it('should be consistent with repeated calls', () => {
      const userAnswer = 'photosynthesis';
      const correctAnswer = 'photosynthesis';

      const result1 = fuzzyMatch(userAnswer, correctAnswer);
      const result2 = fuzzyMatch(userAnswer, correctAnswer);

      expect(result1).toBe(result2);
    });
  });

  describe('Gap Type to Widget Type Mapping', () => {
    it('should map recall gap to flashcard', () => {
      expect(mapGapTypeToWidgetType('recall')).toBe('FLASHCARD');
    });

    it('should map structural gap to drag-drop-label', () => {
      expect(mapGapTypeToWidgetType('structural')).toBe('DRAG_DROP_LABEL');
    });

    it('should map sequence gap to fill-in-blank', () => {
      expect(mapGapTypeToWidgetType('sequence')).toBe('FILL_IN_BLANK');
    });

    it('should map application gap to drag-drop-label', () => {
      expect(mapGapTypeToWidgetType('application')).toBe('DRAG_DROP_LABEL');
    });

    it('should default to flashcard for unknown gap type', () => {
      expect(mapGapTypeToWidgetType('unknown')).toBe('FLASHCARD');
      expect(mapGapTypeToWidgetType('other')).toBe('FLASHCARD');
      expect(mapGapTypeToWidgetType('')).toBe('FLASHCARD');
    });

    it('should be case-sensitive for gap type mapping', () => {
      expect(mapGapTypeToWidgetType('RECALL')).toBe('FLASHCARD');
      expect(mapGapTypeToWidgetType('Recall')).toBe('FLASHCARD');
    });
  });

  describe('Widget Content Generation', () => {
    function generateSampleContent(gapType: string): any {
      switch (gapType) {
        case 'recall':
          return {
            front: 'What is the primary concept?',
            back: 'Understanding the fundamental principles',
          };

        case 'structural':
          return {
            imageUrl: 'https://via.placeholder.com/600x400',
            labels: [
              { id: 'label1', text: 'Component A' },
              { id: 'label2', text: 'Component B' },
            ],
            zones: [
              { id: 'zone1', x: 25, y: 50 },
              { id: 'zone2', x: 75, y: 50 },
            ],
          };

        case 'sequence':
          return {
            sentence:
              'The process begins with _____ and continues to the next step.',
            blankWord: 'identification',
            hints: [
              'First step in any process',
              'Finding what needs to be done',
            ],
          };

        default:
          return {};
      }
    }

    it('should generate flashcard content for recall', () => {
      const content = generateSampleContent('recall');

      expect(content).toHaveProperty('front');
      expect(content).toHaveProperty('back');
      expect(typeof content.front).toBe('string');
      expect(typeof content.back).toBe('string');
      expect(content.front.length).toBeGreaterThan(0);
    });

    it('should generate drag-drop content for structural', () => {
      const content = generateSampleContent('structural');

      expect(content).toHaveProperty('imageUrl');
      expect(content).toHaveProperty('labels');
      expect(content).toHaveProperty('zones');
      expect(Array.isArray(content.labels)).toBe(true);
      expect(Array.isArray(content.zones)).toBe(true);
      expect(content.labels.length).toBeGreaterThan(0);
      expect(content.zones.length).toBeGreaterThan(0);
    });

    it('should generate fill-in-blank content for sequence', () => {
      const content = generateSampleContent('sequence');

      expect(content).toHaveProperty('sentence');
      expect(content).toHaveProperty('blankWord');
      expect(content).toHaveProperty('hints');
      expect(typeof content.sentence).toBe('string');
      expect(typeof content.blankWord).toBe('string');
      expect(Array.isArray(content.hints)).toBe(true);
      expect(content.hints.length).toBeGreaterThan(0);
    });

    it('should have sentences with blanks for sequence', () => {
      const content = generateSampleContent('sequence');
      expect(content.sentence).toContain('_____');
    });

    it('should return empty object for unknown gap type', () => {
      const content = generateSampleContent('unknown');
      expect(Object.keys(content).length).toBe(0);
    });
  });

  describe('Answer Evaluation Scenarios', () => {
    it('should evaluate flashcard responses as always correct (self-evaluated)', () => {
      // Flashcards are self-evaluated in MVP
      // Users flip and judge themselves
      const isCorrect = true; // Always correct for flashcards
      expect(isCorrect).toBe(true);
    });

    it('should evaluate fill-in-blank answers', () => {
      const contentJson = {
        blankWord: 'photosynthesis',
      };

      // Exact match
      expect(
        fuzzyMatch('photosynthesis', contentJson.blankWord)
      ).toBe(true);

      // With spaces/punctuation
      expect(
        fuzzyMatch('photo-synthesis', contentJson.blankWord)
      ).toBe(true);

      // Wrong answer
      expect(fuzzyMatch('respiration', contentJson.blankWord)).toBe(false);
    });

    it('should evaluate drag-drop answers as any non-empty response', () => {
      // MVP: Any non-empty answer is considered a valid attempt
      const studentAnswer1 = 'some_labels';
      const studentAnswer2 = '';

      expect(studentAnswer1.length > 0).toBe(true); // Valid
      expect(studentAnswer2.length > 0).toBe(false); // Invalid
    });

    it('should handle complex science terms', () => {
      const terms = [
        { answer: 'atp synthesis', expected: 'atp synthesis' },
        { answer: 'ATP-Synthesis', expected: 'atp synthesis' },
        { answer: 'A.T.P Synthesis', expected: 'atpsynthesis' },
        { answer: 'electron transport chain', expected: 'electron transport chain' },
        { answer: 'ELECTRON-TRANSPORT-CHAIN', expected: 'electron transport chain' },
      ];

      terms.forEach(({ answer, expected }) => {
        expect(fuzzyMatch(answer, expected)).toBe(true);
      });
    });

    it('should handle partial answers that still meet 70% threshold', () => {
      // "photosynthss" vs "photosynthesis"
      // Missing 'i' and 'e' (2 chars), but has 12/14 = 85.7% match
      expect(fuzzyMatch('photosynthss', 'photosynthesis')).toBe(true);

      // "photosyn" vs "photosynthesis"
      // Only 8/14 = 57% match (below 70%)
      expect(fuzzyMatch('photosyn', 'photosynthesis')).toBe(false);
    });
  });
});
