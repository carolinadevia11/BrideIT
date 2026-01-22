import json
import os
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta

# Optional imports
try:
    from openai import AsyncOpenAI
    OPENAI_SUPPORT = True
except ImportError:
    OPENAI_SUPPORT = False
    print("⚠️ openai not installed. AI features will be limited.")

class CalendarAssistant:
    """
    AI Service for Calendar Management and Conflict Resolution.
    Supports OpenAI and OpenAI-compatible endpoints (like local LLMs).
    """
    
    def __init__(self, api_key: Optional[str] = None, base_url: Optional[str] = None):
        """
        Initialize the calendar assistant.
        
        Args:
            api_key: OpenAI API Key (optional, defaults to env var)
            base_url: Custom base URL for local LLMs (optional)
        """
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        self.base_url = base_url or os.getenv("OPENAI_BASE_URL")
        
        self.client = None
        if OPENAI_SUPPORT and (self.api_key or self.base_url):
            # If base_url is provided (e.g. for local LLM), api_key can be dummy
            final_key = self.api_key or "dummy-key"
            self.client = AsyncOpenAI(api_key=final_key, base_url=self.base_url)

    async def analyze_conflict(self, events: List[Dict], proposed_date: datetime, user_role: str) -> Dict[str, Any]:
        """
        Analyze a proposed date for conflicts and fairness.
        """
        if not self.client:
            return self._heuristic_analyze_conflict(events, proposed_date, user_role)

        # Prepare context for AI
        date_str = proposed_date.strftime("%Y-%m-%d")
        events_on_date = [e for e in events if e['date'].date() == proposed_date.date()]
        
        # Simple context summary
        context = {
            "proposed_date": date_str,
            "user_role": user_role, # 'mom' or 'dad'
            "existing_events": [
                {"title": e["title"], "type": e["type"], "parent": e.get("parent")} 
                for e in events_on_date
            ]
        }

        prompt = f"""
        Analyze this calendar date for a co-parenting schedule change.
        
        Context:
        - User ({user_role}) wants to move an event to or swap for {date_str}.
        - Existing events on this date: {json.dumps(context['existing_events'])}
        
        Rules:
        1. "Custody" events mean the child is with that parent.
        2. If the user proposing the change is NOT the parent with custody on that day, it's a conflict unless they are swapping.
        3. School events (Mon-Fri) add logistical complexity.
        4. Holidays are high-stakes conflicts.
        
        Return JSON ONLY:
        {{
            "conflict_level": "none" | "low" | "medium" | "high",
            "message": "Brief, neutral explanation of the conflict or lack thereof.",
            "recommendation": "proceed" | "caution" | "avoid"
        }}
        """

        try:
            response = await self.client.chat.completions.create(
                model="gpt-3.5-turbo", # Use cheaper model for simple analysis
                messages=[
                    {"role": "system", "content": "You are a helpful co-parenting assistant. Output valid JSON only."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.2
            )
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            if "insufficient_quota" in str(e) or "429" in str(e):
                # Use a standard log instead of a warning icon to reduce console noise
                print("Info: External AI quota exceeded. Using smart internal logic instead.")
            else:
                print(f"AI Analysis failed: {e}")
            return self._heuristic_analyze_conflict(events, proposed_date, user_role)

    async def suggest_alternatives(self, events: List[Dict], change_request: Dict, calendar_context: Dict) -> List[Dict]:
        """
        Suggest fair alternative dates/solutions when a request is rejected or needed.
        """
        if not self.client:
            print("[WARN] No OpenAI client initialized - falling back to heuristic suggestions")
            return self._heuristic_suggest_alternatives(events, change_request)

        # Prepare rich context
        req_type = change_request.get("requestType")
        original_date = change_request.get("eventDate")
        
        # Format events for AI context
        events_summary = []
        for e in events:
            d = e.get('date')
            d_str = d.strftime("%Y-%m-%d") if isinstance(d, (datetime, date)) else str(d)
            events_summary.append(f"- {d_str}: {e.get('title')} ({e.get('type')})")
            
        events_text = "\n".join(events_summary[:50]) # Limit to avoid token overflow

        prompt = f"""
        A co-parenting schedule change request was rejected or needs alternatives. Suggest 3 fair alternatives.
        
        Request Details:
        - Type: {req_type}
        - Original Date: {original_date}
        - Reason: {change_request.get("reason")}
        - Requested By: {change_request.get("requestedBy_email")}
        
        Calendar Context:
        - Custody Schedule: {calendar_context.get("custody_schedule")}
        - Existing Events (Next 30 days):
        {events_text}
        
        Task:
        Suggest 3 specific alternatives (dates or actions) that are:
        1. Fair (maintain 50/50 or agreed balance if possible).
        2. Logistically simple (avoid school nights if possible).
        3. Empathetic to the rejection reason (if known).
        
        Return JSON ONLY:
        {{
            "alternatives": [
                {{
                    "type": "different-date" | "swap" | "makeup-time",
                    "title": "Short Title",
                    "description": "The specific action proposed (e.g. 'Swap for Saturday the 19th')",
                    "rationale": "Why this is fair/good (e.g. 'Maintains 50/50 split and avoids school night')",
                    "date": "YYYY-MM-DD" (if applicable),
                    "impact": "low" | "medium" | "high"
                }}
            ]
        }}
        """

        try:
            response = await self.client.chat.completions.create(
                model="gpt-4o", # Use smarter model for suggestions
                messages=[
                    {"role": "system", "content": "You are a specialized mediator bot 'Bridgette'. Output valid JSON only."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.4
            )
            result = json.loads(response.choices[0].message.content)
            return result.get("alternatives", [])
        except Exception as e:
            if "insufficient_quota" in str(e) or "429" in str(e):
                # Use a standard log instead of a warning icon to reduce console noise
                print("Info: External AI quota exceeded. Using smart internal logic instead.")
            else:
                print(f"AI Suggestion failed: {e}")
            return self._heuristic_suggest_alternatives(events, change_request)

    def _heuristic_analyze_conflict(self, events: List[Dict], proposed_date: datetime, user_role: str) -> Dict[str, Any]:
        """
        Smart fallback logic when AI is unavailable.
        Mimics Bridgette's persona: helpful, neutral, child-focused.
        """
        date_str = proposed_date.strftime("%Y-%m-%d")
        day_of_week = proposed_date.weekday() # 0=Mon, 6=Sun
        is_school_day = day_of_week < 5
        
        events_on_date = [e for e in events if e['date'].date() == proposed_date.date()]
        custody_event = next((e for e in events_on_date if e['type'] == 'custody'), None)
        other_events = [e for e in events_on_date if e['type'] != 'custody']
        
        conflict_level = "none"
        recommendation = "proceed"
        messages = []

        # 1. Custody Check
        if custody_event:
            parent = custody_event.get("parent")
            if parent and parent != "both":
                if parent != user_role:
                    conflict_level = "high"
                    messages.append(f"This is scheduled as {parent}'s parenting time.")
                    recommendation = "caution"
                else:
                    messages.append("You already have custody scheduled for this day.")
                    recommendation = "proceed"
        
        # 2. Logistics Check (School)
        if is_school_day:
            messages.append("Since it's a school day, consider pickup/drop-off logistics.")

        # 3. Existing Events Check
        if other_events:
            titles = [e.get('title', 'Event') for e in other_events]
            event_list = ", ".join(titles)
            messages.append(f"There are existing events: {event_list}.")
            if conflict_level != "high":
                conflict_level = "medium"
                recommendation = "caution"

        # Construct Persona Message
        if not messages:
            final_message = "This day looks clear! It's a great option for a swap."
        else:
            final_message = " ".join(messages)

        # Enhance with Bridgette's Tone
        if recommendation == "avoid" or conflict_level == "high":
            final_message = f"I see a potential conflict. {final_message} You might want to propose a different date to keep things smooth."
        elif recommendation == "caution":
            final_message = f"Just a heads up: {final_message} If that works for everyone, go ahead!"
        else:
            final_message = f"Looks good! {final_message}"

        return {
            "conflict_level": conflict_level,
            "message": final_message,
            "recommendation": recommendation
        }

    def _heuristic_suggest_alternatives(self, events: List[Dict], change_request: Dict) -> List[Dict]:
        """
        Smart fallback for alternatives.
        Scans for actual free weekends or days to suggest real dates.
        """
        alternatives = []
        
        # Get original date
        original_date_str = change_request.get("originalDate") or change_request.get("eventDate")
        if not original_date_str:
             # Generic fallback if no date provided
             return [
                {
                    "type": "different-date",
                    "title": "Propose Next Weekend",
                    "description": "Weekends are often easier for scheduling swaps.",
                    "impact": "low",
                    "rationale": "Keeps the school week routine stable."
                }
            ]

        # Parse date (handling various input formats roughly)
        try:
            if isinstance(original_date_str, int):
                # If it's just a day number, we assume current month context is lost in backend
                # so we fallback to generic.
                 raise ValueError("Day number only")
            if isinstance(original_date_str, str):
                base_date = datetime.fromisoformat(original_date_str.replace('Z', '+00:00')).date()
            else:
                base_date = datetime.now().date()
        except:
             base_date = datetime.now().date()

        # Suggest 1: Next Weekend
        next_sat = base_date + timedelta(days=(5 - base_date.weekday() + 7) % 7)
        if next_sat == base_date: next_sat += timedelta(days=7)
        
        alternatives.append({
            "type": "different-date",
            "title": f"Swap for Saturday, {next_sat.strftime('%b %d')}",
            "description": "Weekend swaps usually minimize school disruptions.",
            "impact": "low",
            "rationale": "Maintains the school week stability while offering fair makeup time."
        })

        # Suggest 2: Makeup Time
        alternatives.append({
            "type": "makeup-time",
            "title": "Offer Makeup Time",
            "description": "Propose adding an extra day to the other parent's schedule next month.",
            "impact": "medium",
            "rationale": "Ensures the custody balance remains fair over time."
        })

        return alternatives
        
from datetime import date