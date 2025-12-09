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

router = APIRouter(prefix="/api/v1/calendar", tags=["calendar"])


def _ensure_datetime(value) -> datetime:
    if isinstance(value, datetime):
        return value
    if isinstance(value, str):
        try:
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


def _get_family_for_user(current_user: User, raise_error: bool = True) -> tuple[Optional[dict], Optional[str]]:
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
        return None, None
    family_id = str(family.get("_id") or family.get("id"))
    return family, family_id


def _find_event_for_family(event_id: str, family_id: str) -> dict:
    event = db.events.find_one({"id": event_id})
    if not event:
        try:
            event = db.events.find_one({"_id": ObjectId(event_id)})
        except Exception:
            event = None
    if not event or str(event.get("family_id")) != family_id:
        raise HTTPException(status_code=404, detail="Event not found")
    return event


def _find_change_request_for_family(request_id: str, family_id: str) -> dict:
    change_request = db.change_requests.find_one({"id": request_id})
    if not change_request:
        try:
            change_request = db.change_requests.find_one({"_id": ObjectId(request_id)})
        except Exception:
            change_request = None
    if not change_request or str(change_request.get("family_id")) != family_id:
        raise HTTPException(status_code=404, detail="Change request not found")
    return change_request


@router.get("/events", response_model=List[Event])
async def get_calendar_events(
    year: int = Query(..., description="Year to fetch events for"),
    month: int = Query(..., description="Month to fetch events for (1-12)"),
    current_user: User = Depends(get_current_user),
):
    """Get calendar events for a specific month."""
    _, family_id = _get_family_for_user(current_user, raise_error=False)
    
    if not family_id:
        return []

    events_cursor = db.events.find({"family_id": family_id})
    events: List[Event] = []

    for event_doc in events_cursor:
        event_obj = _serialize_event_document(event_doc)
        if event_obj.date.year == year and event_obj.date.month == month:
            events.append(event_obj)

    return events


@router.post("/events", response_model=Event)
async def create_calendar_event(
    event_data: EventCreate,
    current_user: User = Depends(get_current_user),
):
    """Create a new calendar event."""
    _, family_id = _get_family_for_user(current_user)

    event_id = str(uuid.uuid4())
    event_doc = {
        "id": event_id,
        "family_id": family_id,
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
    return _serialize_event_document(event_doc)


@router.put("/events/{event_id}", response_model=Event)
async def update_calendar_event(
    event_id: str,
    event_data: EventCreate,
    current_user: User = Depends(get_current_user),
):
    """Update an existing calendar event. Only the creator can edit directly."""
    _, family_id = _get_family_for_user(current_user)
    event_doc = _find_event_for_family(event_id, family_id)

    # Only allow the creator to edit directly
    event_creator = event_doc.get("createdBy_email")
    if event_creator and event_creator != current_user.email:
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

    return _serialize_event_document(event_doc)


@router.delete("/events/{event_id}", status_code=204)
async def delete_calendar_event(
    event_id: str,
    current_user: User = Depends(get_current_user),
):
    """Delete a calendar event."""
    _, family_id = _get_family_for_user(current_user)
    event_doc = _find_event_for_family(event_id, family_id)
    db.events.delete_one({"_id": event_doc.get("_id")})
    return Response(status_code=204)


@router.get("/swappable-dates", response_model=List[Event])
async def get_swappable_dates(current_user: User = Depends(get_current_user)):
    """Get all calendar events for the current user."""
    _, family_id = _get_family_for_user(current_user, raise_error=False)
    
    if not family_id:
        return []
    
    events_cursor = db.events.find({
        "family_id": family_id,
        "parent": current_user.email
    })
    
    return [_serialize_event_document(event_doc) for event_doc in events_cursor]


@router.get("/change-requests", response_model=List[ChangeRequest])
async def get_change_requests(current_user: User = Depends(get_current_user)):
    """Get all change requests for the user's family."""
    _, family_id = _get_family_for_user(current_user, raise_error=False)
    
    if not family_id:
        return []
        
    change_requests_cursor = db.change_requests.find({"family_id": family_id})
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
    _, family_id = _get_family_for_user(current_user)
    event_doc = _find_event_for_family(request_data.event_id, family_id)

    change_request_id = str(uuid.uuid4())
    change_type = request_data.requestType
    if change_type not in {"swap", "modify", "cancel"}:
        raise HTTPException(status_code=400, detail="Invalid request type.")

    change_request_doc = {
        "id": change_request_id,
        "family_id": family_id,
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
        swap_event_doc = _find_event_for_family(request_data.swapEventId, family_id)
        change_request_doc["swapEventId"] = swap_event_doc.get("id")
        change_request_doc["swapEventTitle"] = swap_event_doc.get("title")
        change_request_doc["swapEventDate"] = _ensure_datetime(swap_event_doc.get("date"))
    else:
        change_request_doc["newDate"] = None

    db.change_requests.insert_one(change_request_doc)
    return _serialize_change_request_document(change_request_doc)


@router.put("/change-requests/{request_id}", response_model=ChangeRequest)
async def update_change_request(
    request_id: str,
    update_data: ChangeRequestUpdate,
    current_user: User = Depends(get_current_user),
):
    """Approve or reject a change request."""
    family, family_id = _get_family_for_user(current_user)
    change_request_doc = _find_change_request_for_family(request_id, family_id)

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
            event_doc = _find_event_for_family(change_request_doc.get("event_id"), family_id)
            swap_event_doc = _find_event_for_family(swap_event_id, family_id)

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
                change_request_doc.get("event_id"), family_id
            )
            updated_date = _ensure_datetime(new_date)
            db.events.update_one(
                {"_id": event_doc.get("_id")},
                {"$set": {"date": updated_date, "updatedAt": datetime.utcnow()}},
            )
        elif request_type == "cancel":
            event_doc = _find_event_for_family(
                change_request_doc.get("event_id"), family_id
            )
            db.events.delete_one({"_id": event_doc.get("_id")})

    return _serialize_change_request_document(change_request_doc)