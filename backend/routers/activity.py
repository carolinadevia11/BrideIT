from fastapi import APIRouter, Depends, HTTPException
from typing import List
from datetime import datetime, timedelta
from bson import ObjectId

from models import User
from routers.auth import get_current_user
from database import db

router = APIRouter(prefix="/api/v1/activity", tags=["activity"])

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
            raise HTTPException(status_code=404, detail="Family not found")
        
        family_id = str(family["_id"])
        
        # Get parent names for display
        parent1_name = family.get("parent1", {}).get("firstName", "Parent 1")
        parent2_name = family.get("parent2", {}).get("firstName", "Parent 2") if family.get("parent2") else None
        current_user_name = parent1_name if current_user.email == family.get("parent1_email") else (parent2_name or "Parent 2")
        partner_name = parent2_name if current_user.email == family.get("parent1_email") else parent1_name
        
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        
        # Separate lists for each category
        calendar_activities = []
        message_activities = []
        expense_activities = []
        
        # 1. Get calendar activities (last 2)
        # Get recent calendar events (last 30 days for more options)
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        recent_events = list(db.events.find({
            "family_id": family_id,
            "date": {"$gte": thirty_days_ago.timestamp()}
        }).sort("date", -1).limit(20))
        
        for event in recent_events:
            if len(calendar_activities) >= 2:
                break
                
            event_date = datetime.fromtimestamp(event["date"])
            event_title = event.get("title", "Calendar event")
            
            # Check if there's a confirmed change request for this event
            change_requests = list(db.change_requests.find({
                "event_id": str(event.get("_id", "")),
                "status": "approved"
            }).sort("updated_at", -1).limit(1))
            
            if change_requests:
                # This is a confirmed pickup/dropoff
                confirmed_by = change_requests[0].get("requested_by_email", "")
                confirmed_by_name = partner_name if confirmed_by != current_user.email else current_user_name
                
                calendar_activities.append({
                    "id": f"calendar_confirm_{event.get('_id', '')}",
                    "type": "calendar_confirmed",
                    "title": f"{confirmed_by_name} confirmed pickup for {event_date.strftime('%A at %I:%M%p')}",
                    "description": event_title,
                    "color": "green",
                    "createdAt": change_requests[0].get("updated_at") or change_requests[0].get("created_at"),
                    "actionRequired": False,
                })
            elif event.get("parent") and event.get("parent") != "both":
                # Regular custody event
                event_parent = event.get("parent")
                parent_name = parent1_name if event_parent == "mom" else (parent2_name or "Parent 2")
                
                calendar_activities.append({
                    "id": f"calendar_{event.get('_id', '')}",
                    "type": "calendar_update",
                    "title": f"Calendar updated: {event_title}",
                    "description": f"{parent_name}'s custody day",
                    "color": "blue",
                    "createdAt": event.get("created_at") or datetime.utcnow(),
                    "actionRequired": False,
                })
        
        # Get pending change requests as calendar activities
        pending_requests = list(db.change_requests.find({
            "family_id": family_id,
            "status": "pending",
            "requested_by_email": {"$ne": current_user.email}
        }).sort("created_at", -1).limit(2))
        
        for req in pending_requests:
            if len(calendar_activities) >= 2:
                break
                
            event_id = req.get("event_id")
            event = None
            if event_id:
                try:
                    event = db.events.find_one({"_id": ObjectId(event_id)})
                except:
                    pass
            
            event_title = event.get("title", "calendar event") if event else "calendar event"
            calendar_activities.append({
                "id": f"change_request_{req.get('_id', '')}",
                "type": "change_request",
                "title": f"PENDING: {partner_name} requested change to {event_title}",
                "description": f"Change request: {req.get('type', 'modify')}",
                "color": "red",
                "createdAt": req.get("created_at"),
                "actionRequired": True,
            })
        
        # Sort calendar activities and take top 2
        calendar_activities.sort(key=lambda x: x.get("createdAt") or datetime.min, reverse=True)
        calendar_activities = calendar_activities[:2]
        
        # 2. Get message activities (last 2)
        recent_conversations = list(db.conversations.find({
            "family_id": family_id,
            "last_message_at": {"$gte": seven_days_ago}
        }).sort("last_message_at", -1).limit(10))
        
        for conv in recent_conversations:
            if len(message_activities) >= 2:
                break
                
            # Get the last message
            messages = list(db.messages.find({
                "conversation_id": str(conv.get("_id", ""))
            }).sort("created_at", -1).limit(1))
            
            if messages:
                last_message = messages[0]
                sender_email = last_message.get("sender_email", "")
                sender_name = current_user_name if sender_email == current_user.email else partner_name
                
                message_activities.append({
                    "id": f"message_{conv.get('_id', '')}",
                    "type": "message",
                    "title": f"New message in {conv.get('subject', 'conversation')}",
                    "description": last_message.get("content", "")[:50] + "..." if len(last_message.get("content", "")) > 50 else last_message.get("content", ""),
                    "color": "blue",
                    "createdAt": last_message.get("created_at") or conv.get("last_message_at"),
                    "actionRequired": False,
                })
        
        # Sort message activities and take top 2
        message_activities.sort(key=lambda x: x.get("createdAt") or datetime.min, reverse=True)
        message_activities = message_activities[:2]
        
        # 3. Get expense activities (last 2)
        # Get all expenses (pending, approved, disputed) sorted by most recent
        all_expenses = list(db.expenses.find({
            "family_id": family_id
        }).sort("created_at", -1).limit(10))
        
        for exp in all_expenses:
            if len(expense_activities) >= 2:
                break
                
            if exp["status"] == "pending" and exp["paid_by_email"] != current_user.email:
                # Pending expense from partner
                expense_activities.append({
                    "id": f"expense_{exp.get('id') or str(exp.get('_id', ''))}",
                    "type": "expense_pending",
                    "title": f"PENDING: {exp['description']} expense needs approval (${exp['amount']:.2f})",
                    "description": f"{exp['description']} - ${exp['amount']:.2f}",
                    "amount": exp["amount"],
                    "expenseId": exp.get("id") or str(exp.get("_id", "")),
                    "color": "red",
                    "createdAt": exp.get("created_at") or exp.get("updated_at"),
                    "actionRequired": True,
                })
            elif exp["status"] == "approved":
                # Recently approved expense
                paid_by_name = current_user_name if exp["paid_by_email"] == current_user.email else partner_name
                expense_activities.append({
                    "id": f"expense_{exp.get('id') or str(exp.get('_id', ''))}",
                    "type": "expense_approved",
                    "title": f"Expense approved: {exp['description']} (${exp['amount']:.2f})",
                    "description": f"Paid by {paid_by_name}",
                    "amount": exp["amount"],
                    "expenseId": exp.get("id") or str(exp.get("_id", "")),
                    "color": "green",
                    "createdAt": exp.get("updated_at") or exp.get("created_at"),
                    "actionRequired": False,
                })
        
        # Sort expense activities and take top 2
        expense_activities.sort(key=lambda x: x.get("createdAt") or datetime.min, reverse=True)
        expense_activities = expense_activities[:2]
        
        # Combine all activities
        activities = calendar_activities + message_activities + expense_activities
        
        # Sort all activities by created_at (most recent first)
        activities.sort(key=lambda x: x.get("createdAt") or datetime.min, reverse=True)
        
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
        
        # Return activities (already limited to 2 per category = max 6 total)
        return activities
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Get recent activity: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

