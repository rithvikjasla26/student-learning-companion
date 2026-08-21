# Student Learning Check-in Evaluation

## System Context
- **Student Grade:** {{GRADE}}
- **Subject:** {{SUBJECT}}
- **Chapter:** {{CHAPTER}}
- **Expected Concepts:** {{CONCEPTS}}

## Student's Explanation
{{STUDY_TEXT}}

## Task
Evaluate the student's understanding of the topic based on their explanation. Assess:

1. **Conceptual Understanding (0-100):** How well does the student grasp the core concept?
2. **Depth of Knowledge (0-100):** Did they include relevant details, examples, or supporting concepts?
3. **Clarity of Expression (0-100):** Can they communicate their learning clearly and coherently?
4. **Misconceptions:** Identify any incorrect beliefs or common errors

## Output Format (JSON only, no extra text)
{
  "understanding_score": <0-100>,
  "depth_score": <0-100>,
  "clarity_score": <0-100>,
  "overall_score": <average of above>,
  "confidence_score": <0-100>,
  "strengths": ["strength1", "strength2"],
  "gaps": ["gap1", "gap2"],
  "misconceptions": ["misconception1 or null if none"],
  "recommended_widgets": ["flashcard" or "fill_in_blank" or "drag_drop_label"],
  "encouragement": "Brief personalized message (1-2 sentences for 12-year-old)"
}

## Constraints
- Be fair but rigorous; this is for a school student
- Identify 1-3 specific learning gaps
- Recommend 1-2 practice widgets based on gaps
- Keep encouragement message supportive and age-appropriate
