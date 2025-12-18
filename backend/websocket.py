from typing import List, Dict
from fastapi import WebSocket
import json
from datetime import datetime

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, email: str):
        await websocket.accept()
        if email not in self.active_connections:
            self.active_connections[email] = []
        self.active_connections[email].append(websocket)
        print(f"[WS] User connected: {email}. Total connections: {len(self.active_connections[email])}")

    def disconnect(self, websocket: WebSocket, email: str):
        if email in self.active_connections:
            if websocket in self.active_connections[email]:
                self.active_connections[email].remove(websocket)
            
            if not self.active_connections[email]:
                del self.active_connections[email]
            
            print(f"[WS] User disconnected: {email}")

    async def send_personal_message(self, message: dict, email: str):
        if email in self.active_connections:
            # Ensure datetime objects are converted to strings
            if 'timestamp' in message and isinstance(message['timestamp'], datetime):
                message['timestamp'] = message['timestamp'].isoformat()
            
            message_str = json.dumps(message)
            
            # Iterate over a copy of the list to allow modification during iteration if needed
            # (though we handle disconnects explicitly)
            for connection in self.active_connections[email]:
                try:
                    await connection.send_text(message_str)
                except Exception as e:
                    print(f"[WS] Error sending message to {email}: {e}")
                    # We don't remove here, we let the disconnect handler do it

manager = ConnectionManager()