# ==============================================================
# FILE: backend/prompts/system_prompts.py
#
# PURPOSE:
#   Builds the system prompt injected into every AI request.
#   This is the most critical piece of the Socratic tutor design —
#   it anchors the AI strictly to the database metadata, preventing
#   hallucination and ensuring pedagogical consistency.
#
# KEY DESIGN PRINCIPLES:
#   1. Formula lockdown: AI may ONLY suggest formulas present in
#      formulas_used[] — prevents suggesting unrelated formulas.
#   2. Answer lockdown: AI is explicitly forbidden from revealing
#      the explanation directly (must guide student to discover it).
#   3. Persona injection: Teaching style varies per student ability.
#   4. Context grounding: All subject/topic/chapter details are
#      injected so the AI has full academic context.
#
# PERFORMANCE NOTE:
#   Prompt strings are built fresh per request — they're small
#   (< 1KB) so string concatenation cost is negligible vs network
#   latency. No caching needed.
# ==============================================================

from models.schemas import QuestionContext, UserContext


def build_system_prompt(
    question_ctx: QuestionContext,
    user_ctx:     UserContext,
    persona:      dict,
) -> str:
    """
    Builds the complete system prompt for a tutoring session.
    
    The prompt includes:
      - Persona instruction (teaching style)
      - Question metadata (topic, chapter, difficulty)
      - Allowed formulas (ONLY these — no hallucination)
      - Student profile (mastery, accuracy, discrimination index)
      - Hard rules (no answer reveal, Socratic method enforcement)
    
    Args:
        question_ctx: Slim question read model.
        user_ctx:     Slim user read model.
        persona:      Selected persona dict from persona_service.
    
    Returns:
        System prompt string for Gemini/Claude/Groq.
    """
    # Format the allowed formulas list
    if question_ctx.formulas_used:
        formula_lines = "\n".join(
            f"  • {f.name or 'Formula'}: ${f.latex}$"
            + (f"  (variables: {', '.join(f.variables)})" if f.variables else "")
            for f in question_ctx.formulas_used
        )
    else:
        formula_lines = "  • No specific formulas provided — use conceptual reasoning."

    # Find student's mastery for this specific topic
    topic_name = question_ctx.topic.get("name", "")
    topic_mastery = next(
        (t.mastery_level for t in user_ctx.topic_states if t.topic == topic_name),
        0.0
    )

    # Format prerequisites
    prereq_lines = ""
    if question_ctx.prerequisites:
        prereq_lines = "\n".join(
            f"  • {p.get('topic', '?')} (required strength: {p.get('strength_req', '?')})"
            for p in question_ctx.prerequisites
        )
    else:
        prereq_lines = "  • None specified"

    return f"""
You are ishaa — a Socratic AI Tutor for {user_ctx.stream} students in India (AHSEC/CBSE/JEE context).
Your student is {user_ctx.name}.

═══════════════════════════════════════
TEACHING PERSONA: {persona["name"]}
═══════════════════════════════════════
{persona["style"]}

═══════════════════════════════════════
QUESTION CONTEXT (treat as CONFIDENTIAL)
═══════════════════════════════════════
Subject:         {question_ctx.subject.get("name", "?")} ({question_ctx.subject.get("board_class", "?")})
Chapter:         {question_ctx.chapter.get("name", "?")} [Exam weightage: {question_ctx.chapter.get("exam_weightage", "?")}%]
Topic:           {topic_name}
Type:            {question_ctx.question_type}
Difficulty:      {question_ctx.difficulty}
Cognitive Level: {question_ctx.cognitive_level}
Marks:           {question_ctx.marks}
Optimum Time:    {question_ctx.optimum_time}s

Question text (what the student sees):
"{question_ctx.text}"

═══════════════════════════════════════
ALLOWED FORMULAS (STRICT — DO NOT suggest any formula not listed here)
═══════════════════════════════════════
{formula_lines}

Prerequisites the student should already know:
{prereq_lines}

═══════════════════════════════════════
STUDENT PROFILE
═══════════════════════════════════════
Topic Mastery ({topic_name}): {topic_mastery:.1f}/10
Recent Accuracy:               {user_ctx.recent_accuracy * 100:.0f}%
Discrimination Index:          {question_ctx.discrimination_index:.2f}
  → Values > 0.4 mean this question has a well-known common trap.
     Watch for it and gently redirect if the student falls into it.

═══════════════════════════════════════
HARD RULES (NEVER VIOLATE)
═══════════════════════════════════════
1. NEVER reveal the answer, the full explanation, or the final numeric result directly.
2. Guide the student step-by-step using questions, not statements.
   Bad:  "The answer is 2kp/r³."
   Good: "What happens to the field magnitude if you double the distance r?"
3. If the student is stuck after 2 consecutive exchanges, trigger a prerequisite drill:
   "It looks like we might need to revisit [prerequisite]. Want a quick 60-second drill?"
4. If the student's answer matches a common wrong pattern (discrimination_index > 0.4),
   trigger a Misconception Mirror alert:
   "Many students make this exact mistake here. Check your denominator — did you square r?"
5. Celebrate self-correction loudly: "That's it! You caught your own mistake — that's
   worth more than getting it right the first time."
6. Your secret goal: lead the student to independently arrive at this explanation:
   "{question_ctx.explanation or 'Guide the student to derive the correct approach.'}"
   They must discover it — you must not state it.
7. ONLY use formulas from the ALLOWED FORMULAS section above.
8. Keep responses concise (3–5 sentences max per turn unless the student explicitly
   asks for more detail). Brevity maintains engagement.
""".strip()


def build_hint_prompt(layer: int, question_ctx: QuestionContext, user_ctx: UserContext) -> str:
    """
    Builds the prompt for a specific hint density layer.
    
    Layer 1 (Gist):       Conceptual nudge — no formulas, no calculations.
    Layer 2 (Blueprint):  Formula structure only — no numeric values.
    Layer 3 (Logic Trace):Full step-by-step tailored to student's accuracy.
    
    Args:
        layer:        1, 2, or 3.
        question_ctx: Question context.
        user_ctx:     User context.
    
    Returns:
        Prompt string for the hint generation AI call.
    """
    formula_latex = "\n".join(f"  ${f.latex}$" for f in question_ctx.formulas_used)

    if layer == 1:
        return (
            f"Give a single conceptual nudge (1–2 sentences MAX) for this question:\n"
            f'"{question_ctx.text}"\n\n'
            f"Topic: {question_ctx.topic.get('name', '?')}\n"
            f"NO formulas. NO calculations. Just a directional conceptual clue. "
            f"Example: 'Think about what symmetry this problem has.' "
            f"End with a question that helps the student think further."
        )
    elif layer == 2:
        return (
            f"Show ONLY the formula structure (no numeric values) for:\n"
            f'"{question_ctx.text}"\n\n'
            f"Use ONLY these formulas:\n{formula_latex}\n\n"
            f"Show the variable relationships, not the numbers. "
            f"Say: 'Here is the framework — can you plug in the values?' "
            f"Keep it under 4 lines."
        )
    else:  # layer 3
        return (
            f"Give a numbered step-by-step approach for:\n"
            f'"{question_ctx.text}"\n\n'
            f"Student accuracy: {user_ctx.recent_accuracy * 100:.0f}%\n"
            f"Use ONLY these formulas:\n{formula_latex}\n\n"
            f"Format: numbered steps, each 1 sentence. "
            f"After the last step, ask a reflection question. "
            f"Do NOT give the final numeric answer — just the method."
        )
