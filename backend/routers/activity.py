from fastapi import APIRouter, Depends, HTTPException
from typing import List
from datetime import datetime, timedelta
from bson import ObjectId
from pydantic import BaseModel

from models import User
from routers.auth import get_current_user
from database import db

router = APIRouter(prefix="/api/v1/activity", tags=["activity"])

class DismissActivityRequest(BaseModel):
    activity_id: str

class DismissAllRequest(BaseModel):
    activity_ids: List[str]

@router.get("/health")
async def activity_health():
    """Health check endpoint for activity router"""
    return {"status": "ok", "router": "activity"}

@router.post("/dismiss")
async def dismiss_activity(request: DismissActivityRequest, current_user: User = Depends(get_current_user)):
    """Dismiss a specific activity for the current user"""
    try:
        db.dismissed_activities.insert_one({
            "user_email": current_user.email,
            "activity_id": request.activity_id,
            "dismissed_at": datetime.utcnow()
        })
        return {"status": "success", "message": "Activity dismissed"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/dismiss-all")
async def dismiss_all_activities(request: DismissAllRequest, current_user: User = Depends(get_current_user)):
    """Dismiss multiple activities at once"""
    try:
        if not request.activity_ids:
            return {"status": "success", "message": "No activities to dismiss"}
            
        # Create bulk operations
        documents = [{
            "user_email": current_user.email,
            "activity_id": aid,
            "dismissed_at": datetime.utcnow()
        } for aid in request.activity_ids]
        
        if documents:
            db.dismissed_activities.insert_many(documents)
            
        return {"status": "success", "message": "All activities dismissed"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("", response_model=List[dict])
async def get_recent_activity(current_user: User = Depends(get_current_user)):
    """Get recent activity feed for the current user's family"""
    try:
        # Get user's family
        family = db.families.find_one({"$or": [
            {"parent1_email": current_user.email},
            {"parent2_email": current_user.email}
        ]})
        
        if not family:
            return []
        
        # Get list of dismissed activity IDs for this user
        dismissed = db.dismissed_activities.find({"user_email": current_user.email})
        dismissed_ids = set(d["activity_id"] for d in dismissed)
        
        family_id = str(family["_id"])
        
        # Get parent names for display
        parent1_name = family.get("parent1", {}).get("firstName", "Parent 1")
        parent2_name = family.get("parent2", {}).get("firstName", "Parent 2") if family.get("parent2") else None
        current_user_name = parent1_name if current_user.email == family.get("parent1_email") else (parent2_name or "Parent 2")
        partner_name = parent2_name if current_user.email == family.get("parent1_email") else parent1_name
        
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        
        # Separate lists for each category
        calendar_activities = []
        message_activities = []
        expense_activities = []
        
        # Helper to parse dates safely
        def parse_date_safe(d):
            if isinstance(d, datetime):
                if d.tzinfo:
                    return d.replace(tzinfo=None)
                return d
            if isinstance(d, str):
                try:
                    dt = datetime.fromisoformat(d.replace('Z', '+00:00'))
                    if dt.tzinfo:
                        return dt.replace(tzinfo=None)
                    return dt
                except:
                    pass
            return None

        # 1a. Get Resolved Change Requests (Approved/Rejected/Cancelled)
        # This handles Swaps, Modifications, and Cancellations that went through the request flow
        resolved_requests = list(db.change_requests.find({
            "family_id": family_id,
            "status": {"$in": ["approved", "rejected"]},
            "updatedAt": {"$gte": seven_days_ago}
        }).sort("updatedAt", -1))
        
        # Track IDs of events that have resolved requests to avoid duplicates in generic "Updated" events
        events_with_resolved_requests = set()

        for req in resolved_requests:
            req_updated_at = parse_date_safe(req.get("updatedAt")) or datetime.utcnow()
            req_type = req.get("requestType", "modify")
            status = req.get("status")
            event_title = req.get("eventTitle") or "Calendar event"
            
            # Determine title and description based on type and status
            if status == "approved":
                color = "green"
                if req_type == "swap":
                    title = f"Swap Confirmed: {event_title}"
                    desc = f"Swapped with {req.get('swapEventTitle', 'another day')}"
                elif req_type == "cancel":
                    title = f"Cancellation Approved: {event_title}"
                    desc = "Event removed from calendar"
                else:
                    title = f"Change Approved: {event_title}"
                    desc = "Event details updated"
            else: # rejected
                color = "red"
                title = f"Request Rejected: {event_title}"
                desc = f"{req_type.capitalize()} request was declined"

            calendar_activities.append({
                "id": f"req_resolved_{req.get('id') or str(req.get('_id'))}",
                "type": "calendar_confirmed" if status == "approved" else "change_request",
                "title": title,
                "description": desc,
                "color": color,
                "createdAt": req_updated_at,
                "actionRequired": False,
            })
            
            if req.get("event_id"):
                events_with_resolved_requests.add(req.get("event_id"))

        # 1b. Get Pending Change Requests (Incoming)
        pending_requests = list(db.change_requests.find({
            "family_id": family_id,
            "status": "pending",
            "requestedBy_email": {"$ne": current_user.email}
        }).sort("createdAt", -1))
        
        for req in pending_requests:
            req_created_at = parse_date_safe(req.get("createdAt")) or datetime.utcnow()
            event_title = req.get("eventTitle") or "calendar event"
            request_type = req.get("requestType", "modify")
            
            calendar_activities.append({
                "id": f"change_request_{req.get('id') or str(req.get('_id'))}",
                "type": "change_request",
                "title": f"PENDING: {partner_name} requested {request_type} for {event_title}",
                "description": f"Reason: {req.get('reason', 'None provided')}",
                "color": "red",
                "createdAt": req_created_at,
                "actionRequired": True,
            })

        # 1c. Get Recent Calendar Events (Direct Adds/Updates)
        # Fetch ALL events first to robustly filter in code
        recent_events_cursor = db.events.find({"family_id": family_id})
        recent_events = []
        
        for event in recent_events_cursor:
            created_at = parse_date_safe(event.get("createdAt"))
            updated_at = parse_date_safe(event.get("updatedAt"))
            
            is_created_recent = created_at and created_at >= seven_days_ago
            is_updated_recent = updated_at and updated_at >= seven_days_ago
            
            if is_created_recent or is_updated_recent:
                recent_events.append((event, is_created_recent, is_updated_recent))
        
        # Sort by most recent update
        recent_events.sort(key=lambda x: parse_date_safe(x[0].get("updatedAt")) or parse_date_safe(x[0].get("createdAt")) or datetime.min, reverse=True)
        
        for event, is_recently_created, is_recently_updated in recent_events:
            event_id = event.get("id")
            event_oid = str(event.get("_id", ""))
            
            # Skip if we already showed a resolved request for this event (to avoid noise)
            if event_id in events_with_resolved_requests or event_oid in events_with_resolved_requests:
                continue

            event_title = event.get("title", "Calendar event")
            event_created_at = parse_date_safe(event.get("createdAt"))
            event_updated_at = parse_date_safe(event.get("updatedAt"))

            if is_recently_created:
                # Newly created event
                event_parent = event.get("parent")
                if event_parent and event_parent != "both":
                    parent_name = parent1_name if event_parent == "mom" else (parent2_name or "Parent 2")
                    description = f"{parent_name}'s custody day"
                else:
                    description = "Family event"
                
                calendar_activities.append({
                    "id": f"calendar_add_{event_id}",
                    "type": "calendar_update",
                    "title": f"Event Added: {event_title}",
                    "description": description,
                    "color": "blue",
                    "createdAt": event_created_at or datetime.utcnow(),
                    "actionRequired": False,
                })
            elif is_recently_updated:
                # Recently updated event (direct edit, not via request flow)
                calendar_activities.append({
                    "id": f"calendar_update_{event_id}",
                    "type": "calendar_update",
                    "title": f"Event Updated: {event_title}",
                    "description": "Details modified",
                    "color": "blue",
                    "createdAt": event_updated_at or datetime.utcnow(),
                    "actionRequired": False,
                })
        
        # Sort calendar activities
        calendar_activities.sort(key=lambda x: x.get("createdAt") or datetime.min, reverse=True)
        
        # 2. Get message activities (Text messages - summary per conversation)
        recent_conversations = list(db.conversations.find({
            "family_id": family_id,
            "last_message_at": {"$gte": seven_days_ago}
        }).sort("last_message_at", -1))
        
        conv_ids = [str(c["_id"]) for c in recent_conversations]
        
        for conv in recent_conversations:
            # Get the last TEXT message (exclude calls as they are handled separately)
            conv_id = str(conv.get("_id", ""))
            messages = list(db.messages.find({
                "conversation_id": conv_id,
                "type": {"$nin": ["call_start", "call_missed"]}
            }).sort("timestamp", -1).limit(1))
            
            if messages:
                last_message = messages[0]
                sender_email = last_message.get("sender_email", "")
                # sender_name = current_user_name if sender_email == current_user.email else partner_name
                
                message_content = last_message.get("content", "")
                truncated_content = message_content[:50] + "..." if len(message_content) > 50 else message_content
                
                # Use message ID in the activity ID to ensure new messages reappear after dismissal
                msg_id = str(last_message.get("_id", ""))
                message_activities.append({
                    "id": f"message_{conv.get('_id', '')}_{msg_id}",
                    "type": "message",
                    "title": f"New message in {conv.get('subject', 'conversation')}",
                    "description": truncated_content,
                    "color": "blue",
                    "createdAt": last_message.get("timestamp") or conv.get("last_message_at") or datetime.utcnow(),
                    "actionRequired": False,
                })
        
        # 3. Get Call Activities (Missed calls only)
        # We need to find all conversations for this family first to get IDs
        all_family_convs = list(db.conversations.find({"family_id": family_id}, {"_id": 1}))
        all_conv_ids = [str(c["_id"]) for c in all_family_convs]
        
        recent_calls = list(db.messages.find({
            "conversation_id": {"$in": all_conv_ids},
            "type": "call_missed", # ONLY show missed calls
            "timestamp": {"$gte": seven_days_ago}
        }).sort("timestamp", -1))
        
        for call in recent_calls:
            sender_email = call.get("sender_email", "")
            sender_name = current_user_name if sender_email == current_user.email else partner_name
            
            # Since we filter for call_missed only
            title = f"Missed call from {sender_name}"
            description = "Call was declined or missed"
            color = "red"
            
            message_activities.append({
                "id": f"call_{call.get('_id', '')}",
                "type": "call",
                "title": title,
                "description": description,
                "color": color,
                "createdAt": call.get("timestamp") or datetime.utcnow(),
                "actionRequired": False,
            })

        # Sort combined message/call activities
        message_activities.sort(key=lambda x: x.get("createdAt") or datetime.min, reverse=True)
        
        # 4. Get expense activities
        # Get all expenses (pending, approved, disputed) sorted by most recent
        # Fetch all for family and filter in python to handle mixed date types safely
        all_expenses_cursor = list(db.expenses.find({"family_id": family_id}))
        all_expenses = []
        
        for exp in all_expenses_cursor:
             # Check dates
            created_at = exp.get("created_at")
            updated_at = exp.get("updated_at")
            
            is_recent = False
            
            # Helper to check date
            def check_date(d):
                if isinstance(d, datetime):
                    return d >= thirty_days_ago
                if isinstance(d, str):
                    try:
                        dt = datetime.fromisoformat(d.replace('Z', '+00:00'))
                        if dt.tzinfo and not thirty_days_ago.tzinfo:
                             return dt.replace(tzinfo=None) >= thirty_days_ago
                        return dt >= thirty_days_ago
                    except:
                        pass
                return False

            if check_date(created_at) or check_date(updated_at) or exp["status"] == "pending":
                all_expenses.append(exp)

        # Sort manually
        all_expenses.sort(key=lambda x: x.get("created_at") or datetime.min, reverse=True)
        
        for exp in all_expenses:
            # Handle timestamps that might be strings
            exp_created_at = exp.get("created_at")
            if isinstance(exp_created_at, str):
                try:
                    exp_created_at = datetime.fromisoformat(exp_created_at.replace('Z', '+00:00'))
                except:
                    pass
            
            exp_updated_at = exp.get("updated_at")
            if isinstance(exp_updated_at, str):
                try:
                    exp_updated_at = datetime.fromisoformat(exp_updated_at.replace('Z', '+00:00'))
                except:
                    pass

            # Relax the 7-day filter slightly to ensure user sees "recent" items even if they are a bit older but relevant
            # For pending items, we ALWAYS show them regardless of age if they are pending
            
            if exp["status"] == "pending" and exp.get("paid_by_email") != current_user.email:
                # Pending expense from partner
                expense_activities.append({
                    "id": f"expense_{exp.get('id') or str(exp.get('_id', ''))}",
                    "type": "expense_pending",
                    "title": f"PENDING: {exp['description']} expense needs approval (${exp['amount']:.2f})",
                    "description": f"{exp['description']} - ${exp['amount']:.2f}",
                    "amount": exp["amount"],
                    "expenseId": exp.get("id") or str(exp.get("_id", "")),
                    "color": "red",
                    "createdAt": exp_updated_at or exp_created_at or datetime.utcnow(),
                    "actionRequired": True,
                })
            elif exp["status"] == "approved":
                # For approved items, we stick to the 7-day window to avoid clutter
                if not (exp_updated_at and exp_updated_at >= seven_days_ago):
                    continue
                # Recently approved expense
                paid_by_email = exp.get("paid_by_email", "")
                paid_by_name = current_user_name if paid_by_email == current_user.email else partner_name
                expense_activities.append({
                    "id": f"expense_{exp.get('id') or str(exp.get('_id', ''))}",
                    "type": "expense_approved",
                    "title": f"Expense approved: {exp['description']} (${exp['amount']:.2f})",
                    "description": f"Paid by {paid_by_name}",
                    "amount": exp["amount"],
                    "expenseId": exp.get("id") or str(exp.get("_id", "")),
                    "color": "green",
                    "createdAt": exp_updated_at or exp_created_at or datetime.utcnow(),
                    "actionRequired": False,
                })
        
        # Sort expense activities
        expense_activities.sort(key=lambda x: x.get("createdAt") or datetime.min, reverse=True)
        
        # Combine all activities
        all_activities = calendar_activities + message_activities + expense_activities
        
        # Filter out dismissed activities
        activities = [a for a in all_activities if a["id"] not in dismissed_ids]
        
        # Sort all activities by created_at (most recent first)
        activities.sort(key=lambda x: x.get("createdAt") or datetime.min, reverse=True)

        # Return activities (no hard limit on total count, let frontend handle scrolling if needed)
        
        # Format timestamps and add relative time
        now = datetime.utcnow()
        for activity in activities:
            created_at = activity.get("createdAt")
            if created_at:
                if isinstance(created_at, datetime):
                    activity["createdAt"] = created_at.isoformat()
                    delta = now - created_at
                else:
                    # Try to parse if it's a string
                    try:
                        if isinstance(created_at, str):
                            created_at_dt = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                        else:
                            created_at_dt = created_at
                        delta = now - created_at_dt
                    except:
                        delta = timedelta(0)
                
                # Calculate relative time
                if delta.days > 0:
                    if delta.days == 1:
                        activity["relativeTime"] = "Yesterday"
                    elif delta.days < 7:
                        activity["relativeTime"] = f"{delta.days} days ago"
                    else:
                        activity["relativeTime"] = f"{delta.days // 7} weeks ago"
                elif delta.seconds < 3600:
                    minutes = delta.seconds // 60
                    if minutes < 1:
                        activity["relativeTime"] = "Just now"
                    else:
                        activity["relativeTime"] = f"{minutes} minute{'s' if minutes > 1 else ''} ago"
                else:
                    hours = delta.seconds // 3600
                    activity["relativeTime"] = f"{hours} hour{'s' if hours > 1 else ''} ago"
            else:
                activity["relativeTime"] = "Recently"
                activity["createdAt"] = datetime.utcnow().isoformat()
        
        return activities
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Get recent activity: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
