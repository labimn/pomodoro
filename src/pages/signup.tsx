/* 
TWO MODES: login, signup
On signup it calls createUserWithEmailAndPassword to create the account, then immediately calls updateProfile to save 
the display name, then signs out and  back in so Firebase reloads the user with the name properly set. 
On login it just calls signInWithEmailAndPassword. 
*/

import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { auth } from "../firebase";
import "./signup.css";
import logo from "../assets/logo.png";

type AuthMode = "none" | "signup" | "login";

const Signup = () => {
  const [mode, setMode] = useState<AuthMode>("none");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
const handleSubmit = async () => {
  setError("");
  if (!email || !password) { setError("Please fill in all fields."); return; }
  if (mode === "signup" && !name) { setError("Please enter your name."); return; }

  setLoading(true);
  try {
    if (mode === "signup") {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: name });
      await auth.signOut();
      await signInWithEmailAndPassword(auth, email, password);
    } else {
      await signInWithEmailAndPassword(auth, email, password);
    }
  } catch (err: any) {
    const msg: Record<string, string> = {
      "auth/email-already-in-use": "That email is already registered.",
      "auth/invalid-email": "Invalid email address.",
      "auth/weak-password": "Password must be at least 6 characters.",
      "auth/invalid-credential": "Incorrect email or password.",
      "auth/user-not-found": "No account found with that email.",
      "auth/wrong-password": "Incorrect password.",
    };
    setError(msg[err.code] || "Something went wrong. Try again.");
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="back-container">
      <img src={logo} alt="logo" className="logo" />

      <button className="already-user-btn" onClick={() => { setMode("login"); setError(""); }}>
        Already a user?
      </button>

      <div className="text-container">
        <h1 className="headline">Distraction Free Studying...</h1>
        <p className="subtitle">Welcome to Timely, a pomodoro technique app!</p>
        <div className="button-container">
          <button className="get-started-btn" onClick={() => { setMode("signup"); setError(""); }}>
            Get Started
          </button>
        </div>
      </div>

      {mode !== "none" && (
        <div className="modal-overlay" onClick={() => setMode("none")}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setMode("none")}>✕</button>
            <h2 className="modal-title">{mode === "signup" ? "Create Account" : "Welcome Back"}</h2>

            {mode === "signup" && (
              <input
                className="modal-input"
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            )}
            <input
              className="modal-input"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              className="modal-input"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {error && <p className="modal-error">{error}</p>}

            <button className="modal-submit" onClick={handleSubmit} disabled={loading}>
              {loading ? "Please wait..." : mode === "signup" ? "Sign Up" : "Log In"}
            </button>

            <p className="modal-switch">
              {mode === "signup" ? (
                <>Already have an account?{" "}
                  <span onClick={() => { setMode("login"); setError(""); }}>Log in</span>
                </>
              ) : (
                <>New here?{" "}
                  <span onClick={() => { setMode("signup"); setError(""); }}>Sign up</span>
                </>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Signup;