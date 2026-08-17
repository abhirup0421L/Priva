# 💬 Priva

### 🔒 Private. Simple. Connected.

**Priva** is a modern online chatting web application focused on providing a simple and private messaging experience **without requiring a phone number**.

Users can create an account using their **email**, choose a **unique username**, connect with other users, and communicate through a clean and customizable interface.

> 🚧 **Priva is currently under active development.**
> Features, UI, and architecture are continuously being improved.

---

## ✨ Features

### 🔐 No Phone Number Required

Priva is designed around a simple authentication experience without requiring users to provide a phone number.

* 📧 Email-based authentication
* 🔑 Secure account access
* 🚫 No phone number required
* 👤 Unique username system

---

### 👤 Username-Based Identity

Users can create their own unique username and use it as their identity within Priva.

* Custom usernames
* Unique user identification
* Easy user discovery
* Profile-based communication

---

### 💬 Online Messaging

Priva is being developed as a real-time online communication platform.

Planned and implemented functionality includes:

* 💬 One-to-one conversations
* ⚡ Real-time messaging
* 🟢 Online/offline presence
* 🔎 User search
* 👥 Friend/user discovery
* 🔄 Real-time communication

---

## 🎨 Customizable UI

Priva focuses heavily on personalization and modern UI design.

Users will be able to customize their chatting experience through options such as:

* 🎨 Interface customization
* 🌈 Theme and accent customization
* 🌙 Dark/light interface options
* 🖼️ Personalized chat experience
* ✨ Modern animations and interactions

The goal is to make every user's Priva experience feel **personal and unique**.

---

## 🏗️ Architecture

Priva uses a modern web application architecture designed for real-time communication.

```text
                    ┌─────────────────┐
                    │      Priva      │
                    │   Web Client    │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │   React.js UI   │
                    └────────┬────────┘
                             │
                        HTTP / WebSocket
                             │
                             ▼
                    ┌─────────────────┐
                    │   FastAPI API   │
                    │     Backend     │
                    └────────┬────────┘
                             │
                  ┌──────────┴──────────┐
                  ▼                     ▼
          ┌──────────────┐      ┌──────────────┐
          │   MongoDB    │      │ WebSocket    │
          │   Database   │      │ Communication│
          └──────────────┘      └──────────────┘
```

---

## 🛠️ Technology Stack

### Frontend

* ⚛️ React.js
* 🎨 HTML / CSS
* ⚡ JavaScript
* ✨ Modern responsive UI
* 🔄 Real-time UI updates

### Backend

* 🐍 Python
* ⚡ FastAPI
* 🔌 WebSockets
* 🔐 Authentication
* 🔄 Real-time communication

### Database

* 🍃 MongoDB
* 👤 User management
* 💬 Message storage
* 🧾 Application data

---

## 🔑 Authentication

Priva uses an email-based authentication system rather than relying on phone numbers.

```text
             User
              │
              ▼
       Enter Email
              │
              ▼
      Authentication
              │
              ▼
       Create / Login
              │
              ▼
      Choose Username
              │
              ▼
        Enter Priva
```

---

## 🌐 Real-Time Communication

Real-time communication is one of the core concepts behind Priva.

WebSockets are used to enable fast communication between the client and server.

This allows the application to support features such as:

* ⚡ Instant messages
* 🟢 Online presence
* 🔴 Offline detection
* 🔄 Live conversation updates
* 📡 Real-time connection management

---

## 🎯 Project Goals

Priva is being developed with a few core principles:

**Privacy** 🔒
Avoid unnecessary personal information such as phone numbers.

**Simplicity** ✨
Keep communication straightforward and easy to use.

**Customization** 🎨
Allow users to personalize their experience.

**Real-Time Communication** ⚡
Messages and presence should feel instantaneous.

**Scalability** 🚀
Build the architecture so additional communication features can be added over time.

---

## 🚧 Development Status

**Priva is currently under development.**

Some features may be incomplete, experimental, or subject to change.

### Current Development Areas

* 🔐 Authentication improvements
* 💬 Real-time chat
* 👤 Username and profile system
* 🟢 Online/offline presence
* 🎨 UI customization
* 🔎 User discovery
* 📱 Responsive design
* 🔒 Security improvements
* ⚡ WebSocket optimization

---

## 🔮 Planned Features

Future versions may include:

* 👥 Group chats
* 🖼️ Image and file sharing
* 🎤 Voice messages
* 📞 Voice/video calling
* 🔔 Notifications
* 😊 Emoji reactions
* 📝 Message editing
* 🗑️ Message deletion
* 📌 Message pinning
* 🔒 More privacy controls
* 🎨 Advanced personalization
* 📱 Progressive Web App support

---


```

> Configuration and environment variables may change while Priva is under development.

---

## ⚠️ Development Notice

Priva is an **active development project**.

The project architecture, UI, APIs, database structure, and available features may change as development continues.

If you are exploring the repository, expect unfinished features and ongoing changes.

---

## 💡 Vision

Priva aims to become a modern communication platform where people can **chat, connect, and express themselves without unnecessary barriers**.

No phone number.

Just an account, a username, and your conversations.

### 🔒 **Priva — Chat Freely. Connect Privately.**

---

## ⭐ Support

If you like the idea behind Priva, consider giving the repository a ⭐ **Star** on GitHub.

More features are coming soon. 🚀

**Currently under development with ❤️**
