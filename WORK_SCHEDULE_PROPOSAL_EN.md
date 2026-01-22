# 📅 Work Schedule Management System Proposal

## 🎯 Overview

This is a comprehensive proposal for building a work schedule management system for staff at La Perla Nails, enabling:
1. **Advance schedule registration** for the following week
2. **Late arrival reporting** when unable to arrive on time
3. **Early departure reporting** when needing to leave earlier than planned

## 📊 Current System Analysis

### Existing Features
- ✅ **Staff Portal** (`StaffPortalView.tsx`): Dedicated portal for staff members
- ✅ **Payroll System** (`PayrollView.tsx`): Weekly payroll system (Thursday to Wednesday)
- ✅ **Staff Profiles** (`types.ts`): Staff profiles with basic information
- ✅ **Transaction Tracking**: Tracking transactions and revenue by staff
- ✅ **Kiosk Check-in**: Customer self-service check-in at kiosk

### Strengths to Leverage
- Firebase Realtime Database already in place
- Staff authentication system implemented
- Sydney timezone properly handled
- Work week structure established (Thu-Wed)

## 🏗️ Proposed Architecture

### 1. New Data Structures

#### A. WorkSchedule Interface
```typescript
export interface WorkSchedule {
  id: string;
  staffId: string;
  staffName: string;
  weekStartDate: string; // YYYY-MM-DD (Thursday)
  weekEndDate: string;   // YYYY-MM-DD (Wednesday)
  scheduledDays: ScheduledDay[];
  createdAt: string;
  lastModified: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
}

export interface ScheduledDay {
  date: string; // YYYY-MM-DD
  dayOfWeek: string; // "Monday", "Tuesday", etc.
  status: 'scheduled' | 'confirmed' | 'absent' | 'late' | 'early_leave';
  scheduledStart: string; // "09:00"
  scheduledEnd: string;   // "18:00"
  actualStart?: string;   // Actual check-in time
  actualEnd?: string;     // Actual check-out time
  lateReason?: string;    // Reason for being late
  earlyLeaveReason?: string; // Reason for early departure
  notes?: string;
}
```

#### B. AttendanceRecord Interface
```typescript
export interface AttendanceRecord {
  id: string;
  staffId: string;
  staffName: string;
  date: string; // YYYY-MM-DD
  checkInTime: string; // ISO timestamp
  checkOutTime?: string; // ISO timestamp
  location?: {
    lat: number;
    lng: number;
  };
  device?: string; // "mobile" | "kiosk" | "admin"
  status: 'on_time' | 'late' | 'early_leave' | 'absent';
  notes?: string;
}
```

### 2. Firebase Database Structure

```
/schedules
  /{staffId}
    /{weekId}
      - id
      - staffId
      - staffName
      - weekStartDate
      - weekEndDate
      - scheduledDays []
      - status
      - createdAt
      - lastModified

/attendance
  /{date} (YYYY-MM-DD)
    /{staffId}
      - id
      - staffId
      - staffName
      - checkInTime
      - checkOutTime
      - location
      - status
      - notes

/schedule_requests
  /{requestId}
    - staffId
    - weekId
    - action: 'late_notification' | 'early_leave_request'
    - date
    - reason
    - requestedAt
    - status: 'pending' | 'approved' | 'rejected'
```

## 🎨 User Interface (UI)

### 1. Schedule Registration Screen

**Location**: New tab in `StaffPortalView`

**Features**:
- 📅 Weekly calendar displaying 7 days (Thu - Wed)
- ✏️ Click on each day to select work shifts:
  - Morning shift: 9:00 - 13:00
  - Afternoon shift: 13:00 - 18:00
  - Full day: 9:00 - 18:00
  - Custom time: Select custom hours
- 💾 "Save Draft" button to save as draft
- ✅ "Submit Schedule" button to send for manager approval
- 📊 Status display: Draft / Submitted / Approved / Rejected

**Workflow**:
1. Staff opens portal on Sunday or Monday
2. Selects next week from dropdown
3. Clicks on days to register shifts
4. Submits schedule before Tuesday 23:59
5. Manager approves before Wednesday

### 2. Check-in/Check-out Screen

**Location**: Main screen in Staff Portal

**Features**:
- 🟢 Green "Check In" button (shown when not checked in)
- 🔴 Red "Check Out" button (shown when checked in)
- ⏰ Display check-in time and hours worked
- 📍 Optional: GPS location capture
- 📝 Reason input field if late or leaving early

**Check-in Workflow**:
1. Staff clicks "Check In"
2. System compares with registered schedule
3. If late > 15 minutes → Mandatory reason input
4. Save time and status to database

**Check-out Workflow**:
1. Staff clicks "Check Out"
2. If leaving > 30 minutes early → Mandatory reason input
3. Save time and calculate total hours

### 3. Advance Notification Screen

**Location**: Modal popup in Staff Portal

**Features**:
- 📢 "Report Late Arrival" button
- 📢 "Request Early Leave" button
- 📝 Input form:
  - Expected late/early date
  - Expected arrival/departure time
  - Reason
  - Additional notes (optional)
- 🔔 Real-time notification to manager

**Workflow**:
1. Staff knows in advance they'll be late or leave early
2. Opens portal, clicks "Report Late" or "Request Early Leave"
3. Fills form and submits
4. Manager receives notification immediately
5. Manager approves/rejects request

## 👨‍💼 Management Screen (Admin View)

### 1. Schedule Management Tab

**Features**:
- 📋 List of all schedule requests
- 🔍 Filter by: Week / Staff / Status
- 👀 Preview each staff schedule
- ✅ Approve/Reject buttons
- 📊 Overview chart: Number of staff scheduled per day

### 2. Attendance Dashboard

**Features**:
- 📊 Today's attendance table:
  - Columns: Staff Name | Check-in | Check-out | Status | Hours
  - Color coding: Green (on time) / Yellow (late) / Red (absent)
- 🔔 Notifications for late arrivals and early leaves
- 📈 Weekly/Monthly reports:
  - On-time rate for each staff
  - Total hours worked
  - Number of late arrivals/early departures
- 📥 Export CSV/PDF

### 3. Real-time Notifications

**Features**:
- 🔔 Popup notification when:
  - New schedule request received
  - Staff reports late/early leave
  - Staff checks in/out
- 🔊 Option: Enable/disable sound notifications
- 📱 Option: SMS/Email notifications

## 🔧 Technical Features

### 1. Services to Add

```typescript
// services/scheduleService.ts
export const scheduleService = {
  // Schedule CRUD
  createSchedule(staffId, weekId, days)
  getSchedule(staffId, weekId)
  updateSchedule(scheduleId, updates)
  submitSchedule(scheduleId)
  approveSchedule(scheduleId, adminId)
  rejectSchedule(scheduleId, reason)
  
  // Attendance
  checkIn(staffId, location?)
  checkOut(staffId, reason?)
  getAttendance(staffId, date)
  getTodayAttendance()
  
  // Notifications
  notifyLateArrival(staffId, date, expectedTime, reason)
  notifyEarlyLeave(staffId, date, expectedTime, reason)
  
  // Reports
  getWeeklyReport(weekId)
  getMonthlyReport(month)
  getStaffAttendanceHistory(staffId, startDate, endDate)
}
```

### 2. Firebase Rules Updates

```json
{
  "rules": {
    "schedules": {
      "$staffId": {
        ".read": "auth != null && (auth.uid === $staffId || root.child('admins').child(auth.uid).exists())",
        ".write": "auth != null && (auth.uid === $staffId || root.child('admins').child(auth.uid).exists())"
      }
    },
    "attendance": {
      "$date": {
        "$staffId": {
          ".read": "auth != null",
          ".write": "auth != null && (auth.uid === $staffId || root.child('admins').child(auth.uid).exists())"
        }
      }
    },
    "schedule_requests": {
      ".read": "auth != null",
      ".write": "auth != null"
    }
  }
}
```

### 3. New Components to Create

```
components/
  scheduling/
    ScheduleCalendar.tsx        # Schedule registration calendar
    ScheduleWeekView.tsx        # Weekly schedule view
    ShiftSelector.tsx           # Shift selection component
    CheckInButton.tsx           # Check-in/out button
    LateNotificationModal.tsx   # Late notification modal
    EarlyLeaveModal.tsx         # Early leave modal
    AttendanceTable.tsx         # Admin attendance table
    ScheduleApprovalCard.tsx    # Schedule approval card
    AttendanceReport.tsx        # Attendance report
```

## 📱 User Workflows

### Staff Workflow

**Previous Week:**
```
Sunday/Monday
└─> Open Staff Portal
    └─> "My Schedule" tab
        └─> Click "Next Week"
            └─> Select days to work
                └─> Select shift for each day
                    └─> "Submit Schedule"
                        └─> Wait for manager approval
```

**Work Day:**
```
Morning
└─> Open Staff Portal
    └─> Click "Check In"
        ├─> On time → Check-in successful
        └─> Late > 15 min → Enter reason → Check-in

Afternoon
└─> Click "Check Out"
    ├─> On time → Check-out successful
    └─> Early > 30 min → Enter reason → Check-out
```

**Unexpected Events:**
```
Known Late Arrival
└─> Open Staff Portal
    └─> Click "Report Late"
        └─> Select date
            └─> Enter expected arrival time
                └─> Enter reason
                    └─> Submit
                        └─> Manager receives notification

Need Early Leave
└─> Click "Request Early Leave"
    └─> Similar process as above
```

### Manager Workflow

**Early Week:**
```
Tuesday/Wednesday
└─> Open Admin View
    └─> "Schedule Management" tab
        └─> View list of schedule requests
            └─> Preview each schedule
                ├─> Click "Approve" → Schedule confirmed
                └─> Click "Reject" → Enter reason → Send to staff
```

**Daily:**
```
Monitor Attendance
└─> "Attendance Dashboard" tab
    └─> View today's check-in table
        ├─> Green: On time
        ├─> Yellow: Late (view reason)
        └─> Red: Not arrived

Receive Notifications
└─> Popup notifications
    ├─> Staff reports late → View details → OK
    └─> Staff requests early leave → Approve/Reject
```

**End of Week/Month:**
```
View Reports
└─> "Reports" tab
    └─> Select Week/Month
        └─> View:
            ├─> On-time rate per staff
            ├─> Total hours worked
            ├─> Attendance chart
            └─> Export PDF/CSV
```

## 🎯 Benefits

### For Staff
- ✅ Proactive schedule registration
- ✅ Transparency in work hours and shifts
- ✅ Easy to report unexpected events
- ✅ Avoid misunderstandings about work hours

### For Manager
- ✅ Know staff schedules in advance
- ✅ Easy workforce planning
- ✅ Real-time attendance monitoring
- ✅ Data for employee evaluation
- ✅ Reduce manual management time

### For Salon
- ✅ More professional management
- ✅ Optimize workforce based on demand
- ✅ Data for analysis and improvement
- ✅ Integration with existing payroll system

## 🚀 Implementation Plan

### Phase 1: MVP (2-3 weeks)
- [ ] Create data types and interfaces
- [ ] Build Schedule Calendar component
- [ ] Implement basic Check-in/Check-out
- [ ] Firebase database setup
- [ ] Staff Portal integration
- [ ] Admin approval workflow

### Phase 2: Advanced Features (2 weeks)
- [ ] Late notification system
- [ ] Early leave request system
- [ ] Real-time notifications
- [ ] GPS location tracking (optional)
- [ ] Attendance reports
- [ ] Mobile responsive optimization

### Phase 3: Integration (1 week)
- [ ] Integrate with Payroll system
- [ ] Export reports (PDF/CSV)
- [ ] SMS/Email notifications (optional)
- [ ] Performance optimization
- [ ] Testing and bug fixes

### Phase 4: Polish & Deploy (1 week)
- [ ] UI/UX improvements
- [ ] Vietnamese translations
- [ ] User training materials
- [ ] Production deployment
- [ ] Monitoring and support

## 📝 Technical Notes

### Timezone Handling
- Use Sydney timezone (already in code)
- Store all timestamps in UTC in database
- Convert to Sydney time when displaying

### Offline Handling
- Cache current schedule in local storage
- Allow offline check-in, sync when online
- Display warning when connection lost

### Security
- Staff can only view/edit their own schedule
- Manager views all, approves/rejects
- Firebase rules protect data
- Optional: GPS verification to prevent fraud

### Performance
- Lazy load schedules (only current and next week)
- Index Firebase queries by staffId and date
- Debounce real-time updates
- Optimize rendering with React.memo

## 💡 Future Extension Options

### Possible Future Additions:
- 🤝 **Shift Trading**: Staff can swap shifts
- 📲 **Push Notifications**: App notifications
- 🌐 **Multi-language**: Support more languages
- 📊 **Advanced Analytics**: ML to predict attendance patterns
- 🎯 **Smart Scheduling**: AI suggests optimal schedules based on history
- ⏰ **Break Time Tracking**: Track break times during shifts
- 💰 **OT Calculation**: Automatic overtime calculation
- 📱 **Biometric Check-in**: Fingerprint/Face ID

## 🔗 Integration with Current System

### PayrollView Integration
```typescript
// Integrate attendance data into payroll calculation
interface PayrollDailyBreakdown {
  // Existing fields...
  hoursWorked?: number;        // From attendance
  scheduledHours?: number;     // From schedule
  lateMinutes?: number;        // From check-in
  earlyLeaveMinutes?: number;  // From check-out
}
```

### StaffPortalView Integration
```typescript
// Add new tabs to portal
type PortalTab = 
  | 'overview'          // Existing
  | 'schedule'          // NEW: Schedule registration
  | 'attendance'        // NEW: Check-in/out history
  | 'transactions'      // Existing
  | 'portfolio';        // Existing
```

## 📞 Support & Documentation

After implementation, prepare:
- 📖 User manual (Vietnamese & English)
- 🎥 Tutorial videos
- ❓ FAQ document
- 🐛 Bug report template
- 💬 Support channel (SMS/WhatsApp/Email)

## ✅ Summary

This is a comprehensive solution for work schedule and attendance management for La Perla Nails. The system is:

1. **Easy to use**: Simple, intuitive interface
2. **Flexible**: Staff register proactively, manager controls
3. **Transparent**: Everyone knows each other's schedules
4. **Integrated**: Works smoothly with existing system
5. **Extensible**: Easy to add new features later

**Estimated Time**: 6-8 weeks for full implementation
**Complexity**: Medium (can leverage much existing code)
**ROI**: High (saves significant manual management time)

---

**📌 Note**: This is a detailed proposal only. No code has been changed. If you agree with this direction, we can start implementing phase by phase.

**Questions to Discuss**:
1. Is GPS tracking needed?
2. Are SMS/Email notifications needed?
3. Is the schedule submission deadline (Tuesday 23:59) acceptable?
4. Do we need shift trading between staff?
5. Do you want biometric check-in integration?
