import { useState } from "react";

export default function Login({ onLogin, onGoRegister }) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleLogin = async () => {
        setError("");

        if (!username.trim() || !password.trim()) {
        setError("Tous les champs sont obligatoires");
        return;
        }

        const res = await fetch("http://localhost:8000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        });

        const data = await res.json();

        if (!res.ok) {
        setError(data.detail || "Identifiants incorrects");
        return;
        }

        onLogin({
        username: data.username,
        token: data.access_token,
        });
    };

    return (
        <div className="login-page">
        <div className="login-card">
            <h1>Connexion</h1>
            <p className="subtitle">Entrez vos identifiants pour accéder au chat.</p>

            <input
            type="text"
            placeholder="Pseudo"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            />

            <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            />

            {error && <p className="error">{error}</p>}

            <button onClick={handleLogin}>Se connecter</button>

            <p className="switch-text">
            Pas encore de compte ?{" "}
            <span className="link" onClick={onGoRegister}>
                Créer un compte
            </span>
            </p>
        </div>
        </div>
    );
}
