/* On load it reads the pomodoroStats object from localStorage and displays sessions completed, total minutes focused,
 and tasks checked off.*/
 
import { useState, useEffect } from "react";
import "./analytics.css";
import logo from "../assets/logo.png";
import analyticsIcon from "../assets/analytics.png";
import settings from "../assets/settings.png";
import { Page } from "../App";
import { auth } from "../firebase";
import { getStats } from "../utils/stats";

interface AnalyticsProps {
  onNavigate: (page: Page) => void;
}

interface Stats {
  sessions: number;
  minutes: number;
  tasks: number;
}

const Analytics = ({ onNavigate }: AnalyticsProps) => {
  const [stats, setStats] = useState<Stats>({ sessions: 0, minutes: 0, tasks: 0 });

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (uid) getStats(uid).then(setStats);
  }, []);

  const hours = Math.floor(stats.minutes / 60);
  const mins = stats.minutes % 60;
  const timeLabel = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

  return (
    <div className="analytics-layout">
      <nav className="navbar">
        <img src={logo} alt="logo" className="logo" 
         style={{ cursor: "pointer" }}
  onClick={() => onNavigate("dashboard")}
        />
        <div className="nav-icons">
          <span className="icon nav-icon--active" title="Dashboard" onClick={() => onNavigate("dashboard")}>
            <img src={analyticsIcon} alt="analytics" className="analytics-icon" />
          </span>
          <span className="icon">
            <img src={settings} alt="settings" className="settings-icon" />
          </span>
        </div>
      </nav>

      <main className="main-content">
        <div className="analytics-header">
        
        
        </div>
        <div className="cards-container">
          <div className="card">
            <p className="card-label">Focus Sessions</p>
            <p className="card-value">{stats.sessions}</p>
            <p className="card-desc">completed pomodoros</p>
          </div>
          <div className="card">
            <p className="card-label">Time Focused</p>
            <p className="card-value">{timeLabel}</p>
            <p className="card-desc">of deep work</p>
          </div>
          <div className="card">
            <p className="card-label">Tasks Done</p>
            <p className="card-value">{stats.tasks}</p>
            <p className="card-desc">tasks completed</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Analytics;