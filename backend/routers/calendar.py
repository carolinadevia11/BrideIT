from fastapi import APIRouter, Depends, HTTPException, Query, Response
from typing import List, Optional
import uuid
from datetime import datetime
from bson import ObjectId

from models import (
    Event,
    EventCreate,
    User,
    ChangeRequest,
    ChangeRequestCreate,
    ChangeRequestUpdate,
)
from routers.auth import get_current_user
from database import db
from services.email_service import email_service

router = APIRouter(prefix="/api/v1/calendar", tags=["calendar"])


def _ensure_datetime(value) -> datetime:
    if isinstance(value, datetime):
        return value
    if isinstance(value, str):
        try:
            # Handle Z suffix for UTC which fromisoformat might not handle in older python versions
            if value.endswith('Z'):
                value = value[:-1] + '+00:00'
            return datetime.fromisoformat(value)
        except ValueError:
            pass
    raise HTTPException(status_code=500, detail="Invalid date stored for calendar event")


def _serialize_event_document(event_doc: dict) -> Event:
    return Event(
        id=event_doc.get("id") or str(event_doc.get("_id")),
        family_id=event_doc.get("family_id"),
        date=_ensure_datetime(event_doc.get("date")),
        type=event_doc.get("type"),
        title=event_doc.get("title"),
        parent=event_doc.get("parent"),
        isSwappable=event_doc.get("isSwappable", False),
        createdBy_email=event_doc.get("createdBy_email"),
    )


def _serialize_change_request_document(change_doc: dict) -> ChangeRequest:
    new_date = change_doc.get("newDate")
    if new_date:
        new_date = _ensure_datetime(new_date)
    swap_event_date = change_doc.get("swapEventDate")
    if swap_event_date:
        swap_event_date = _ensure_datetime(swap_event_date)
    event_date = _ensure_datetime(change_doc.get("eventDate"))
    return ChangeRequest(
        id=change_doc.get("id") or str(change_doc.get("_id")),
        event_id=change_doc.get("event_id"),
        requestedBy_email=change_doc.get("requestedBy_email"),
        status=change_doc.get("status", "pending"),
        reason=change_doc.get("reason"),
        createdAt=_ensure_datetime(change_doc.get("createdAt")),
        requestType=change_doc.get("requestType", "modify"),
        eventTitle=change_doc.get("eventTitle"),
        eventType=change_doc.get("eventType"),
        eventParent=change_doc.get("eventParent"),
        eventDate=event_date,
        newDate=new_date,
        swapEventId=change_doc.get("swapEventId"),
        swapEventTitle=change_doc.get("swapEventTitle"),
        swapEventDate=swap_event_date,
    )


def _get_family_for_user(current_user: User, raise_error: bool = True) -> tuple[Optional[dict], List[str]]:
    family = db.families.find_one(
        {
            "$or": [
                {"parent1_email": current_user.email},
                {"parent2_email": current_user.email},
            ]
        }
    )
    if not family:
        if raise_error:
            raise HTTPException(
                status_code=404,
                detail="No family profile found. Complete onboarding before using the calendar.",
            )
        return None, []
    
    # Robust: return ALL valid family IDs (UUID and ObjectId)
    family_ids = []
    if family.get("id"):
        family_ids.append(family.get("id"))
    if family.get("_id"):
        family_ids.append(str(family.get("_id")))
        
    return family, family_ids


def _find_event_for_family(event_id: str, family_ids: List[str]) -> dict:
    event = db.events.find_one({"id": event_id})
    if not event:
        try:
            event = db.events.find_one({"_id": ObjectId(event_id)})
        except Exception:
            event = None
            
    # Check if event belongs to ANY of the family IDs
    if not event or str(event.get("family_id")) not in family_ids:
        raise HTTPException(status_code=404, detail="Event not found")
    return event


def _find_change_request_for_family(request_id: str, family_ids: List[str]) -> dict:
    change_request = db.change_requests.find_one({"id": request_id})
    if not change_request:
        try:
            change_request = db.change_requests.find_one({"_id": ObjectId(request_id)})
        except Exception:
            change_request = None
            
    # Check if request belongs to ANY of the family IDs
    if not change_request or str(change_request.get("family_id")) not in family_ids:
        raise HTTPException(status_code=404, detail="Change request not found")
    return change_request


@router.get("/events", response_model=List[Event])
async def get_calendar_events(
    year: int = Query(..., description="Year to fetch events for"),
    month: int = Query(..., description="Month to fetch events for (1-12)"),
    current_user: User = Depends(get_current_user),
):
    """Get calendar events for a specific month."""
    family, family_ids = _get_family_for_user(current_user, raise_error=False)
    
    if not family:
        return []
        
    events_cursor = db.events.find({"family_id": {"$in": family_ids}})
    events: List[Event] = []

    # Get events for requested month, plus some buffer for timezone overlaps
    # A generous window (e.g., +/- 2 days) ensures we catch events that might
    # fall into the current month depending on the user's timezone.
    for event_doc in events_cursor:
        event_obj = _serialize_event_document(event_doc)
        
        # Simple inclusion check: if the event falls in the requested month/year
        # OR if it's very close to the start/end of the month (buffer for timezone)
        event_year = event_obj.date.year
        event_month = event_obj.date.month
        
        if event_year == year and event_month == month:
            events.append(event_obj)
        else:
            # Check edge cases (e.g. Nov 30th UTC might be Dec 1st locally, or vice versa)
            # We'll send adjacent events so frontend can filter
            is_prev_month = (month == 1 and event_month == 12 and event_year == year - 1) or \
                            (event_month == month - 1 and event_year == year)
            is_next_month = (month == 12 and event_month == 1 and event_year == year + 1) or \
                            (event_month == month + 1 and event_year == year)
            
            if is_prev_month and event_obj.date.day >= 25:
                events.append(event_obj)
            elif is_next_month and event_obj.date.day <= 7:
                events.append(event_obj)

    return events


@router.post("/events", response_model=Event)
async def create_calendar_event(
    event_data: EventCreate,
    current_user: User = Depends(get_current_user),
):
    """Create a new calendar event."""
    family, family_ids = _get_family_for_user(current_user)
    
    # Use the first ID (preferred UUID) for new events
    primary_family_id = family_ids[0] if family_ids else str(family.get("_id"))

    event_id = str(uuid.uuid4())
    event_doc = {
        "id": event_id,
        "family_id": primary_family_id,
        "date": _ensure_datetime(event_data.date),
        "type": event_data.type,
        "title": event_data.title,
        "parent": event_data.parent,
        "isSwappable": event_data.isSwappable,
        "createdBy_email": current_user.email,
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow(),
    }

    db.events.insert_one(event_doc)

    # Send email notification
    recipients = [family.get("parent1_email"), family.get("parent2_email")]
    user_name = f"{current_user.firstName} {current_user.lastName}"

    # Check for conflicts
    existing_events = db.events.find_one({
        "family_id": {"$in": family_ids},
        "date": _ensure_datetime(event_data.date),
        "type": "custody",
        "id": {"$ne": event_id}
    })
    
    is_conflict = False
    if existing_events and event_data.type == "custody":
        is_conflict = True

    await email_service.send_event_notification(
        recipients,
        "create",
        event_data.title,
        str(event_data.date),
        user_name,
        is_conflict=is_conflict
    )

    return _serialize_event_document(event_doc)


@router.put("/events/{event_id}", response_model=Event)
async def update_calendar_event(
    event_id: str,
    event_data: EventCreate,
    current_user: User = Depends(get_current_user),
):
    """Update an existing calendar event. Only the creator can edit directly."""
    family, family_ids = _get_family_for_user(current_user)
    event_doc = _find_event_for_family(event_id, family_ids)

    # Only allow the creator to edit directly
    event_creator = event_doc.get("createdBy_email")
    if event_creator and event_creator.lower().strip() != current_user.email.lower().strip():
        raise HTTPException(
            status_code=403,
            detail="Only the event creator can edit this event. Please use a change request instead."
        )

    update_fields = {
        "date": _ensure_datetime(event_data.date),
        "type": event_data.type,
        "title": event_data.title,
        "parent": event_data.parent,
        "isSwappable": event_data.isSwappable,
        "updatedAt": datetime.utcnow(),
    }

    db.events.update_one({"_id": event_doc.get("_id")}, {"$set": update_fields})
    event_doc.update(update_fields)

    # Send email notification
    recipients = [family.get("parent1_email"), family.get("parent2_email")]
    user_name = f"{current_user.firstName} {current_user.lastName}"

    # Check for conflicts
    existing_events = db.events.find_one({
        "family_id": {"$in": family_ids},
        "date": _ensure_datetime(event_data.date),
        "type": "custody",
        "id": {"$ne": event_id}
    })
    
    is_conflict = False
    if existing_events and event_data.type == "custody":
        is_conflict = True

    await email_service.send_event_notification(
        recipients,
        "update",
        event_data.title,
        str(event_data.date),
        user_name,
        is_conflict=is_conflict
    )

    return _serialize_event_document(event_doc)


@router.delete("/events/{event_id}", status_code=204)
async def delete_calendar_event(
    event_id: str,
    current_user: User = Depends(get_current_user),
):
    """Delete a calendar event."""
    family, family_ids = _get_family_for_user(current_user)
    event_doc = _find_event_for_family(event_id, family_ids)

    # Only allow the creator to delete directly
    event_creator = event_doc.get("createdBy_email")
    if event_creator and event_creator.lower().strip() != current_user.email.lower().strip():
        raise HTTPException(
            status_code=403,
            detail="Only the event creator can delete this event. Please use a change request instead."
        )

    db.events.delete_one({"_id": event_doc.get("_id")})

    # Send email notification
    recipients = [family.get("parent1_email"), family.get("parent2_email")]
    user_name = f"{current_user.firstName} {current_user.lastName}"

    await email_service.send_event_notification(
        recipients,
        "delete",
        event_doc.get("title"),
        str(event_doc.get("date")),
        user_name
    )

    return Response(status_code=204)


@router.get("/swappable-dates", response_model=List[Event])
async def get_swappable_dates(current_user: User = Depends(get_current_user)):
    """Get all calendar events for the current user."""
    family, family_ids = _get_family_for_user(current_user, raise_error=False)
    
    if not family:
        return []

    events_cursor = db.events.find({
        "family_id": {"$in": family_ids},
        "parent": current_user.email
    })
    
    return [_serialize_event_document(event_doc) for event_doc in events_cursor]


@router.get("/change-requests", response_model=List[ChangeRequest])
async def get_change_requests(current_user: User = Depends(get_current_user)):
    """Get all change requests for the user's family."""
    family, family_ids = _get_family_for_user(current_user, raise_error=False)
    
    if not family:
        return []

    change_requests_cursor = db.change_requests.find({"family_id": {"$in": family_ids}})
    return [
        _serialize_change_request_document(change_doc)
        for change_doc in change_requests_cursor
    ]


@router.post("/change-requests", response_model=ChangeRequest)
async def create_change_request(
    request_data: ChangeRequestCreate,
    current_user: User = Depends(get_current_user),
):
    """Submit a change request for a calendar event."""
    family, family_ids = _get_family_for_user(current_user)
    event_doc = _find_event_for_family(request_data.event_id, family_ids)
    
    primary_family_id = family_ids[0] if family_ids else str(family.get("_id"))

    change_request_id = str(uuid.uuid4())
    change_type = request_data.requestType
    if change_type not in {"swap", "modify", "cancel"}:
        raise HTTPException(status_code=400, detail="Invalid request type.")

    change_request_doc = {
        "id": change_request_id,
        "family_id": primary_family_id,
        "event_id": event_doc.get("id"),
        "requestedBy_email": current_user.email,
        "status": "pending",
        "reason": request_data.reason,
        "createdAt": datetime.utcnow(),
        "requestType": change_type,
        "eventTitle": event_doc.get("title"),
        "eventType": event_doc.get("type"),
        "eventParent": event_doc.get("parent"),
        "eventDate": _ensure_datetime(event_doc.get("date")),
    }

    if change_type == "modify":
        if not request_data.newDate:
            raise HTTPException(
                status_code=400, detail="newDate is required for a modify request."
            )
        change_request_doc["newDate"] = _ensure_datetime(request_data.newDate)
    elif change_type == "swap":
        if not request_data.swapEventId:
            raise HTTPException(
                status_code=400, detail="swapEventId is required for a swap request."
            )
        swap_event_doc = _find_event_for_family(request_data.swapEventId, family_ids)
        change_request_doc["swapEventId"] = swap_event_doc.get("id")
        change_request_doc["swapEventTitle"] = swap_event_doc.get("title")
        change_request_doc["swapEventDate"] = _ensure_datetime(swap_event_doc.get("date"))
    else:
        change_request_doc["newDate"] = None

    db.change_requests.insert_one(change_request_doc)

    # Send email notification to both parents about the request
    # family already fetched at start
    
    # Determine requester and recipient
    requester_email = current_user.email
    recipient_email = family.get("parent1_email") if family.get("parent2_email") == requester_email else family.get("parent2_email")
    requester_name = f"{current_user.firstName} {current_user.lastName}"

    await email_service.send_swap_request_created(
        requester_email,
        recipient_email,
        requester_name,
        event_doc.get("title"),
        str(event_doc.get("date"))
    )

    return _serialize_change_request_document(change_request_doc)


@router.put("/change-requests/{request_id}", response_model=ChangeRequest)
async def update_change_request(
    request_id: str,
    update_data: ChangeRequestUpdate,
    current_user: User = Depends(get_current_user),
):
    """Approve or reject a change request."""
    family, family_ids = _get_family_for_user(current_user)
    change_request_doc = _find_change_request_for_family(request_id, family_ids)

    if update_data.status not in ["approved", "rejected"]:
        raise HTTPException(
            status_code=400, detail="Status must be either 'approved' or 'rejected'"
        )

    if (
        update_data.status == "approved"
        and change_request_doc.get("requestedBy_email") == current_user.email
    ):
        raise HTTPException(
            status_code=403,
            detail="The parent who created the request cannot approve it.",
        )

    change_request_doc["status"] = update_data.status
    change_request_doc["updatedAt"] = datetime.utcnow()
    change_request_doc["resolvedBy_email"] = current_user.email

    db.change_requests.update_one(
        {"_id": change_request_doc.get("_id")},
        {"$set": {"status": update_data.status, "resolvedBy_email": current_user.email}},
    )

    # Send email notification to both parents about the resolution
    recipients = [family.get("parent1_email"), family.get("parent2_email")]
    user_name = f"{current_user.firstName} {current_user.lastName}"

    request_type = change_request_doc.get("requestType", "modify")
    details = {
        "event_date": str(change_request_doc.get("eventDate")),
        "request_type": request_type
    }
    
    if request_type == "swap":
        details["swap_date"] = str(change_request_doc.get("swapEventDate"))
        details["swap_title"] = change_request_doc.get("swapEventTitle")
    elif request_type == "modify":
        details["new_date"] = str(change_request_doc.get("newDate"))

    await email_service.send_swap_resolution_notification(
        recipients,
        change_request_doc.get("eventTitle"),
        update_data.status,
        user_name,
        details
    )

    # If approved, apply the requested date change
    request_type = change_request_doc.get("requestType", "modify")
    if update_data.status == "approved":
        if request_type == "swap":
            swap_event_id = change_request_doc.get("swapEventId")
            if not swap_event_id:
                raise HTTPException(
                    status_code=400,
                    detail="Swap request missing swapEventId.",
                )
            event_doc = _find_event_for_family(change_request_doc.get("event_id"), family_ids)
            swap_event_doc = _find_event_for_family(swap_event_id, family_ids)

            event_date = _ensure_datetime(event_doc.get("date"))
            swap_date = _ensure_datetime(swap_event_doc.get("date"))

            db.events.update_one(
                {"_id": event_doc.get("_id")},
                {"$set": {"date": swap_date, "updatedAt": datetime.utcnow()}},
            )
            db.events.update_one(
                {"_id": swap_event_doc.get("_id")},
                {"$set": {"date": event_date, "updatedAt": datetime.utcnow()}},
            )
        elif request_type == "modify":
            new_date = change_request_doc.get("newDate")
            if not new_date:
                raise HTTPException(
                    status_code=400,
                    detail="Modify request missing newDate.",
                )
            event_doc = _find_event_for_family(
                change_request_doc.get("event_id"), family_ids
            )
            updated_date = _ensure_datetime(new_date)
            db.events.update_one(
                {"_id": event_doc.get("_id")},
                {"$set": {"date": updated_date, "updatedAt": datetime.utcnow()}},
            )
        elif request_type == "cancel":
            event_doc = _find_event_for_family(
                change_request_doc.get("event_id"), family_ids
            )
            db.events.delete_one({"_id": event_doc.get("_id")})

    return _serialize_change_request_document(change_request_doc)