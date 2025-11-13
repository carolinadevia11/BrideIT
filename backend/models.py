from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime

class User(BaseModel):
    firstName: str
    lastName: str
    email: str
    password: str
    role: str = "user"

class Child(BaseModel):
    id: Optional[str] = None
    name: str
    dateOfBirth: date
    grade: Optional[str] = None
    school: Optional[str] = None
    allergies: Optional[str] = None
    medications: Optional[str] = None
    notes: Optional[str] = None

class CustodyAgreement(BaseModel):
    uploadDate: Optional[datetime] = None
    fileName: Optional[str] = None
    parsedData: Optional[dict] = None  # AI-parsed key terms
    custodySchedule: Optional[str] = None
    holidaySchedule: Optional[str] = None
    decisionMaking: Optional[str] = None
    expenseSplit: Optional[dict] = None  # e.g., {"ratio": "50-50", "parent1": 50, "parent2": 50}

class Family(BaseModel):
    id: Optional[str] = None
    familyName: str
    familyCode: Optional[str] = None  # Unique 6-digit code for partner linking
    parent1_email: str  # Reference to user email
    parent2_email: Optional[str] = None  # Reference to user email
    parent1_name: Optional[str] = None
    parent2_name: Optional[str] = None
    children: List[Child] = []
    custodyArrangement: Optional[str] = None
    custodyAgreement: Optional[CustodyAgreement] = None
    createdAt: Optional[datetime] = None
    linkedAt: Optional[datetime] = None  # When parent2 joined

class FamilyCreate(BaseModel):
    familyName: str
    parent1_name: str
    parent2_email: Optional[str] = None
    custodyArrangement: Optional[str] = None

class FamilyLink(BaseModel):
    familyCode: str
    parent2_name: str

class ContractUpload(BaseModel):
    fileName: str
    fileContent: str  # Base64 encoded file content
    fileType: str  # pdf, doc, txt, etc.

class ChildCreate(BaseModel):
    name: str
    dateOfBirth: date
    grade: Optional[str] = None
    school: Optional[str] = None
    allergies: Optional[str] = None
    medications: Optional[str] = None
    notes: Optional[str] = None

class ChildUpdate(BaseModel):
    name: Optional[str] = None
    dateOfBirth: Optional[date] = None
    grade: Optional[str] = None
    school: Optional[str] = None
    allergies: Optional[str] = None
    medications: Optional[str] = None
    notes: Optional[str] = None

class Event(BaseModel):
    id: Optional[str] = None
    family_id: str
    date: datetime
    type: str
    title: str
    parent: Optional[str] = None
    isSwappable: Optional[bool] = False

class EventCreate(BaseModel):
    date: datetime
    type: str
    title: str
    parent: Optional[str] = None
    isSwappable: Optional[bool] = False

class ChangeRequest(BaseModel):
    id: Optional[str] = None
    event_id: str
    requestedBy_email: str  # Email of the user who requested the change
    status: str = "pending"  # pending, approved, rejected
    requestedDate: Optional[datetime] = None  # New date if requesting a date change
    reason: Optional[str] = None
    createdAt: datetime

class ChangeRequestCreate(BaseModel):
    event_id: str
    requestedDate: Optional[datetime] = None
    reason: Optional[str] = None

class ChangeRequestUpdate(BaseModel):
    status: str  # approved or rejected

# Messaging Models
class Message(BaseModel):
    id: Optional[str] = None
    conversation_id: str
    sender_email: str
    content: str
    tone: str  # 'matter-of-fact', 'friendly', 'neutral-legal'
    timestamp: Optional[datetime] = None
    status: str = 'sent'  # sent, delivered, read

class MessageCreate(BaseModel):
    conversation_id: str
    content: str
    tone: str = 'friendly'

class Conversation(BaseModel):
    id: Optional[str] = None
    family_id: str
    subject: str
    category: str  # 'custody', 'medical', 'school', 'activities', 'financial', 'general', 'urgent'
    participants: List[str]  # List of user emails
    created_at: Optional[datetime] = None
    last_message_at: Optional[datetime] = None
    is_archived: bool = False

class ConversationCreate(BaseModel):
    subject: str
    category: str = 'general'

# Expense Models
class Expense(BaseModel):
    id: Optional[str] = None
    family_id: str
    description: str
    amount: float
    category: str  # 'medical', 'education', 'activities', 'clothing', 'other'
    date: date
    paid_by_email: str  # Email of parent who paid
    status: str = 'pending'  # 'pending', 'approved', 'disputed', 'paid'
    split_ratio: dict  # e.g., {"parent1": 50, "parent2": 50}
    receipt_url: Optional[str] = None
    receipt_file_name: Optional[str] = None
    children_ids: Optional[List[str]] = None  # Which children this expense is for
    dispute_reason: Optional[str] = None
    dispute_created_at: Optional[datetime] = None
    dispute_created_by: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class ExpenseCreate(BaseModel):
    description: str
    amount: float
    category: str
    date: date
    receipt_file_name: Optional[str] = None
    receipt_content: Optional[str] = None  # Base64 encoded
    children_ids: Optional[List[str]] = None

class ExpenseUpdate(BaseModel):
    status: Optional[str] = None  # 'approved', 'disputed', 'paid'
    dispute_reason: Optional[str] = None