from fastapi import APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from typing import List, Dict, Optional
from datetime import datetime
from bson import ObjectId
from models import MessageCreate, ConversationCreate, Message, Conversation, User
from routers.auth import get_current_user
from database import db
import json
import os
import jwt
import time
from websocket import manager

router = APIRouter(prefix="/api/v1/messaging", tags=["messaging"])

# WebSocket Endpoint
@router.websocket("/ws/{email}")
async def websocket_endpoint(websocket: WebSocket, email: str):
    # Normalize email to lowercase for consistent connection management
    email = email.lower()
    await manager.connect(websocket, email)
    try:
        while True:
            data = await websocket.receive_text()
            try:
                message = json.loads(data)
                # Handle typing indicators
                if message.get("type") == "typing":
                    recipient_email = message.get("recipientEmail")
                    if recipient_email:
                        await manager.send_personal_message({
                            "type": "typing",
                            "conversationId": message.get("conversationId"),
                            "senderEmail": email
                        }, recipient_email.lower())
                
                # Handle Call Rejected
                elif message.get("type") == "call_rejected":
                    recipient_email = message.get("recipientEmail")
                    if recipient_email:
                        await manager.send_personal_message({
                            "type": "call_rejected",
                            "conversationId": message.get("conversationId"),
                            "rejectorEmail": email
                        }, recipient_email.lower())
                        
                        # Log missed call in chat
                        db.messages.insert_one({
                            "conversation_id": message.get("conversationId"),
                            "sender_email": email, # The person who rejected
                            "content": "Declined the call",
                            "tone": "neutral-legal",
                            "type": "call_missed",
                            "timestamp": datetime.utcnow(),
                            "status": "sent"
                        })
            except json.JSONDecodeError:
                pass
            except Exception as e:
                print(f"[WS] Error processing message: {e}")
    except WebSocketDisconnect:
        manager.disconnect(websocket, email)
    except Exception as e:
        print(f"[WS] Error: {e}")
        manager.disconnect(websocket, email)

# Get all conversations for the current user's family
@router.get("/conversations", response_model=List[dict])
async def get_conversations(current_user: User = Depends(get_current_user)):
    """
    Get all conversations for the current user's family
    Optimized with MongoDB Aggregation to avoid N+1 query problem
    """
    try:
        print(f"[GET /conversations] User: {current_user.email}")
        
        # Get user's family
        family = db.families.find_one({"$or": [
            {"parent1_email": current_user.email},
            {"parent2_email": current_user.email}
        ]})
        
        if not family:
            print("[GET /conversations] No family found")
            return []
        
        family_id = str(family["_id"])
        
        # Aggregation Pipeline
        pipeline = [
            # 1. Match conversations for this family (not archived)
            {
                "$match": {
                    "family_id": family_id,
                    "is_archived": False
                }
            },
            # 2. Lookup messages for each conversation to get counts and last message
            {
                "$lookup": {
                    "from": "messages",
                    "let": {"conv_id": {"$toString": "$_id"}},
                    "pipeline": [
                        {"$match": {"$expr": {"$eq": ["$conversation_id", "$$conv_id"]}}},
                        {"$sort": {"timestamp": -1}}, # Newest first
                    ],
                    "as": "messages"
                }
            },
            # 3. Project the fields we need
            {
                "$project": {
                    "id": {"$toString": "$_id"},
                    "subject": 1,
                    "category": 1,
                    "participants": 1,
                    "is_starred": 1,
                    "is_archived": 1,
                    "created_at": 1,
                    "last_message_at": 1,
                    "messageCount": {"$size": "$messages"},
                    "unreadCount": {
                        "$size": {
                            "$filter": {
                                "input": "$messages",
                                "as": "msg",
                                "cond": {
                                    "$and": [
                                        {"$ne": ["$$msg.sender_email", current_user.email]},
                                        {"$ne": ["$$msg.status", "read"]}
                                    ]
                                }
                            }
                        }
                    },
                    "lastMessage": {"$arrayElemAt": ["$messages", 0]}
                }
            }
        ]
        
        conversations = list(db.conversations.aggregate(pipeline))
        print(f"[GET /conversations] Found {len(conversations)} conversations")
        
        # Format result
        result = []
        for conv in conversations:
            # Determine last activity time (message or creation)
            last_msg_time = conv.get("lastMessage", {}).get("timestamp")
            created_at = conv.get("created_at")
            
            # Use stored last_message_at if available and consistent, otherwise fallback
            display_time = last_msg_time or created_at
            
            result.append({
                "id": conv["id"],
                "subject": conv["subject"],
                "category": conv["category"],
                "participants": conv["participants"],
                "messageCount": conv["messageCount"],
                "unreadCount": conv["unreadCount"],
                "lastMessageAt": display_time.isoformat() if display_time else None,
                "isStarred": conv.get("is_starred", False),
                "isArchived": conv.get("is_archived", False),
                "createdAt": created_at.isoformat() if created_at else None
            })
        
        # Sort by last message time (most recent first)
        result.sort(key=lambda x: x["lastMessageAt"] or x["createdAt"] or "", reverse=True)
        
        return result
    except Exception as e:
        print(f"[ERROR] Get conversations: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# Create a new conversation
@router.post("/conversations", response_model=dict)
async def create_conversation(
    conversation: ConversationCreate,
    current_user: User = Depends(get_current_user)
):
    """
    Create a new conversation
    """
    try:
        print(f"[POST /conversations] User: {current_user.email}, Subject: {conversation.subject}")
        
        # Get user's family
        family = db.families.find_one({"$or": [
            {"parent1_email": current_user.email},
            {"parent2_email": current_user.email}
        ]})
        
        if not family:
            raise HTTPException(status_code=404, detail="Family not found")
        
        # Check if family is linked (has both parents)
        if not family.get("parent2_email"):
            raise HTTPException(
                status_code=400, 
                detail="Cannot create conversation until family is linked with both parents"
            )
        
        family_id = str(family["_id"])
        
        # Create conversation document
        conv_doc = {
            "family_id": family_id,
            "subject": conversation.subject,
            "category": conversation.category,
            "participants": [family["parent1_email"], family["parent2_email"]],
            "created_at": datetime.utcnow(),
            "last_message_at": None,
            "is_archived": False,
            "is_starred": False
        }
        
        result = db.conversations.insert_one(conv_doc)
        conv_id = str(result.inserted_id)
        
        print(f"[POST /conversations] Created conversation: {conv_id}")
        
        return {
            "id": conv_id,
            "subject": conversation.subject,
            "category": conversation.category,
            "participants": conv_doc["participants"],
            "messageCount": 0,
            "unreadCount": 0,
            "lastMessageAt": None,
            "isStarred": False,
            "isArchived": False,
            "createdAt": conv_doc["created_at"].isoformat()
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Create conversation: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# Get messages for a conversation (with pagination)
@router.get("/conversations/{conversation_id}/messages", response_model=dict)
async def get_messages(
    conversation_id: str,
    page: int = 1,
    limit: int = 50,
    current_user: User = Depends(get_current_user)
):
    """
    Get messages for a conversation with pagination
    """
    try:
        print(f"[GET /messages] Conversation: {conversation_id}, User: {current_user.email}, Page: {page}")
        
        # Verify user has access to this conversation
        conversation = db.conversations.find_one({"_id": ObjectId(conversation_id)})
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        if current_user.email not in conversation["participants"]:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Calculate skip
        skip = (page - 1) * limit
        
        # Get total count
        total_messages = db.messages.count_documents({"conversation_id": conversation_id})
        
        # Get paginated messages (sort by timestamp DESC for pagination, then reverse for display)
        # We fetch newest first to easily get the latest "limit" messages
        cursor = db.messages.find({"conversation_id": conversation_id})\
            .sort("timestamp", -1)\
            .skip(skip)\
            .limit(limit)
            
        messages = list(cursor)
        messages.reverse() # Reverse back to chronological order
        
        print(f"[GET /messages] Found {len(messages)} messages (Total: {total_messages})")
        
        # Mark messages as read for current user (only unread ones)
        db.messages.update_many(
            {
                "conversation_id": conversation_id,
                "sender_email": {"$ne": current_user.email},
                "status": {"$ne": "read"}
            },
            {"$set": {"status": "read"}}
        )
        
        # Format messages for response
        formatted_messages = []
        for msg in messages:
            status = msg.get("status", "sent")
            if msg.get("sender_email") != current_user.email:
                status = "read"
            formatted_messages.append({
                "id": str(msg["_id"]),
                "conversationId": conversation_id,
                "senderEmail": msg["sender_email"],
                "content": msg["content"],
                "tone": msg["tone"],
                "type": msg.get("type", "text"), # Added type with default
                "timestamp": msg["timestamp"].isoformat(),
                "status": status
            })
        
        return {
            "messages": formatted_messages,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total_messages,
                "hasMore": (skip + limit) < total_messages
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Get messages: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# Send a message
@router.post("/messages", response_model=dict)
async def send_message(
    message: MessageCreate,
    current_user: User = Depends(get_current_user)
):
    """
    Send a message in a conversation
    """
    try:
        print(f"[POST /message] Conversation: {message.conversation_id}, User: {current_user.email}")
        
        # Verify user has access to this conversation
        conversation = db.conversations.find_one({"_id": ObjectId(message.conversation_id)})
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        if current_user.email not in conversation["participants"]:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Create message document
        timestamp = datetime.utcnow()
        msg_doc = {
            "conversation_id": message.conversation_id,
            "sender_email": current_user.email,
            "content": message.content,
            "tone": message.tone,
            "type": message.type, # Added type
            "timestamp": timestamp,
            "status": "sent"
        }
        
        result = db.messages.insert_one(msg_doc)
        msg_id = str(result.inserted_id)
        
        # Update conversation's last_message_at
        db.conversations.update_one(
            {"_id": ObjectId(message.conversation_id)},
            {"$set": {"last_message_at": timestamp}}
        )
        
        print(f"[POST /message] Sent message: {msg_id} (Type: {message.type})")
        
        response_data = {
            "id": msg_id,
            "conversationId": message.conversation_id,
            "senderEmail": current_user.email,
            "content": message.content,
            "tone": message.tone,
            "type": message.type, # Added type
            "timestamp": timestamp.isoformat(),
            "status": "sent"
        }
        
        # Push to other participants via WebSocket
        for participant in conversation["participants"]:
            # Use case-insensitive comparison and sending
            if participant.strip().lower() != current_user.email.strip().lower():
                # Add a flag so frontend knows this is a real-time update
                # Preserve original message type as 'messageType' since 'type' is overwritten
                ws_payload = {
                    **response_data,
                    "type": "new_message",
                    "messageType": response_data.get("type")
                }
                await manager.send_personal_message(ws_payload, participant.strip().lower())
        
        # Refresh dashboard activities as well (notify ALL participants including sender)
        for participant in conversation["participants"]:
            await manager.send_personal_message({
                "type": "refresh_activities",
            }, participant.strip().lower())

        return response_data
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Send message: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# Toggle star on conversation
@router.patch("/conversations/{conversation_id}/star")
async def toggle_star(
    conversation_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Toggle star status on a conversation
    """
    try:
        # Verify user has access
        conversation = db.conversations.find_one({"_id": ObjectId(conversation_id)})
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        if current_user.email not in conversation["participants"]:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Toggle star
        new_star_status = not conversation.get("is_starred", False)
        db.conversations.update_one(
            {"_id": ObjectId(conversation_id)},
            {"$set": {"is_starred": new_star_status}}
        )
        
        return {"isStarred": new_star_status}
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Toggle star: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Archive conversation
@router.patch("/conversations/{conversation_id}/archive")
async def archive_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Archive a conversation
    """
    try:
        # Verify user has access
        conversation = db.conversations.find_one({"_id": ObjectId(conversation_id)})
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        if current_user.email not in conversation["participants"]:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Archive
        db.conversations.update_one(
            {"_id": ObjectId(conversation_id)},
            {"$set": {"is_archived": True}}
        )
        
        return {"message": "Conversation archived"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Archive conversation: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Get LiveKit Token for Video Call
@router.get("/livekit/token")
async def get_livekit_token(
    room: str,
    username: str,
    callType: str = "video", # Add callType parameter, default to video for backward compatibility
    current_user: User = Depends(get_current_user)
):
    """
    Generate a LiveKit access token for video calls manually (bypassing SDK issues)
    """
    try:
        # Get credentials from env
        api_key = os.getenv("LIVEKIT_API_KEY")
        api_secret = os.getenv("LIVEKIT_API_SECRET")

        if not api_key or not api_secret:
             raise HTTPException(status_code=500, detail="LiveKit credentials not configured")

        # Token expiration (6 hours)
        expiration = int(time.time()) + (6 * 60 * 60)

        # Video Grant
        grant = {
            "room": room,
            "roomJoin": True,
            "canPublish": True,
            "canSubscribe": True,
        }

        # JWT Payload
        payload = {
            "exp": expiration,
            "iss": api_key,
            "sub": current_user.email, # Use email as unique identity
            "video": grant,
            "name": username # Display name
        }

        # Encode token
        token = jwt.encode(payload, api_secret, algorithm="HS256")

        # Notify other participants in the conversation (inferred from room name)
        # Assuming room name is "room-{conversation_id}"
        if room.startswith("room-"):
             conversation_id = room.replace("room-", "")
             conversation = db.conversations.find_one({"_id": ObjectId(conversation_id)})
             
             if conversation:
                 # 1. Insert System Message "Video/Audio Call started"
                 timestamp = datetime.utcnow()
                 msg_content = "Started a video call" if callType == "video" else "Started a voice call"
                 msg_doc = {
                    "conversation_id": conversation_id,
                    "sender_email": current_user.email,
                    "content": msg_content,
                    "tone": "neutral-legal",
                    "type": "call_start",
                    "timestamp": timestamp,
                    "status": "sent"
                 }
                 db.messages.insert_one(msg_doc)
                 
                 # 2. Notify via WebSocket
                 for participant in conversation["participants"]:
                     # Use case-insensitive comparison and sending
                     if participant.strip().lower() != current_user.email.strip().lower():
                         await manager.send_personal_message({
                             "type": "video_call_started",
                             "conversationId": conversation_id,
                             "initiatorName": username,
                             "initiatorEmail": current_user.email,
                             "roomName": room,
                             "callType": callType # Pass callType to frontend
                         }, participant.strip().lower())

        return {"token": token}

    except Exception as e:
        print(f"[ERROR] Generate LiveKit token: {e}")
        raise HTTPException(status_code=500, detail=str(e))

