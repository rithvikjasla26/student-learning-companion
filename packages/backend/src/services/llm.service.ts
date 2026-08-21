import Anthropic from '@anthropic-ai/sdk';
import env from '../config/env.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const client = new Anthropic({
  apiKey: env.ANTHROPIC_API_KEY,
});

/**
 * Load prompt template from file
 */
function loadPromptTemplate(filename: string): string {
  const promptPath = path.join(__dirname, '../prompts', filename);
  return fs.readFileSync(promptPath, 'utf-8');
}

export interface LLMEvaluationResponse {
  mastery_score: number; // 0-100
  gap_type: 'recall' | 'structural' | 'sequence' | 'application' | 'none';
  gap_description: string;
  follow_up_question?: string;
}

export const llmService = {
  /**
   * Call Claude Haiku or Sonnet with prompt
   */
  async callLLM(
    model: 'haiku' | 'sonnet',
    userMessage: string,
    systemPrompt?: string
  ): Promise<string> {
    const modelId = model === 'haiku' ? env.CLAUDE_HAIKU_MODEL : env.CLAUDE_SONNET_MODEL;

    const response = await client.messages.create({
      model: modelId,
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userMessage,
        },
      ],
    });

    const content = response.content[0];
    if (content.type === 'text') {
      return content.text;
    }

    throw new Error('Unexpected response type from LLM');
  },

  /**
   * Evaluate student's explanation of a concept
   */
  async evaluateExplanation(
    explanation: string,
    expectedConcepts: string[],
    topicName: string
  ): Promise<LLMEvaluationResponse> {
    const promptTemplate = loadPromptTemplate('check-in-evaluation.md');

    const systemPrompt = `You are an expert educational evaluator for CBSE students.
Your task is to evaluate student explanations and identify learning gaps.
Respond ONLY with valid JSON, no additional text.`;

    const userMessage = promptTemplate
      .replace('{explanation}', explanation)
      .replace('{expected_concepts}', expectedConcepts.join(', '))
      .replace('{topic_name}', topicName);

    const response = await this.callLLM('haiku', userMessage, systemPrompt);

    try {
      // Extract JSON from response (in case it's wrapped in markdown)
      let jsonStr = response;
      const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }

      const parsed = JSON.parse(jsonStr);
      return {
        mastery_score: Math.min(100, Math.max(0, parseInt(parsed.mastery_score) || 50)),
        gap_type: parsed.gap_type || 'none',
        gap_description: parsed.gap_description || 'No specific gaps detected',
        follow_up_question: parsed.follow_up_question,
      };
    } catch (error) {
      console.error('Failed to parse LLM response:', response, error);
      // Return default if parsing fails
      return {
        mastery_score: 50,
        gap_type: 'none',
        gap_description: 'Could not evaluate explanation',
      };
    }
  },

  /**
   * Generate practice widgets based on detected gap
   */
  async generateWidgetContent(
    gapType: string,
    topic: string,
    concepts: string[]
  ): Promise<{
    type: string;
    content: Record<string, any>;
  }> {
    const promptTemplate = loadPromptTemplate('widget-generation.md');

    const systemPrompt =
      'You are a widget content generator for educational apps. Respond with valid JSON only.';

    const userMessage = promptTemplate
      .replace('{gap_type}', gapType)
      .replace('{topic}', topic)
      .replace('{concepts}', concepts.join(', '));

    const response = await this.callLLM('haiku', userMessage, systemPrompt);

    try {
      let jsonStr = response;
      const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }

      return JSON.parse(jsonStr);
    } catch (error) {
      console.error('Failed to parse widget response:', response, error);
      return {
        type: 'flashcard',
        content: {
          front: topic,
          back: concepts.join(', '),
        },
      };
    }
  },

  /**
   * Transcribe audio to text using Whisper API
   * For MVP, this uses a placeholder that returns the audio metadata
   * In production, integrate with OpenAI Whisper or similar service
   */
  async transcribeAudio(
    audioPath: string,
    language: string = 'en'
  ): Promise<{
    transcript: string;
    confidence: number;
    language: string;
    duration: number;
  }> {
    try {
      // Check if file exists
      if (!fs.existsSync(audioPath)) {
        throw new Error('Audio file not found');
      }

      const stats = fs.statSync(audioPath);
      const fileSizeInMB = stats.size / (1024 * 1024);

      // Validate file size (max 25MB for typical Whisper implementations)
      if (fileSizeInMB > 25) {
        throw new Error('Audio file too large (max 25MB)');
      }

      // TODO: Integrate with OpenAI Whisper API or similar
      // For MVP, return a placeholder response
      console.log(`🎤 Audio file received: ${audioPath} (${fileSizeInMB.toFixed(2)}MB)`);
      console.log(`   Language: ${language}`);
      console.log(`   Note: Whisper transcription not yet integrated`);

      // Placeholder: Return empty transcript indicating audio was received but not transcribed
      return {
        transcript: '[Audio received - transcription pending]',
        confidence: 0,
        language,
        duration: Math.floor(fileSizeInMB * 10), // Rough estimate
      };
    } catch (error) {
      console.error('Audio transcription failed:', error);
      throw new Error(
        `Failed to transcribe audio: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  },

  /**
   * Re-evaluate student's re-confirmation explanation (using Sonnet for deeper reasoning)
   */
  async evaluateReconfirmation(
    originalExplanation: string,
    newExplanation: string,
    expectedConcepts: string[],
    topicName: string,
    originalMasteryScore: number
  ): Promise<LLMEvaluationResponse> {
    const promptTemplate = loadPromptTemplate('re-confirmation.md');

    const systemPrompt = `You are an expert educational evaluator. Compare the student's two explanations.
Provide deeper reasoning about improvement. Respond ONLY with valid JSON.`;

    const userMessage = promptTemplate
      .replace('{original_explanation}', originalExplanation)
      .replace('{new_explanation}', newExplanation)
      .replace('{expected_concepts}', expectedConcepts.join(', '))
      .replace('{topic_name}', topicName)
      .replace('{original_mastery_score}', originalMasteryScore.toString());

    const response = await this.callLLM('sonnet', userMessage, systemPrompt);

    try {
      let jsonStr = response;
      const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }

      const parsed = JSON.parse(jsonStr);
      return {
        mastery_score: Math.min(100, Math.max(0, parseInt(parsed.mastery_score) || 50)),
        gap_type: parsed.gap_type || 'none',
        gap_description: parsed.gap_description || 'Progress evaluation complete',
        follow_up_question: parsed.follow_up_question,
      };
    } catch (error) {
      console.error('Failed to parse re-confirmation response:', response, error);
      return {
        mastery_score: originalMasteryScore,
        gap_type: 'none',
        gap_description: 'Re-evaluation complete',
      };
    }
  },
};
