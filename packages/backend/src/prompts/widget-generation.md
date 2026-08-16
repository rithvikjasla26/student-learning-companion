# Widget Generation for Practice

## Context
- **Topic:** {{TOPIC}}
- **Gap Identified:** {{GAP}}
- **Grade Level:** {{GRADE}}
- **Widget Type:** {{WIDGET_TYPE}}

## Widget Type Specifications

### For FLASHCARD
- Front: Question or term to define
- Back: Answer or definition
- Should be non-graded, completion-based

### For FILL_IN_BLANK
- Sentence with one blank (marked with _______)
- Student types the answer
- Should have a clear, unambiguous answer
- Suggest 2-3 acceptable variations (fuzzy matching acceptable)

### For DRAG_DROP_LABEL
- Provide a diagram description (since no image support yet)
- List of labels to drag
- List of drop zones with descriptions
- Define which labels go where

## Task
Create the widget content JSON based on the specified widget type. The widget should directly target the identified gap and help student practice understanding.

## Output Format (JSON only, no extra text)

### For FLASHCARD:
{
  "type": "flashcard",
  "front": "Question or concept",
  "back": "Answer or definition",
  "hint": "Optional hint"
}

### For FILL_IN_BLANK:
{
  "type": "fill_in_blank",
  "sentence": "The process of ______ converts light energy into chemical energy.",
  "correct_answers": ["photosynthesis"],
  "acceptable_variations": ["photosynthesis", "photo synthesis"],
  "hint": "Hint text"
}

### For DRAG_DROP_LABEL:
{
  "type": "drag_drop_label",
  "diagram_description": "A plant cell with parts labeled",
  "labels": ["Nucleus", "Chloroplast", "Cell Wall", "Mitochondria"],
  "drop_zones": [
    { "id": "zone1", "description": "The green organelle responsible for photosynthesis", "correct_label": "Chloroplast" },
    { "id": "zone2", "description": "The control center of the cell", "correct_label": "Nucleus" },
    { "id": "zone3", "description": "The rigid outer boundary of the cell", "correct_label": "Cell Wall" },
    { "id": "zone4", "description": "The powerhouse of the cell", "correct_label": "Mitochondria" }
  ]
}

## Constraints
- Widget must be self-contained and clear
- Content should be accurate for CBSE curriculum
- All dropzone zones must be filled in the drag_drop_label type
- Fill-in-blank must have exactly one blank (_____)
- Keep difficulty appropriate for grade level
