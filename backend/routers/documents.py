from fastapi import APIRouter, Depends, HTTPException, Response, Query, Header
from fastapi.responses import StreamingResponse
from typing import List, Optional
from datetime import datetime, timedelta
from bson import ObjectId
import uuid
import base64
import os
import io
from pathlib import Path
import jwt

from models import Document, DocumentUpload, DocumentFolder, DocumentFolderCreate, DocumentFolderUpdate, User, EventCreate
from routers.auth import get_current_user
from database import db, fs
from services.document_parser import DocumentParser
from services.calendar_generator import generate_custody_events

router = APIRouter(prefix="/api/v1/documents", tags=["documents"])

# Default folders configuration
DEFAULT_FOLDERS = [
    {
        "id": "legal",
        "name": "Legal Documents",
        "description": "Custody agreements, court orders, and legal papers",
        "icon": "Scale",
        "color": "text-red-600",
        "bg_color": "bg-red-50 border-red-200",
        "document_types": ["custody-agreement", "court-order", "financial"],
        "is_custom": False
    },
    {
        "id": "medical",
        "name": "Medical Records",
        "description": "Insurance cards, medical records, and health documents",
        "icon": "Stethoscope",
        "color": "text-green-600",
        "bg_color": "bg-green-50 border-green-200",
        "document_types": ["medical"],
        "is_custom": False
    },
    {
        "id": "school",
        "name": "School Documents",
        "description": "Report cards, school forms, and educational records",
        "icon": "GraduationCap",
        "color": "text-blue-600",
        "bg_color": "bg-blue-50 border-blue-200",
        "document_types": ["school"],
        "is_custom": False
    },
    {
        "id": "emergency",
        "name": "Emergency Contacts",
        "description": "Emergency contact lists and important phone numbers",
        "icon": "AlertTriangle",
        "color": "text-orange-600",
        "bg_color": "bg-orange-50 border-orange-200",
        "document_types": ["emergency"],
        "is_custom": False
    },
    {
        "id": "memories",
        "name": "Pictures & Memories",
        "description": "Photos, videos, and special family moments",
        "icon": "Heart",
        "color": "text-pink-600",
        "bg_color": "bg-pink-50 border-pink-200",
        "document_types": ["memories"],
        "is_custom": False,
        "is_special": True
    }
]

def save_document_file(file_content: str, file_name: str, document_id: str) -> str:
    """Save document file to GridFS and return file ID"""
    try:
        decoded_content = base64.b64decode(file_content)
        # Determine content type
        ext = file_name.split('.')[-1].lower() if '.' in file_name else ''
        content_type = "application/octet-stream"
        if ext in ['pdf']: content_type = 'application/pdf'
        elif ext in ['jpg', 'jpeg']: content_type = 'image/jpeg'
        elif ext in ['png']: content_type = 'image/png'
        elif ext in ['doc', 'docx']: content_type = 'application/msword'
        
        file_id = fs.put(
            decoded_content,
            filename=file_name,
            content_type=content_type,
            metadata={"document_id": document_id}
        )
        return str(file_id)
    except Exception as e:
        print(f"Error saving document to GridFS: {e}")
        return ""

def format_file_size(size_bytes: int) -> str:
    """Format file size in human-readable format"""
    if size_bytes < 1024:
        return f"{size_bytes} B"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.1f} KB"
    elif size_bytes < 1024 * 1024 * 1024:
        return f"{size_bytes / (1024 * 1024):.1f} MB"
    else:
        return f"{size_bytes / (1024 * 1024 * 1024):.1f} GB"

def get_file_type(file_name: str) -> str:
    """Determine file type from extension"""
    ext = file_name.split('.')[-1].lower() if '.' in file_name else ''
    if ext in ['pdf']:
        return 'pdf'
    elif ext in ['doc', 'docx']:
        return 'doc'
    elif ext in ['jpg', 'jpeg', 'png', 'gif', 'webp']:
        return 'image'
    elif ext in ['mp4', 'mov', 'avi', 'mkv']:
        return 'video'
    else:
        return 'other'

def get_user_from_token(token: str) -> Optional[User]:
    """Helper to decode token and get user manually"""
    try:
        payload = jwt.decode(token, os.getenv("JWT_SECRET"), algorithms=["HS256"])
        email: str = payload.get("sub")
        if email is None:
            return None
        user = db.users.find_one({"email": email})
        if user is None:
            return None
        return User(**user)
    except Exception as e:
        print(f"Token validation error: {e}")
        return None

@router.get("/folders", response_model=List[dict])
async def get_folders(current_user: User = Depends(get_current_user)):
    """Get all folders (default + custom) for the current user's family"""
    try:
        # Get user's family
        family = db.families.find_one({"$or": [
            {"parent1_email": current_user.email},
            {"parent2_email": current_user.email}
        ]})
        
        if not family:
            # Return default folders with 0 counts if no family
            folders = []
            for default_folder in DEFAULT_FOLDERS:
                folders.append({
                    "id": default_folder["id"],
                    "name": default_folder["name"],
                    "description": default_folder["description"],
                    "icon": default_folder["icon"],
                    "color": default_folder["color"],
                    "bgColor": default_folder["bg_color"],
                    "documentTypes": default_folder["document_types"],
                    "count": 0,
                    "isCustom": False,
                    "isSpecial": default_folder.get("is_special", False)
                })
            return folders
        
        family_id = str(family["_id"])
        
        # Get custom folders from database
        custom_folders = list(db.document_folders.find({"family_id": family_id}))
        
        # Get document counts for each folder
        all_documents = list(db.documents.find({"family_id": family_id}))
        
        # Build folder list with counts
        folders = []
        
        # Add default folders
        for default_folder in DEFAULT_FOLDERS:
            folder_id = default_folder["id"]
            document_types = default_folder["document_types"]
            
            # Count documents in this folder
            if folder_id == "memories":
                count = sum(1 for doc in all_documents if doc.get("type") == "memories")
            else:
                count = sum(1 for doc in all_documents if doc.get("type") in document_types)
            
            folders.append({
                "id": folder_id,
                "name": default_folder["name"],
                "description": default_folder["description"],
                "icon": default_folder["icon"],
                "color": default_folder["color"],
                "bgColor": default_folder["bg_color"],
                "documentTypes": document_types,
                "count": count,
                "isCustom": False,
                "isSpecial": default_folder.get("is_special", False)
            })
        
        # Add custom folders
        for custom_folder in custom_folders:
            folder_id = custom_folder.get("id") or str(custom_folder.get("_id", ""))
            custom_category = custom_folder.get("custom_category", "")
            
            # Count documents in this custom folder
            count = sum(1 for doc in all_documents if doc.get("custom_category") == custom_category)
            
            folders.append({
                "id": folder_id,
                "name": custom_folder["name"],
                "description": custom_folder["description"],
                "icon": custom_folder["icon"],
                "color": custom_folder["color"],
                "bgColor": custom_folder["bg_color"],
                "documentTypes": ["custom"],
                "count": count,
                "isCustom": True,
                "customCategory": custom_category
            })
        
        return folders
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Get folders: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/folders", response_model=dict)
async def create_folder(
    folder_data: DocumentFolderCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a custom folder"""
    try:
        # Get user's family
        family = db.families.find_one({"$or": [
            {"parent1_email": current_user.email},
            {"parent2_email": current_user.email}
        ]})
        
        if not family:
            raise HTTPException(status_code=404, detail="Family not found")
        
        family_id = str(family["_id"])
        
        # Generate folder ID and custom category
        folder_id = folder_data.name.lower().replace(" ", "-").replace("&", "and")
        custom_category = folder_id
        
        # Check if folder with same name already exists
        existing = db.document_folders.find_one({
            "family_id": family_id,
            "name": folder_data.name
        })
        if existing:
            raise HTTPException(status_code=400, detail="Folder with this name already exists")
        
        folder_doc = {
            "id": folder_id,
            "family_id": family_id,
            "name": folder_data.name,
            "description": folder_data.description,
            "icon": folder_data.icon,
            "color": folder_data.color,
            "bg_color": folder_data.bg_color,
            "document_types": ["custom"],
            "is_custom": True,
            "custom_category": custom_category,
            "created_at": datetime.utcnow(),
            "created_by": current_user.email
        }
        
        db.document_folders.insert_one(folder_doc)
        
        return {
            "id": folder_id,
            "name": folder_data.name,
            "description": folder_data.description,
            "icon": folder_data.icon,
            "color": folder_data.color,
            "bgColor": folder_data.bg_color,
            "documentTypes": ["custom"],
            "count": 0,
            "isCustom": True,
            "customCategory": custom_category
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Create folder: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/folders/{folder_id}", response_model=dict)
async def update_folder(
    folder_id: str,
    folder_update: DocumentFolderUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update a custom folder"""
    try:
        # Get user's family
        family = db.families.find_one({"$or": [
            {"parent1_email": current_user.email},
            {"parent2_email": current_user.email}
        ]})
        
        if not family:
            raise HTTPException(status_code=404, detail="Family not found")
        
        family_id = str(family["_id"])
        
        # Find folder
        folder = db.document_folders.find_one({
            "family_id": family_id,
            "id": folder_id
        })
        
        if not folder:
            raise HTTPException(status_code=404, detail="Folder not found")
        
        # Update folder
        update_data = {"updated_at": datetime.utcnow()}
        if folder_update.name:
            update_data["name"] = folder_update.name
        if folder_update.description:
            update_data["description"] = folder_update.description
        if folder_update.icon:
            update_data["icon"] = folder_update.icon
        if folder_update.color:
            update_data["color"] = folder_update.color
        if folder_update.bg_color:
            update_data["bg_color"] = folder_update.bg_color
        
        db.document_folders.update_one(
            {"id": folder_id, "family_id": family_id},
            {"$set": update_data}
        )
        
        # Get updated folder
        updated_folder = db.document_folders.find_one({
            "id": folder_id,
            "family_id": family_id
        })
        
        # Count documents
        all_documents = list(db.documents.find({"family_id": family_id}))
        count = sum(1 for doc in all_documents if doc.get("custom_category") == updated_folder.get("custom_category", ""))
        
        return {
            "id": folder_id,
            "name": updated_folder["name"],
            "description": updated_folder["description"],
            "icon": updated_folder["icon"],
            "color": updated_folder["color"],
            "bgColor": updated_folder["bg_color"],
            "documentTypes": ["custom"],
            "count": count,
            "isCustom": True,
            "customCategory": updated_folder.get("custom_category", "")
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Update folder: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/folders/{folder_id}")
async def delete_folder(
    folder_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a custom folder"""
    try:
        # Get user's family
        family = db.families.find_one({"$or": [
            {"parent1_email": current_user.email},
            {"parent2_email": current_user.email}
        ]})
        
        if not family:
            raise HTTPException(status_code=404, detail="Family not found")
        
        family_id = str(family["_id"])
        
        # Find folder
        folder = db.document_folders.find_one({
            "family_id": family_id,
            "id": folder_id
        })
        
        if not folder:
            raise HTTPException(status_code=404, detail="Folder not found")
        
        # Check if folder has documents
        custom_category = folder.get("custom_category", "")
        documents_count = db.documents.count_documents({
            "family_id": family_id,
            "custom_category": custom_category
        })
        
        if documents_count > 0:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot delete folder with {documents_count} document(s). Please delete or move documents first."
            )
        
        # Delete folder
        db.document_folders.delete_one({
            "id": folder_id,
            "family_id": family_id
        })
        
        return {"message": "Folder deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Delete folder: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("", response_model=List[dict])
async def get_documents(
    folder_id: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user)
):
    """Get all documents for the current user's family, optionally filtered by folder"""
    try:
        # Get user's family
        family = db.families.find_one({"$or": [
            {"parent1_email": current_user.email},
            {"parent2_email": current_user.email}
        ]})
        
        if not family:
            return []
        
        family_id = str(family["_id"])
        
        # Build query
        query = {"family_id": family_id}
        
        if folder_id:
            # Check if it's a default folder or custom folder
            default_folder = next((f for f in DEFAULT_FOLDERS if f["id"] == folder_id), None)
            
            if default_folder:
                # Filter by document types
                query["type"] = {"$in": default_folder["document_types"]}
            else:
                # Custom folder - get custom category
                custom_folder = db.document_folders.find_one({
                    "family_id": family_id,
                    "id": folder_id
                })
                if custom_folder:
                    query["custom_category"] = custom_folder.get("custom_category", "")
                else:
                    raise HTTPException(status_code=404, detail="Folder not found")
        
        # Get documents
        documents = list(db.documents.find(query).sort("created_at", -1))
        
        result = []
        for doc in documents:
            result.append({
                "id": doc.get("id") or str(doc.get("_id", "")),
                "name": doc["name"],
                "type": doc["type"],
                "customCategory": doc.get("custom_category"),
                "uploadDate": doc.get("created_at").isoformat() if doc.get("created_at") else datetime.utcnow().isoformat(),
                "size": format_file_size(doc.get("file_size", 0)),
                "status": doc.get("status", "processed"),
                "tags": doc.get("tags", []),
                "description": doc.get("description"),
                "isProtected": doc.get("is_protected", False),
                "protectionReason": doc.get("protection_reason"),
                "fileType": doc.get("file_type", "other"),
                "fileUrl": doc.get("file_url"),
                "fileName": doc.get("file_name"),
            })
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Get documents: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upload", response_model=dict)
async def upload_document(
    document_data: DocumentUpload,
    current_user: User = Depends(get_current_user)
):
    """Upload a new document"""
    try:
        # Get user's family
        family = db.families.find_one({"$or": [
            {"parent1_email": current_user.email},
            {"parent2_email": current_user.email}
        ]})
        
        if not family:
            raise HTTPException(status_code=404, detail="Family not found")
        
        family_id = str(family["_id"])
        
        # Generate document ID
        document_id = str(uuid.uuid4())
        
        # Determine file type and size
        file_type = get_file_type(document_data.file_name)
        file_size = len(base64.b64decode(document_data.file_content))
        
        # Save file
        gridfs_id = save_document_file(
            document_data.file_content,
            document_data.file_name,
            document_id
        )
        
        if not gridfs_id:
            raise HTTPException(status_code=500, detail="Failed to save document file")
            
        file_url = f"/api/v1/documents/files/{gridfs_id}"
        
        # Determine folder and custom category
        folder_id = document_data.folder_id
        custom_category = None
        
        if folder_id:
            # Check if it's a custom folder
            custom_folder = db.document_folders.find_one({
                "family_id": family_id,
                "id": folder_id
            })
            if custom_folder:
                custom_category = custom_folder.get("custom_category", "")
                document_type = "custom"
            else:
                # Default folder - use provided type
                document_type = document_data.type
        else:
            document_type = document_data.type
        
        # Check if this is a protected document type
        is_protected = document_type in ["custody-agreement", "court-order"]
        protection_reason = None
        if is_protected:
            if document_type == "custody-agreement":
                protection_reason = "This is your official divorce contract and cannot be deleted. It serves as the legal foundation for your co-parenting arrangement."
            elif document_type == "court-order":
                protection_reason = "This is your official divorce decree and cannot be deleted. It contains critical legal information and court orders."
        
        # Create document document
        document_doc = {
            "id": document_id,
            "family_id": family_id,
            "folder_id": folder_id,
            "name": document_data.name,
            "type": document_type,
            "custom_category": custom_category,
            "file_url": file_url,
            "gridfs_id": gridfs_id,
            "file_name": document_data.file_name,
            "file_type": file_type,
            "file_size": file_size,
            "description": document_data.description,
            "tags": document_data.tags or [],
            "status": "processed",
            "is_protected": is_protected,
            "protection_reason": protection_reason,
            "uploaded_by": current_user.email,
            "children_ids": document_data.children_ids or [],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        db.documents.insert_one(document_doc)

        # If custody agreement, parse and create events
        if document_type == "custody-agreement":
            await create_custody_events(
                document_data.file_content,
                file_type,
                family,
                current_user
            )
        
        return {
            "id": document_id,
            "name": document_data.name,
            "type": document_type,
            "customCategory": custom_category,
            "uploadDate": document_doc["created_at"].isoformat(),
            "size": format_file_size(file_size),
            "status": "processed",
            "tags": document_data.tags or [],
            "description": document_data.description,
            "isProtected": is_protected,
            "protectionReason": protection_reason,
            "fileType": file_type,
            "fileUrl": file_url,
            "fileName": document_data.file_name,
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Upload document: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{document_id}")
async def delete_document(
    document_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a document"""
    try:
        # Get user's family
        family = db.families.find_one({"$or": [
            {"parent1_email": current_user.email},
            {"parent2_email": current_user.email}
        ]})
        
        if not family:
            raise HTTPException(status_code=404, detail="Family not found")
        
        family_id = str(family["_id"])
        
        # Find document
        document = db.documents.find_one({
            "family_id": family_id,
            "$or": [
                {"id": document_id},
                {"_id": ObjectId(document_id) if ObjectId.is_valid(document_id) else None}
            ]
        })
        
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        # Check if protected
        if document.get("is_protected", False):
            raise HTTPException(
                status_code=403,
                detail="This document is protected and cannot be deleted. " + 
                       (document.get("protection_reason", "") or "It contains critical legal information.")
            )
        
        # Delete file from GridFS
        gridfs_id = document.get("gridfs_id")
        if gridfs_id:
            try:
                fs.delete(ObjectId(gridfs_id))
            except Exception as e:
                print(f"Warning: Could not delete file from GridFS {gridfs_id}: {e}")
        
        # Delete document from database
        db.documents.delete_one({
            "$or": [
                {"id": document_id},
                {"_id": document.get("_id")}
            ]
        })
        
        return {"message": "Document deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Delete document: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/files/{file_id}")
async def get_document_file(
    file_id: str,
    token: Optional[str] = Query(None),
    authorization: Optional[str] = Header(None),
    download: bool = Query(False)
):
    """Serve document file from GridFS"""
    try:
        user = None
        
        # 1. Try query token (direct browser link)
        if token:
            user = get_user_from_token(token)
            
        # 2. Try Authorization header (API call)
        if not user and authorization:
            scheme, _, param = authorization.partition(" ")
            if scheme.lower() == "bearer":
                user = get_user_from_token(param)
        
        if not user:
            raise HTTPException(status_code=401, detail="Not authenticated")

        # Verify user has access to this document
        # Search by gridfs_id or file_url containing the ID
        document = db.documents.find_one({
            "$or": [
                {"gridfs_id": file_id},
                {"file_url": {"$regex": file_id}}
            ]
        })
        
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        # Get user's family to verify access
        family = db.families.find_one({"$or": [
            {"parent1_email": user.email},
            {"parent2_email": user.email}
        ]})
        
        if not family or str(family["_id"]) != document["family_id"]:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Get file from GridFS
        try:
            # If we don't have the gridfs_id directly (older records might be tricky, but we are fixing forward)
            # Use the file_id passed in, assuming it is the gridfs_id
            grid_out = fs.get(ObjectId(file_id))
            
            def iterfile():
                while True:
                    chunk = grid_out.read(1024 * 1024)  # Read 1MB chunks
                    if not chunk:
                        break
                    yield chunk

            # Determine disposition type based on file extension
            file_name = document.get('file_name', 'document')
            file_type = get_file_type(file_name)
            
            if download:
                disposition = "attachment"
            else:
                disposition = "inline" if file_type in ['pdf', 'image', 'video'] else "attachment"

            return StreamingResponse(
                iterfile(),
                media_type=grid_out.content_type,
                headers={"Content-Disposition": f"{disposition}; filename={file_name}"}
            )
        except Exception as e:
            print(f"GridFS Error: {e}")
            raise HTTPException(status_code=404, detail="File not found in storage")
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Get document file: {e}")

async def create_custody_events(
    file_content: str,
    file_type: str,
    family: dict,
    current_user: User
):
    """Parse custody agreement and create calendar events"""
    try:
        parser = DocumentParser()
        decoded_content = base64.b64decode(file_content)
        parsed_data = await parser.parse_document(decoded_content, file_type)

        if parsed_data and parsed_data.get("custodySchedule"):
            family_id = str(family["_id"])
            generate_custody_events(family_id, parsed_data)
        else:
            print("No custody schedule found in document")

    except Exception as e:
        print(f"Error creating custody events: {e}")
        # We don't re-raise the exception to avoid failing the whole upload
        # if calendar generation fails. This can be handled async later.

