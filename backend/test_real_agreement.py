"""
Test with the actual agreement document provided by the user
"""
import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from services.document_parser import DocumentParser

REAL_AGREEMENT = """
ARTICLE I: IDENTIFICATION OF PARTIES

This Marital Settlement Agreement ("Agreement") is entered into by:

Parent 1:

Emma Rose Turner

DOB: 06/02/1988

Address: 2145 Maple Ridge Drive, Aurora, CO

Parent 2:

Michael Joseph Carter

DOB: 09/17/1986

Address: 118 Westbrook Lane, Aurora, CO

Marriage Date: June 12, 2012

Separation Date: March 4, 2024

Children:

1. Oliver Carter – DOB: 02/11/2016

2. Ava Carter – DOB: 10/05/2020

This Agreement resolves all financial, custodial, and property matters.

ARTICLE II: LEGAL CUSTODY

The parties shall share Joint Legal Custody, giving both parents equal decision-making

authority over:

●

Medical and dental care

●

Education, tutoring, and special needs services

●

Religious upbringing

●

Extracurricular activities

●

Counseling and mental-health decisions

Both parents shall communicate significant issues within 24 hours.

ARTICLE III: PHYSICAL CUSTODY

The parties agree to a shared physical custody arrangement using a 2-2-3 rotating

schedule, repeating every 14 days.

ARTICLE IV: PARENTING TIME

SCHEDULE (2-2-3 ROTATING)

WEEK 1

●

Parent 1:

○

Monday & Tuesday

●

Parent 2:

○

Wednesday & Thursday

●

Parent 1:

○

Friday, Saturday, Sunday

WEEK 2

●

Parent 2:

○

Monday & Tuesday

●

Parent 1:

○

Wednesday & Thursday

●

Parent 2:

○

Friday, Saturday, Sunday

Exchange Rules

●

●

●

School days: exchange happens at school dismissal.

Non-school days: exchange occurs 5:30 PM at Parent 1's driveway unless modified.

If a parent is more than 15 minutes late twice within 60 days, makeup time or schedule

review may be required.

Make-Up Parenting Time

Missed time due to emergencies or illness will be restored within 30 days, unless the parents

agree to waive it.

ARTICLE V: HOLIDAY & SPECIAL DAY

SCHEDULE

Holiday schedule overrides the weekly rotation.

Alternating Holidays

Holiday Odd Years Even

Years

New Year's Day Parent 2 Parent 1

Easter Weekend Parent 1 Parent 2

Memorial Day Parent 2 Parent 1

July 4th Parent 1 Parent 2

Labor Day Parent 2 Parent 1

Thanksgiving (Thurs–Sun) Parent 1 Parent 2

Christmas Eve Parent 2 Parent 1

Christmas Day Parent 1 Parent 2

Spring Break

Alternates yearly (Parent 1 in even years, Parent 2 in odd years).

Winter Break

Split evenly:

●

First half: Parent 1

●

Second half: Parent 2

Rotation reverses next year.

Special Days

●

●

●

Mother's Day: Always with Mother

Father's Day: Always with Father

Child birthdays: Parents alternate yearly (Parent 1 odd years; Parent 2 even years)

ARTICLE VI: SUMMER PARENTING TIME

The 2-2-3 rotation continues during summer unless the parents choose to follow a

week-on/week-off plan for smoother scheduling.

Each parent may take:

●

Up to 14 consecutive vacation days

●

With 45 days advance written notice

Vacation time cannot interfere with the other parent's designated holiday period.

ARTICLE VII: TRANSPORTATION

●

●

●

The parent starting their parenting time is responsible for pickup.

All transportation must be safe, legal, and age-appropriate.

Car seats/boosters must be compliant with Colorado law.

ARTICLE VIII: COMMUNICATION &

TECHNOLOGY ACCESS

●

●

●

Children may video call or phone either parent freely.

No parent shall block, monitor, or interfere with communication.

Parents shall use the "Bridge-it" co-parenting app to log:

○

Schedule changes

○

Medical information

○

School updates

○

Expense reimbursements

ARTICLE IX: RELOCATION

Neither parent may relocate more than 50 miles from their current residence without:

1. 30-day written notice

2. 3. 4. A proposed updated parenting plan

Good-faith mediation if the other parent objects

Court approval if no agreement is reached

ARTICLE X: CHILD SUPPORT &

EXPENSES

Child Support

Support shall follow state guidelines, considering each parent's income and parenting time.

Shared Expenses

Split 50/50 unless modified:

●

Medical costs

●

School fees

●

●

●

Tutoring

Extracurricular supplies

Childcare when the other parent is unavailable

Receipts must be provided within 30 days.

ARTICLE XI: ACCESS TO RECORDS

Both parents shall have equal access to:

●

●

●

Medical reports

Educational reports

Extracurricular calendars

●

●

School portals

Counseling records

Schools and doctors shall list both parents as emergency contacts.

ARTICLE XII: DISPUTE RESOLUTION

If disagreements arise:

1. 2. 3. Parents shall attempt to resolve the issue through written discussion.

If unresolved, the parties must attend mediation through a certified family mediator.

Only after mediation may either parent file a court motion.

ARTICLE XIII: FINAL PROVISIONS

●

●

●

●

The Agreement is voluntary and not the result of coercion.

Both parties had the opportunity to seek legal advice.

Any amendments must be in writing and signed by both parties.

This Agreement is enforceable when signed and notarized.
"""

async def test_real_agreement():
    print("=" * 70)
    print("Testing with REAL Agreement Document")
    print("=" * 70)
    
    parser = DocumentParser(ai_provider="none")
    
    print("\n1. Testing Pattern Matching (Fallback Mode):")
    print("-" * 70)
    result = parser._parse_with_patterns(REAL_AGREEMENT)
    
    print(f"Custody Schedule: {result.get('custodySchedule', 'NOT FOUND')}")
    print(f"Custody Arrangement: {result.get('custodyArrangement', 'NOT FOUND')}")
    print(f"Holiday Schedule: {result.get('holidaySchedule', 'NOT FOUND')}")
    print(f"Decision Making: {result.get('decisionMaking', 'NOT FOUND')}")
    print(f"Expense Split: {result.get('expenseSplit', 'NOT FOUND')}")
    
    # Check what we got
    if result.get('custodySchedule') == "2-2-3 schedule":
        print("\n✅ Pattern matching CORRECTLY identified 2-2-3 schedule!")
    else:
        print(f"\n❌ Pattern matching FAILED - got: {result.get('custodySchedule')}")
        print("   Expected: '2-2-3 schedule'")
    
    # Check for the problematic phrases
    text_lower = REAL_AGREEMENT.lower()
    print("\n2. Checking for key phrases in document:")
    print("-" * 70)
    print(f"Contains '2-2-3': {'2-2-3' in text_lower}")
    print(f"Contains '2-2-3 rotating': {'2-2-3 rotating' in text_lower}")
    print(f"Contains 'week-on/week-off': {'week-on/week-off' in text_lower}")
    print(f"Contains 'week on week off': {'week on week off' in text_lower}")
    
    # Test regex patterns
    import re
    print("\n3. Testing Regex Patterns:")
    print("-" * 70)
    pattern_2_2_3 = re.search(r'2\s*-\s*2\s*-\s*3|two.*two.*three', text_lower)
    pattern_weekly = re.search(r'week.*on.*week.*off|alternat.*week', text_lower)
    
    print(f"2-2-3 pattern match: {pattern_2_2_3.group() if pattern_2_2_3 else 'NO MATCH'}")
    print(f"Week-on/week-off pattern match: {pattern_weekly.group() if pattern_weekly else 'NO MATCH'}")
    
    if pattern_2_2_3 and pattern_weekly:
        print(f"\n⚠️  BOTH patterns found! 2-2-3 at position {pattern_2_2_3.start()}, weekly at {pattern_weekly.start()}")
        print(f"   The regex should prioritize 2-2-3, but let's verify the order...")
    
    # Test normalization function
    print("\n4. Testing Normalization Function:")
    print("-" * 70)
    # Simulate AI returning wrong answer
    mock_ai_result = {
        "custodySchedule": "Week-on/week-off",  # Wrong answer
        "custodyArrangement": "50-50",
        "holidaySchedule": "Alternating holidays",
        "decisionMaking": "joint"
    }
    normalized = parser._normalize_parsed_data(mock_ai_result, REAL_AGREEMENT)
    print(f"Mock AI returned: {mock_ai_result.get('custodySchedule')}")
    print(f"After normalization: {normalized.get('custodySchedule')}")
    if normalized.get('custodySchedule') == "2-2-3 schedule":
        print("✅ Normalization CORRECTLY fixed the schedule!")
    else:
        print(f"❌ Normalization FAILED - got: {normalized.get('custodySchedule')}")
    
    # Test AI parsing if available
    api_key = os.getenv("OPENAI_API_KEY")
    if api_key:
        print("\n5. Testing AI Parsing (with normalization):")
        print("-" * 70)
        parser_ai = DocumentParser(ai_provider="openai", api_key=api_key)
        try:
            ai_result = await parser_ai.parse_with_ai(REAL_AGREEMENT)
            print(f"AI Custody Schedule: {ai_result.get('custodySchedule', 'NOT FOUND')}")
            if ai_result.get('custodySchedule', '').lower().find('2-2-3') >= 0 or ai_result.get('custodySchedule') == "2-2-3 schedule":
                print("✅ AI CORRECTLY identified 2-2-3 schedule!")
            else:
                print(f"❌ AI FAILED - got: {ai_result.get('custodySchedule')}")
                print("   (Normalization should have fixed this)")
        except Exception as e:
            print(f"⚠️  AI parsing error: {e}")
    else:
        print("\n5. AI Parsing: Skipped (no OPENAI_API_KEY)")

if __name__ == "__main__":
    asyncio.run(test_real_agreement())

