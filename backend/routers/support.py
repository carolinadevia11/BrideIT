import random
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from models import User
from routers.auth import get_current_user


router = APIRouter(prefix="/api/v1/support", tags=["support-coach"])


SUPPORTIVE_PHRASES = [
    "You're showing up for your child even while things feel messy.",
    "Choosing a steady tone is already a win for your kiddo.",
    "It's okay to need a pause—calm is something you can build, not fake.",
    "Naming what you need is the most respectful thing you can do for everyone involved.",
]

GROUNDING_TIPS = [
    "4-7-8 breath: inhale 4, hold 7, exhale 8. Repeat three times.",
    "Name 3 things you can see, 2 you can touch, 1 you can hear.",
    "Plant both feet, roll your shoulders back, and unclench your jaw.",
    "Sip water intentionally—slow sips signal safety to your nervous system.",
]

REPAIR_PROMPTS = [
    "“I hear what matters to you. Here's what matters to me…”",
    "“Let's pick one next step we can both say yes to today.”",
    "“I'm choosing calm so the kids feel steady—even if we disagree.”",
    "“Can we stay with the facts and leave assumptions out?”",
]

SUGGESTED_STEPS = [
    "Jot down one clear request you'd like to make.",
    "Draft a message in Notes before sending it so you can edit for tone.",
    "Decide on the best channel (Bridge, email, phone) before you reach out.",
    "Check the calendar so you can offer two concrete timing options.",
]

INTENT_LIBRARY = [
    {
        "keywords": ["angry", "mad", "furious", "rage", "screaming", "yelling"],
        "focus": "Emotion Regulation",
        "responses": [
            "It sounds like the heat of this moment is real. Anger usually guards softer feelings underneath—naming the fear, sadness, or exhaustion underneath helps you respond instead of react.",
            "When your body rushes with anger, pause long enough to ask what you're protecting. Naming the softer feeling gives you back choices that yelling takes away.",
        ],
        "quick_replies": [
            "Help me slow down before I reply.",
            "Give me language for a calm boundary.",
            "I need a script for when I'm angry.",
        ],
    },
    {
        "keywords": [
            "schedule",
            "calendar",
            "swap",
            "pickup",
            "pick up",
            "dropoff",
            "drop-off",
            "logistics",
            "timing",
        ],
        "focus": "Logistics & Planning",
        "responses": [
            "Keep the conversation anchored to the child's routine. Mirror the other parent's concern and offer two realistic options that respect what your child needs today.",
            "Before you respond, glance at the calendar so you can propose two workable timings—naming options lowers tension faster than arguing about the past.",
        ],
        "quick_replies": [
            "Draft a response about swapping days.",
            "How do I keep this child-focused?",
            "I need wording for a polite no.",
        ],
    },
    {
        "keywords": ["court", "legal", "judge", "attorney", "mediation", "lawyer"],
        "focus": "Documentation & Legal",
        "responses": [
            "Legal stress spikes adrenaline, so stick to facts, document agreements in Bridge, and separate what needs a calm parent voice from what needs your attorney.",
            "When the legal system gets involved, calm timelines and written summaries protect you. Respond with facts, note decisions, and give yourself time to breathe before you hit send.",
        ],
        "quick_replies": [
            "Remind me how to document calmly.",
            "Help me keep this factual.",
            "What tone keeps this safe legally?",
        ],
    },
    {
        "keywords": [
            "tired",
            "exhausted",
            "burned",
            "burnt",
            "drained",
            "fatigued",
            "relax",
            "rest",
            "break",
            "pause",
            "calm down",
        ],
        "focus": "Rest & Recovery",
        "responses": [
            "Rest isn't earned—it's required. Micro-breaks (stretching, stepping outside, drinking water) reset your nervous system so you don't spill stress onto your child.",
            "Your nervous system is asking for a reset. A five-minute ritual—walk to the mailbox, sip water intentionally, or write one sentence that starts with “I can handle…”—brings you back online.",
        ],
        "quick_replies": [
            "I need a doable reset idea.",
            "How do I tell them I need time?",
            "Give me a self-compassion nudge.",
        ],
    },
    {
        "keywords": ["worried", "worry", "anxious", "anxiety", "panic", "fear", "stressed"],
        "focus": "Anxiety & Reassurance",
        "responses": [
            "Worry is a signal you care, not proof you're failing. Separate what you can influence (tone, timing, responsiveness) from what you cannot, and respond to the part within your control.",
            "When worry spikes, name one thing you can influence right now—your tone, your timing, your documentation—and let the rest pass like waves instead of gripping them.",
        ],
        "quick_replies": [
            "Help me calm down before I text.",
            "Give me a confident script.",
            "What if they don't respond well?",
        ],
    },
    {
        "keywords": ["child", "kid", "daughter", "son", "kids", "co-parenting"],
        "focus": "Child-Centered",
        "responses": [
            "Keep your language anchored in what your child needs: safety, predictability, permission to love both parents. Model the tone you hope your co-parent will eventually mirror.",
            "Every message can start with the child's need. Try “For the kids to feel steady, I’m thinking…” so even hard topics stay grounded in care instead of conflict.",
        ],
        "quick_replies": [
            "Help me keep this kid-focused.",
            "What do I say about the kids?",
            "Give me a validating sentence.",
        ],
    },
]

QUICK_REPLY_RESPONSES = {
    "how do i respond without escalating?": (
        "Try a three-part reply: (1) mirror what you heard, (2) name what you need, (3) offer one next step. "
        'Example: “I hear timing is stressful. I need to protect bedtimes, so the earliest I can do is 6pm. Does that work?”'
    ),
    "give me a validating sentence.": (
        'You could say, “I can see this matters a lot to you, and I want us both feeling steady as we work it out.” Validation doesn’t equal agreement—it just lowers defenses.'
    ),
    "help me find balanced language.": (
        'Use “I feel / I need / I’m willing” to keep things balanced. Example: “I feel anxious when plans change last-minute. I need a heads-up by noon. I’m willing to swap Sundays if we plan it together.”'
    ),
    "help me keep this kid-focused.": (
        'Lead with the child: “For Mia to feel secure this week, she needs consistent handoffs. Can we confirm the Tuesday pickup by 5pm?” Mention the child’s need, then the logistical ask.'
    ),
    "what do i say about the kids?": (
        'Share an observation plus an ask: “Eli has been clingy after transitions. Can we both remind him he’s safe and loved before exchanges this week?”'
    ),
    "draft a response about swapping days.": (
        '“I see you need Thursday. I can swap if we trade for Saturday morning so the kids keep their routine. Does that work?”'
    ),
    "i need wording for a polite no.": (
        '“I appreciate you asking. I can’t make that change this week because it disrupts the kids’ routine. Let’s revisit after the holiday.”'
    ),
    "i need a script for when i'm angry.": (
        'Pause, then say: “I’m too charged to respond well right now. I’ll circle back in an hour so we can stay respectful.”'
    ),
}


class SupportSessionResponse(BaseModel):
    greeting: str
    status: str
    focus: str
    quick_replies: List[str]
    reminders: List[str]


class SupportChatRequest(BaseModel):
    message: str
    parent_name: Optional[str] = None
    goal: Optional[str] = None
    intensity: Optional[str] = None


class SupportChatResponse(BaseModel):
    message: str
    supportive_phrase: str
    grounding_tip: str
    repair_prompt: str
    quick_replies: List[str]
    focus: str
    suggested_next_step: str


def _pick_intent(message: str) -> dict:
    normalized = message.lower()
    for intent in INTENT_LIBRARY:
        if any(keyword in normalized for keyword in intent["keywords"]):
            return intent
    return {
        "focus": "Steady Communication",
        "responses": [
            "Slow the tempo, validate both perspectives, and use “I feel / I need / I'm willing” language. That keeps things collaborative even if you disagree.",
            "Even if you disagree, keeping statements to “I feel / I need / I’m willing” protects everyone’s nervous system and keeps the conversation useful.",
        ],
        "quick_replies": [
            "How do I respond without escalating?",
            "Give me a validating sentence.",
            "Help me find balanced language.",
        ],
    }


def _personalize_context(user_message: str) -> str:
    text = user_message.lower()
    notes = []

    if any(word in text for word in ["depress", "sad", "lonely", "down", "heavy"]):
        notes.append("I can feel how heavy this feels—naming it out loud is a strong first step.")
    if "child" in text or "kid" in text or "son" in text or "daughter" in text:
        if "away" in text or "missing" in text or "gone" in text:
            notes.append("Being separated from your child can ache—let that tenderness guide how gently you treat yourself today.")
        else:
            notes.append("Keep anchoring yourself to what keeps your child feeling safe and steady.")
    if "relax" in text or "calm" in text or "breathe" in text:
        notes.append("Your body is asking for cues of safety—small, repeated rituals reassure it faster than pep talks.")

    return " ".join(notes)


def _build_response_text(intent: dict, user_message: str) -> str:
    base = random.choice(intent.get("responses", [""]))
    context = _personalize_context(user_message)
    if context:
        return f"{base} {context}".strip()
    return base


@router.get("/session", response_model=SupportSessionResponse)
async def start_session(
    parent_name: Optional[str] = None,
    current_user: User = Depends(get_current_user),
):
    display_name = parent_name or current_user.firstName or current_user.email.split("@")[0]
    focus = random.choice(
        ["Emotional Safety", "Logistics Ready", "Calm Advocacy", "Grace Under Pressure"]
    )
    quick_replies = random.choice(INTENT_LIBRARY)["quick_replies"]
    reminders = [
        "I’m an emotional support coach, not legal counsel.",
        "If you feel unsafe, reach out to emergency services.",
    ]
    greeting = (
        f"Hi {display_name}, I’m Bridgette’s Support Coach. I’m here to help you stay calm, clear, "
        "and child-focused. What’s on your heart today?"
    )
    return {
        "greeting": greeting,
        "status": "Online • responses in under 1 minute",
        "focus": focus,
        "quick_replies": quick_replies,
        "reminders": reminders,
    }


@router.post("/chat", response_model=SupportChatResponse)
async def chat_with_support_coach(
    payload: SupportChatRequest,
    current_user: User = Depends(get_current_user),
):
    if not payload.message or not payload.message.strip():
        raise HTTPException(status_code=400, detail="Message is required.")

    normalized = payload.message.strip().lower()
    custom_reply = QUICK_REPLY_RESPONSES.get(normalized)

    intent = _pick_intent(payload.message)

    if custom_reply:
        response_text = custom_reply
    else:
        response_text = _build_response_text(intent, payload.message)

    supportive_phrase = random.choice(SUPPORTIVE_PHRASES)
    grounding_tip = random.choice(GROUNDING_TIPS)
    repair_prompt = random.choice(REPAIR_PROMPTS)
    suggested_step = random.choice(SUGGESTED_STEPS)

    return {
        "message": response_text,
        "supportive_phrase": supportive_phrase,
        "grounding_tip": grounding_tip,
        "repair_prompt": repair_prompt,
        "quick_replies": intent["quick_replies"],
        "focus": intent["focus"],
        "suggested_next_step": suggested_step,
    }

