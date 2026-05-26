import { useState, useEffect } from "react";
import { api } from "./api";
import "./style.css";

function App() {
  const [page, setPage] = useState("login");

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");

  const [notice, setNotice] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);

  const [currentUser, setCurrentUser] = useState(localStorage.getItem("user_id"));
  const [friends, setFriends] = useState([]);
  const [searchId, setSearchId] = useState("");
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  useEffect(() => {
    if (currentUser) {
      loadFriends();
      setPage("chat");
    }
  }, [currentUser]);

  

  useEffect(() => {
    if (!currentUser) return;

    const ws = new WebSocket(`wss://priva-backend.onrender.com/ws/${currentUser}`);

    ws.onmessage = () => {
      loadFriends();

      if (selectedFriend) {
        loadMessages();
      }
    };

    return () => {
      ws.close();
    };
  }, [currentUser, selectedFriend]);

  useEffect(() => {
    if (!currentUser) return;

    loadFriends();

    const interval = setInterval(() => {
      loadFriends();
    }, 3000);

    return () => clearInterval(interval);
  }, [currentUser]);

  const connectSocket = () => {
    const ws = new WebSocket(`ws://localhost:8000/ws/${currentUser}`);

    ws.onmessage = (event) => {
      const incoming = JSON.parse(event.data);

      // only reload chat if message belongs to the currently opened chat
      if (
        selectedFriend &&
        (incoming.sender_id === selectedFriend || incoming.receiver_id === selectedFriend)
      ) {
        loadMessages();
      }

      loadFriends();
    };
  };

  const sendOtp = async () => {
    setNotice("");

    if (!email.includes("@") || !email.includes(".")) {
      setNotice("Please enter a valid email address.");
      return;
    }

    const res = await api.post("/send-otp", { email });

    if (res.data.error) {
      setNotice(res.data.error);
      setOtpSent(false);
      return;
    }

    setNotice(res.data.message);
    setOtpSent(true);
  };

  const verifyOtpOnly = () => {
    setNotice("");

    if (!otp.trim()) {
      setNotice("Please enter OTP.");
      return;
    }

    setOtpVerified(true);
    setNotice("OTP entered. Now create your user ID and password.");
  };

  const signup = async () => {
    setNotice("");

    if (!userId.trim() || !password.trim()) {
      setNotice("Please enter user ID and password.");
      return;
    }

    const res = await api.post("/signup", {
      email,
      otp,
      user_id: userId,
      password,
    });

    if (res.data.error) {
      setNotice(res.data.error);
      return;
    }

    setNotice("Account created successfully. Please login.");

    setTimeout(() => {
      setPage("login");
      setEmail("");
      setOtp("");
      setUserId("");
      setPassword("");
      setOtpSent(false);
      setOtpVerified(false);
      setNotice("");
    }, 1200);
  };

  const login = async () => {
    setNotice("");

    const res = await api.post("/login", {
      user_id: userId,
      password,
    });

    if (res.data.error) {
      setNotice(res.data.error);
      return;
    }

    localStorage.setItem("user_id", res.data.user_id);
    setCurrentUser(res.data.user_id);
    setPage("chat");
  };

  const logout = async () => {
    await api.post(`/logout/${currentUser}`);
    localStorage.removeItem("user_id");
    setCurrentUser(null);
    setPage("login");
  };

  const loadFriends = async () => {
    const res = await api.get(`/friends/${currentUser}`);
    setFriends(res.data);
  };

  const searchUser = async () => {
    setNotice("");

    const res = await api.get(`/search-user/${searchId}`);

    if (res.data.error) {
      setNotice(res.data.error);
    } else {
      setNotice(`User found: ${res.data.user_id}`);
    }
  };

  const addFriend = async () => {
    setNotice("");

    const res = await api.post("/add-friend", {
      user_id: currentUser,
      friend_id: searchId,
    });

    setNotice(res.data.message || res.data.error);
    loadFriends();
  };

  const loadMessages = async () => {
    if (!selectedFriend) return;

    const res = await api.get(`/messages/${currentUser}/${selectedFriend}`);
    setMessages(res.data);
  };

  const sendMessage = async () => {
    if (!text.trim() || !selectedFriend) return;

    await api.post("/send-message", {
      sender_id: currentUser,
      receiver_id: selectedFriend,
      text,
    });

    const newText = text;
    setText("");

    setMessages((prev) => [
      ...prev,
      {
        sender_id: currentUser,
        receiver_id: selectedFriend,
        text: newText,
        read: false,
      },
    ]);
  };

  if (page === "login") {
    return (
      <div className="auth-container">
        <div className="auth-box">
          <h1>Priva</h1>

          {notice && <div className="notice-box">{notice}</div>}

          <input
            placeholder="User ID"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button onClick={login}>Login</button>

          <p
            onClick={() => {
              setPage("signup");
              setNotice("");
              setUserId("");
              setPassword("");
            }}
          >
            New user? Signup
          </p>
        </div>
      </div>
    );
  }

  if (page === "signup") {
    return (
      <div className="auth-container">
        <div className="auth-box">
          <h1 className="signup-title">Create Priva</h1>

          {notice && <div className="notice-box">{notice}</div>}

          <input
            placeholder="Email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setOtp("");
              setOtpSent(false);
              setOtpVerified(false);
              setNotice("");
            }}
          />

          {!otpSent && <button onClick={sendOtp}>Send OTP</button>}

          {otpSent && !otpVerified && (
            <>
              <input
                placeholder="OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
              <button onClick={verifyOtpOnly}>Verify OTP</button>
            </>
          )}

          {otpVerified && (
            <>
              <input
                placeholder="Unique User ID"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
              />

              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <button onClick={signup}>Signup</button>
            </>
          )}

          <p
            onClick={() => {
              setPage("login");
              setNotice("");
            }}
          >
            Already have account? Login
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-app">
      <div className="sidebar">
        <h2>{currentUser}</h2>

        {notice && <div className="notice-box">{notice}</div>}

        <div className="search-box">
          <input
            placeholder="Search user ID"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
          />

          <button onClick={searchUser}>Search</button>
          <button onClick={addFriend}>Add</button>
        </div>

        <h3>Friends</h3>

        {friends.map((f) => (
          <div
            key={f.user_id}
            className="friend"
            onClick={async () => {
              setSelectedFriend(f.user_id);
              setMessages([]);

              const res = await api.get(`/messages/${currentUser}/${f.user_id}`);
              setMessages(res.data);
            }}
          >
            <span>{f.user_id}</span>
            <small className={f.online ? "online" : "offline"}>
              {f.online ? "Online" : "Offline"}
            </small>
          </div>
        ))}

        <button className="logout" onClick={logout}>
          Logout
        </button>
      </div>

      <div className="chat-section">
        {selectedFriend ? (
          <>
            <div className="chat-header">{selectedFriend}</div>

            <div className="messages">
              {messages.length === 0 ? (
                <div className="empty-chat">No messages yet</div>
              ) : (
                messages.map((m, index) => (
                  <div
                    key={index}
                    className={m.sender_id === currentUser ? "msg own" : "msg other"}
                  >
                    {m.text}
                  </div>
                ))
              )}
            </div>

            <div className="send-box">
              <input
                placeholder="Type message..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              />

              <button onClick={sendMessage}>Send</button>
            </div>
          </>
        ) : (
          <div className="empty-chat">Select a friend to chat</div>
        )}
      </div>
    </div>
  );
}

export default App;
