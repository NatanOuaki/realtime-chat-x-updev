import { useState } from "react";

export default function Register({ onRegistered, onGoLogin }) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleRegister = async () => {
        setError("");
        setSuccess("");

        if (!username.trim() || !password.trim()) {
        setError("Tous les champs sont obligatoires");
        return;
        }

        const res = await fetch("http://localhost:8000/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        });

        const data = await res.json();

        if (!res.ok) {
        setError(data.detail || "Erreur lors de la création du compte");
        return;
        }

        setSuccess("Compte créé avec succès !");
        setTimeout(() => onRegistered(), 1200);
    };

    return (
        <div className="login-page">
        <div className="login-card">
            <h1>Créer un compte</h1>
            <p className="subtitle">Rejoignez le chat en créant votre compte.</p>

            <input
            type="text"
            placeholder="Choisissez un pseudo"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            />

            <input
            type="password"
            placeholder="Choisissez un mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            />

            {error && <p className="error">{error}</p>}
            {success && <p className="success">{success}</p>}

            <button onClick={handleRegister}>Créer mon compte</button>

            <p className="switch-text">
            Déjà inscrit ?{" "}
            <span className="link" onClick={onGoLogin}>
                Se connecter
            </span>
            </p>
        </div>
        </div>
    );
}
