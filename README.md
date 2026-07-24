# Cloud Enterprise Knowledge Assistant

A cloud-native Retrieval-Augmented Generation (RAG) application that
lets users query enterprise knowledge through a ChatGPT-style web
interface.

The backend retrieves relevant passages from two Amazon Bedrock
Knowledge Bases and generates natural language answers with OpenAI
GPT-5-mini. Both services are containerised with Docker and deployed
on Amazon ECS Fargate, each behind its own Application Load Balancer
(one for the frontend, one for the backend).

------------------------------------------------------------------------

# Project Motivation

Enterprise organisations generate large volumes of information across
collaboration tools, ticketing systems, source code repositories,
emails, CRM platforms, and internal documentation. Traditional keyword
search often struggles to surface the right answer quickly.

This project explores how Retrieval-Augmented Generation, combined
with managed cloud infrastructure, can provide accurate, context-aware
answers across an organisation's scattered knowledge sources without
maintaining a self-hosted vector database or search cluster.

------------------------------------------------------------------------

# Skills Demonstrated

-   Retrieval-Augmented Generation (RAG)
-   Amazon Bedrock Knowledge Bases
-   OpenAI API Integration
-   FastAPI
-   Next.js
-   Docker Containerisation
-   Amazon Elastic Container Registry (ECR)
-   Amazon ECS Fargate
-   Application Load Balancer
-   REST API Development
-   Cloud Architecture
-   Enterprise Search

------------------------------------------------------------------------

# Features

-   ChatGPT-style conversational interface
-   Multiple conversation management with persistent, browser-based
    chat history
-   Retrieval across two Amazon Bedrock Knowledge Bases per query
-   Score-based merging and ranking of retrieval results
-   Answer generation with OpenAI GPT-5-mini
-   FastAPI REST backend
-   Next.js frontend
-   Docker containerisation for both services
-   Live deployment on Amazon ECS Fargate behind an Application Load
    Balancer

------------------------------------------------------------------------

# Supported Enterprise Data Sources

-   Confluence
-   Fireflies
-   GitHub
-   Gmail
-   Google Drive
-   HubSpot
-   Jira
-   Linear
-   Slack

All sources are indexed into Amazon Bedrock Knowledge Bases and queried
through a single, unified conversational interface.

------------------------------------------------------------------------

# Benchmark Data Sampling

The underlying `onyx-dot-app/EnterpriseRAG-Bench` dataset is highly
imbalanced across sources:

  Source          Documents
  --------------- -----------
  Slack           ~275,000
  Gmail           ~120,000
  Linear          ~35,000
  Google Drive    ~25,000
  HubSpot         ~15,000
  Fireflies       ~10,000
  GitHub          ~8,000
  Jira            ~6,000
  Confluence      ~5,000

After inspecting the full counts, only a random sample of up to 1000
documents per source is used to build the knowledge bases, keeping the
corpus balanced across sources rather than letting Slack and Gmail
dominate the retrieval index.

The dataset also ships a `questions` config: 500 official benchmark
questions, each with a gold answer and the specific `doc_id`(s) expected
to answer it. Since this project only ingests a 9,000-document sample
(1000 per source) out of the full ~512,000-document corpus, the
document(s) a given official benchmark question depends on may not be
part of our sample. As a result, this project cannot reliably answer
the full official benchmark question set — answers are only as good as
whatever subset of the source documents was actually sampled and
ingested.

------------------------------------------------------------------------

# Chunking Strategy

Enterprise data sources differ in structure and retrieval needs, so a
single chunking strategy does not serve them all equally well. The
project maintains **two Amazon Bedrock Knowledge Bases**, each tuned
to a different retrieval pattern. The fixed-size KB chunks documents
at 500 tokens with 10% overlap between chunks.

  Data Source     Chunking Strategy   Reason
  --------------- ------------------- ----------------------------------------------------
  Confluence      Fixed-size          Long documentation benefits from semantic chunking
  Fireflies       Fixed-size          Meeting transcripts retrieve better in sections
  GitHub          Fixed-size          PRs and discussions carry large amounts of context
  Google Drive    Fixed-size          Reports and docs often exceed the LLM context window
  HubSpot         No chunking         Customer notes and records stay intact for context
  Jira            No chunking         Issue threads preserve conversation and metadata
  Linear          No chunking         Project specifications remain whole for retrieval
  Slack           No chunking         Conversation threads preserve chat context
  Gmail           No chunking         Email threads stay intact to preserve conversational context

For every query, the backend retrieves from **both Knowledge Bases**,
merges the results, ranks them by similarity score, and passes the
top-scoring passages to GPT-5-mini. This hybrid approach preserves full
email context while improving retrieval accuracy for long-form
documents.

------------------------------------------------------------------------

# Design Decisions

## Retrieval

Amazon Bedrock Knowledge Bases provide managed semantic retrieval.
Each knowledge base is backed by a Pinecone index as its vector store,
with the Pinecone API key stored in AWS Secrets Manager — Bedrock
handles chunking, embedding, and querying against it, so the backend
never talks to Pinecone directly.

## Response Generation

OpenAI GPT-5-mini handles response generation after retrieval.
Separating retrieval from generation makes it straightforward to swap
in a different LLM later without touching the retrieval layer.

## Hybrid Chunking

Different enterprise data sources need different chunking strategies.
Running two specialised Knowledge Bases improves retrieval quality for
long documents while keeping email threads intact.

## Containerisation

The frontend and backend are containerised independently with Docker
and deployed as separate ECS services, enabling independent deployment
and scaling.

------------------------------------------------------------------------

# Architecture

``` text
User
 │
 ▼
Frontend ALB
 │
 ▼
Frontend ECS
 │
 ▼
Backend ALB
 │
 ▼
Backend ECS
 │
 ┌───────────┴───────────┐
 ▼                       ▼
Amazon Bedrock KBs      OpenAI GPT-5-mini
```

------------------------------------------------------------------------

# Retrieval Pipeline

``` text
User Question
      │
      ▼
Next.js Frontend
      │
      ▼
FastAPI Backend
      │
 ┌────┴────┐
 ▼         ▼
Fixed KB  No-Chunk KB
 └────┬────┘
      ▼
Merge & Rank Results
      ▼
Build Prompt
      ▼
GPT-5-mini
      ▼
Response
```

------------------------------------------------------------------------

# AWS Services Used

  AWS Service                               Purpose
  ------------------------------------------ -------------------------
  Amazon Bedrock Knowledge Bases            Semantic retrieval
  Amazon ECS Fargate                        Container orchestration
  Amazon Elastic Container Registry (ECR)   Docker image storage
  Application Load Balancer                 Traffic routing
  AWS IAM                                    Secure permissions
  AWS CloudWatch                             Logging and monitoring
  AWS Secrets Manager                        Stores the Pinecone API key used by the Bedrock KBs

------------------------------------------------------------------------

# Technology Stack

## Frontend

-   Next.js
-   React
-   TypeScript
-   Tailwind CSS

## Backend

-   FastAPI
-   Python
-   Boto3
-   OpenAI Python SDK

## Cloud

-   Amazon Bedrock
-   Amazon ECS Fargate
-   Amazon ECR
-   CloudWatch
-   IAM
-   Secrets Manager

## Vector Store

-   Pinecone (backing both Bedrock Knowledge Bases)

## Containerisation

-   Docker

------------------------------------------------------------------------

# Running Locally

## Backend

```
cd backend
cp .env.example .env   # fill in AWS_REGION, both Knowledge Base/Data Source IDs, OPENAI_API_KEY
pip install -r requirements.txt
uvicorn main:app --reload
```

API available at `http://127.0.0.1:8000/docs`.

## Frontend

```
cd frontend
cp .env.local.example .env.local   # set NEXT_PUBLIC_API_URL to your backend URL
npm install
npm run dev
```

## Docker Compose

```
docker compose up --build
```

Frontend available at `http://localhost:3000`, backend at
`http://localhost:8000`.

------------------------------------------------------------------------

# Deployment Workflow

``` text
Source Code
     │
     ▼
Docker Build
     │
     ▼
Amazon ECR
     │
     ▼
Amazon ECS Fargate
     │
     ▼
Application Load Balancer
     │
     ▼
Browser
```

------------------------------------------------------------------------

# Example Queries

### Confluence

-   What guardrails were introduced after the April 2025 router policy
    regression?
-   What action items were identified in the routing fallback
    retrospective?

### Fireflies

-   What security concerns did HelioHealth raise during the security
    review?

### GitHub

-   Is the new VPC control plane module enabled by default, and how
    can it be rolled back?

### Gmail

-   Why was the Nova Retail deal delayed?

### Google Drive

-   What caused the KV cache latency incident?
-   What follow-up action items were proposed after the P1 incident?

### HubSpot

-   What are Acacia Loop Services' current blockers?
-   What recommendations were given to improve Acacia Loop's latency
    issues?

### Jira

-   What temporary workarounds are available for the VPN roaming
    issue?

### Linear

-   What is the goal of the Cortex Watch dashboard?

### Slack

-   Who should a new employee contact for repository access?
-   What is the escalation path for production incidents?

------------------------------------------------------------------------

# Future Improvements

-   Intelligent document ingestion capable of processing text, tables,
    images, and complex document layouts.
-   Integrate Amazon Bedrock Data Automation or another document
    intelligence service.
-   Support PDF, Word, PowerPoint, Excel, HTML, and image-based
    documents.
-   Source citations in responses.
-   Persistent conversation history using a cloud database.
-   User authentication and role-based access control.
-   On-demand enterprise document upload.
-   Automated CI/CD deployment.

------------------------------------------------------------------------

# Acknowledgements

Sample enterprise documents used to populate the knowledge bases come
from the [`onyx-dot-app/EnterpriseRAG-Bench`](https://huggingface.co/datasets/onyx-dot-app/EnterpriseRAG-Bench)
dataset. Credit to its creators for building and publishing this
benchmark dataset.

The overall system architecture, backend implementation,
Retrieval-Augmented Generation pipeline, cloud deployment, Amazon
Bedrock integration, Docker containerisation, and AWS infrastructure
were independently designed and implemented by the project author.

------------------------------------------------------------------------

# License

This project is licensed under the MIT License.
