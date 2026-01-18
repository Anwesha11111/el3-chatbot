# Flan-T5 Chatbot (Financial Literacy)

## Local Run
1. MongoDB Atlas: Get MONGO_URI.
2. Backend: cd backend && npm i && npm start
3. AI: cd ai-service && python -m venv venv && venv\Scripts\activate && pip install -r requirements.txt && python app.py
4. Frontend: cd frontend && npm i && npm run dev → http://localhost:3000

## Deploy
- Vercel: frontend + backend monorepo.
- Render: ai-service.
