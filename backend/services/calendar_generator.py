import uuid
from datetime import date, timedelta, datetime
from database import db
from models import Event

def generate_custody_events(family_id: str, custody_agreement: dict):
    """
    Manages custody events based on a parsed custody agreement.
    
    NOTE: As of recent updates (per user request and PRD review), we NO LONGER
    generate explicit calendar events for every single day of the custody schedule.
    This was causing visual clutter ("lots of events").
    
    Instead, the frontend now renders the custody schedule visually (background colors)
    based on the 'custodyAgreement' data stored in the family profile.
    
    This function now acts as a CLEANUP utility to remove any previously auto-generated
    system events, ensuring the calendar remains clean. It does NOT create new events.
    """
    # Fix: Try finding by custom 'id' first, then ObjectId if needed, or _id
    family = db.families.find_one({"id": family_id})
    if not family:
        try:
             from bson import ObjectId
             family = db.families.find_one({"_id": ObjectId(family_id)})
        except:
             pass
    
    # If still not found, check if it's the internal _id string
    if not family:
         family = db.families.find_one({"_id": family_id})

    if not family:
        print(f"Error: Family with ID {family_id} not found during calendar generation")
        return

    # Robust cleanup: delete events for ANY of the family's IDs (UUID or ObjectId)
    family_ids = []
    if family.get("id"):
        family_ids.append(family.get("id"))
    if family.get("_id"):
        family_ids.append(str(family.get("_id")))

    # Clear existing SYSTEM-GENERATED custody events for this family
    # We filter by createdBy_email="system" to avoid deleting user-created custody events
    db.events.delete_many({
        "family_id": {"$in": family_ids}, 
        "type": "custody",
        "createdBy_email": "system"
    })

    print(f"Cleaned up auto-generated custody events for family {family_id}")
    
    # We purposely do NOT generate new events here anymore.
    # The 'custodyAgreement' saved on the family object is sufficient for the frontend
    # to render the schedule patterns (2-2-3, alternating weeks, etc.) visually.
