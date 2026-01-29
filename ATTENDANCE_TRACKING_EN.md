# Attendance Tracking Feature - Late Arrivals & Early Departures

## Overview
This new feature allows administrators to record and track when employees arrive late or leave early. When filtering by date, the system displays the total late and early leave time for each employee.

## Changes Made

### 1. New Data Structure (types.ts)
Added `AttendanceRecord` interface to store attendance information:

```typescript
export interface AttendanceRecord {
    id: string;                    // Unique identifier
    staffId: string;               // Employee ID
    staffName: string;             // Employee name (for display)
    date: string;                  // Date (YYYY-MM-DD)
    lateMinutes: number;           // Minutes late (0 if on time)
    earlyLeaveMinutes: number;     // Minutes left early (0 if stayed full time)
    notes?: string;                // Admin notes
    recordedBy?: string;           // Who recorded this
    recordedAt: string;            // When recorded (ISO timestamp)
}
```

### 2. Firebase Service (firebaseService.ts)
Added functions to manage attendance data:

- **saveAttendanceRecord**: Save or update attendance record
- **subscribeToAttendance**: Subscribe to real-time updates with date filtering
- **fetchAttendanceByDateRange**: One-time fetch for date range
- **deleteAttendanceRecord**: Delete record

### 3. Management Interface (AttendanceView.tsx)
New component provides a complete interface to:

#### Filters
- **Start Date**: Select start date
- **End Date**: Select end date
- **Staff Member**: Filter by specific staff or all
- **"Add Record" Button**: Add new record

#### Summary Cards
- **Total Records**: Number of records in period
- **Total Late Time**: Display total hours:minutes late (red)
- **Total Early Leave Time**: Display total hours:minutes early (blue)

#### Data Table
Displays list of records with:
- Date
- Staff name (with avatar)
- Late time
- Early leave time
- Notes
- Edit/Delete buttons

#### Add/Edit Modal
Form to enter:
- Select staff member
- Select date
- Enter minutes late
- Enter minutes left early
- Notes (optional)

### 4. Admin Dashboard Integration (AdminView.tsx)
- Added "⏰ Attendance" tab to navigation bar
- Integrated AttendanceView component
- Follows existing design patterns

## How to Use

### Step 1: Access the Feature
1. Login with Admin account
2. Go to Admin Dashboard
3. Click on "⏰ Attendance" tab

### Step 2: Add Record
1. Click "Add Record" button
2. Select staff member from list
3. Select date
4. Enter minutes late (if any)
5. Enter minutes left early (if any)
6. Add notes (optional)
7. Click "Save"

### Step 3: View Reports
1. Select start and end dates
2. Select specific staff or "All Staff"
3. View total late/early time in summary cards
4. View daily details in table

### Step 4: Edit/Delete
- Click pencil icon to edit
- Click trash icon to delete

## Time Format
- Time is displayed as hours and minutes (e.g., "2h 30m")
- If only minutes: "30m"
- If only hours: "2h"
- If none: "0m"

## Firebase Sync
- All data stored in Firebase Realtime Database
- Real-time updates when changes occur
- Data stored at path: `/attendance/{recordId}`

## Benefits
- ✅ Accurately track employee late/early times
- ✅ Filter by date and staff member
- ✅ View totals for time periods
- ✅ Detailed notes for each case
- ✅ User-friendly, easy-to-use interface
- ✅ Real-time sync with Firebase
- ✅ Mobile-responsive

## Security
- Only admins have access
- Data securely stored on Firebase
- No security vulnerabilities (verified with CodeQL)

## Technical Stack
- **Frontend**: React + TypeScript
- **UI Framework**: TailwindCSS
- **Database**: Firebase Realtime Database
- **Timezone**: Australia/Sydney (consistent with existing system)
