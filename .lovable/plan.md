

# PDF Upload + AI Extraction for SEO Analytics

## Overview
Replace the manual SEO analytics form with a PDF upload flow. Team members upload a monthly SEO report PDF, an edge function extracts the key metrics using OpenAI, and the data is saved to `seo_analytics` automatically.

## How It Works

```text
User clicks "Upload SEO Report" → selects PDF
  → PDF uploaded to Supabase Storage (department-files bucket)
  → PDF content sent to edge function "extract-seo-report"
  → OpenAI extracts: DA, backlinks, keywords top 10, organic traffic, top keywords
  → Extracted data shown in dialog for review/edit
  → User confirms → upsert into seo_analytics table
```

## Data Extraction from PDF

Based on the uploaded sample PDF, the AI will extract:
- **Domain Authority**: from backlink profile or KPI dashboard
- **Backlinks**: count of referring domains with DA > 40
- **Keywords in Top 10**: from keyword rankings table
- **Organic Traffic**: total sessions from traffic analysis
- **Top Keywords**: keyword name, position, and change from the keyword rankings table
- **Month**: from the report date/title

## Files to Create/Modify

### 1. New Edge Function: `supabase/functions/extract-seo-report/index.ts`
- Accepts a PDF file URL or base64 content
- Uses OpenAI GPT-4o-mini to parse the text and extract structured JSON
- Returns: `{ month, domain_authority, backlinks, keywords_top_10, organic_traffic, top_keywords[] }`
- Prompt instructs OpenAI to find KPI values, keyword rankings table, and traffic totals

### 2. Modify: `src/components/department/UpdateSeoAnalyticsDialog.tsx`
- Add a file upload dropzone at the top of the dialog
- When PDF is selected:
  - Read as base64, send to `extract-seo-report` edge function
  - Show loading state ("Extracting data from PDF...")
  - Auto-populate all form fields with extracted values
- Keep all manual fields editable so team can review/correct before saving
- The dialog becomes a "review & confirm" step after AI extraction

### 3. Modify: `src/pages/WebsiteDepartment.tsx`
- Change the "Update" button label to "Upload SEO Report"
- Update the icon from Pencil to Upload

### 4. Config: `supabase/config.toml`
- Add `[functions.extract-seo-report]` with `verify_jwt = false`

## Edge Function Design

The function will:
1. Receive PDF as base64 in the request body
2. Send the PDF text content to OpenAI with a structured extraction prompt
3. Use JSON mode to get reliable structured output
4. Return the extracted data

OpenAI prompt will instruct:
- Find organic traffic total (sessions)
- Find domain authority score
- Count backlinks with DA > 40
- Count keywords ranking in top 10
- Extract keyword table with position and change values
- Determine the report month from the date

## UX Flow
1. Team member clicks "Upload SEO Report"
2. Dialog opens with a file upload area + all the existing manual fields
3. User selects a PDF → "Extracting..." spinner appears
4. Fields auto-populate with extracted values
5. User reviews, edits if needed, clicks "Save"

No database changes needed — uses existing `seo_analytics` table and `department-files` storage bucket.

