import os

import boto3

from dotenv import load_dotenv

# --------------------------------------------------------
# Configuration, load variables from the .env file
# --------------------------------------------------------

load_dotenv()

AWS_REGION = os.getenv("AWS_REGION")

FIXED_KNOWLEDGE_BASE_ID = os.getenv("FIXED_KNOWLEDGE_BASE_ID")

NOCHUNK_KNOWLEDGE_BASE_ID = os.getenv("NOCHUNK_KNOWLEDGE_BASE_ID")


# --------------------------------------------------------
# Set up AWS, OpenAI LLM
# --------------------------------------------------------
import boto3
from openai import OpenAI

# Bedrock Knowledge Base Retrieval
kb_client = boto3.client("bedrock-agent-runtime",region_name = AWS_REGION)

# OpenAI LLM
gpt_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# --------------------------------------------------------
# Retrieve from Fixed-size Knowledge Base
# --------------------------------------------------------

def retrieve_fixed(question, top_k = 5):

    response = kb_client.retrieve(knowledgeBaseId = FIXED_KNOWLEDGE_BASE_ID,

                                    retrievalQuery={"text": question},

                                    retrievalConfiguration={"vectorSearchConfiguration": {"numberOfResults": top_k}}
                                )

    chunks = []

    for result in response["retrievalResults"]:

        chunks.append({"text": result["content"]["text"],

                        "score": result["score"],

                        "source": "Fixed Chunk"}
                        
                        )

    return chunks




# --------------------------------------------------------
# Retrieve from No-Chunk Knowledge Base
# --------------------------------------------------------

def retrieve_nochunk(question, top_k = 5):

    response = kb_client.retrieve(knowledgeBaseId = NOCHUNK_KNOWLEDGE_BASE_ID,

                                    retrievalQuery = {"text": question},

                                    retrievalConfiguration = {"vectorSearchConfiguration": {"numberOfResults": top_k}}
                                    )

    chunks = []

    for result in response["retrievalResults"]:

        chunks.append({"text": result["content"]["text"],

                        "score": result["score"],

                        "source": "No Chunk"}

                        )

    return chunks

# --------------------------------------------------------
# Merge and Rank Results
# --------------------------------------------------------
def get_score(chunk):

    return chunk["score"]


def merge_chunks(fixed_chunks, nochunk_chunks, top_k=5):

    all_chunks = fixed_chunks + nochunk_chunks

    all_chunks.sort(key = get_score, reverse=True)

    return all_chunks[:top_k]


# --------------------------------------------------------
# Build Prompt, to pass to the LLM
# --------------------------------------------------------

def build_context(chunks):

    context = ""

    for chunk in chunks:

        context += f"""
Source: {chunk['source']}

{chunk['text']}

----------------------------------------

"""

    return context


# --------------------------------------------------------
# Generate Answer with ChatGPT
# --------------------------------------------------------

def generate_answer(question, context):

    system_prompt = """
You are an enterprise knowledge assistant.

Answer the user's question using ONLY the supplied context.

If the answer is not present in the context, reply:
"I don't know based on the available information."

Do not make up facts.
"""

    response = gpt_client.responses.create(
        model = "gpt-5-mini",
        input=[{"role": "system",
                "content": system_prompt},
            {"role": "user",
                "content": f"""
Context:

{context}

Question:

{question}
"""
            }
        ]
    )

    return response.output_text


# --------------------------------------------------------
# Function Used by FastAPI
# --------------------------------------------------------

def ask_rag(question):

    try:

        fixed_chunks = retrieve_fixed(question)

        nochunk_chunks = retrieve_nochunk(question)

        best_chunks = merge_chunks(fixed_chunks, nochunk_chunks)

        context = build_context(best_chunks)

        answer = generate_answer(question, context)

        return answer

    except Exception as e:
        return f"An error occurred while processing your request. {str(e)}"
