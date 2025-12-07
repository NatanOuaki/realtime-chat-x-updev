import { useState } from "react";
import Login from "./Login";
import Register from "./Register";
import Chat from "./components/Chat";
import "./App.css";

export default function App() {
  const [session, setSession] = useState(null);
  const [mode, setMode] = useState("login"); // "login" | "register"

  if (session) {
    return <Chat session={session} onLogout={() => setSession(null)} />;
  }

  if (mode === "register") {
    return (
      <Register
        onRegistered={() => setMode("login")}
        onGoLogin={() => setMode("login")}
      />
    );
  }

  return (
    <Login
      onLogin={(s) => setSession(s)}
      onGoRegister={() => setMode("register")}
    />
  );
}
