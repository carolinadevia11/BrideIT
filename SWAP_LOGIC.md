# Swappable Dates Logic: End-to-End Analysis

This document explains the logic for determining and displaying swappable dates in the "Request Schedule Change" feature.

## 1. Backend: Storing Swappable Status

- **`isSwappable` Flag**: In [`backend/routers/calendar.py`](backend/routers/calendar.py:40), the `isSwappable` property is a boolean value stored with each calendar event in the database. It is not calculated dynamically.
- **Setting the Flag**: This flag is set to `true` or `false` when an event is first created via the `create_calendar_event` function or updated in `update_calendar_event`. The default value is `false` if not provided.
- **API Endpoint**: The [`/api/v1/calendar/events`](backend/routers/calendar.py:113) endpoint retrieves all calendar events for a given month, including the `isSwappable` flag for each event.

## 2. Frontend: Highlighting Swappable Dates

- **Fetching Data**: In [`frontend/src/components/CalendarView.tsx`](frontend/src/components/CalendarView.tsx:394), the `loadEvents` function calls the backend API to get all calendar events for the current month. The `isSwappable` flag is stored in the component's state.
- **Triggering the Modal**: When a user clicks on a swappable event and selects "Request Change," the "Request Schedule Change" dialog opens.
- **Filtering Logic**: Inside this dialog, the code iterates through each day of the month. A day is highlighted as swappable (green) if it meets the following criteria:
    1. It has at least one event.
    2. The event type matches the type of the event being swapped.
    3. The `isSwappable` flag on the event is `true`.
    4. It is not the same day as the event being swapped.

This logic is implemented in the `onClick` handler of the button inside the `getDaysInMonth().map()` loop within the "Request Schedule Change" dialog.

## 3. Conclusion

The reason only the 22nd is highlighted in the provided image is that it is the only other date in the month that has a "custody" event with the `isSwappable` flag set to `true`. Other dates either have no events, have events of a different type, or have events where `isSwappable` is `false`.