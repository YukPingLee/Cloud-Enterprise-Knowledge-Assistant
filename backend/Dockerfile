FROM python:3.10-slim

# Create the working directory and also get into it
WORKDIR /app

COPY requirements.txt .

# Install Python packages
# --no-cache-dir stop the vm from saving a copy of the package to a cache (disk)
RUN pip install --no-cache-dir -r requirements.txt

# Copy current folder on your laptop to the current folder inside the container
COPY . .

# FastAPI needs port 8000 to be exposed
EXPOSE 8000

# Start FastAPI
# equivalent to this: uvicorn main:app --host 0.0.0.0 --port 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]


#   docker build -t enterprise-backend .

#   docker run -p 8000:8000 enterprise-backend
