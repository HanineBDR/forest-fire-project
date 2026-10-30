"""
INKAD Realtime Event Broadcaster
Manages SSE (Server-Sent Events) and WebSocket notification distribution
across connected operational panels (Protection Civile, Admin, Forêts).
"""

import asyncio
import json
import time
from typing import AsyncGenerator, Dict, Any, List

# Active listener queues for SSE clients
_listeners: List[asyncio.Queue] = []

def broadcast_realtime_event(event_type: str, data: Dict[str, Any]):
    """Synchronous or asynchronous broadcast to all SSE connected listeners."""
    msg = {
        "event": event_type,
        "data": data,
        "timestamp": time.time()
    }
    dead_queues = []
    for q in _listeners:
        try:
            q.put_nowait(msg)
        except asyncio.QueueFull:
            dead_queues.append(q)
        except Exception:
            dead_queues.append(q)
    for dq in dead_queues:
        if dq in _listeners:
            _listeners.remove(dq)


async def sse_event_generator(role: str = "all") -> AsyncGenerator[str, None]:
    """Generates SSE messages for a connected panel role."""
    queue = asyncio.Queue(maxsize=100)
    _listeners.append(queue)
    try:
        # Initial greeting event
        yield f"event: connected\ndata: {json.dumps({'role': role, 'connected_at': time.time()})}\n\n"
        
        while True:
            try:
                # Wait for next event or send heartbeat every 20 seconds
                msg = await asyncio.wait_for(queue.get(), timeout=20.0)
                event_name = msg.get("event", "message")
                payload = msg.get("data", {})
                
                # Check recipient role if relevant
                rec_role = payload.get("recipient_role")
                if rec_role and rec_role != "all" and role != "all" and rec_role != role:
                    continue

                yield f"event: {event_name}\ndata: {json.dumps(payload)}\n\n"
            except asyncio.TimeoutError:
                # Heartbeat keep-alive
                yield f": ping {time.time()}\n\n"
    except asyncio.CancelledError:
        pass
    finally:
        if queue in _listeners:
            _listeners.remove(queue)

