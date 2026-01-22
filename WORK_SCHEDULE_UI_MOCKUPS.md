# 📱 Work Schedule System - UI Mockups & Visual Guide

## 🎨 Visual Overview

This document provides visual mockups and screen flows for the proposed Work Schedule Management System.

## 📱 Staff Portal Screens

### 1. Schedule Registration Screen
```
┌─────────────────────────────────────────────┐
│  📅 My Schedule - Week 3 (Jan 22-28)       │
├─────────────────────────────────────────────┤
│  Select Week: [Next Week ▼]                │
│                                              │
│  ┌──────┬──────┬──────┬──────┬──────┬───┐  │
│  │ THU  │ FRI  │ SAT  │ SUN  │ MON  │...│  │
│  │ 23   │ 24   │ 25   │ 26   │ 27   │   │  │
│  ├──────┼──────┼──────┼──────┼──────┼───┤  │
│  │ ✅   │ ✅   │ ✅   │ OFF  │ ✅   │   │  │
│  │ 9-6  │ 9-6  │ 9-6  │      │ 9-1  │   │  │
│  └──────┴──────┴──────┴──────┴──────┴───┘  │
│                                              │
│  Click on a day to edit                     │
│                                              │
│  [💾 Save Draft]  [✅ Submit Schedule]      │
│                                              │
│  Status: 📝 Draft                           │
└─────────────────────────────────────────────┘

When clicking on a day:
┌─────────────────────────────────────────────┐
│  ✏️ Edit Thursday, Jan 23                   │
├─────────────────────────────────────────────┤
│  Working: [✓] Yes  [ ] Day Off              │
│                                              │
│  Select Shift:                               │
│  ( ) Morning (9:00 - 13:00)                 │
│  ( ) Afternoon (13:00 - 18:00)              │
│  (•) Full Day (9:00 - 18:00)                │
│  ( ) Custom                                  │
│                                              │
│  Custom Hours (if selected):                │
│  Start: [09:00] End: [18:00]                │
│                                              │
│  Notes: [Optional notes...]                 │
│                                              │
│  [Cancel]  [Save]                           │
└─────────────────────────────────────────────┘
```

### 2. Check-in/Check-out Screen
```
┌─────────────────────────────────────────────┐
│  ⏰ Attendance - Today                      │
├─────────────────────────────────────────────┤
│  📅 Thursday, January 23, 2026              │
│  🕐 Current Time: 09:15 AM                  │
│                                              │
│  ┌───────────────────────────────────────┐  │
│  │  Your Schedule Today:                  │  │
│  │  📍 9:00 AM - 6:00 PM (Full Day)      │  │
│  └───────────────────────────────────────┘  │
│                                              │
│  Status: 🟡 Not Checked In                  │
│                                              │
│  ┌───────────────────────────────────────┐  │
│  │                                        │  │
│  │         🟢 CHECK IN NOW               │  │
│  │                                        │  │
│  └───────────────────────────────────────┘  │
│                                              │
│  📍 Location: [✓] Use GPS                   │
│                                              │
│  💡 Tip: You are scheduled to start at 9AM  │
└─────────────────────────────────────────────┘

After Check-in:
┌─────────────────────────────────────────────┐
│  ⏰ Attendance - Today                      │
├─────────────────────────────────────────────┤
│  Status: ✅ Checked In                      │
│                                              │
│  ┌───────────────────────────────────────┐  │
│  │  Check-in: 9:15 AM                    │  │
│  │  Time Elapsed: 2h 15m                 │  │
│  │  Expected End: 6:00 PM                │  │
│  └───────────────────────────────────────┘  │
│                                              │
│  ⚠️ You checked in 15 minutes late          │
│  Reason: [Traffic jam on M1]                │
│                                              │
│  ┌───────────────────────────────────────┐  │
│  │                                        │  │
│  │         🔴 CHECK OUT                  │  │
│  │                                        │  │
│  └───────────────────────────────────────┘  │
│                                              │
│  [📊 View History]  [📢 Report Issue]       │
└─────────────────────────────────────────────┘
```

### 3. Late/Early Leave Notification
```
┌─────────────────────────────────────────────┐
│  📢 Report Late Arrival                     │
├─────────────────────────────────────────────┤
│  Date: [Jan 24, 2026 ▼]                    │
│                                              │
│  Scheduled Start: 9:00 AM                   │
│                                              │
│  Expected Arrival: [10:30] AM               │
│                                              │
│  Reason:                                     │
│  ┌───────────────────────────────────────┐  │
│  │ Doctor's appointment                   │  │
│  │                                        │  │
│  └───────────────────────────────────────┘  │
│                                              │
│  Additional Notes: [Optional...]            │
│                                              │
│  ⚠️ Manager will be notified immediately    │
│                                              │
│  [Cancel]  [📤 Submit Report]               │
└─────────────────────────────────────────────┘

After Submission:
┌─────────────────────────────────────────────┐
│  ✅ Report Submitted                        │
├─────────────────────────────────────────────┤
│  Your late arrival report has been sent     │
│  to the manager.                             │
│                                              │
│  📊 Report Details:                         │
│  - Date: Jan 24, 2026                       │
│  - Expected: 10:30 AM (1.5h late)           │
│  - Reason: Doctor's appointment             │
│  - Status: ⏳ Pending Approval              │
│                                              │
│  You will receive a notification when        │
│  the manager responds.                       │
│                                              │
│  [OK]                                        │
└─────────────────────────────────────────────┘
```

### 4. Attendance History
```
┌─────────────────────────────────────────────┐
│  📊 My Attendance History                   │
├─────────────────────────────────────────────┤
│  Period: [Last 7 Days ▼]                   │
│                                              │
│  📈 Summary:                                │
│  - Days Worked: 6 / 6                       │
│  - On Time: 5 (83%)                         │
│  - Late: 1 (17%)                            │
│  - Total Hours: 48.5 hours                  │
│                                              │
│  ┌───────────────────────────────────────┐  │
│  │ Jan 23 (Thu) ✅                       │  │
│  │ In: 9:15 AM | Out: 6:00 PM | 8.75h   │  │
│  │ Status: 🟡 Late (15 min)              │  │
│  │ Reason: Traffic                        │  │
│  ├───────────────────────────────────────┤  │
│  │ Jan 22 (Wed) ✅                       │  │
│  │ In: 9:00 AM | Out: 6:00 PM | 9h      │  │
│  │ Status: 🟢 On Time                    │  │
│  ├───────────────────────────────────────┤  │
│  │ Jan 21 (Tue) ✅                       │  │
│  │ In: 8:55 AM | Out: 5:30 PM | 8.58h   │  │
│  │ Status: 🟡 Early Leave (30 min)       │  │
│  │ Reason: Family emergency               │  │
│  └───────────────────────────────────────┘  │
│                                              │
│  [📥 Export PDF]  [📊 View More]            │
└─────────────────────────────────────────────┘
```

## 👨‍💼 Admin/Manager Screens

### 5. Schedule Management Dashboard
```
┌─────────────────────────────────────────────┐
│  📋 Schedule Management                     │
├─────────────────────────────────────────────┤
│  Week: [Week 3 (Jan 22-28) ▼]             │
│  Filter: [All Staff ▼] [All Status ▼]      │
│                                              │
│  ⏳ Pending Approvals: 3                    │
│                                              │
│  ┌───────────────────────────────────────┐  │
│  │ 👤 Sarah Nguyen                       │  │
│  │ Submitted: 2 hours ago                 │  │
│  │ Days: Thu, Fri, Sat, Mon, Tue (5 days)│  │
│  │ [👁️ Preview] [✅ Approve] [❌ Reject]  │  │
│  ├───────────────────────────────────────┤  │
│  │ 👤 Michael Chen                       │  │
│  │ Submitted: 5 hours ago                 │  │
│  │ Days: Thu, Fri, Sat, Sun (4 days)     │  │
│  │ [👁️ Preview] [✅ Approve] [❌ Reject]  │  │
│  ├───────────────────────────────────────┤  │
│  │ 👤 Emma Wilson                        │  │
│  │ Submitted: 1 day ago                   │  │
│  │ Days: All week (7 days)               │  │
│  │ [👁️ Preview] [✅ Approve] [❌ Reject]  │  │
│  └───────────────────────────────────────┘  │
│                                              │
│  ✅ Approved: 12  |  ❌ Rejected: 1         │
└─────────────────────────────────────────────┘

Preview Modal:
┌─────────────────────────────────────────────┐
│  👤 Sarah Nguyen's Schedule                 │
├─────────────────────────────────────────────┤
│  Week 3: Jan 22-28, 2026                    │
│                                              │
│  ┌──────┬──────┬──────┬──────┬──────┐      │
│  │ THU  │ FRI  │ SAT  │ SUN  │ MON  │      │
│  │ ✅   │ ✅   │ ✅   │ OFF  │ ✅   │      │
│  │ 9-6  │ 9-6  │ 9-6  │      │ 9-1  │      │
│  └──────┴──────┴──────┴──────┴──────┘      │
│                                              │
│  Total Days: 5 days                         │
│  Total Hours: 40 hours                      │
│                                              │
│  Notes: Need Monday afternoon off for       │
│         personal appointment                 │
│                                              │
│  [✅ Approve Schedule]  [❌ Reject]          │
│  [✏️ Request Changes]   [Close]             │
└─────────────────────────────────────────────┘
```

### 6. Attendance Dashboard
```
┌─────────────────────────────────────────────┐
│  ⏰ Today's Attendance - Jan 23, 2026       │
├─────────────────────────────────────────────┤
│  🕐 Current Time: 11:30 AM                  │
│                                              │
│  📊 Quick Stats:                            │
│  Checked In: 12/15 | On Time: 10 | Late: 2  │
│                                              │
│  🔔 Recent Notifications:                   │
│  • Sarah - Late arrival (15m) - Traffic     │
│  • Michael - Requests early leave at 5pm    │
│                                              │
│  Staff Status:                               │
│  ┌──────────────────────────────────────┐   │
│  │ Name         Check-in  Status  Hours │   │
│  ├──────────────────────────────────────┤   │
│  │ 🟢 Sarah N.   9:15 AM  Late    2.25h│   │
│  │ 🟢 Michael C. 9:00 AM  ✅      2.5h │   │
│  │ 🟢 Emma W.    8:55 AM  ✅      2.58h│   │
│  │ 🟢 John D.    9:10 AM  Late    2.33h│   │
│  │ 🔴 Lisa P.     --      Absent   --  │   │
│  │ 🟡 Tom R.     Schedule starts 1pm   │   │
│  ├──────────────────────────────────────┤   │
│  │ [Load More...]                       │   │
│  └──────────────────────────────────────┘   │
│                                              │
│  [🔔 View All Notifications]                │
│  [📊 Weekly Report]  [📥 Export]            │
└─────────────────────────────────────────────┘
```

### 7. Real-time Notifications Panel
```
┌─────────────────────────────────────────────┐
│  🔔 Notifications                           │
├─────────────────────────────────────────────┤
│  ⚙️ [🔊 Sound: ON] [📱 Push: ON]           │
│                                              │
│  Today (3):                                  │
│  ┌───────────────────────────────────────┐  │
│  │ 🟡 NEW - 2 min ago                    │  │
│  │ Sarah Nguyen checked in 15 min late   │  │
│  │ Reason: Traffic jam on M1              │  │
│  │ [View Details] [Dismiss]               │  │
│  ├───────────────────────────────────────┤  │
│  │ 🔵 NEW - 10 min ago                   │  │
│  │ Michael Chen requests early leave     │  │
│  │ Tomorrow at 5:00 PM (1h early)        │  │
│  │ Reason: Family appointment             │  │
│  │ [✅ Approve] [❌ Reject] [View]        │  │
│  ├───────────────────────────────────────┤  │
│  │ ✅ Approved - 1 hour ago              │  │
│  │ Emma Wilson's schedule approved       │  │
│  │ Week 3 (5 days, 40 hours)             │  │
│  │ [View Schedule]                        │  │
│  └───────────────────────────────────────┘  │
│                                              │
│  Yesterday (8):                              │
│  [Show More...]                              │
│                                              │
│  [Mark All as Read]  [Clear All]            │
└─────────────────────────────────────────────┘
```

### 8. Weekly Report
```
┌─────────────────────────────────────────────┐
│  📊 Weekly Attendance Report                │
├─────────────────────────────────────────────┤
│  Week 3: Jan 22-28, 2026                    │
│  Total Staff: 15                             │
│                                              │
│  📈 Overall Statistics:                     │
│  ┌───────────────────────────────────────┐  │
│  │ Total Hours Worked: 423.5 hours       │  │
│  │ On-Time Rate: 87%                      │  │
│  │ Late Arrivals: 12 (13%)                │  │
│  │ Early Departures: 5 (5%)               │  │
│  │ Absences: 3 (2%)                       │  │
│  └───────────────────────────────────────┘  │
│                                              │
│  👥 Individual Performance:                 │
│  ┌───────────────────────────────────────┐  │
│  │ Staff        Days  Hours  On-Time     │  │
│  ├───────────────────────────────────────┤  │
│  │ Sarah N.      6    48h    83% 🟡     │  │
│  │ Michael C.    6    48h    100% 🟢    │  │
│  │ Emma W.       7    56h    86% 🟡     │  │
│  │ John D.       5    40h    80% 🟡     │  │
│  │ Lisa P.       4    32h    75% 🟡     │  │
│  └───────────────────────────────────────┘  │
│                                              │
│  📊 Daily Breakdown:                        │
│  Thu: 14 staff | Fri: 15 | Sat: 15        │
│  Sun: 12 | Mon: 14 | Tue: 13 | Wed: 11    │
│                                              │
│  [📥 Export PDF]  [📊 Detailed View]        │
│  [📧 Email Report]  [🖨️ Print]              │
└─────────────────────────────────────────────┘
```

## 🎨 Color Coding System

### Status Colors
- 🟢 **Green**: On time, everything normal
- 🟡 **Yellow**: Late arrival or early departure (with reason)
- 🔴 **Red**: Absent or no show
- 🔵 **Blue**: Pending action/approval
- ⚪ **Gray**: Not yet started or day off

### Button Colors
- **Green**: Positive actions (Approve, Submit, Check-in)
- **Red**: Negative actions (Reject, Cancel, Check-out)
- **Blue**: Informational actions (View, Preview, Details)
- **Gray**: Secondary actions (Save Draft, Back, Close)

## 📱 Mobile Responsive Design

All screens adapt to mobile with:
- Larger touch targets (minimum 44x44px)
- Simplified navigation
- Swipe gestures for calendar
- Bottom sheet modals for forms
- Pull-to-refresh for attendance data

## 🎯 User Experience Flow

### Staff Journey
```
Week Start (Sun/Mon)
↓
Open Portal → My Schedule → Next Week
↓
Click Days → Select Shifts
↓
Submit Schedule
↓
Wait for Approval ⏳
↓
Receive Notification ✅

Work Day (Any day)
↓
Arrive at Work → Open Portal
↓
Check In 🟢
↓
Work...
↓
Check Out 🔴
↓
View Hours Worked 📊
```

### Manager Journey
```
Week Start (Tue/Wed)
↓
Open Admin → Schedule Management
↓
View Pending Requests (3) 🔔
↓
Preview Each Schedule 👁️
↓
Approve/Reject ✅/❌
↓
Staff Notified 📧

Daily
↓
Open Attendance Dashboard
↓
Monitor Real-time Check-ins 📊
↓
Handle Notifications 🔔
↓
Review Late/Early Requests
↓
Approve/Reject as needed

Weekly/Monthly
↓
Generate Reports 📊
↓
Export Data 📥
↓
Review Performance 📈
```

## 💡 Design Principles

1. **Simplicity**: Minimal clicks to complete tasks
2. **Clarity**: Clear status indicators and feedback
3. **Responsiveness**: Fast, real-time updates
4. **Accessibility**: Large text, high contrast, clear labels
5. **Consistency**: Same patterns across all screens

## 🚀 Implementation Notes

- Use existing La Perla color scheme (gold, pearl white, charcoal)
- Maintain consistent typography with current app
- Leverage existing icon set or add minimal new icons
- Ensure smooth animations and transitions
- Test on both mobile and desktop thoroughly

---

These mockups serve as a visual guide for implementation. Actual implementation will follow the technical specifications in the main proposal documents.
