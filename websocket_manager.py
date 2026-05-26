class ConnectionManager:
    def __init__(self):
        self.active_connections = {}

    async def connect(self, user_id, websocket):
        await websocket.accept()
        self.active_connections[user_id] = websocket

    def disconnect(self, user_id):
        if user_id in self.active_connections:
            del self.active_connections[user_id]

    async def send_personal_message(self, user_id, message):
        if user_id in self.active_connections:
            await self.active_connections[user_id].send_json(message)

    def is_online(self, user_id):
        return user_id in self.active_connections


manager = ConnectionManager()