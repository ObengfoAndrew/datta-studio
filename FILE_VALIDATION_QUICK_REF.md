# File Upload Validation - Quick Reference

## What Changed

Added strict file type validation to the file upload feature in `AddDataSourceModal.tsx`.

✅ **Only code files are now accepted**
❌ **Images, videos, PDFs, and other non-code files are rejected**

---

## How It Works

When a user clicks the Upload button and selects a file:

1. **File is selected** via the file picker
2. **Validation runs** (client-side, instant)
3. **MIME type is checked** against allowed list
4. **If MIME type doesn't match**, file extension is checked
5. **If both fail**, user sees error alert with list of valid formats
6. **If valid**, license selection modal appears

---

## Accepted File Types

### 📦 Archives
.zip, .tar, .gz, .tar.gz

### 💻 Programming Languages
Python (.py), JavaScript (.js), TypeScript (.ts, .tsx), Java (.java), C/C++ (.cpp, .c), Go (.go), Ruby (.rb), PHP (.php), C# (.cs), Swift (.swift), Kotlin (.kt), Scala (.scala)

### 📄 Data Formats
JSON, XML, YAML, SQL

### 🌐 Web
HTML, CSS, SCSS, Sass

### 📝 Text
Markdown (.md), Plain text (.txt), Config files (.conf, .config)

### 🔧 Scripts
Bash, Shell (.sh), Zsh

---

## Rejected File Types

❌ Images: PNG, JPG, GIF, SVG, WebP, PSD
❌ Videos: MP4, AVI, MOV, WebM
❌ Audio: MP3, WAV, FLAC, AAC
❌ Documents: PDF, Word, Excel, PowerPoint
❌ Executables: EXE, DLL, SO, DMG

---

## Error Message Example

When user uploads a .pdf file:

```
❌ Invalid file type!

Only code files are accepted. Valid formats include:

Archives: .zip, .tar, .tar.gz, .gz
Code: .js, .ts, .py, .java, .cpp, .go, .rb, .php, .cs, .swift, etc.
Data: .json, .xml, .yaml, .sql
Web: .html, .css, .scss
Text: .txt, .md

You uploaded: document.pdf (application/pdf)
```

---

## Testing

### ✅ Test with valid code file
1. Click "Add Dataset"
2. Select "Upload Code Files"
3. Upload any `.py` or `.js` file
4. → Should proceed to license selection

### ❌ Test with invalid file
1. Click "Add Dataset"
2. Select "Upload Code Files"
3. Try to upload `.png` or `.pdf`
4. → Should show error alert

---

## Code Location

**File:** `src/components/AddDataSourceModal.tsx`

**Functions:**
- `isValidCodeFile()` - Validates file type
- `handleFileSelected()` - Handles file selection with validation

**Constants:**
- `VALID_CODE_EXTENSIONS` - List of allowed extensions
- `VALID_CODE_MIME_TYPES` - List of allowed MIME types

---

## How to Extend

To add more supported file types, modify these constants in `AddDataSourceModal.tsx`:

```typescript
// Add extension
const VALID_CODE_EXTENSIONS = [
  // ... existing extensions
  '.new_extension',  // Add here
];

// Add MIME type
const VALID_CODE_MIME_TYPES = [
  // ... existing MIME types
  'application/new-type',  // Add here
];
```

---

## Key Features

✅ **Instant Validation** - No server calls, validates immediately
✅ **Clear Error Messages** - Shows exactly what went wrong
✅ **Fallback Logic** - Checks extension if MIME type is unknown
✅ **Special Handling** - Supports .tar.gz double extensions
✅ **User-Friendly** - Tells user what they uploaded and why it was rejected

---

**Status: ✅ Implemented & Tested**
