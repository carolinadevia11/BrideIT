from datetime import date, timedelta
from database import db
from models import Event

def generate_custody_events(family_id: str, custody_agreement: dict):
    """
    Generates custody events based on a parsed custody agreement.
    Supports "2-2-3" and "Week-on/week-off" schedules.
    """
    family = db.families.find_one({"id": family_id})
    if not family:
        return

    parent1_email = family.get("parent1_email")
    parent2_email = family.get("parent2_email")

    if not parent1_email or not parent2_email:
        return

    # Clear existing custody events for this family
    db.events.delete_many({"family_id": family_id, "type": "custody"})

    start_date = date.today()
    end_date = start_date + timedelta(days=365)
    current_date = start_date
    
    schedule_type = custody_agreement.get("custodySchedule", "").lower()
    
    # Default to alternating weeks if not specified or unknown
    if "2-2-3" in schedule_type or "2-2-3" in str(custody_agreement):
        # 2-2-3 Schedule:
        # Week 1: P1 (2 days), P2 (2 days), P1 (3 days)
        # Week 2: P2 (2 days), P1 (2 days), P2 (3 days)
        # Cycle length: 14 days
        
        # Pattern for 14 days: [P1, P1, P2, P2, P1, P1, P1, P2, P2, P1, P1, P2, P2, P2]
        pattern = [
            parent1_email, parent1_email, 
            parent2_email, parent2_email, 
            parent1_email, parent1_email, parent1_email,
            parent2_email, parent2_email, 
            parent1_email, parent1_email, 
            parent2_email, parent2_email, parent2_email
        ]
        
        cycle_length = 14
        
        while current_date <= end_date:
            days_since_start = (current_date - start_date).days
            day_index = days_since_start % cycle_length
            current_parent = pattern[day_index]
            
            event = Event(
                family_id=family_id,
                title="Custody",
                date=current_date.isoformat(),
                type="custody",
                parent=current_parent
            )
            db.events.insert_one(event.model_dump())
            current_date += timedelta(days=1)
            
    else:
        # Default: Week-on/week-off (Alternating Weeks)
        # Switch every 7 days
        current_parent = parent1_email
        
        while current_date <= end_date:
            # Switch parent every 7 days
            days_since_start = (current_date - start_date).days
            if days_since_start > 0 and days_since_start % 7 == 0:
                current_parent = parent2_email if current_parent == parent1_email else parent1_email
                
            event = Event(
                family_id=family_id,
                title="Custody",
                date=current_date.isoformat(),
                type="custody",
                parent=current_parent
            )
            db.events.insert_one(event.model_dump())
            current_date += timedelta(days=1)
