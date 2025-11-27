# Agreement Compliance Report: Event-Swapping Functionality

## 1. Executive Summary

The application's current event-swapping functionality is **partially compliant** with the Marital Settlement Agreement. While the feature provides a necessary mechanism for schedule changes and aligns with the agreement's emphasis on mutual consent (Section 12), it lacks the specific constraints and rules outlined in the document.

The core issue is that the application treats all custody days as potentially swappable, contingent only on co-parent approval. The legal agreement, however, establishes a rigid structure with specific clauses for missed time, holidays, and vacations that are not reflected in the app's logic.

To achieve full compliance, the application must be updated to differentiate between standard parenting days and special events (holidays, birthdays) and handle swap requests according to the rules defined for each.

## 2. Detailed Compliance Analysis

This analysis compares the application's logic, as described in `SWAP_LOGIC.md` and `EVENT_RULES.md`, with the relevant sections of the Marital Settlement Agreement.

### Section 3: Parenting Time Schedule & Missed Time

*   **Agreement Terms**: Establishes a fixed, repeating two-week schedule. It explicitly states that a parent who misses time due to specific reasons (illness, emergencies, work) is entitled to make-up time within 21 days.
*   **Application Logic**: Allows any custody day to be requested for a swap, regardless of the reason. It requires co-parent approval for the swap to be finalized.
*   **Compliance Gap**: The application does not enforce the "make-up time" provision. A parent could theoretically decline a valid make-up request without violating the app's rules, even though it would violate the legal agreement. The app also doesn't track the *reason* for a swap request, making it impossible to determine if it qualifies as official "missed time."

### Section 4: Holiday Schedule

*   **Agreement Terms**: Specifies that the holiday schedule **overrides** the normal weekly rotation. It pre-assigns major holidays and special days (Mother's Day, Father's Day, Birthdays) to specific parents, often on an alternating yearly basis.
*   **Application Logic**: The current system does not distinguish between a regular custody day and a designated holiday. A parent could request to swap a day like Thanksgiving or a child's birthday, even if the agreement explicitly grants that day to the other parent.
*   **Compliance Gap**: This is a significant point of non-compliance. The application should restrict or flag swap requests for holidays and special days defined in the agreement. Allowing these days to be swapped via a standard request undermines the legally binding holiday schedule.

### Section 8: Communication Rules

*   **Agreement Terms**: Mandates the use of a co-parenting app for all scheduling-related communication.
*   **Application Logic**: By providing a feature for requesting and approving schedule changes, the application directly supports this requirement.
*   **Compliance Status**: **Fully Compliant**. The app serves as the designated platform for managing schedule modifications.

### Section 12: Decision-Making & Dispute Resolution

*   **Agreement Terms**: Requires parents to discuss disagreements in good faith and attend mediation if they cannot resolve an issue.
*   **Application Logic**: The requirement for co-parent approval on all swap requests aligns perfectly with this principle. A swap cannot occur unilaterally; it necessitates mutual consent, which is the foundation of the agreement's dispute resolution process.
*   **Compliance Status**: **Fully Compliant**. The approval mechanism ensures that schedule changes are mutually agreed upon.

## 3. Recommendations for Full Compliance

To bridge the compliance gaps, the following enhancements are recommended:

1.  **Implement Event-Specific Rules**: The application's calendar logic should be updated to categorize events (e.g., `CUSTODY_REGULAR`, `HOLIDAY`, `SPECIAL_DAY`, `VACATION`).
2.  **Restrict Swaps on Overriding Events**: Swap requests for events categorized as `HOLIDAY` or `SPECIAL_DAY` should be disabled by default, with a clear explanation referencing the legal agreement.
3.  **Introduce a "Make-Up Time" Request**: Create a distinct request type for "missed parenting time." This would allow a parent to formally request make-up time as stipulated in the agreement, track it, and distinguish it from a standard day swap.
4.  **Add Context to Requests**: Allow parents to add a reason or note when requesting a swap, which can help in determining if the request falls under the "missed time" clause.