import { useState, useEffect, useRef } from "react";
import { api } from "./api";
import "./style.css";

import pic1 from "./assets/pic1.png";
import pic2 from "./assets/pic2.png";
import pic3 from "./assets/pic3.png";
import pic4 from "./assets/pic4.png";
import pic5 from "./assets/pic5.png";

const profilePics = {
  1: pic1,
  2: pic2,
  3: pic3,
  4: pic4,
  5: pic5,
};

function App() {
  const [page, setPage] = useState(
    localStorage.getItem("user_id") ? "chat" : "login"
  );

  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");

  const [notice, setNotice] = useState("");

  const [currentUser, setCurrentUser] = useState(localStorage.getItem("user_id"));
  const [friends, setFriends] = useState([]);
  const [searchId, setSearchId] = useState("");
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);
  const [text, setText] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showProfile, setShowProfile] = useState(false);
  const [shouldScroll, setShouldScroll] = useState(false);
  const [showSelfProfile, setShowSelfProfile] = useState(false);
  const [myPic, setMyPic] = useState(1);
  const [theme, setTheme] = useState(1);
  const [messageMenu, setMessageMenu] = useState(null);
  const goBackToChat = () => {
    setShowProfile(false);
  };

  useEffect(() => {
    const setMobileHeight = () => {
      document.documentElement.style.setProperty(
        "--app-height",
        `${window.innerHeight}px`
      );
    };

    setMobileHeight();

    window.addEventListener("resize", setMobileHeight);
    window.addEventListener("orientationchange", setMobileHeight);

    return () => {
      window.removeEventListener("resize", setMobileHeight);
      window.removeEventListener("orientationchange", setMobileHeight);
    };
  }, []);

  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === "Escape") {
        setSelectedFriend(null); // close current chat
      }
    };

    window.addEventListener("keydown", handleEsc);

    return () => {
      window.removeEventListener("keydown", handleEsc);
    };
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    const ws = new WebSocket(
      `wss://priva-backend.onrender.com/ws/${currentUser}`
    );

    ws.onmessage = () => {
      loadFriends();

      if (selectedFriend) {
        loadMessages();
        setShouldScroll(true);
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
    if (!currentUser) return;

    const loadUserSettings = async () => {
      try {
        const res = await api.get(
          `/user-settings/${currentUser}`
        );

        if (!res.data.error) {
          setMyPic(res.data.profile_pic || 1);
          setTheme(res.data.theme || 1);
        }
      } catch (err) {}
    };

    loadUserSettings();
  }, [currentUser]);

  
   


  useEffect(() => {
    if (shouldScroll) {
      messagesEndRef.current?.scrollIntoView({
        behavior: "smooth",
      });

      setShouldScroll(false);
    }
  }, [messages, shouldScroll]);

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
    setMyPic(res.data.profile_pic || 1);
    setTheme(res.data.theme || 1);
    setShowSelfProfile(false);
    setFriends([]);
    setPage("chat");

    setTimeout(() => {
      loadFriends(res.data.user_id);
    }, 800);
  };

  const logout = async () => {
    await api.post(`/logout/${currentUser}`);

    localStorage.removeItem("user_id");
    setShowSelfProfile(false);
    setMyPic(1);
    setTheme(1);
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

  const loadFriends = async (user = currentUser) => {
    if (!user) return;

    const res = await api.get(`/friends/${user}`);
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

  const deleteMessage = async (messageId) => {
    const res = await api.delete("/delete-message", {
      data: {
        message_id: messageId,
        user_id: currentUser,
      },
    });

    
    setMessageMenu(null);
    loadMessages();
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
    setShouldScroll(true);
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
    <div className={`chat-app theme-${theme} ${selectedFriend ? "mobile-chat-open" : ""}`}>
      <div className="sidebar">
        <div
          className="self-user"
          onClick={() => setShowSelfProfile(!showSelfProfile)}
        >
          <img src={profilePics[myPic]} />
          <h2>{currentUser}</h2>
        </div>

        {showSelfProfile && (
          <div className="self-profile-panel">
            <div className="profile-pic-slider">
              {[1, 2, 3, 4, 5].map((pic) => (
                <img
                  key={pic}
                  src={profilePics[pic]}
                  className={myPic === pic ? "selected-pic" : ""}
                  onClick={async () => {
                    setMyPic(pic);
                    await api.post("/update-profile-pic", {
                      user_id: currentUser,
                      profile_pic: pic,
                    });
                  }}
                />
              ))}
            </div>

              <div className="theme-box">
                <p>Theme</p>

                <div className="theme-grid">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((t) => (
                    <button
                      key={t}
                      className={`theme-dot theme-dot-${t} ${
                        theme === t ? "active-theme" : ""
                      }`}
                      onClick={async () => {
                        setTheme(t);

                        await api.post("/update-theme", {
                          user_id: currentUser,
                          theme: t,
                        });
                      }}
                    />
                  ))}
                </div>
              </div>

              <button className="panel-logout" onClick={logout}>
                Logout
              </button>
          </div>
        )}

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

        <div className="friend-list">
          {friends.map((f) => (
            <div
              key={f.user_id}
              className="friend"
              onClick={async () => {
                setSelectedFriend(f.user_id);
                setMessages([]);

                const res = await api.get(
                  `/messages/${currentUser}/${f.user_id}`
                );
                setMessages(res.data);
              }}
            >
              <span>{f.user_id}</span>

              {f.unread_count > 0 ? (
                <small className="unread-count">{f.unread_count}</small>
              ) : (
                <small className={f.online ? "online" : "offline"}>
                  {f.online ? "Online" : "Offline"}
                </small>
              )}
            </div>
          ))}
        </div>

        
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

              

              <img
                className="friend-profile-big"
                src={
                  profilePics[
                    friends.find((f) => f.user_id === selectedFriend)?.profile_pic || 1
                  ]
                }
              />

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

              <button
                className="mobile-back-chat"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedFriend(null);
                  setShowProfile(false);
                }}
              >
                ←
              </button>

              <img
                className="chat-user-avatar-img"
                src={
                  profilePics[
                    friends.find((f) => f.user_id === selectedFriend)?.profile_pic || 1
                  ]
                }
              />

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
                    key={m.message_id || index}
                    className={m.sender_id === currentUser ? "msg own" : "msg other"}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setMessageMenu(m.message_id);
                    }}
                    onTouchStart={() => {
                      const timer = setTimeout(() => {
                        setMessageMenu(m.message_id);
                      }, 600);

                      m.touchTimer = timer;
                    }}
                    onTouchEnd={() => {
                      clearTimeout(m.touchTimer);
                    }}
                  >
                    {m.text}

                    {messageMenu === m.message_id && m.sender_id === currentUser && (
                      <div className="message-menu">
                        <button onClick={() => deleteMessage(m.message_id)}>
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
              <div ref={messagesEndRef}></div>
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
