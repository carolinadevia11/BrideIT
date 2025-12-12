from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime

class User(BaseModel):
    firstName: str
    lastName: str
    email: str
    password: str
    role: str = "user"
    phone: Optional[str] = None
    timezone: Optional[str] = None
    tourCompleted: Optional[bool] = False

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
    fileType: Optional[str] = None  # File extension (pdf, docx, etc.)
    fileContent: Optional[str] = None  # Base64 encoded file content for download
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
    parent1: Optional[dict] = None
    parent2: Optional[dict] = None
    children: List[Child] = []
    custodyArrangement: Optional[str] = None
    custodyAgreement: Optional[CustodyAgreement] = None
    createdAt: Optional[datetime] = None
    linkedAt: Optional[datetime] = None  # When parent2 joined

class FamilyCreate(BaseModel):
    familyName: str
    parent1_name: str
    parent2_name: Optional[str] = None
    parent2_email: Optional[str] = None
    custodyArrangement: Optional[str] = None

class FamilyLink(BaseModel):
    familyCode: str
    parent2_name: str

class FamilyUpdate(BaseModel):
    familyName: Optional[str] = None
    parent1_name: Optional[str] = None
    parent2_name: Optional[str] = None
    parent1_email: Optional[str] = None
    parent2_email: Optional[str] = None
    # Additional fields for detailed profile
    parent1: Optional[dict] = None
    parent2: Optional[dict] = None
    children: Optional[List[Child]] = None
    custodyArrangement: Optional[str] = None
    custodyNotes: Optional[str] = None
    specialAccommodations: Optional[List[str]] = None
    geographicalDistance: Optional[float] = None
    differentTimezones: Optional[bool] = None
    onboardingCompleted: Optional[bool] = None

class ContractUpload(BaseModel):
    fileName: str
    fileContent: str  # Base64 encoded file content
    fileType: str  # pdf, doc, txt, etc.

class CustodyManualData(BaseModel):
    custodySchedule: str
    holidaySchedule: Optional[str] = None
    decisionMaking: Optional[str] = None
    expenseSplitRatio: Optional[str] = "50-50"
    expenseParent1: Optional[float] = 50.0
    expenseParent2: Optional[float] = 50.0

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
    createdBy_email: Optional[str] = None

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
    reason: Optional[str] = None
    createdAt: datetime
    updatedAt: Optional[datetime] = None
    resolvedBy_email: Optional[str] = None
    requestType: str  # swap, modify, cancel
    eventTitle: str
    eventType: str
    eventParent: Optional[str] = None
    eventDate: datetime
    newDate: Optional[datetime] = None
    swapEventId: Optional[str] = None
    swapEventTitle: Optional[str] = None
    swapEventDate: Optional[datetime] = None

class ChangeRequestCreate(BaseModel):
    event_id: str
    requestType: str
    newDate: Optional[datetime] = None
    swapEventId: Optional[str] = None
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
    gridfs_id: Optional[str] = None
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

# Document Models
class DocumentFolder(BaseModel):
    id: Optional[str] = None
    family_id: str
    name: str
    description: str
    icon: str  # Icon name (e.g., 'Folder', 'Star', 'Heart')
    color: str  # Color name (e.g., 'blue', 'purple')
    bg_color: str  # Background color class
    document_types: List[str]  # Types of documents this folder contains
    is_custom: bool = False
    custom_category: Optional[str] = None
    created_at: Optional[datetime] = None
    created_by: Optional[str] = None  # Email of user who created it

class DocumentFolderCreate(BaseModel):
    name: str
    description: str
    icon: str
    color: str
    bg_color: str

class DocumentFolderUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    bg_color: Optional[str] = None

class Document(BaseModel):
    id: Optional[str] = None
    family_id: str
    folder_id: Optional[str] = None  # ID of folder (for custom folders)
    name: str
    type: str  # 'custody-agreement', 'court-order', 'medical', 'school', 'financial', 'emergency', 'memories', 'custom', 'other'
    custom_category: Optional[str] = None  # For custom folder documents
    file_url: str
    gridfs_id: Optional[str] = None
    file_name: str
    file_type: str  # 'pdf', 'doc', 'image', 'video', 'other'
    file_size: int  # Size in bytes
    description: Optional[str] = None
    tags: List[str] = []
    status: str = 'processed'  # 'processed', 'processing', 'needs-review'
    is_protected: bool = False
    protection_reason: Optional[str] = None
    uploaded_by: str  # Email of user who uploaded
    children_ids: Optional[List[str]] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class DocumentUpload(BaseModel):
    folder_id: Optional[str] = None
    name: str
    type: str
    description: Optional[str] = None
    tags: Optional[List[str]] = None
    file_content: str  # Base64 encoded file
    file_name: str
    children_ids: Optional[List[str]] = None

class PasswordResetRequest(BaseModel):
    email: str

class PasswordReset(BaseModel):
    token: str
    new_password: str