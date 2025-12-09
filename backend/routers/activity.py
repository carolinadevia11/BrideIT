from fastapi import APIRouter, Depends, HTTPException
from typing import List
from datetime import datetime, timedelta
from bson import ObjectId

from models import User
from routers.auth import get_current_user
from database import db

router = APIRouter(prefix="/api/v1/activity", tags=["activity"])

@router.get("/health")
async def activity_health():
    """Health check endpoint for activity router"""
    return {"status": "ok", "router": "activity"}

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
        # Get recently created/updated calendar events (last 7 days)
        recent_events = list(db.events.find({
            "family_id": family_id,
            "$or": [
                {"createdAt": {"$gte": seven_days_ago}},
                {"updatedAt": {"$gte": seven_days_ago}}
            ]
        }).sort("createdAt", -1).limit(20))
        
        for event in recent_events:
            if len(calendar_activities) >= 2:
                break
            
            # Handle date field - could be datetime or timestamp
            event_date_obj = event.get("date")
            if isinstance(event_date_obj, datetime):
                event_date = event_date_obj
            elif isinstance(event_date_obj, (int, float)):
                event_date = datetime.fromtimestamp(event_date_obj)
            else:
                try:
                    event_date = datetime.fromisoformat(str(event_date_obj))
                except:
                    event_date = datetime.utcnow()
            
            event_title = event.get("title", "Calendar event")
            
            # Check if there's a confirmed change request for this event
            change_requests = list(db.change_requests.find({
                "event_id": str(event.get("_id", "")),
                "status": "approved"
            }).sort("updatedAt", -1).limit(1))
            
            # Determine who created/updated this event
            event_created_at = event.get("createdAt")
            event_updated_at = event.get("updatedAt")
            is_recently_created = event_created_at and event_created_at >= seven_days_ago
            is_recently_updated = event_updated_at and event_updated_at >= seven_days_ago and event_updated_at != event_created_at
            
            if change_requests:
                # This is a confirmed pickup/dropoff
                confirmed_by = change_requests[0].get("requestedBy_email", "")
                confirmed_by_name = partner_name if confirmed_by != current_user.email else current_user_name
                
                calendar_activities.append({
                    "id": f"calendar_confirm_{event.get('_id', '')}",
                    "type": "calendar_confirmed",
                    "title": f"{confirmed_by_name} confirmed pickup for {event_date.strftime('%A at %I:%M%p')}",
                    "description": event_title,
                    "color": "green",
                    "createdAt": change_requests[0].get("updatedAt") or change_requests[0].get("createdAt") or datetime.utcnow(),
                    "actionRequired": False,
                })
            elif is_recently_created:
                # Newly created event
                event_parent = event.get("parent")
                if event_parent and event_parent != "both":
                    parent_name = parent1_name if event_parent == "mom" else (parent2_name or "Parent 2")
                    description = f"{parent_name}'s custody day"
                else:
                    description = "Family event"
                
                calendar_activities.append({
                    "id": f"calendar_{event.get('_id', '')}",
                    "type": "calendar_update",
                    "title": f"Calendar event added: {event_title}",
                    "description": description,
                    "color": "blue",
                    "createdAt": event_created_at or datetime.utcnow(),
                    "actionRequired": False,
                })
            elif is_recently_updated:
                # Recently updated event
                calendar_activities.append({
                    "id": f"calendar_update_{event.get('_id', '')}",
                    "type": "calendar_update",
                    "title": f"Calendar event updated: {event_title}",
                    "description": "Event details were modified",
                    "color": "blue",
                    "createdAt": event_updated_at or datetime.utcnow(),
                    "actionRequired": False,
                })
        
        # Get pending change requests as calendar activities
        pending_requests = list(db.change_requests.find({
            "family_id": family_id,
            "status": "pending",
            "requestedBy_email": {"$ne": current_user.email}
        }).sort("createdAt", -1).limit(2))
        
        for req in pending_requests:
            if len(calendar_activities) >= 2:
                break
                
            event_id = req.get("event_id")
            event = None
            if event_id:
                try:
                    # Try to find by id field first, then _id
                    event = db.events.find_one({"id": event_id})
                    if not event:
                        event = db.events.find_one({"_id": ObjectId(event_id)})
                except:
                    pass
            
            event_title = event.get("title", "calendar event") if event else "calendar event"
            request_type = req.get("requestType", "modify")
            calendar_activities.append({
                "id": f"change_request_{req.get('_id', '')}",
                "type": "change_request",
                "title": f"PENDING: {partner_name} requested change to {event_title}",
                "description": f"Change request: {request_type}",
                "color": "red",
                "createdAt": req.get("createdAt") or datetime.utcnow(),
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
            conv_id = str(conv.get("_id", ""))
            messages = list(db.messages.find({
                "conversation_id": conv_id
            }).sort("timestamp", -1).limit(1))
            
            if messages:
                last_message = messages[0]
                sender_email = last_message.get("sender_email", "")
                sender_name = current_user_name if sender_email == current_user.email else partner_name
                
                message_content = last_message.get("content", "")
                truncated_content = message_content[:50] + "..." if len(message_content) > 50 else message_content
                
                message_activities.append({
                    "id": f"message_{conv.get('_id', '')}",
                    "type": "message",
                    "title": f"New message in {conv.get('subject', 'conversation')}",
                    "description": truncated_content,
                    "color": "blue",
                    "createdAt": last_message.get("timestamp") or conv.get("last_message_at") or datetime.utcnow(),
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
            
            exp_created_at = exp.get("created_at")
            exp_updated_at = exp.get("updated_at")
            is_recent = (exp_created_at and exp_created_at >= seven_days_ago) or (exp_updated_at and exp_updated_at >= seven_days_ago)
            
            if not is_recent:
                continue
                
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
            elif exp["status"] == "approved" and exp_updated_at and exp_updated_at >= seven_days_ago:
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

