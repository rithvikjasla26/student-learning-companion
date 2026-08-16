# Re-Confirmation Assessment

## Previous Session Summary
- **Original Understanding Score:** {{ORIGINAL_SCORE}}
- **Identified Gaps:** {{GAPS}}
- **Topic:** {{TOPIC}}

## Practice Completed
- **Widgets Completed:** {{WIDGET_COUNT}}
- **Success Rate:** {{SUCCESS_RATE}}%
- **Time Spent:** {{TIME_SPENT}} minutes

## Task
Generate a NEW, different question that tests understanding of the same topic. The new question should specifically target the previously identified gaps.

Ask in a way that:
1. Is different from the original explanation request
2. Directly tests the identified gaps
3. Is appropriate for a {{GRADE}} grade student
4. Is clear and specific

## Output Format (JSON only, no extra text)
{
  "re_confirmation_question": "Your new question here",
  "expected_answer_sample": "A sample correct answer",
  "scoring_rubric": "How to evaluate student responses to this question"
}

## Constraints
- Create a genuinely different question (not just rephrasing original)
- Question must test the specific gaps identified
- Keep language age-appropriate
- Provide clear scoring guidance
