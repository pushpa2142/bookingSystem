# 🚌 BusConnect — Bus Ticket Booking System (Angular 16)

A fully frontend-based Bus Ticket Booking System for a Bus Conductor, built with **Angular 16**.  
All data is managed via **localStorage** — no backend or API calls.  
localStorage is **automatically cleared** when the user leaves/closes the page.

---

## 📋 Project Summary

| Item | Details |
|------|---------|
| Framework | Angular 16 |
| Styling | SCSS with CSS Variables |
| Font | Sora (Google Fonts) |
| Data Storage | Browser localStorage (cleared on page leave) |
| Routing | Angular Router (2 screens) |
| State | RxJS BehaviorSubject |

---

## 🖥️ Screens

### Screen 1 — Book / Update / Edit Booking (`/book`)
- Travel Date picker (today onwards)
- Mobile Number input with validation (must start with 6–9, 10 digits)
- Interactive 2×2 seat layout — 15 rows (60 seats: A1–D15)
- Max 6 seats per mobile per day enforced
- Edit mode via `?bookingId=XXX` query param
- Confirmation popup on success: Booking ID, Date, Mobile, Seats

### Screen 2 — Booking List & Boarding Tracking (`/bookings`)
- Filter by travel date
- Table: #, Booking ID, Seats, Mobile (with call button), Board action
- 60-second settling timer per booking (progress bar)
- **Optimal Boarding Sequence View** — toggleable algorithm view

---

## ⚡ Optimal Boarding Algorithm

**Problem:** Minimize total boarding time for all passengers.

**Solution:** Board passengers **back-to-front** (highest row number first).

```
Seats in rows 1–15, where row 1 = front, row 15 = back.

For each booking, find the maximum row number among selected seats.
Sort bookings descending by this max row → board back-to-front.

Result: No passenger blocks another → total time = 60s (one settling cycle)
regardless of number of bookings.

Time complexity: O(n log n)
```

**Example:**
| Sequence | Booking ID | Seat | Why |
|----------|-----------|------|-----|
| 1 | 333 | A15 | Furthest back, boards first |
| 2 | 222 | A7  | Middle |
| 3 | 111 | A1  | Front, boards last |

No blocking → Total time = **60 seconds** ✅

---

## 🗂️ Project Structure

```
bus-booking-system/
├── src/
│   ├── app/
│   │   ├── models/
│   │   │   └── booking.model.ts          # Interfaces & Enums
│   │   ├── services/
│   │   │   ├── local-storage.service.ts  # All localStorage CRUD
│   │   │   └── booking.service.ts        # Business logic + algorithm
│   │   ├── components/
│   │   │   ├── navbar/                   # Top navigation
│   │   │   ├── booking/                  # Screen 1: Book/Edit
│   │   │   ├── booking-list/             # Screen 2: List & Boarding
│   │   │   ├── seat-layout/              # 2×2 seat grid (15 rows)
│   │   │   └── confirmation-modal/       # Booking success popup
│   │   ├── app.module.ts
│   │   ├── app-routing.module.ts
│   │   └── app.component.ts/html/scss
│   ├── styles.scss                       # Global CSS variables & base styles
│   ├── index.html
│   └── main.ts
├── angular.json
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🚀 Setup & Execution Steps

### Prerequisites
Make sure you have the following installed:

```bash
node --version   # v16.x or v18.x recommended
npm --version    # v8+
ng version       # Angular CLI 16.x
```

Install Angular CLI globally if not already installed:
```bash
npm install -g @angular/cli@16
```

---

### Step 1 — Extract the ZIP

```bash
unzip bus-booking-system.zip
cd bus-booking-system
```

---

### Step 2 — Install Dependencies

```bash
npm install
```

This will install all Angular 16 dependencies listed in `package.json`.

---

### Step 3 — Run the Development Server

```bash
ng serve
```

Or with npm:
```bash
npm start
```

Navigate to **http://localhost:4200** in your browser.

The app will automatically reload if you change any source files.

---

### Step 4 — Build for Production (Optional)

```bash
ng build
```

The build artifacts will be stored in the `dist/bus-booking-system/` directory.

---

## 🧩 Key Features

### Data Management
- All bookings stored in `localStorage` key: `bus_bookings`
- Data auto-cleared via `window.beforeunload` event
- Full CRUD: Create, Read, Update, Delete bookings

### Validations
- Travel date: required, must be today or future
- Mobile: 10 digits, must start with 6–9 (Indian numbers)
- Max 6 seats per mobile per day
- Seats can't be double-booked on same date
- Edit mode re-validates excluding the current booking

### Boarding Logic
- Click "Board" → status changes to `SETTLING` (60s timer starts)
- Progress bar shows settling progress
- After 60s → status changes to `BOARDED`
- Cannot re-board or edit a boarded passenger
- Phone icon initiates a call via `tel:` link

---

## 🎨 UI/UX Highlights

- **Responsive** — works on mobile, tablet, desktop
- **Dark-ready** — uses CSS variables for easy theming
- **Font** — Sora (modern, clean, highly readable)
- **Color system** — blue accent, semantic success/warning/danger
- **Animations** — modal slide-up, seat hover, button transitions
- **Accessible** — aria-labels on all interactive seat buttons

---

## 📌 Assumptions Made

1. Seat IDs follow pattern: `{Column}{Row}` → A1 to D15
2. Columns: A, B (left of aisle) | C, D (right of aisle)
3. Row 1 = front of bus, Row 15 = back of bus
4. A "booking" can contain seats from any row/column combination
5. The 6-seat limit is per mobile number per day across all bookings
6. Boarding algorithm groups all seats under one Booking ID together
7. localStorage is the single source of truth (no persistence across sessions by design)

---

## 👨‍💻 Author

**Project:** Bus Ticket Booking System — Bus Conductor Portal  
**Technology:** Angular 16, SCSS, TypeScript, localStorage  
**Submitted by:** pushpakeerthi2896@gmail.com
