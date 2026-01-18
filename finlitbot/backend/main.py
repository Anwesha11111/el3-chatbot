from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
import openai  # or use Grok, Anthropic, etc.
import os
from typing import List
import uvicorn

app = FastAPI(title="FinLit Bot API")

# Mount frontend static files
app.mount("/static", StaticFiles(directory="../frontend"), name="static")

# AI Configuration (use your API key)
openai.api_key = os.getenv("OPENAI_API_KEY")  # Set in Render dashboard

class ChatMessage(BaseModel):
    message: str

# Chat endpoint for real AI responses
@app.post("/api/chat")
async def chat(message: ChatMessage):
    try:
        # Real AI response for financial literacy
        response = openai.ChatCompletion.create(
            model="gpt-4o-mini",  # Cheap & fast
            messages=[
                {
                    "role": "system", 
                    "content": """You are FinLit Bot, a financial literacy AI. Always provide:
                    1. Beginner-friendly explanations
                    2. Step-by-step guidance
                    3. Links to official websites (RBI, SEBI, bank sites)
                    4. Document analysis tips if asked
                    5. Never give personalized financial advice
                    Focus on: budgeting, investing, banking, debt, insurance in India."""
                },
                {"role": "user", "content": message.message}
            ],
            max_tokens=500,
            temperature=0.7
        )
        
        ai_response = response.choices[0].message.content
        
        # Add official links based on topic
        links = {
            "bank": "https://rbi.org.in/Scripts/FAQView.aspx?Id=28",
            "investment": "https://www.sebi.gov.in/investor_education.html",
            "budget": "https://financialplanning.nism.ac.in/",
            "credit": "https://www.cibil.com/"
        }
        
        # Smart link addition
        for keyword, url in links.items():
            if keyword in message.message.lower():
                ai_response += f"\n\n🔗 **Official Resource**: [Verify here]({url})"
                break
        
        return {
            "response": ai_response,
            "type": "ai",
            "timestamp": "now"
        }
    except Exception as e:
        return {"response": f"Sorry, I encountered an error: {str(e)}. Please try again.", "type": "error"}

# WebSocket for real-time chat (optional)
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

manager = ConnectionManager()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Process with AI
            result = await chat(ChatMessage(message=data))
            await manager.broadcast(result["response"])
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# Serve frontend
@app.get("/", response_class=HTMLResponse)
async def serve_frontend():
    with open("../frontend/index.html", "r", encoding="utf-8") as f:
        return HTMLResponse(content=f.read())

# Health check for Render
@app.get("/health")
async def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 8000)))
