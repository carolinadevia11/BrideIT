# Document Parsing Feature

## Overview

The document parsing feature is designed to automatically extract structured data from legal documents, specifically divorce and custody agreements. This feature helps users quickly digitize and understand the key terms of their legal agreements without manual data entry. It supports both PDF and DOCX file formats and uses a combination of text extraction and AI-powered analysis to identify and interpret relevant information.

## API Endpoint

The document parsing feature is integrated into the document upload process. When a user uploads a document, the backend processes the file, extracts the text, and then sends it to the parsing service.

### Endpoint Description

The primary endpoint for uploading documents is `POST /api/v1/documents/upload`. This endpoint handles the entire document upload process, including parsing.

-   **File:** [`backend/routers/documents.py`](backend/routers/documents.py:1)
-   **Function:** [`upload_document`](backend/routers/documents.py:462)

### Request Format

The request should be a `multipart/form-data` request containing the following fields:

-   `file`: The document to be uploaded (PDF or DOCX).
-   `name`: The name of the document.
-   `type`: The type of document (e.g., `custody-agreement`, `court-order`).
-   `folder_id`: The ID of the folder where the document should be stored.

### Response Format

The endpoint returns a JSON object with the following structure:

```json
{
  "id": "string",
  "name": "string",
  "type": "string",
  "customCategory": "string",
  "uploadDate": "string",
  "size": "string",
  "status": "string",
  "tags": [],
  "description": "string",
  "isProtected": false,
  "protectionReason": "string",
  "fileType": "string",
  "fileUrl": "string",
  "fileName": "string"
}
```

## Parsing Logic

The parsing logic is handled by the `DocumentParser` service, which is responsible for extracting text from the document and using AI to parse it.

-   **File:** [`backend/services/document_parser.py`](backend/services/document_parser.py:1)
-   **Class:** `DocumentParser`

### Text Extraction

The `extract_text_from_file` method is responsible for extracting text from the uploaded document. It supports the following file types:

-   **PDF:** Uses the `pdfplumber` library to extract text from PDF files.
-   **DOCX:** Uses the `python-docx` library to extract text from DOCX files.

If the required libraries are not installed, the feature will gracefully handle the error and log a warning message.

### AI-Powered Parsing

The `parse_with_ai` method uses the extracted text to parse the document and extract key information. It uses the OpenAI API to analyze the text and return a structured JSON object. The prompt is designed to extract the following information:

-   `custodyArrangement`
-   `custodySchedule`
-   `holidaySchedule`
-   `decisionMaking`
-   `expenseSplit`
-   `childSupport`
-   `extractedTerms`
-   `startDate`
-   `endDate`
-   `confidence`

If the AI service is unavailable or fails, the system falls back to a pattern-matching approach to extract basic information.

## Current Status

The document parsing service is fully implemented but is not yet integrated with the document upload endpoint. The next step is to update the [`upload_document`](backend/routers/documents.py:462) function in [`backend/routers/documents.py`](backend/routers/documents.py:1) to call the `DocumentParser` service and store the parsed data in the database.