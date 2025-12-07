import { useEffect, useState, useRef } from "react";

const WS_URL = "ws://localhost:8000/ws";
const API_URL = "http://localhost:8000/messages";

export default function Chat({ session, onLogout }) {
    const [ws, setWs] = useState(null);
    const [messages, setMessages] = useState([]);
    const [content, setContent] = useState("");
    const [error, setError] = useState("");
    const [typingUser, setTypingUser] = useState(null);
    const messagesEndRef = useRef(null);

    const username = session.username;
    const token = session.token;

    // Charger historique
    useEffect(() => {
        fetch(API_URL)
        .then((res) => res.json())
        .then((data) => setMessages(data))
        .catch(() => setError("Impossible de récupérer l'historique."));
    }, []);

    // WebSocket
    useEffect(() => {
        const socket = new WebSocket(WS_URL);
        setWs(socket);

        socket.onmessage = (event) => {
        const msg = JSON.parse(event.data);

        if (msg.event === "typing") {
            if (msg.username !== username) {
            setTypingUser(msg.username);
            setTimeout(() => setTypingUser(null), 1500);
            }
            return;
        }

        if (msg.event === "message") {
            setMessages((prev) => [...prev, msg]);
        }
        };

        return () => socket.close();
    }, [token, username]);

    // Envoyer message
    const sendMessage = () => {
        if (!ws || ws.readyState !== WebSocket.OPEN) {
        setError("Connexion WebSocket non établie.");
        return;
        }

        if (!content.trim()) return;

        ws.send(
        JSON.stringify({
            event: "message",
            token,
            content,
        })
        );

        setContent("");
    };

    // Typing
    const handleTyping = () => {
        if (!ws || ws.readyState !== WebSocket.OPEN) return;

        ws.send(
        JSON.stringify({
            event: "typing",
            token,
        })
        );
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") sendMessage();
    };

    const scrollToBottom = () => {
    if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
    };

    function formatDateHeader(dateString) {
        const date = new Date(dateString);
        const today = new Date();

        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);

        const d = date.toLocaleDateString("fr-FR", { timeZone: "Asia/Jerusalem" });
        const t = today.toLocaleDateString("fr-FR", { timeZone: "Asia/Jerusalem" });
        const y = yesterday.toLocaleDateString("fr-FR", { timeZone: "Asia/Jerusalem" });

        if (d === t) return "Aujourd’hui";
        if (d === y) return "Hier";

        return date.toLocaleDateString("fr-FR", {
            timeZone: "Asia/Jerusalem",
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    }


    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    return (
    <div className="chat-page">
        <div className="chat-card">

        <header className="chat-header">
            <div>
            <h1>Chat en temps réel</h1>
            <p className="subtitle">
                Connecté en tant que <strong>{username}</strong>
            </p>
            </div>
            <button className="logout-btn" onClick={onLogout}>
            Déconnexion
            </button>
        </header>

        <div className="messages-container">

            {messages.map((m, index) => {
            const currentDate = new Date(m.timestamp).toLocaleDateString("fr-FR", {
                timeZone: "Asia/Jerusalem",
            });

            const previousDate =
                index > 0
                ? new Date(messages[index - 1].timestamp).toLocaleDateString("fr-FR", {
                    timeZone: "Asia/Jerusalem",
                    })
                : null;

            const showDateHeader = currentDate !== previousDate;

            return (
                <div key={m.id}>
                
                {showDateHeader && (
                    <div className="date-separator">
                    {formatDateHeader(m.timestamp)}
                    </div>
                )}

                <div
                    className={
                    m.username === username ? "message message-me" : "message"
                    }
                >
                    <div className="message-meta">
                    <span className="message-user">{m.username}</span>
                    <span className="message-time">
                        {new Date(m.timestamp).toLocaleTimeString("fr-FR", {
                        timeZone: "Asia/Jerusalem",
                        hour: "2-digit",
                        minute: "2-digit",
                        })}
                    </span>
                    </div>

                    <div className="message-content">{m.content}</div>
                </div>

                </div>
            );
            })}

            {typingUser && (
            <p className="typing-indicator">
                {typingUser} est en train d'écrire…
            </p>
            )}

            {/* marqueur pour le scroll auto */}
            <div ref={messagesEndRef}></div>
        </div>

        <div className="input-row">
            <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => {
                handleKeyDown(e);
                handleTyping();
            }}
            placeholder="Écrivez votre message..."
            />
            <button onClick={sendMessage}>Envoyer</button>
        </div>

        </div>
    </div>
    );

}
