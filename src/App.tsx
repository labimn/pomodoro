/* When the app loads, this file listens for Firebase auth state with onAuthStateChanged. 
If no user is logged in --> shows the Signup page. 
If a user is logged in --> shows the Dashboard. 
Firebase stores the user's email/password and display name */


import { useState, useEffect } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "./firebase";
import Analytics from "./pages/analytics";
import Signup from "./pages/signup";
import Dashboard from "./pages/dashboard";

export type Page = "dashboard" | "analytics";

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");

useEffect(() => {
  const unsub = onAuthStateChanged(auth, async (u) => {
    if (u) {
      await u.reload();
      const fresh = auth.currentUser;
      setUser(fresh);
    } else {
      setUser(null);
    }
    setLoading(false);
  });
  return unsub;
}, []);

  if (loading) return null;

  if (!user) return <Signup />;

  const displayName = user.displayName || 
    (user.email ? user.email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "Friend");

  return currentPage === "dashboard" ? (
    <Dashboard onNavigate={setCurrentPage} userName={displayName} />
  ) : (
    <Analytics onNavigate={setCurrentPage} />
  );
};

export default App;