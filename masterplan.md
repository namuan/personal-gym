# Personal Exercise Gym Instructor — Master Plan

## App Overview & Objectives

A web-based Personal Exercise Gym Instructor that guides users through home workouts step by step. Users pre-load a single workout plan with exercises, sets, reps, and text instructions. During a session, the app walks them through each set with auto-timed rest periods, tracks their progress, and stores a history of completed workouts — all stored locally on the device.

**Core objective**: Replace the need for a human trainer during home workouts by providing structured, guided workout sessions that are simple to set up and follow.

---

## Target Audience

- **Primary**: Beginners and intermediate fitness enthusiasts working out at home
- **Secondary**: Anyone looking for a lightweight, no-fuss workout tracker without social features or complex metrics
- **Devices**: Mobile, tablet, and desktop users (responsive web app)
- **Goals**: General fitness, weight loss, muscle building, or any personal fitness objective

---

## Core Features & Functionality

### MVP (Phase 1)

1. **Single Workout Plan Editor**
   - Create and edit one active workout plan
   - Add exercises in a flat list (no categories)
   - For each exercise: name, number of sets, number of reps, text instructions, default rest time
   - Save plan locally on device

2. **Guided Workout Session**
   - Start session with the saved plan
   - Set-by-set breakdown: guides user through each set of each exercise
   - Per-exercise rest timer counts down after each set (user can override/skip)
   - Mark sets as completed
   - Navigate to next exercise once all sets are done
   - Session summary on completion

3. **Workout History**
   - Date-stamped list of past completed sessions
   - Expandable detail view showing exercises, sets, reps completed
   - Stored locally on device

### Post-MVP (Future)

- Multiple workout plans with names
- Exercise library with saved exercises
- Static images / diagrams for form guidance
- Audio cues (voice countdown, rest timer end)
- Charts and trends (weekly volume, streaks)
- Export/import workout data
- Cloud sync with optional account

---

## High-Level Technical Stack Recommendations

| Layer | Recommendation | Rationale |
|---|---|---|
| **Frontend Framework** | **React** | Mature ecosystem, excellent PWA support, large community |
| **Styling** | Tailwind CSS | Rapid responsive design, consistent cross-browser output |
| **State Management** | React Context + useReducer | Lightweight for local-only data; no need for Redux at MVP scale |
| **Local Storage** | IndexedDB (via Dexie.js or idb) | Structured storage for plans and history; survives browser clears better than localStorage for larger data |
| **PWA** | Vite PWA Plugin (workbox) | Offline-capable, installable on mobile/desktop, full cross-browser support |
| **Testing** | Vitest + React Testing Library | Component and logic testing |
| **Build Tool** | Vite | Fast dev experience, optimal production builds |

### Why PWA over native mobile app?

- Single codebase works on Chrome, Safari, Edge, Firefox across all screen sizes
- No app store approval or updates needed
- Installable on phone home screen for app-like experience
- Offline capable once loaded
- Lowest barrier to entry for users

---

## Conceptual Data Model

```
WorkoutPlan (single, active)
  ├── exercises: Exercise[]
  └── createdAt: timestamp

Exercise
  ├── name: string
  ├── sets: number
  ├── reps: number
  ├── instructions: string
  ├── restSeconds: number
  └── order: number

WorkoutSession (completed)
  ├── date: timestamp
  ├── planSnapshot: Exercise[] (copy of plan at time of workout)
  ├── completedSets: CompletedSet[]
  └── totalDuration: number

CompletedSet
  ├── exerciseIndex: number
  ├── setNumber: number
  ├── repsCompleted: number
  └── restTaken: number
```

---

## User Interface Design Principles

- **Clarity over flair** — Large, readable text; high contrast; generous tap targets for mobile
- **Minimalist layout** — Focus on the current exercise/set; remove distractions
- **Consistent navigation** — Clear back/next/complete buttons in predictable positions
- **Progress visibility** — Show "Set 2 of 3", "Exercise 3 of 6" so users always know where they are
- **Responsive** — Single column on mobile, two-column on tablet/desktop for wider view
- **Rest timer** — Full-screen countdown when resting, large tap-to-skip button

---

## Security Considerations

- **No user accounts or passwords** at MVP stage — zero authentication surface
- All data stored locally in the browser (IndexedDB)
- No network requests for core functionality
- If cloud sync is added later: encrypt data in transit (HTTPS) and at rest; consider passkey-based auth for passwordless security

---

## Development Phases & Milestones

### Phase 1 — MVP (estimated 4–6 weeks)

| Milestone | Description |
|---|---|
| **M1: Project setup** | Vite + React + Tailwind + PWA setup, responsive layout shell |
| **M2: Data layer** | IndexedDB service for saving/loading plans and sessions |
| **M3: Plan editor** | UI for creating/editing/saving workout plan with exercises |
| **M4: Workout session** | Guided set-by-set flow with rest timer, completion tracking |
| **M5: History** | View past sessions with expandable details |
| **M6: Polish** | Responsive testing across devices/browsers, PWA install flow, edge cases |

## Potential Challenges & Solutions

| Challenge | Mitigation |
|---|---|
| **IndexedDB browser limits** | Some mobile browsers may clear IndexedDB under storage pressure. Implement data export and inform users. |
| **Rest timer accuracy on mobile** | Use `requestAnimationFrame` or Web Worker for timer precision. Handle background tab throttling gracefully. |
| **PWA not installing on iOS** | Safari has stricter PWA requirements. Provide clear install instructions and fallback to browser usage. |
| **User accidentally leaves session** | Auto-save current progress periodically (e.g., after each set). Resume prompt on return. |
| **Cross-browser consistency** | Use Tailwind's built-in reset and test on Chrome, Safari, Firefox, Edge before each release. |

---

*This masterplan is a living document. As you build and test, feel free to revisit and adjust any part of it.*
