from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from response import ask_rag

app = FastAPI()

app.add_middleware(CORSMiddleware,
                    allow_origins=["*"],     
                    allow_credentials=True,
                    allow_methods=["*"],
                    allow_headers=["*"],
                    )

class ChatRequest(BaseModel):
    question: str

@app.post("/chat")      # if someone send a POST request to /chat, run the function below

def chat(request: ChatRequest):

    answer = ask_rag(request.question)

    return {"answer": answer}


# cd "/Users/yukpinglee/Desktop/Enterprise Knowledge Assistant/Web Interface for Enterprise Knowledge Assistant/backend"

# conda activate py310

# Run in terminal

#   uvicorn main:app --reload

# When you run the the above command, you start the web server, load app from main.py, keep watching for change

# http://127.0.0.1:8000/docs
