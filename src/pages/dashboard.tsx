/*TEST IF FILES IN GITHUB UPDATED */

/*Timer:  uses useState for timeLeft, isRunning, mode (focus/break), and cycle. A useEffect watches
 isRunning and when true starts a setInterval that ticks down every second. When it hits 0 it calls handleTimerEnd 
which decides whether to start a break or the next focus session. After 4 focus sessions it resets everything. */

/* To-do: useState array of todo objects with id, text, and done. 
Adding appends to the array, toggling flips done,
deleting filters it out. */

/* Stats: whenever a focus session completes or a task gets checked, 
it reads from localStorage, updates the numbers, and saves back.  */

/*Settings: clicking the gear icon opens a modal with 3 options. 
Change name calls Firebase's updateProfile. Change password first re-authenticates the user 
then calls updatePassword. Delete account re-authenticates then calls deleteUser. */


import { useState, useEffect, useRef } from "react";
import {
  updateProfile,
  updatePassword,
  deleteUser,
  reauthenticateWithCredential,
  EmailAuthProvider,
  signOut,
} from "firebase/auth";
import { auth } from "../firebase";
import { recordSession, recordTaskChecked, recordTaskUnchecked } from "../utils/stats";
import { loadTodos, saveTodos, Todo } from "../utils/todos";
import { loadTheme, saveTheme, Theme } from "../utils/theme";
import "./dashboard.css";
import logo from "../assets/logo.png";
import analyticsIcon from "../assets/analytics.png";
import settingsIcon from "../assets/settings.png";
import { Page } from "../App";
import { motivationalMessages } from "../constants/messages";

interface DashboardProps {
  onNavigate: (page: Page) => void;
  userName: string;
}

type SettingsView = "menu" | "changeName" | "changePassword" | "deleteAccount" | "theme";
type TimerMode = "focus" | "break";

const TOTAL_CYCLES = 4;

const themeVideoUrls: Record<string, string> = {
  christmas: "https://firebasestorage.googleapis.com/v0/b/timely-pomodoro.firebasestorage.app/o/christmas.mp4?alt=media&token=8c2582a2-da87-4c72-a34f-03c6d6ab558d",
  fall: "https://firebasestorage.googleapis.com/v0/b/timely-pomodoro.firebasestorage.app/o/fall.mp4?alt=media&token=e0542728-bbca-4d06-b921-e4b321dc71b8",
  summer: "https://firebasestorage.googleapis.com/v0/b/timely-pomodoro.firebasestorage.app/o/summer.mp4?alt=media&token=af7b47c1-5b9f-4d22-896b-62e59fd44867",
};

const themeAudioUrls: Record<string, string> = {
  christmas: "https://firebasestorage.googleapis.com/v0/b/timely-pomodoro.firebasestorage.app/o/christmas.mp3?alt=media&token=9cfcf4db-6ad5-47ac-bbf4-413cf0c743e8",
  fall: "https://firebasestorage.googleapis.com/v0/b/timely-pomodoro.firebasestorage.app/o/fall.mp3?alt=media&token=6b38621e-ff12-4765-895c-7dca086c90f6",
  summer: "https://firebasestorage.googleapis.com/v0/b/timely-pomodoro.firebasestorage.app/o/summer.mp3?alt=media&token=8d8b6c86-ce4d-494d-9836-65a356975db9",
};

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};

const themes: { id: Theme; label: string; emoji: string; colors: string }[] = [
  { id: "default", label: "Default", emoji: "🌸", colors: "#E9C3C3" },
  { id: "christmas", label: "Christmas", emoji: "🎄", colors: "#8B0000" },
  { id: "fall", label: "Fall", emoji: "🍂", colors: "#8B4513" },
  { id: "summer", label: "Summer", emoji: "☀️", colors: "#0077b6" },
];

const VideoBackground = ({ theme }: { theme: Theme }) => {
  const videoThemes = ["summer", "fall", "christmas"] as const;
  if (!videoThemes.includes(theme as any)) return null;

  const handlePlaying = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const cover = e.currentTarget.parentElement?.querySelector(".video-cover") as HTMLElement | null;
    if (cover) {
      cover.style.transition = "opacity 0.8s ease";
      cover.style.opacity = "0";
      setTimeout(() => { cover.style.display = "none"; }, 900);
    }
  };

  return (
    <div className="theme-video-bg">
      <video
        key={theme}
        className="theme-video"
        autoPlay
        muted
        loop
        playsInline
        onPlaying={handlePlaying}
      >
        <source src={themeVideoUrls[theme]} type="video/mp4" />
      </video>
      <div className="video-cover" />
      <div className="theme-video-overlay" />
    </div>
  );
};

const Dashboard = ({ onNavigate, userName }: DashboardProps) => {
  const [showSettings, setShowSettings] = useState(false);
  const [view, setView] = useState<SettingsView>("menu");
  const [newName, setNewName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [message] = useState(
    () => motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)]
  );
  const [todos, setTodos] = useState<Todo[]>([]);
  const [todoInput, setTodoInput] = useState("");
  const [todosLoaded, setTodosLoaded] = useState(false);
  const [theme, setTheme] = useState<Theme>("default");
  const [muted, setMuted] = useState(false);

  const [focusMinutes, setFocusMinutes] = useState(45);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [showTimerEdit, setShowTimerEdit] = useState(false);
  const [editFocus, setEditFocus] = useState(45);
  const [editBreak, setEditBreak] = useState(5);

  const FOCUS_TIME = focusMinutes * 60;
  const BREAK_TIME = breakMinutes * 60;

  const [timeLeft, setTimeLeft] = useState(FOCUS_TIME);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<TimerMode>("focus");
  const [cycle, setCycle] = useState(1);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const modeRef = useRef<TimerMode>("focus");
  const cycleRef = useRef(1);
  const elapsedFocusRef = useRef(0);
  const sessionSavedRef = useRef(false);
  const focusTimeRef = useRef(FOCUS_TIME);
  const breakTimeRef = useRef(BREAK_TIME);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  modeRef.current = mode;
  cycleRef.current = cycle;
  focusTimeRef.current = FOCUS_TIME;
  breakTimeRef.current = BREAK_TIME;

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (uid) {
      loadTodos(uid).then(items => { setTodos(items); setTodosLoaded(true); });
      loadTheme(uid).then(t => { setTheme(t); });
    }
  }, []);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (uid && todosLoaded) saveTodos(uid, todos.filter(t => !t.done));
  }, [todos, todosLoaded]);

  useEffect(() => {
    const videoThemes = ["summer", "fall", "christmas"];
    if (!videoThemes.includes(theme)) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    const audio = new Audio(themeAudioUrls[theme]);
    audio.loop = true;
    audio.volume = 0.5;
    audio.muted = muted;
    audio.play().catch(() => {});
    audioRef.current = audio;

    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, [theme]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = muted;
    }
  }, [muted]);

  const handleTimerEnd = async () => {
    if (sessionSavedRef.current) return;
    sessionSavedRef.current = true;
    const uid = auth.currentUser?.uid;
    if (modeRef.current === "focus") {
      const elapsed = elapsedFocusRef.current;
      elapsedFocusRef.current = 0;
      if (uid && elapsed > 0) await recordSession(uid, elapsed);
      if (cycleRef.current >= TOTAL_CYCLES) {
        setMode("focus"); setCycle(1); setTimeLeft(focusTimeRef.current); setIsRunning(false);
      } else {
        setMode("break"); setTimeLeft(breakTimeRef.current); setIsRunning(true);
      }
    } else {
      setCycle(c => c + 1); setMode("focus"); setTimeLeft(focusTimeRef.current); setIsRunning(true);
    }
    setTimeout(() => { sessionSavedRef.current = false; }, 1000);
  };

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        if (modeRef.current === "focus") elapsedFocusRef.current += 1;
        setTimeLeft(prev => {
          if (prev <= 1) { clearInterval(intervalRef.current!); handleTimerEnd(); return 0; }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning]);

  const toggleTimer = () => setIsRunning(prev => !prev);

  const resetTimer = () => {
    setIsRunning(false); setMode("focus"); setCycle(1);
    setTimeLeft(FOCUS_TIME); elapsedFocusRef.current = 0;
  };

  const saveTimerSettings = () => {
    if (editFocus < 1 || editFocus > 120 || editBreak < 1 || editBreak > 60) return;
    setFocusMinutes(editFocus); setBreakMinutes(editBreak);
    setIsRunning(false); setMode("focus"); setCycle(1);
    setTimeLeft(editFocus * 60); elapsedFocusRef.current = 0;
    setShowTimerEdit(false);
  };

  const selectTheme = async (t: Theme) => {
    setTheme(t);
    const uid = auth.currentUser?.uid;
    if (uid) await saveTheme(uid, t);
  };

  const addTodo = () => {
    if (!todoInput.trim()) return;
    setTodos(prev => [...prev, { id: Date.now(), text: todoInput.trim(), done: false }]);
    setTodoInput("");
  };

  const toggleTodo = (id: number) => {
    const uid = auth.currentUser?.uid;
    setTodos(prev => {
      const todo = prev.find(t => t.id === id);
      if (uid && todo) {
        if (!todo.done) recordTaskChecked(uid);
        else recordTaskUnchecked(uid);
      }
      return prev.map(t => t.id === id ? { ...t, done: !t.done } : t);
    });
  };

  const deleteTodo = (id: number) => setTodos(prev => prev.filter(t => t.id !== id));
  const clearDone = () => setTodos(prev => prev.filter(t => !t.done));

  const closeModal = () => {
    setShowSettings(false); setView("menu");
    setError(""); setSuccess("");
    setNewName(""); setNewPassword("");
    setConfirmPassword(""); setCurrentPassword("");
  };

  const reauth = async (password: string) => {
    const credential = EmailAuthProvider.credential(auth.currentUser!.email!, password);
    await reauthenticateWithCredential(auth.currentUser!, credential);
  };

  const handleChangeName = async () => {
    if (!newName.trim()) { setError("Please enter a name."); return; }
    setLoading(true); setError("");
    try {
      await updateProfile(auth.currentUser!, { displayName: newName.trim() });
      await auth.currentUser!.reload();
      setSuccess("Name updated! Refresh to see it.");
    } catch { setError("Failed to update name."); }
    finally { setLoading(false); }
  };

  const handleChangePassword = async () => {
    if (!currentPassword) { setError("Enter your current password."); return; }
    if (!newPassword) { setError("Enter a new password."); return; }
    if (newPassword !== confirmPassword) { setError("Passwords don't match."); return; }
    if (newPassword.length < 6) { setError("Password must be at least 6 characters."); return; }
    setLoading(true); setError("");
    try {
      await reauth(currentPassword);
      await updatePassword(auth.currentUser!, newPassword);
      setSuccess("Password updated!");
    } catch (err: any) {
      setError(err.code === "auth/invalid-credential" ? "Current password is incorrect." : "Failed to update password.");
    } finally { setLoading(false); }
  };

  const handleDeleteAccount = async () => {
    if (!currentPassword) { setError("Enter your password to confirm."); return; }
    setLoading(true); setError("");
    try {
      await reauth(currentPassword);
      await deleteUser(auth.currentUser!);
    } catch (err: any) {
      setError(err.code === "auth/invalid-credential" ? "Incorrect password." : "Failed to delete account.");
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-layout" data-theme={theme}>
      <VideoBackground theme={theme} />
      <nav className="navbar">
        <img src={logo} alt="logo" className="logo" />
        <div className="nav-icons">
          <span className="icon nav-icon--active" onClick={() => onNavigate("analytics")}>
            <img src={analyticsIcon} alt="analytics" className="analytics" />
          </span>
          <span className="icon nav-icon--active" onClick={() => { setShowSettings(true); setView("menu"); }}>
            <img src={settingsIcon} alt="settings" className="settings" />
          </span>
          {["summer", "fall", "christmas"].includes(theme) && (
            <button
              className="music-toggle-btn"
              onClick={() => setMuted(prev => !prev)}
              title={muted ? "Unmute music" : "Mute music"}
            >
              {muted ? "🔇" : "🎵"}
            </button>
          )}
          <button className="logout-btn" onClick={() => signOut(auth)}>Log out</button>
        </div>
      </nav>

      <main className="main-content">
        <div className="welcome-section">
          <h1 className="welcome-title">Welcome Back, {userName}!</h1>
          <p className="motivational-message">{message}</p>
        </div>

        <div className="panels-row">
          <div className={`panel timer-panel ${mode === "break" ? "timer-panel--break" : ""}`}>
            <div className="panel-menu panel-menu--edit" onClick={() => { setEditFocus(focusMinutes); setEditBreak(breakMinutes); setShowTimerEdit(true); }}>✎</div>
            <div className="panel-menu panel-menu--reset" onClick={resetTimer}>↺</div>
            <div className="cycle-indicator">
              {Array.from({ length: TOTAL_CYCLES }).map((_, i) => (
                <span key={i} className={`cycle-dot ${i < cycle ? "cycle-dot--active" : ""}`} />
              ))}
            </div>
            <div className="timer-display">{formatTime(timeLeft)}</div>
            <button className="start-btn" onClick={toggleTimer}>{isRunning ? "PAUSE" : "START"}</button>
            <p className="focus-label">{mode === "break" ? "[BREAK TIME]" : "[FOCUS MODE]"}</p>
          </div>

          <div className="panel todo-panel">
            <div className="todo-header-row">
              <h2 className="todo-title">TO DO</h2>
              {todos.some(t => t.done) && (
                <button className="todo-clear-btn" onClick={clearDone}>Clear done</button>
              )}
            </div>
            <div className="todo-input-row">
              <input
                className="todo-input"
                type="text"
                placeholder="Add a task..."
                value={todoInput}
                onChange={(e) => setTodoInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addTodo()}
              />
              <button className="todo-add-btn" onClick={addTodo}>+</button>
            </div>
            <ul className="todo-list">
              {todos.map(todo => (
                <li key={todo.id} className={`todo-item ${todo.done ? "todo-item--done" : ""}`}>
                  <input type="checkbox" className="todo-checkbox" checked={todo.done} onChange={() => toggleTodo(todo.id)} />
                  <span className="todo-text">{todo.text}</span>
                  <button className="todo-delete-btn" onClick={() => deleteTodo(todo.id)}>✕</button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>

      {showTimerEdit && (
        <div className="modal-overlay" onClick={() => setShowTimerEdit(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowTimerEdit(false)}>✕</button>
            <h2 className="modal-title">Edit Timer</h2>
            <label className="timer-edit-label">Focus duration (minutes)</label>
            <input className="modal-input" type="number" min={1} max={120} value={editFocus} onChange={(e) => setEditFocus(Number(e.target.value))} />
            <label className="timer-edit-label">Break duration (minutes)</label>
            <input className="modal-input" type="number" min={1} max={60} value={editBreak} onChange={(e) => setEditBreak(Number(e.target.value))} />
            <button className="modal-submit" onClick={saveTimerSettings}>Save</button>
          </div>
        </div>
      )}

      {showSettings && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>✕</button>
            {view === "menu" && (
              <>
                <h2 className="modal-title">Settings</h2>
                <button className="settings-option-btn" onClick={() => { setView("theme"); setError(""); setSuccess(""); }}>🎨 Change Theme</button>
                <button className="settings-option-btn" onClick={() => { setView("changeName"); setError(""); setSuccess(""); }}>✏️ Change Name</button>
                <button className="settings-option-btn" onClick={() => { setView("changePassword"); setError(""); setSuccess(""); }}>🔒 Change Password</button>
                <button className="settings-option-btn settings-option-btn--danger" onClick={() => { setView("deleteAccount"); setError(""); setSuccess(""); }}>🗑️ Delete Account</button>
              </>
            )}
            {view === "theme" && (
              <>
                <button className="modal-back" onClick={() => setView("menu")}>← Back</button>
                <h2 className="modal-title">Choose Theme</h2>
                <div className="theme-grid">
                  {themes.map(t => (
                    <button
                      key={t.id}
                      className={`theme-card ${theme === t.id ? "theme-card--active" : ""}`}
                      style={{ borderColor: t.colors }}
                      onClick={() => selectTheme(t.id)}
                    >
                      <span className="theme-emoji">{t.emoji}</span>
                      <span className="theme-label">{t.label}</span>
                      <div className="theme-swatch" style={{ backgroundColor: t.colors }} />
                    </button>
                  ))}
                </div>
              </>
            )}
            {view === "changeName" && (
              <>
                <button className="modal-back" onClick={() => { setView("menu"); setError(""); setSuccess(""); }}>← Back</button>
                <h2 className="modal-title">Change Name</h2>
                <input className="modal-input" type="text" placeholder="New name" value={newName} onChange={(e) => setNewName(e.target.value)} />
                {error && <p className="modal-error">{error}</p>}
                {success && <p className="modal-success">{success}</p>}
                <button className="modal-submit" onClick={handleChangeName} disabled={loading}>{loading ? "Saving..." : "Save Name"}</button>
              </>
            )}
            {view === "changePassword" && (
              <>
                <button className="modal-back" onClick={() => { setView("menu"); setError(""); setSuccess(""); }}>← Back</button>
                <h2 className="modal-title">Change Password</h2>
                <input className="modal-input" type="password" placeholder="Current password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                <input className="modal-input" type="password" placeholder="New password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                <input className="modal-input" type="password" placeholder="Confirm new password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                {error && <p className="modal-error">{error}</p>}
                {success && <p className="modal-success">{success}</p>}
                <button className="modal-submit" onClick={handleChangePassword} disabled={loading}>{loading ? "Saving..." : "Update Password"}</button>
              </>
            )}
            {view === "deleteAccount" && (
              <>
                <button className="modal-back" onClick={() => { setView("menu"); setError(""); setSuccess(""); }}>← Back</button>
                <h2 className="modal-title">Delete Account</h2>
                <p className="modal-warning">This cannot be undone. Enter your password to confirm.</p>
                <input className="modal-input" type="password" placeholder="Your password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                {error && <p className="modal-error">{error}</p>}
                <button className="modal-submit modal-submit--danger" onClick={handleDeleteAccount} disabled={loading}>{loading ? "Deleting..." : "Delete My Account"}</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;