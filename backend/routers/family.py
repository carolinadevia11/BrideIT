from fastapi import APIRouter, Depends, HTTPException
from typing import List
import uuid
import random
import string
import os
from datetime import datetime, date, timedelta, timezone
import base64
import re

from models import Family, FamilyCreate, FamilyLink, ContractUpload, CustodyAgreement, Child, ChildCreate, ChildUpdate, User
from routers.auth import get_current_user
from database import db

router = APIRouter()

def generate_family_code():
    """Generate a unique 6-character alphanumeric family code."""
    while True:
        # Generate a 6-character code (letters and numbers, excluding confusing chars like 0, O, I, l)
        chars = ''.join(c for c in (string.ascii_uppercase + string.digits) if c not in '0OIL1')
        code = ''.join(random.choice(chars) for _ in range(6))
        
        # Check if code already exists
        if not db.families.find_one({"familyCode": code}):
            return code

@router.post("/api/v1/family", response_model=Family)
async def create_family(family_data: FamilyCreate, current_user: User = Depends(get_current_user)):
    """Create a new family profile for the current user and generate a Family Code."""
    # Check if user already has a family
    if db.families.find_one({"$or": [{"parent1_email": current_user.email}, {"parent2_email": current_user.email}]}):
        raise HTTPException(status_code=400, detail="User already has a family profile")
    
    family_id = str(uuid.uuid4())
    family_code = generate_family_code()
    
    family = Family(
        id=family_id,
        familyName=family_data.familyName,
        familyCode=family_code,
        parent1_email=current_user.email,
        parent1_name=family_data.parent1_name,
        parent2_email=family_data.parent2_email,
        children=[],
        custodyArrangement=family_data.custodyArrangement,
        createdAt=datetime.utcnow()
    )
    db.families.insert_one(family.model_dump())
    return family

@router.post("/api/v1/family/link", response_model=Family)
async def link_to_family(link_data: FamilyLink, current_user: User = Depends(get_current_user)):
    """Link current user as parent2 using a Family Code."""
    # Check if user already has a family
    existing_family = db.families.find_one({"$or": [{"parent1_email": current_user.email}, {"parent2_email": current_user.email}]})
    if existing_family:
        raise HTTPException(status_code=400, detail="User already has a family profile")
    
    # Find family by code
    family = db.families.find_one({"familyCode": link_data.familyCode})
    if not family:
        raise HTTPException(status_code=404, detail="Invalid Family Code")
    
    # Check if family already has parent2
    if family.get("parent2_email"):
        raise HTTPException(status_code=400, detail="This family already has two parents linked")
    
    # Link the current user as parent2
    db.families.update_one(
        {"familyCode": link_data.familyCode},
        {
            "$set": {
                "parent2_email": current_user.email,
                "parent2_name": link_data.parent2_name,
                "linkedAt": datetime.utcnow()
            }
        }
    )
    
    updated_family = db.families.find_one({"familyCode": link_data.familyCode})
    return Family(**updated_family)

@router.get("/api/v1/family", response_model=Family)
async def get_family(current_user: User = Depends(get_current_user)):
    """Get the current user's family profile."""
    family = db.families.find_one({"$or": [{"parent1_email": current_user.email}, {"parent2_email": current_user.email}]})
    if family:
        return Family(**family)
    
    raise HTTPException(status_code=404, detail="Family profile not found")

@router.get("/api/v1/children", response_model=List[Child])
async def get_children(current_user: User = Depends(get_current_user)):
    """Get all children for the current user's family."""
    user_family = db.families.find_one({"$or": [{"parent1_email": current_user.email}, {"parent2_email": current_user.email}]})
    
    if not user_family:
        raise HTTPException(status_code=404, detail="Family profile not found")
    
    children = user_family.get("children", [])
    print(f"DEBUG: Found family for {current_user.email}")
    print(f"DEBUG: Family has {len(children)} children")
    print(f"DEBUG: Children data: {children}")
    return children

@router.post("/api/v1/children", response_model=Child)
async def add_child(child_data: ChildCreate, current_user: User = Depends(get_current_user)):
    """Add a new child to the family."""
    try:
        print(f"DEBUG: Received child data: {child_data}")
        
        # Find the user's family
        user_family = db.families.find_one({"$or": [{"parent1_email": current_user.email}, {"parent2_email": current_user.email}]})
        
        if not user_family:
            raise HTTPException(status_code=404, detail="Family profile not found")
        
        child_id = str(uuid.uuid4())
        
        # Create child document for MongoDB (convert date to string)
        child_doc = {
            "id": child_id,
            "name": child_data.name,
            "dateOfBirth": child_data.dateOfBirth.isoformat() if isinstance(child_data.dateOfBirth, date) else str(child_data.dateOfBirth),
            "grade": child_data.grade or "",
            "school": child_data.school or "",
            "allergies": child_data.allergies or "",
            "medications": child_data.medications or "",
            "notes": child_data.notes or ""
        }
        
        print(f"DEBUG: Saving child to MongoDB: {child_doc}")
        
        db.families.update_one(
            {"_id": user_family["_id"]},
            {"$push": {"children": child_doc}}
        )
        
        # Return Child model for response
        child = Child(
            id=child_id,
            name=child_data.name,
            dateOfBirth=child_data.dateOfBirth,
            grade=child_data.grade,
            school=child_data.school,
            allergies=child_data.allergies,
            medications=child_data.medications,
            notes=child_data.notes
        )
        
        print(f"DEBUG: Successfully added child to family")
        return child
    except Exception as e:
        print(f"ERROR adding child: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error adding child: {str(e)}")

@router.put("/api/v1/children/{child_id}", response_model=Child)
async def update_child(child_id: str, child_data: ChildUpdate, current_user: User = Depends(get_current_user)):
    """Update a child's information."""
    # Find the user's family
    user_family = db.families.find_one({"$or": [{"parent1_email": current_user.email}, {"parent2_email": current_user.email}]})
    
    if not user_family:
        raise HTTPException(status_code=404, detail="Family profile not found")
    
    # Find the child and update
    update_data = child_data.model_dump(exclude_unset=True)
    result = db.families.update_one(
        {"_id": user_family["_id"], "children.id": child_id},
        {"$set": {f"children.$.{key}": value for key, value in update_data.items()}}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Child not found")

    # Retrieve the updated child
    updated_family = db.families.find_one({"_id": user_family["_id"]})
    for child in updated_family["children"]:
        if child["id"] == child_id:
            return Child(**child)
    
    raise HTTPException(status_code=404, detail="Child not found after update")

@router.delete("/api/v1/children/{child_id}")
async def delete_child(child_id: str, current_user: User = Depends(get_current_user)):
    """Remove a child from the family."""
    # Find the user's family
    user_family = db.families.find_one({"$or": [{"parent1_email": current_user.email}, {"parent2_email": current_user.email}]})
    
    if not user_family:
        raise HTTPException(status_code=404, detail="Family profile not found")
    
    # Find and remove the child
    result = db.families.update_one(
        {"_id": user_family["_id"]},
        {"$pull": {"children": {"id": child_id}}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Child not found")
        
    return {"message": "Child removed successfully"}

def parse_contract_with_ai(file_content: str, file_type: str):
    """
    Simulate AI parsing of custody agreement.
    In production, this would use GPT-4, Claude, or a specialized legal AI.
    """
    # This is a simulation - in production, you'd send to an AI API
    # For now, we'll extract some common patterns
    
    parsed_data = {
        "parsed": True,
        "confidence": 0.85,
        "extractedTerms": []
    }
    
    # Simulate extracting key information
    content_lower = file_content.lower()
    
    # Check for custody split patterns
    if "50/50" in content_lower or "50-50" in content_lower or "equal time" in content_lower:
        parsed_data["extractedTerms"].append({
            "term": "Custody Split",
            "value": "50/50 Equal Time",
            "confidence": 0.9
        })
        expense_split = {"ratio": "50-50", "parent1": 50, "parent2": 50}
    elif "primary" in content_lower and "secondary" in content_lower:
        parsed_data["extractedTerms"].append({
            "term": "Custody Split",
            "value": "Primary/Secondary",
            "confidence": 0.8
        })
        expense_split = {"ratio": "60-40", "parent1": 60, "parent2": 40}
    else:
        expense_split = {"ratio": "custom", "parent1": 50, "parent2": 50}
    
    # Check for decision-making terms
    if "joint legal custody" in content_lower:
        parsed_data["extractedTerms"].append({
            "term": "Legal Custody",
            "value": "Joint Legal Custody",
            "confidence": 0.95
        })
    
    # Check for holiday scheduling
    if "alternate" in content_lower and "holiday" in content_lower:
        parsed_data["extractedTerms"].append({
            "term": "Holiday Schedule",
            "value": "Alternating Holidays",
            "confidence": 0.85
        })
    
    return {
        "custodySchedule": "Extracted from agreement",
        "holidaySchedule": "Alternating holidays as specified",
        "decisionMaking": "Joint legal custody",
        "expenseSplit": expense_split,
        "parsedData": parsed_data
    }

from services.calendar_generator import generate_custody_events

@router.post("/api/v1/family/contract")
async def upload_contract(contract: ContractUpload, current_user: User = Depends(get_current_user)):
    """Upload and parse custody agreement document."""
    # Find the user's family
    user_family = db.families.find_one({"$or": [{"parent1_email": current_user.email}, {"parent2_email": current_user.email}]})
    
    if not user_family:
        raise HTTPException(status_code=404, detail="Family profile not found")
    
    try:
        # Decode base64 content to bytes (not text - PDFs/DOCs are binary)
        file_bytes = base64.b64decode(contract.fileContent)
        
        # Try to use the new DocumentParser service
        try:
            from services.document_parser import DocumentParser
            parser = DocumentParser(
                ai_provider=os.getenv("AI_PROVIDER", "openai"),
                api_key=os.getenv("OPENAI_API_KEY") or os.getenv("ANTHROPIC_API_KEY")
            )
            
            # Parse document (extracts text and uses AI)
            parsed_info = await parser.parse_document(file_bytes, contract.fileType)
            
            # Map parsed data to expected format
            custody_schedule = parsed_info.get("custodySchedule", "Extracted from agreement")
            holiday_schedule = parsed_info.get("holidaySchedule", "As specified in agreement")
            decision_making = parsed_info.get("decisionMaking", "Joint legal custody")
            expense_split = parsed_info.get("expenseSplit", {"ratio": "50-50", "parent1": 50, "parent2": 50})
            
        except (ImportError, ValueError) as e:
            # Fallback to old pattern matching if new parser not available or PDF support missing
            error_msg = str(e)
            
            # If it's a PDF/DOC file and libraries aren't available, provide helpful error
            if contract.fileType.lower() not in ['txt', 'text']:
                if "PDF support not available" in error_msg or "DOCX support not available" in error_msg:
                    raise HTTPException(
                        status_code=400,
                        detail=error_msg
                    )
                else:
                    raise HTTPException(
                        status_code=400,
                        detail=f"PDF/DOC parsing requires additional libraries. Install: pip install pdfplumber python-docx openai. Error: {error_msg}"
                    )
            
            # For TXT files, fallback to old pattern matching
            if contract.fileType.lower() in ['txt', 'text']:
                file_content = file_bytes.decode('utf-8', errors='ignore')
                parsed_info = parse_contract_with_ai(file_content, contract.fileType)
                custody_schedule = parsed_info["custodySchedule"]
                holiday_schedule = parsed_info["holidaySchedule"]
                decision_making = parsed_info["decisionMaking"]
                expense_split = parsed_info["expenseSplit"]
            else:
                raise HTTPException(
                    status_code=400,
                    detail=f"PDF/DOC parsing requires additional libraries. Install: pip install pdfplumber python-docx openai. Error: {error_msg}"
                )
        
        # Create custody agreement object (store original file for download)
        custody_agreement = CustodyAgreement(
            uploadDate=datetime.utcnow(),
            fileName=contract.fileName,
            fileType=contract.fileType,
            fileContent=contract.fileContent,  # Store base64 for download
            custodySchedule=custody_schedule,
            holidaySchedule=holiday_schedule,
            decisionMaking=decision_making,
            expenseSplit=expense_split,
            parsedData=parsed_info.get("parsedData", parsed_info)
        )
        
        # Update family with custody agreement
        db.families.update_one(
            {"_id": user_family["_id"]},
            {"$set": {"custodyAgreement": custody_agreement.model_dump()}}
        )
        
        # Generate calendar events from the new agreement
        generate_custody_events(user_family["id"], custody_agreement.model_dump())
        
        return {
            "message": "Contract uploaded and parsed successfully",
            "custodyAgreement": custody_agreement,
            "aiAnalysis": parsed_info.get("parsedData", parsed_info)
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error parsing document: {str(e)}"
        )

@router.get("/api/v1/family/contract")
async def get_contract(current_user: User = Depends(get_current_user)):
    """Get the parsed custody agreement for the current family."""
    user_family = db.families.find_one({"$or": [{"parent1_email": current_user.email}, {"parent2_email": current_user.email}]})
    
    if not user_family:
        raise HTTPException(status_code=404, detail="Family profile not found")
    
    custody_agreement = user_family.get("custodyAgreement")
    if not custody_agreement:
        raise HTTPException(status_code=404, detail="No custody agreement found")
    
    return custody_agreement

@router.get("/api/v1/family/contract/download")
async def download_contract(current_user: User = Depends(get_current_user)):
    """Download the original custody agreement file."""
    from fastapi.responses import Response
    
    user_family = db.families.find_one({"$or": [{"parent1_email": current_user.email}, {"parent2_email": current_user.email}]})
    
    if not user_family:
        raise HTTPException(status_code=404, detail="Family profile not found")
    
    custody_agreement = user_family.get("custodyAgreement")
    if not custody_agreement:
        raise HTTPException(status_code=404, detail="No custody agreement found")
    
    file_content = custody_agreement.get("fileContent")
    if not file_content:
        raise HTTPException(status_code=404, detail="Original file not available")
    
    # Decode base64 to bytes
    file_bytes = base64.b64decode(file_content)
    file_name = custody_agreement.get("fileName", "custody_agreement")
    file_type = custody_agreement.get("fileType", "pdf")
    
    # Clean filename - remove trailing underscores and ensure proper extension
    file_name = file_name.rstrip('_').strip()
    
    # Ensure filename has correct extension
    if not file_name.lower().endswith(('.pdf', '.doc', '.docx', '.txt')):
        # Add extension if missing
        extension_map = {
            "pdf": ".pdf",
            "doc": ".doc",
            "docx": ".docx",
            "txt": ".txt"
        }
        ext = extension_map.get(file_type.lower(), ".pdf")
        if not file_name.endswith(ext):
            file_name = file_name.rsplit('.', 1)[0] + ext
    
    # Determine MIME type
    mime_types = {
        "pdf": "application/pdf",
        "doc": "application/msword",
        "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "txt": "text/plain"
    }
    media_type = mime_types.get(file_type.lower(), "application/octet-stream")
    
    # For PDFs, use 'inline' to open in browser; for others, use 'attachment' to download
    disposition = "inline" if file_type.lower() == "pdf" else "attachment"
    
    return Response(
        content=file_bytes,
        media_type=media_type,
        headers={
            "Content-Disposition": f'{disposition}; filename="{file_name}"'
        }
    )

@router.delete("/api/v1/family")
async def delete_family(current_user: User = Depends(get_current_user)):
    """Delete the current user's family profile (for testing purposes)."""
    user_family = db.families.find_one({"$or": [{"parent1_email": current_user.email}, {"parent2_email": current_user.email}]})
    
    if not user_family:
        raise HTTPException(status_code=404, detail="Family profile not found")
    
    db.families.delete_one({"_id": user_family["_id"]})
    
    return {"message": "Family profile deleted successfully"}

@router.get("/api/v1/family/custody-distribution")
async def get_custody_distribution(period: str = "yearly", current_user: User = Depends(get_current_user)):
    """
    Calculate and return the custody distribution for the current family.
    Can be filtered by period: 'weekly' or 'yearly'.
    """
    user_family = db.families.find_one({"$or": [{"parent1_email": current_user.email}, {"parent2_email": current_user.email}]})

    if not user_family:
        raise HTTPException(status_code=404, detail="Family profile not found")

    family_id = user_family["id"]
    parent1_email = user_family.get("parent1_email")
    parent2_email = user_family.get("parent2_email")
    parent1_name = user_family.get("parent1_name", "Parent 1")
    parent2_name = user_family.get("parent2_name", "Parent 2")

    if not parent1_email or not parent2_email:
        raise HTTPException(status_code=400, detail="Family is not fully linked")

    # Define date range for query
    today = datetime.now(timezone.utc).date()
    if period == "weekly":
        start_of_week = today - timedelta(days=today.weekday())
        end_of_week = start_of_week + timedelta(days=6)
        query = {
            "family_id": family_id,
            "type": "custody",
            "date": {
                "$gte": start_of_week.isoformat(),
                "$lte": end_of_week.isoformat()
            }
        }
    else:  # yearly
        start_of_year = date(today.year, 1, 1)
        end_of_year = date(today.year, 12, 31)
        query = {
            "family_id": family_id,
            "type": "custody",
            "date": {
                "$gte": start_of_year.isoformat(),
                "$lte": end_of_year.isoformat()
            }
        }

    # Fetch calendar events for the specified period
    events = list(db.events.find(query))

    total_days = len(events)
    if total_days == 0:
        return {
            "parent1": {"name": parent1_name, "days": 0, "percentage": 0},
            "parent2": {"name": parent2_name, "days": 0, "percentage": 0},
            "total_days": 0
        }

    parent1_days = 0
    parent2_days = 0

    for event in events:
        parent_email = event.get("parent")
        if parent_email == parent1_email:
            parent1_days += 1
        elif parent_email == parent2_email:
            parent2_days += 1

    parent1_percentage = round((parent1_days / total_days) * 100, 1) if total_days > 0 else 0
    parent2_percentage = round((parent2_days / total_days) * 100, 1) if total_days > 0 else 0

    return {
        "parent1": {"name": parent1_name, "days": parent1_days, "percentage": parent1_percentage},
        "parent2": {"name": parent2_name, "days": parent2_days, "percentage": parent2_percentage},
        "total_days": total_days
    }