# ==============================================================
# FILE: backend/services/persona_service.py
#
# PURPOSE:
#   Selects the appropriate AI teaching persona based on the
#   student's recent accuracy. The persona shapes the AI's
#   communication style — from analogies for beginners to
#   Socratic challenges for high performers.
#
# THREE PERSONAS:
#   Intuitionist  (accuracy < 50%): Uses analogies, avoids jargon,
#                                   visual and simple language.
#   Standard      (50–80%):         Balanced explanation + formulas.
#   Challenger    (> 80%):          Socratic questioning, pushes
#                                   student to derive answers.
#
# WHY THIS MATTERS:
#   A student struggling with basic concepts needs encouragement
#   and analogies, not high-level Socratic challenges. Personalized
#   pedagogy improves retention and reduces frustration.
# ==============================================================

from models.schemas import UserContext

# Persona definitions — each has a name, style instruction, and trigger predicate
PERSONAS: dict[str, dict] = {
    "intuitionist": {
        "name":    "Intuitionist",
        "style":   (
            "Use real-world analogies and simple language. Avoid mathematical jargon "
            "until the student shows comfort. Keep explanations visual and intuitive. "
            "Build confidence with small wins before tackling formula details."
        ),
        "trigger": lambda acc: acc < 0.5,
    },
    "standard": {
        "name":    "Standard Mentor",
        "style":   (
            "Balance conceptual explanation with formula usage. Ask guiding questions "
            "at each step. Acknowledge what the student does correctly before pointing "
            "to gaps. Adjust pace based on response quality."
        ),
        "trigger": lambda acc: 0.5 <= acc <= 0.8,
    },
    "challenger": {
        "name":    "Challenger",
        "style":   (
            "Use advanced Socratic questioning. Rarely explain directly — instead ask "
            "probing questions that force the student to derive conclusions. Challenge "
            "them to predict results before showing formulas. Celebrate independent insight."
        ),
        "trigger": lambda acc: acc > 0.8,
    },
}


def select_persona(user: UserContext) -> dict:
    """
    Selects the appropriate persona based on recent_accuracy.
    
    Falls back to "standard" if no trigger matches (shouldn't happen
    given the trigger conditions cover all of [0, 1], but defensive coding).
    
    Args:
        user: UserContext with recent_accuracy field (0.0–1.0).
    
    Returns:
        Persona dict with "name" and "style" keys.
    """
    for persona in PERSONAS.values():
        if persona["trigger"](user.recent_accuracy):
            return persona
    return PERSONAS["standard"]   # Safe fallback
