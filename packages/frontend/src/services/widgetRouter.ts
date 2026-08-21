export type WidgetType = 'flashcard' | 'fill_in_blank' | 'drag_drop_label';

export interface WidgetContent {
  type: WidgetType;
  content: Record<string, any>;
}

/**
 * Pick widget type based on gap type
 */
export function pickWidgetByGapType(gapType: string): WidgetType {
  switch (gapType) {
    case 'recall':
      return 'flashcard';
    case 'structural':
      return 'drag_drop_label';
    case 'sequence':
      return 'fill_in_blank';
    case 'application':
      return 'drag_drop_label';
    case 'none':
    default:
      return 'flashcard';
  }
}

/**
 * Generate sample widget content for testing
 * In production, this would come from backend
 */
export function generateSampleWidgetContent(
  gapType: string,
  topicName: string
): WidgetContent {
  const widgetType = pickWidgetByGapType(gapType);

  switch (widgetType) {
    case 'flashcard':
      return {
        type: 'flashcard',
        content: {
          front: `What is the key concept in ${topicName}?`,
          back: `Understanding the fundamental principles and relationships in ${topicName}`,
        },
      };

    case 'fill_in_blank':
      return {
        type: 'fill_in_blank',
        content: {
          sentence: `In the context of ${topicName}, the process follows a sequence where _____ is the first step.`,
          blankWord: 'identification',
          hints: ['Starts with finding or determining something', 'Common first step in any process'],
        },
      };

    case 'drag_drop_label':
      return {
        type: 'drag_drop_label',
        content: {
          imageUrl: 'https://via.placeholder.com/600x400/e3f2fd/1976d2?text=Diagram+for+' + encodeURIComponent(topicName),
          labels: [
            { id: 'label1', text: 'Component A', correctZoneId: 'zone1' },
            { id: 'label2', text: 'Component B', correctZoneId: 'zone2' },
            { id: 'label3', text: 'Component C', correctZoneId: 'zone3' },
          ],
          zones: [
            { id: 'zone1', x: 25, y: 30, label: 'Zone 1' },
            { id: 'zone2', x: 50, y: 50, label: 'Zone 2' },
            { id: 'zone3', x: 75, y: 30, label: 'Zone 3' },
          ],
        },
      };
  }
}
