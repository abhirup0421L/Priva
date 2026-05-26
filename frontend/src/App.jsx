import { useState, useEffect } from "react";
import { api } from "./api";
import "./style.css";

function App() {
  const [page, setPage] = useState("login");

  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");

  const [notice, setNotice] = useState("");

  const [currentUser, setCurrentUser] = useState(localStorage.getItem("user_id"));
  const [friends, setFriends] = useState([]);
  const [searchId, setSearchId] = useState("");
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showProfile, setShowProfile] = useState(false);
  const goBackToChat = () => {
    setShowProfile(false);
  };

  useEffect(() => {
    if (currentUser) {
      loadFriends();
      setPage("chat");
    }
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;

    const ws = new WebSocket(
      `wss://priva-backend.onrender.com/ws/${currentUser}`
    );

    ws.onmessage = () => {
      loadFriends();
      if (selectedFriend) {
        loadMessages();
      }
    };

    return () => ws.close();
  }, [currentUser, selectedFriend]);

  useEffect(() => {
    if (!currentUser) return;

    loadFriends();

    const interval = setInterval(() => {
      loadFriends();
    }, 3000);

    return () => clearInterval(interval);
  }, [currentUser]);

  useEffect(() => {
    if (selectedFriend) {
      loadMessages();

      const interval = setInterval(() => {
        loadMessages();
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [selectedFriend]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape" && showProfile) {
        setShowProfile(false);
      }
    };

    window.addEventListener("keydown", handleEsc);

    return () => {
      window.removeEventListener("keydown", handleEsc);
    };
  }, [showProfile]);

  const signup = async () => {
    setNotice("");

    if (!email.includes("@") || !email.includes(".")) {
      setNotice("Please enter a valid email address.");
      return;
    }

    if (!userId.trim() || !password.trim()) {
      setNotice("Please enter user ID and password.");
      return;
    }

    const res = await api.post("/signup", {
      email,
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
      setUserId("");
      setPassword("");
      setNotice("");
    }, 1200);
  };

  const login = async () => {
    setNotice("");

    if (!userId.trim() || !password.trim()) {
      setNotice("Please enter user ID and password.");
      return;
    }

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
    setSelectedFriend(null);
    setMessages([]);
    setUserId("");
    setPassword("");
    setNotice("");
    setPage("login");
  };

  const searchSuggestions = async (value) => {
    setSearchId(value);
    setNotice("");

    if (!value.trim()) {
      setSuggestions([]);
      return;
    }

    const res = await api.get(`/search-users/${value}/${currentUser}`);
    setSuggestions(res.data);
  };

  const loadFriends = async () => {
    if (!currentUser) return;

    const res = await api.get(`/friends/${currentUser}`);
    setFriends(res.data);
  };

  const searchUser = async () => {
    setNotice("");

    if (!searchId.trim()) {
      setNotice("Please enter a user ID.");
      return;
    }

    const res = await api.get(`/search-user/${searchId}`);

    if (res.data.error) {
      setNotice(res.data.error);
    } else {
      setNotice(`User found: ${res.data.user_id}`);
    }
  };

  const addFriend = async () => {
    setNotice("");

    if (!searchId.trim()) {
      setNotice("Please enter a user ID.");
      return;
    }

    const res = await api.post("/add-friend", {
      user_id: currentUser,
      friend_id: searchId,
    });

    setNotice(res.data.message || res.data.error);
    loadFriends();
  };

  const loadMessages = async () => {
    if (!selectedFriend || !currentUser) return;

    const res = await api.get(`/messages/${currentUser}/${selectedFriend}`);
    setMessages(res.data);
  };

  const sendMessage = async () => {
    if (!text.trim() || !selectedFriend) return;

    const newText = text;

    await api.post("/send-message", {
      sender_id: currentUser,
      receiver_id: selectedFriend,
      text: newText,
    });

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
              setEmail("");
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
            onChange={(e) => setEmail(e.target.value)}
          />

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

          <p
            onClick={() => {
              setPage("login");
              setNotice("");
              setEmail("");
              setUserId("");
              setPassword("");
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
            onChange={(e) => searchSuggestions(e.target.value)}
          />

          {suggestions.length > 0 && (
            <div className="suggestion-dropdown">
              {suggestions.map((user) => (
                <div className="suggestion-row" key={user.user_id}>
                  <span>{user.user_id}</span>

                  <button
                    className="suggestion-add-btn"
                    onClick={async () => {
                      const res = await api.post("/add-friend", {
                        user_id: currentUser,
                        friend_id: user.user_id,
                      });

                      setNotice(res.data.message || res.data.error);
                      setSearchId("");
                      setSuggestions([]);
                      loadFriends();
                    }}
                  >
                    +
                  </button>
                </div>
              ))}
            </div>
          )}
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
          showProfile ? (
            <div className="profile-view">

              <button
                className="back-btn"
                onClick={goBackToChat}
              >
                ← Back
              </button>

              <div className="profile-avatar">☻</div>

              <h2>{selectedFriend}</h2>

              <button
                className="delete-friend-btn"
                onClick={async () => {
                  const res = await api.delete("/remove-friend", {
                    data: {
                      user_id: currentUser,
                      friend_id: selectedFriend,
                    },
                  });

                  setNotice(res.data.message || res.data.error);

                  setSelectedFriend(null);
                  setShowProfile(false);
                  setMessages([]);
                  loadFriends();
                }}
              >
                Remove Friend
              </button>
            </div>
          ) : (
            <>
            <div
              className="chat-header"
              onClick={() => setShowProfile(true)}
            >
              <div className="chat-user-avatar">☻</div>

              <div className="chat-user-info">
                <h3>{selectedFriend}</h3>

                <small>
                  {friends.find((f) => f.user_id === selectedFriend)?.online
                    ? "Online"
                    : `last seen ${friends.find((f) => f.user_id === selectedFriend)?.last_seen || "recently"}`}
                </small>
              </div>
            </div>

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
          )
        ) : (
          <div className="empty-chat">Select a friend to chat</div>
        )}
      </div>
    </div>
  );
}

export default App;
