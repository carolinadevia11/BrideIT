"""
Comprehensive Test Suite for Document Parser

Tests:
1. Pattern-based parsing (fallback mode)
2. Text extraction from various formats
3. Sample agreement parsing
4. API endpoint testing
"""

import asyncio
import os
import sys

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from services.document_parser import DocumentParser

# Test cases for pattern matching
TEST_CASES = [
    {
        "name": "2-2-3 Schedule Detection",
        "text": """
        CUSTODY AGREEMENT
        The parents agree to a 2-2-3 custody schedule.
        This means: 2 days with Parent 1, 2 days with Parent 2, then 3 days with Parent 1.
        The schedule then alternates for the next week.
        """,
        "expected": {
            "custodySchedule": "2-2-3 schedule"
        }
    },
    {
        "name": "Week-on/Week-off Detection",
        "text": """
        CUSTODY AGREEMENT
        The children shall alternate weeks between parents.
        Week on, week off schedule shall be followed.
        """,
        "expected": {
            "custodySchedule": "Week-on/week-off"
        }
    },
    {
        "name": "50-50 Custody Split",
        "text": """
        PARENTING PLAN
        Physical custody shall be shared equally.
        This is a 50/50 custody arrangement.
        Each parent shall have the children for equal time.
        """,
        "expected": {
            "custodyArrangement": "50-50"
        }
    },
    {
        "name": "Joint Legal Custody",
        "text": """
        CUSTODY DECREE
        The parties shall share joint legal custody of the minor children.
        Both parents will make major decisions together.
        """,
        "expected": {
            "decisionMaking": "joint"
        }
    },
    {
        "name": "Holiday Alternating Schedule",
        "text": """
        HOLIDAY SCHEDULE
        Major holidays shall be alternated between parents each year.
        Alternate holiday schedule shall apply.
        """,
        "expected": {
            "holidaySchedule": "Alternating holidays"
        }
    },
    {
        "name": "Primary/Secondary Custody",
        "text": """
        CUSTODY ORDER
        Mother shall have primary custody of the children.
        Father shall have secondary custody with visitation rights.
        """,
        "expected": {
            "custodyArrangement": "primary-secondary"
        }
    },
    {
        "name": "Complete Agreement Sample",
        "text": """
        CUSTODY AND PARENTING AGREEMENT
        
        1. CUSTODY ARRANGEMENT
        The parents shall share joint legal custody of the minor children.
        Physical custody shall be shared on a 50/50 basis using a 2-2-3 schedule.
        
        2. SCHEDULE DETAILS
        Parent 1 (Mother): Monday and Tuesday
        Parent 2 (Father): Wednesday and Thursday
        Weekends (Friday-Sunday): Alternating between parents
        
        3. HOLIDAYS
        Major holidays shall be alternated each year.
        Thanksgiving: Even years with Mother, odd years with Father.
        Christmas: Split - Eve with one parent, Day with the other.
        
        4. EXPENSES
        Child-related expenses shall be shared 50-50.
        Major medical expenses require mutual agreement.
        
        5. DECISION MAKING
        Both parents shall share joint legal custody and make major decisions together.
        """,
        "expected": {
            "custodyArrangement": "50-50",
            "custodySchedule": "2-2-3 schedule",
            "decisionMaking": "joint",
            "holidaySchedule": "Alternating holidays"
        }
    }
]


async def test_pattern_matching():
    """Test the fallback pattern matching parser."""
    print("=" * 60)
    print("Testing Pattern Matching Parser (Fallback Mode)")
    print("=" * 60)
    
    # Create parser without API key to force pattern matching
    parser = DocumentParser(ai_provider="none")
    
    passed = 0
    failed = 0
    
    for test in TEST_CASES:
        print(f"\n📋 Test: {test['name']}")
        
        result = parser._parse_with_patterns(test['text'])
        
        all_pass = True
        for key, expected_value in test['expected'].items():
            actual_value = result.get(key)
            if actual_value == expected_value:
                print(f"  ✅ {key}: '{actual_value}'")
            else:
                print(f"  ❌ {key}: Expected '{expected_value}', got '{actual_value}'")
                all_pass = False
        
        if all_pass:
            passed += 1
        else:
            failed += 1
    
    print(f"\n{'=' * 60}")
    print(f"Pattern Matching Results: {passed} passed, {failed} failed")
    print("=" * 60)
    
    return passed, failed


async def test_sample_agreement():
    """Test parsing the sample agreement file."""
    print("\n" + "=" * 60)
    print("Testing Sample Agreement Parsing")
    print("=" * 60)
    
    sample_path = os.path.join(os.path.dirname(__file__), "..", "sample_agreement.txt")
    
    if not os.path.exists(sample_path):
        print("❌ sample_agreement.txt not found")
        return 0, 1
    
    with open(sample_path, "rb") as f:
        content = f.read()
    
    parser = DocumentParser(ai_provider="none")
    
    try:
        # Test text extraction
        text = parser.extract_text_from_file(content, "txt")
        print(f"✅ Text extracted successfully ({len(text)} chars)")
        
        # Test pattern parsing
        result = parser._parse_with_patterns(text)
        print(f"\nParsed Results:")
        print(f"  Custody Arrangement: {result.get('custodyArrangement', 'Not found')}")
        print(f"  Custody Schedule: {result.get('custodySchedule', 'Not found')}")
        print(f"  Holiday Schedule: {result.get('holidaySchedule', 'Not found')}")
        print(f"  Decision Making: {result.get('decisionMaking', 'Not found')}")
        print(f"  Expense Split: {result.get('expenseSplit', 'Not found')}")
        print(f"  Confidence: {result.get('confidence', 'Not found')}")
        print(f"  Extracted Terms: {len(result.get('extractedTerms', []))} terms")
        
        # Check expected values
        if result.get('custodySchedule') == "2-2-3 schedule":
            print("\n✅ 2-2-3 schedule correctly detected!")
            return 1, 0
        else:
            print("\n⚠️  Schedule type not detected as expected")
            return 0, 1
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return 0, 1


async def test_ai_parsing():
    """Test AI-powered parsing (requires API key)."""
    print("\n" + "=" * 60)
    print("Testing AI-Powered Parsing")
    print("=" * 60)
    
    api_key = os.getenv("OPENAI_API_KEY")
    
    if not api_key:
        print("⚠️  OPENAI_API_KEY not set - skipping AI tests")
        print("   Set the environment variable to enable AI parsing tests")
        return 0, 0
    
    parser = DocumentParser(ai_provider="openai", api_key=api_key)
    
    sample_text = """
    CUSTODY AND PARENTING PLAN
    
    ARTICLE 1: CUSTODY ARRANGEMENT
    The parties agree to share joint legal and physical custody of the minor children.
    Physical custody shall be exercised according to a 2-2-3 rotating schedule.
    
    ARTICLE 2: SCHEDULE
    Week 1: Mother has Monday-Tuesday, Father has Wednesday-Thursday, Mother has Friday-Sunday.
    Week 2: Father has Monday-Tuesday, Mother has Wednesday-Thursday, Father has Friday-Sunday.
    This pattern repeats on a bi-weekly basis.
    
    ARTICLE 3: HOLIDAYS
    Holidays shall be alternated each year between the parents.
    Thanksgiving: Even years with Mother, odd years with Father.
    Christmas Eve: With Father, Christmas Day: With Mother.
    
    ARTICLE 4: EXPENSES
    All child-related expenses shall be split 50/50 between the parties.
    
    ARTICLE 5: DECISION MAKING
    Both parents shall share in major decisions regarding education, health, and welfare.
    This constitutes joint legal custody.
    """
    
    try:
        print("🤖 Parsing with OpenAI...")
        result = await parser.parse_with_ai(sample_text)
        
        print(f"\nAI Parsed Results:")
        print(f"  Custody Arrangement: {result.get('custodyArrangement', 'Not found')}")
        print(f"  Custody Schedule: {result.get('custodySchedule', 'Not found')}")
        print(f"  Holiday Schedule: {result.get('holidaySchedule', 'Not found')}")
        print(f"  Decision Making: {result.get('decisionMaking', 'Not found')}")
        print(f"  Expense Split: {result.get('expenseSplit', 'Not found')}")
        print(f"  Confidence: {result.get('confidence', 'Not found')}")
        
        if result.get('extractedTerms'):
            print(f"  Extracted Terms:")
            for term in result.get('extractedTerms', []):
                print(f"    - {term.get('term')}: {term.get('value')} (confidence: {term.get('confidence', 'N/A')})")
        
        # Verify 2-2-3 detected
        schedule = str(result.get('custodySchedule', '')).lower()
        if '2-2-3' in schedule or 'two-two-three' in schedule:
            print("\n✅ AI correctly detected 2-2-3 schedule!")
            return 1, 0
        else:
            print(f"\n⚠️  AI schedule detection: {result.get('custodySchedule')}")
            return 0, 1
            
    except Exception as e:
        print(f"❌ AI Parsing Error: {e}")
        return 0, 1


async def test_prompt_content():
    """Test that the prompt contains correct instructions."""
    print("\n" + "=" * 60)
    print("Testing Prompt Content")
    print("=" * 60)
    
    parser = DocumentParser()
    sample_text = "Sample custody agreement text"
    prompt = parser._build_parsing_prompt(sample_text)
    
    checks = [
        ("Primary schedule instruction", "PRIMARY/MAIN custody schedule"),
        ("2-2-3 schedule option", "2-2-3 schedule"),
        ("Week-on/week-off option", "Week-on/week-off"),
        ("JSON structure", "custodyArrangement"),
        ("Holiday schedule", "holidaySchedule"),
        ("Decision making", "decisionMaking"),
        ("Expense split", "expenseSplit"),
        ("Confidence score", "confidence"),
    ]
    
    passed = 0
    for name, substring in checks:
        if substring in prompt:
            print(f"  ✅ {name}")
            passed += 1
        else:
            print(f"  ❌ {name} - missing '{substring}'")
    
    return passed, len(checks) - passed


async def main():
    """Run all tests."""
    print("\n" + "=" * 60)
    print("🧪 DOCUMENT PARSER TEST SUITE")
    print("=" * 60)
    
    total_passed = 0
    total_failed = 0
    
    # Test 1: Prompt content
    p, f = await test_prompt_content()
    total_passed += p
    total_failed += f
    
    # Test 2: Pattern matching
    p, f = await test_pattern_matching()
    total_passed += p
    total_failed += f
    
    # Test 3: Sample agreement
    p, f = await test_sample_agreement()
    total_passed += p
    total_failed += f
    
    # Test 4: AI parsing (optional)
    p, f = await test_ai_parsing()
    total_passed += p
    total_failed += f
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 FINAL RESULTS")
    print("=" * 60)
    print(f"Total Passed: {total_passed}")
    print(f"Total Failed: {total_failed}")
    
    if total_failed == 0:
        print("\n✅ All tests passed!")
    else:
        print(f"\n⚠️  {total_failed} test(s) need attention")
    
    return total_failed == 0


if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)
