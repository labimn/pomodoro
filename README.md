Timely is a simple, distraction‑free productivity app built with React, TypeScript, and Firebase. It combines a Pomodoro timer, a to‑do list, user authentication, and basic analytics.

- Features
  
Pomodoro Timer

Focus and break cycles

Auto‑switching between modes

Editable durations

Four‑cycle Pomodoro system

Session stats saved per user

To‑Do List

Add, toggle, and delete tasks

Clear completed tasks

Tasks persist per user

Tech Stack

- React + TypeScript

Firebase Authentication

Firebase Firestore

Vite

CSS

- Project Structure

src/
 ├── App.tsx
 ├── firebase.ts
 ├── main.tsx
 ├── pages/
 │    ├── dashboard.tsx
 │    ├── analytics.tsx
 │    └── signup.tsx
 ├── utils/
 │    ├── stats.ts
 │    ├── todos.ts
 │    └── theme.ts
 ├── assets/
 ├── styles/
 │    ├── dashboard.css
 │    ├── analytics.css
 │    └── signup.css

- Installation

npm install
npm run dev

- Summary
Timely provides a clean interface for studying with the Pomodoro technique. It includes a timer, tasks, themes, and user‑specific stats, all backed by Firebase.
