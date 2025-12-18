from fastapi import APIRouter, Depends, HTTPException, status, Response
from fastapi.responses import StreamingResponse
from typing import List
from datetime import datetime, date
from bson import ObjectId
import uuid
import base64
import os
import io
from pathlib import Path

from models import Expense, ExpenseCreate, ExpenseUpdate, User
from routers.auth import get_current_user
from database import db, fs
from websocket import manager

router = APIRouter(prefix="/api/v1/expenses", tags=["expenses"])

def get_family_expense_split(family: dict) -> dict:
    """Get expense split ratio from family's custody agreement"""
    if family.get("custodyAgreement") and family["custodyAgreement"].get("expenseSplit"):
        expense_split = family["custodyAgreement"]["expenseSplit"]
        return {
            "parent1": expense_split.get("parent1", 50),
            "parent2": expense_split.get("parent2", 50)
        }
    # Default to 50-50 if no agreement
    return {"parent1": 50, "parent2": 50}

def save_receipt(receipt_content: str, receipt_file_name: str, expense_id: str) -> str:
    """Save receipt file to GridFS and return file ID"""
    try:
        decoded_content = base64.b64decode(receipt_content)
        # Determine content type
        ext = receipt_file_name.split('.')[-1].lower() if '.' in receipt_file_name else ''
        content_type = "application/octet-stream"
        if ext in ['jpg', 'jpeg']: content_type = 'image/jpeg'
        elif ext in ['png']: content_type = 'image/png'
        elif ext in ['pdf']: content_type = 'application/pdf'
        elif ext in ['gif']: content_type = 'image/gif'
        
        file_id = fs.put(
            decoded_content,
            filename=receipt_file_name,
            content_type=content_type,
            metadata={"expense_id": expense_id, "type": "receipt"}
        )
        return str(file_id)
    except Exception as e:
        print(f"Error saving receipt to GridFS: {e}")
        return ""

@router.get("", response_model=List[dict])
async def get_expenses(current_user: User = Depends(get_current_user)):
    """Get all expenses for the current user's family"""
    try:
        # Get user's family
        family = db.families.find_one({"$or": [
            {"parent1_email": current_user.email},
            {"parent2_email": current_user.email}
        ]})
        
        if not family:
            return []
        
        family_id = str(family["_id"])
        
        # Get all expenses for this family
        expenses = list(db.expenses.find({"family_id": family_id}).sort("date", -1))
        
        result = []
        for exp in expenses:
            # Normalize receipt URL to use API endpoint
            receipt_url = exp.get("receipt_url")
            if receipt_url and receipt_url.startswith("/receipts/"):
                # Convert old format to new API endpoint format
                receipt_filename = receipt_url.replace("/receipts/", "")
                receipt_url = f"/api/v1/expenses/receipts/{receipt_filename}"
            
            # Use the stored 'id' field (UUID) if available, otherwise fall back to _id
            expense_id = exp.get("id") or str(exp.get("_id", ""))
            
            result.append({
                "id": expense_id,
                "description": exp["description"],
                "amount": exp["amount"],
                "category": exp["category"],
                "date": exp["date"].isoformat() if isinstance(exp["date"], date) else exp["date"],
                "paidBy": exp["paid_by_email"],
                "status": exp["status"],
                "splitRatio": exp["split_ratio"],
                "receiptUrl": receipt_url,
                "receiptFileName": exp.get("receipt_file_name"),
                "childrenIds": exp.get("children_ids", []),
                "disputeReason": exp.get("dispute_reason"),
                "disputeCreatedAt": exp.get("dispute_created_at").isoformat() if exp.get("dispute_created_at") else None,
                "disputeCreatedBy": exp.get("dispute_created_by"),
                "createdAt": exp.get("created_at").isoformat() if exp.get("created_at") else None,
            })
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Get expenses: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("", response_model=dict)
async def create_expense(
    expense_data: ExpenseCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a new expense"""
    try:
        # Get user's family
        family = db.families.find_one({"$or": [
            {"parent1_email": current_user.email},
            {"parent2_email": current_user.email}
        ]})
        
        if not family:
            raise HTTPException(status_code=404, detail="Family not found")
        
        family_id = str(family["_id"])
        
        # Get expense split ratio from custody agreement
        split_ratio = get_family_expense_split(family)
        
        # Create expense document
        expense_id = str(uuid.uuid4())
        receipt_url = None
        
        # Save receipt if provided
        gridfs_id = None
        if expense_data.receipt_content and expense_data.receipt_file_name:
            gridfs_id = save_receipt(
                expense_data.receipt_content,
                expense_data.receipt_file_name,
                expense_id
            )
            if gridfs_id:
                receipt_url = f"/api/v1/expenses/receipts/{gridfs_id}"
        
        # Convert date to string for MongoDB compatibility
        date_str = expense_data.date.isoformat() if isinstance(expense_data.date, date) else str(expense_data.date)
        
        expense_doc = {
            "id": expense_id,
            "family_id": family_id,
            "description": expense_data.description,
            "amount": expense_data.amount,
            "category": expense_data.category,
            "date": date_str,
            "paid_by_email": current_user.email,
            "status": "pending",
            "split_ratio": split_ratio,
            "receipt_url": receipt_url,
            "gridfs_id": gridfs_id,
            "receipt_file_name": expense_data.receipt_file_name,
            "children_ids": expense_data.children_ids or [],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        db.expenses.insert_one(expense_doc)

        # Notify family members
        participants = [family["parent1_email"]]
        if family.get("parent2_email"):
            participants.append(family["parent2_email"])
        
        for email in participants:
            if email:
                await manager.send_personal_message({
                    "type": "refresh_expenses",
                    "action": "create",
                    "expense_id": expense_id
                }, email)
                await manager.send_personal_message({
                    "type": "refresh_activities",
                }, email)
        
        return {
            "id": expense_id,
            "description": expense_data.description,
            "amount": expense_data.amount,
            "category": expense_data.category,
            "date": expense_data.date.isoformat(),
            "paidBy": current_user.email,
            "status": "pending",
            "splitRatio": split_ratio,
            "receiptUrl": receipt_url,
            "receiptFileName": expense_data.receipt_file_name,
            "childrenIds": expense_data.children_ids or [],
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Create expense: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{expense_id}", response_model=dict)
async def update_expense(
    expense_id: str,
    expense_update: ExpenseUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update an expense (approve, dispute, or mark as paid)"""
    try:
        # Verify user has access to this expense - try both 'id' and '_id' fields
        expense = db.expenses.find_one({"id": expense_id})
        if not expense:
            # Try MongoDB ObjectId format
            try:
                from bson import ObjectId
                expense = db.expenses.find_one({"_id": ObjectId(expense_id)})
            except:
                pass
        
        if not expense:
            raise HTTPException(status_code=404, detail="Expense not found")
        
        # Get user's family to verify access
        family = db.families.find_one({"$or": [
            {"parent1_email": current_user.email},
            {"parent2_email": current_user.email}
        ]})
        
        if not family or str(family["_id"]) != expense["family_id"]:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Update expense
        update_data = {"updated_at": datetime.utcnow()}
        
        if expense_update.status:
            update_data["status"] = expense_update.status
            
            # When approving, set split to 50/50 regardless of custody agreement
            if expense_update.status == "approved":
                update_data["split_ratio"] = {"parent1": 50, "parent2": 50}
            
            # If disputing, add dispute info
            if expense_update.status == "disputed":
                update_data["dispute_reason"] = expense_update.dispute_reason
                update_data["dispute_created_at"] = datetime.utcnow()
                update_data["dispute_created_by"] = current_user.email
        
        # Update using the field we found it with
        if "id" in expense and expense["id"] == expense_id:
            db.expenses.update_one(
                {"id": expense_id},
                {"$set": update_data}
            )
        else:
            db.expenses.update_one(
                {"_id": expense.get("_id")},
                {"$set": update_data}
            )

        # Notify family members
        participants = [family["parent1_email"]]
        if family.get("parent2_email"):
            participants.append(family["parent2_email"])
        
        for email in participants:
            if email:
                await manager.send_personal_message({
                    "type": "refresh_expenses",
                    "action": "update",
                    "expense_id": expense_id
                }, email)
                await manager.send_personal_message({
                    "type": "refresh_activities",
                }, email)
        
        # Get updated expense using the same lookup logic
        updated_expense = db.expenses.find_one({"id": expense_id})
        if not updated_expense:
            try:
                from bson import ObjectId
                updated_expense = db.expenses.find_one({"_id": ObjectId(expense_id)})
            except:
                pass
        
        # Normalize receipt URL to use API endpoint
        receipt_url = updated_expense.get("receipt_url")
        if receipt_url and receipt_url.startswith("/receipts/"):
            receipt_filename = receipt_url.replace("/receipts/", "")
            receipt_url = f"/api/v1/expenses/receipts/{receipt_filename}"
        
        return {
            "id": expense_id,
            "description": updated_expense["description"],
            "amount": updated_expense["amount"],
            "category": updated_expense["category"],
            "date": updated_expense["date"].isoformat() if isinstance(updated_expense["date"], date) else updated_expense["date"],
            "paidBy": updated_expense["paid_by_email"],
            "status": updated_expense["status"],
            "splitRatio": updated_expense["split_ratio"],
            "receiptUrl": receipt_url,
            "receiptFileName": updated_expense.get("receipt_file_name"),
            "childrenIds": updated_expense.get("children_ids", []),
            "disputeReason": updated_expense.get("dispute_reason"),
            "disputeCreatedAt": updated_expense.get("dispute_created_at").isoformat() if updated_expense.get("dispute_created_at") else None,
            "disputeCreatedBy": updated_expense.get("dispute_created_by"),
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Update expense: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{expense_id}")
async def delete_expense(
    expense_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete an expense (only if pending)"""
    try:
        # Try to find by 'id' field first, then by '_id'
        expense = db.expenses.find_one({"id": expense_id})
        if not expense:
            # Try MongoDB ObjectId format
            try:
                from bson import ObjectId
                expense = db.expenses.find_one({"_id": ObjectId(expense_id)})
            except:
                pass
        
        if not expense:
            raise HTTPException(status_code=404, detail="Expense not found")
        
        # Only allow deletion if expense is pending and user is the one who created it
        if expense["status"] != "pending":
            raise HTTPException(status_code=400, detail="Can only delete pending expenses")
        
        if expense["paid_by_email"] != current_user.email:
            raise HTTPException(status_code=403, detail="Can only delete your own expenses")
        
        # Delete receipt from GridFS if it exists
        gridfs_id = expense.get("gridfs_id")
        if gridfs_id:
            try:
                fs.delete(ObjectId(gridfs_id))
            except Exception as e:
                print(f"Warning: Could not delete receipt from GridFS {gridfs_id}: {e}")

        # Delete using the field we found it with
        if "id" in expense and expense["id"] == expense_id:
            db.expenses.delete_one({"id": expense_id})
        else:
            db.expenses.delete_one({"_id": expense.get("_id")})

        # Notify family members
        participants = [family["parent1_email"]]
        if family.get("parent2_email"):
            participants.append(family["parent2_email"])
        
        for email in participants:
            if email:
                await manager.send_personal_message({
                    "type": "refresh_expenses",
                    "action": "delete",
                    "expense_id": expense_id
                }, email)
                await manager.send_personal_message({
                    "type": "refresh_activities",
                }, email)
        
        return {"message": "Expense deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Delete expense: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/summary", response_model=dict)
async def get_expense_summary(current_user: User = Depends(get_current_user)):
    """Get expense summary statistics"""
    try:
        # Get user's family
        family = db.families.find_one({"$or": [
            {"parent1_email": current_user.email},
            {"parent2_email": current_user.email}
        ]})
        
        if not family:
            return {
                "totalAmount": 0,
                "userOwes": 0,
                "userOwed": 0,
                "pendingCount": 0,
                "disputedCount": 0,
                "approvedCount": 0,
                "paidCount": 0,
            }
        
        family_id = str(family["_id"])
        
        # Get all expenses
        expenses = list(db.expenses.find({"family_id": family_id}))
        
        # Calculate totals
        total_amount = sum(exp["amount"] for exp in expenses)
        
        # Calculate what current user owes and is owed
        user_owes = 0
        user_owed = 0
        
        user_is_parent1 = family["parent1_email"] == current_user.email
        
        for exp in expenses:
            if exp["status"] == "approved":
                # Use the expense's split_ratio (which is 50/50 for approved expenses)
                expense_split = exp.get("split_ratio", {"parent1": 50, "parent2": 50})
                user_ratio = expense_split["parent1"] if user_is_parent1 else expense_split["parent2"]
                partner_ratio = expense_split["parent2"] if user_is_parent1 else expense_split["parent1"]
                
                if exp["paid_by_email"] == current_user.email:
                    # User paid, partner owes
                    user_owed += (exp["amount"] * partner_ratio) / 100
                else:
                    # Partner paid, user owes
                    user_owes += (exp["amount"] * user_ratio) / 100
        
        # Count by status
        pending_count = sum(1 for exp in expenses if exp["status"] == "pending")
        disputed_count = sum(1 for exp in expenses if exp["status"] == "disputed")
        approved_count = sum(1 for exp in expenses if exp["status"] == "approved")
        paid_count = sum(1 for exp in expenses if exp["status"] == "paid")
        
        return {
            "totalAmount": total_amount,
            "userOwes": user_owes,
            "userOwed": user_owed,
            "pendingCount": pending_count,
            "disputedCount": disputed_count,
            "approvedCount": approved_count,
            "paidCount": paid_count,
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Get expense summary: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/receipts/{file_id}")
async def get_receipt(
    file_id: str,
    current_user: User = Depends(get_current_user)
):
    """Serve receipt file from GridFS"""
    try:
        # Verify user has access to this expense
        # Search by gridfs_id or receipt_url containing the ID
        expense = db.expenses.find_one({
            "$or": [
                {"gridfs_id": file_id},
                {"receipt_url": {"$regex": file_id}}
            ]
        })
        
        if not expense:
            # Fallback for legacy files - try parsing ID from filename if it looks like one
            # But with GridFS IDs this is less likely to collide.
            # We'll rely on the DB lookup above.
            raise HTTPException(status_code=404, detail="Receipt not found")
        
        # Get user's family to verify access
        family = db.families.find_one({"$or": [
            {"parent1_email": current_user.email},
            {"parent2_email": current_user.email}
        ]})
        
        if not family or str(family["_id"]) != expense["family_id"]:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Get file from GridFS
        try:
            grid_out = fs.get(ObjectId(file_id))
            
            return StreamingResponse(
                io.BytesIO(grid_out.read()),
                media_type=grid_out.content_type,
                headers={"Content-Disposition": f"attachment; filename={expense.get('receipt_file_name', 'receipt')}"}
            )
        except Exception as e:
            print(f"GridFS Error: {e}")
            raise HTTPException(status_code=404, detail="File not found in storage")
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Get receipt: {e}")
        raise HTTPException(status_code=500, detail=str(e))

