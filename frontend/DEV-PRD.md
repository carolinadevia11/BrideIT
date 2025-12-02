# Bridge Co-Parenting Platform - Developer PRD

**Last Updated:** November 10, 2025  
**Stack:** React + TypeScript (Frontend) | Python FastAPI + MongoDB (Backend)

---

## Overview

Bridge is an AI-powered co-parenting coordinator that helps separated or divorced parents organize logistics, manage calendars, reduce emotional stress, and proactively solve conflicts. The platform uses Bridgette (AI assistant) to provide emotionally intelligent guidance throughout the user experience.

---

## Core Architecture

### Authentication
- Email + password authentication with JWT tokens
- OAuth2 Bearer token flow
- Secure password hashing (bcrypt)
- User roles: Parent 1, Parent 2, Lawyer, Child (read-only)

### Family Linking System
- Parent 1 creates family profile → generates unique 6-character Family Code
- Parent 2 uses Family Code to link their account
- Shared data model for both parents
- Each user maintains separate app instance with personalized views

### Data Models

**User:**
- firstName, lastName, email, password (hashed), role

**Family:**
- familyName, familyCode (6-char unique)
- parent1_email, parent2_email
- parent1_name, parent2_name
- children[], custodyAgreement, custodyArrangement
- createdAt, linkedAt

**Child:**
- name, dateOfBirth, grade, school
- allergies, medications, notes

**Custody Agreement:**
- fileName, uploadDate, parsedData (AI-extracted)
- custodySchedule, holidaySchedule, decisionMaking
- expenseSplit (ratio + percentages)

**Calendar Event:**
- date, type (custody/holiday/school/medical/activity)
- title, parent (mom/dad/both), isSwappable

**Change Request:**
- event_id, requestedBy_email, status (pending/approved/rejected)
- requestedDate, reason, createdAt

---

## MVP Feature Set

### 1. Smart Custody Calendar (HIGH PRIORITY)

**User Stories:**
- View shared monthly calendar with color-coded events
- See custody days, holidays, school events, medical appointments
- Propose schedule swaps with consequences preview
- Receive automatic conflict detection
- Export court-ready calendar PDF

**Technical Requirements:**
- Real-time sync between both parents
- Event types: custody, holiday, school, medical, activity
- Color coding by category
- Swap request workflow with approval system
- Email documentation generation on approval
- Bridgette provides alternative suggestions on rejection

**API Endpoints:**
```
GET /api/v1/calendar/events?year={year}&month={month}
POST /api/v1/calendar/events
PUT /api/v1/calendar/events/{event_id}
DELETE /api/v1/calendar/events/{event_id}
POST /api/v1/calendar/change-request
PUT /api/v1/calendar/change-request/{request_id}
GET /api/v1/calendar/change-requests
```

**Frontend Components:**
- `CalendarView.tsx` (implemented)
- Monthly grid with event display
- Change request dialog
- Consequences preview
- Email preview/download

---

### 2. Secure Messaging System (HIGH PRIORITY)

**User Stories:**
- Send messages organized by topic/category
- Select tone before sending (friendly, matter-of-fact, neutral-legal)
- Bridgette suggests message improvements
- View immutable message logs
- Export conversations for court

**Technical Requirements:**
- Structured conversations by subject + category
- Categories: custody, medical, school, activities, financial, general, urgent
- Tone selection: friendly, matter-of-fact, neutral-legal
- Message status: sent, delivered, read
- Immutable logging with timestamps
- Search and filter functionality

**API Endpoints:**
```
GET /api/v1/messages/conversations
POST /api/v1/messages/conversations
GET /api/v1/messages/{conversation_id}
POST /api/v1/messages/{conversation_id}/send
GET /api/v1/messages/export/{conversation_id}
```

**Frontend Components:**
- `MessagingInterface.tsx` (implemented)
- Conversation sidebar with search/filter
- Message thread view
- Tone selector
- Bridgette message assistance

---

### 3. Expense Tracking & Management (MEDIUM PRIORITY)

**User Stories:**
- Log child-related expenses with receipts
- Automatic split calculation based on custody agreement
- Approve/dispute expenses
- Track pending reimbursements
- Generate financial reports

**Technical Requirements:**
- Expense categories: medical, education, activities, clothing, other
- Receipt photo upload and storage
- Split ratios from custody agreement
- Status tracking: pending, approved, disputed, paid
- Running balance calculations
- Monthly summary reports

**API Endpoints:**
```
GET /api/v1/expenses
POST /api/v1/expenses
PUT /api/v1/expenses/{expense_id}
DELETE /api/v1/expenses/{expense_id}
POST /api/v1/expenses/{expense_id}/receipt
GET /api/v1/expenses/summary?month={month}&year={year}
POST /api/v1/expenses/{expense_id}/dispute
```

**Frontend Components:**
- `ExpenseTracker.tsx` (implemented)
- Summary cards with totals
- Expense list with status badges
- Receipt upload
- Dispute workflow

---

### 4. Bridgette AI Assistant (HIGH PRIORITY)

**Personality:**
- Neutral, helpful, empathetic
- Appears as justice symbol avatar (balanced scales)
- Provides contextual guidance without judgment
- Focuses on children's best interests

**Expressions:**
- happy, thinking, encouraging, celebrating, waving, balanced

**Functionality:**
- Onboarding guidance
- Contextual tips throughout app
- Schedule conflict alternatives
- Message tone suggestions
- Emotional check-ins
- Educational content recommendations

**Integration Points:**
- Every page header (contextual messages)
- Onboarding flow
- Calendar change request rejection → alternative solutions
- Message composition
- Document parsing results

**Frontend Components:**
- `BridgetteAvatar.tsx` (implemented)
- `AnimatedBridgette.tsx` (implemented)
- Context-aware message system

---

### 5. Document Management & Audit Logs (MEDIUM PRIORITY)

**User Stories:**
- Upload custody agreement (PDF/DOC)
- AI parses key terms automatically
- Manual entry fallback for contract details
- View audit trail of all platform actions
- Export court-ready documentation

**Technical Requirements:**
- File upload (PDF, DOC, TXT)
- AI parsing using GPT-4/Claude (currently simulated)
- Extract: custody schedule, holiday schedule, decision-making, expense split
- Immutable audit logging for all actions
- PDF export with legal formatting
- Timestamp and signature tracking

**API Endpoints:**
```
POST /api/v1/family/contract (implemented)
GET /api/v1/family/contract (implemented)
GET /api/v1/audit-logs
GET /api/v1/audit-logs/export
```

**Frontend Components:**
- `ContractUpload.tsx` (implemented)
- `DocumentManager.tsx` (implemented)
- AI parsing results display
- Audit log viewer
- Export functionality

---

## Onboarding Flow

### Steps (All Implemented):
1. **Welcome** - Introduce Bridge and Bridgette
2. **Account Creation**
   - Parent 1: Create family → Get Family Code
   - Parent 2: Enter Family Code → Link account
3. **Family Setup**
   - Add children (names, birthdates, details)
   - Set notification preferences
   - Choose communication tone defaults
4. **Contract Upload**
   - Upload custody agreement OR manual entry
   - Review AI-parsed terms
   - Confirm legal consent
5. **Calendar Creation**
   - AI builds initial calendar from agreement
   - Review and adjust events
6. **Financial Setup**
   - Confirm expense split ratio
   - Optional payment method linking
7. **Tour Complete**
   - Dashboard walkthrough
   - Feature highlights
   - Bridgette introduction complete

**Components:**
- `OnboardingFlow.tsx` (implemented)
- `FamilyChoice.tsx` (implemented)
- `FamilyCodeSetup.tsx` (implemented)
- `FamilyOnboarding.tsx` (implemented)
- `ChildManagement.tsx` (implemented)
- `ContractUpload.tsx` (implemented)

---

## Design System

### Colors
- **bridge-blue**: #3b82f6 (primary)
- **bridge-green**: #10b981 (success, balanced)
- **bridge-yellow**: #f59e0b (warning)
- **bridge-red**: #ef4444 (urgent, disputed)
- **bridge-black**: #1f2937 (text)

### Event Type Colors:
- Custody: blue-100
- Holiday: red-100
- School: green-100
- Medical: purple-100
- Activity: orange-100

### Status Colors:
- Pending: yellow-100
- Approved: green-100
- Disputed: red (bridge-red)
- Paid: blue-100

### Typography
- Font: System UI (Inter fallback)
- Headings: Bold, 2xl-4xl
- Body: Regular, sm-base
- Calming, low cognitive load

---

## User Experience Principles

### Emotional Intelligence
- Calming color palette
- Empathetic microcopy
- Gentle nudges, not demands
- Conflict prevention over resolution

### Fairness & Balance
- Both parents have equal access
- Transparent decision logging
- No parent is "primary" in system hierarchy
- Visual balance in all interfaces

### Child-First
- Every feature asks: "Is this in the child's best interest?"
- Reduce parent conflict exposure
- Stability and routine prioritization

### Progressive Disclosure
- Features introduced step-by-step
- Optional advanced features
- Clear action paths
- Minimized decision fatigue

---

## Non-Functional Requirements

### Security
- SOC2-compliant infrastructure
- End-to-end encryption for messages
- Encrypted file storage
- Immutable audit logging
- GDPR/CCPA compliance

### Performance
- Calendar loads < 1 second
- Real-time sync within 2 seconds
- Mobile-first responsive design
- Offline capability for core features

### Accessibility
- WCAG 2.1 AA compliance
- Screen reader support
- Keyboard navigation
- High contrast mode

### Legal Compliance
- Court-admissible documentation
- Tamper-proof audit trails
- Timestamped immutable records
- Digital signature support

---

## API Design Standards

### Authentication
All protected endpoints require Bearer token:
```
Authorization: Bearer {jwt_token}
```

### Response Format
```json
{
  "success": true,
  "data": {},
  "message": "Operation successful",
  "timestamp": "2025-11-10T12:00:00Z"
}
```

### Error Format
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": []
  },
  "timestamp": "2025-11-10T12:00:00Z"
}
```

---

## Testing Requirements

### Unit Tests
- All utility functions
- Data validation
- Business logic

### Integration Tests
- API endpoint functionality
- Database operations
- Authentication flow

### E2E Tests
- Complete user flows
- Onboarding → Calendar → Messaging
- Family linking workflow
- Expense approval workflow

---

## Future Enhancements (Post-MVP)

### Phase 2:
- Push notifications (SMS, email, in-app)
- Video call scheduling
- Professional directory (lawyers, therapists)
- Educational content library
- Payment integration (Venmo, Zelle, Plaid)

### Phase 3:
- Mobile apps (iOS, Android)
- Advanced AI features (conflict prediction, recommendation engine)
- Mediator/lawyer portal access
- Child portal (age-appropriate read-only view)
- Multi-language support

---

## Development Notes

### Current Stack:
- **Frontend:** React 18 + TypeScript + Vite + TailwindCSS + shadcn/ui
- **Backend:** Python 3.11 + FastAPI + MongoDB + JWT
- **AI (Simulated):** Placeholder for GPT-4/Claude integration

### Environment Variables:
```bash
# Backend
JWT_SECRET=your-secret-key
MONGODB_URI=mongodb://localhost:27017/bridge
DATABASE_NAME=bridge

# Frontend
VITE_API_URL=http://localhost:8000
```

### Running Locally:
```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload

# Frontend
cd frontend
pnpm install
pnpm dev
```

---

## Key Decisions & Constraints

1. **No real-time chat** - Messages are asynchronous to reduce conflict escalation
2. **Mandatory Family Code** - Ensures both parents explicitly agree to use platform
3. **Immutable logs** - All actions are permanent for legal compliance
4. **Tone selection** - Forces users to think about communication style
5. **Children best interest** - Default state for all conflict resolution suggestions

---

## Glossary

- **Family Code**: Unique 6-character code for linking parent accounts
- **Bridgette**: AI assistant persona (justice/balance symbol)
- **Custody Event**: Calendar event representing parenting time
- **Swappable Event**: Event that can be exchanged with another date
- **Change Request**: Formal request to modify calendar
- **Tone**: Communication style for messages (friendly/matter-of-fact/legal)
- **Audit Trail**: Immutable log of all platform actions
- **Court-Ready**: Formatted for legal proceedings

---

**End of Developer PRD**






