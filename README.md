# CampusConnect — Intelligent Facilities Care & Ticket Lifecycle

> **DevArambh Hackathon • Google Developer Groups Collaboration**  
> Built in accordance with the official CampusConnect PRD & 24-Hour Technical Blueprint.

CampusConnect converts informal, incomplete student maintenance complaints into structured, explainable, trackable facilities tickets. Gemini AI provides structured interpretation and missing-information clarification, while deterministic application code strictly enforces campus routing policies, finite state transitions, and persistent event audit trails.

---

## Key Features

1. **Material 3 (M3) Design Language**
   - Built from the ground up using official Google Material 3 tokens: tonal elevation palettes, dynamic surface containers, MD3 rounded corners (`shape-corner-l`, `shape-corner-xl`), filled & outlined buttons, floating labels, assist chips, and accessible color contrast.

2. **4 Core Problem Categories**
   - 🔧 **Plumbing**: Water leaks, ceiling seepage, sink blockages, drainage hazards.
   - ⚡ **Electricity**: Buzzing distribution boards, flickering lights, tripping breakers, socket faults.
   - 🧹 **Cleanliness**: Overflowing waste receptacles, restroom sanitation, litter, spills.
   - 🌐 **Internet Connectivity**: Campus Wi-Fi drops, DHCP lease failures, AP signal degradation.

3. **Intelligent Intake & Clarification Dialogue**
   - Accepts natural language descriptions, structured campus locations (building, floor, room), and optional photos.
   - Gemini AI generates an instant actionable draft (concise title, 1-2 sentence summary, category recommendation, routing rationale).
   - If crucial operational details are missing (e.g. room number or outage scope), an interactive **one-question clarification dialogue** is presented to the student.
   - Before creation, a side-by-side **Confirmation Card** contrasts the student's original wording with the AI extraction, ensuring model output is never mistaken for student words.

4. **Transparent Student Tracking**
   - Generates collision-resistant references (e.g. `CC-2026-000101`).
   - Chronological event timeline showing who acted, timestamp, new status, and student-safe resolution notes.
   - Persistent across page reloads and browser sessions.

5. **Staff Triage Dashboard & Lifecycle Control**
   - Operational queue with real-time KPI counters (Workload, Unassigned, In Progress, Resolved).
   - Filters by category, status, and instant text search.
   - Strictly enforced **Finite State Machine**:
     `Submitted` ➔ `Acknowledged` ➔ `Assigned` ➔ `In progress` ➔ `Blocked` ➔ `Resolved` (illegal transitions are rejected with 400 Bad Request).
   - Technician assignment and mandatory resolution logging.

6. **Duplicate Report Detection & Human Review**
   - Deterministic spatial/temporal narrowing + keyword/AI similarity scoring.
   - Surfaced to staff in a side-by-side comparison modal with match confidence and rationale.
   - Explicit human actions: **"Mark Same Underlying Incident"**, **"Mark Separate Issue"**, or **"Defer"**. Both records remain intact without data loss or auto-deletion.

7. **Explainable Routing Provenance**
   - Replaceable, clearly labelled demo routing rules linked to transparent source guidelines.

---

## Architecture: Single-Service Google Cloud Run & AI Studio Ready

To guarantee reliable zero-friction deployment:
- A single Node.js 24 LTS Express service hosts both the built React/Vite Material 3 frontend and the `/api/*` REST endpoints from the **same origin**.
- Eliminates CORS complications and multi-container orchestration.
- Listens on `process.env.PORT` (default `8080`) and binds to `0.0.0.0`.
- Includes `.gcloudignore` so credentials and `node_modules` are never uploaded.
- Auto-detects `GEMINI_API_KEY` from Google AI Studio. If unconfigured, automatically enables a local deterministic rule engine so the application remains 100% testable and operational in all environments.

---

## Getting Started Locally

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment (Optional)
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Add your free Google AI Studio API key (get one from [https://aistudio.google.com](https://aistudio.google.com)):
```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=8080
```
*(If left blank, CampusConnect seamlessly runs using the built-in deterministic rule engine.)*

### 3. Run Self-Check Verification Tests
```bash
npm test
```

### 4. Build & Start Full-Stack App
```bash
# Build frontend and server bundles
npm run build

# Start production server
npm start
```
Open **[http://localhost:8080](http://localhost:8080)** in your browser.

---

## Deploying Through Google AI Studio & Google Cloud Run

### Option A: 1-Click Source Deployment (No Docker Workflow)
As specified in Chapter 13 of the project documentation, Cloud Run source deployment utilizes Google Cloud Buildpacks without requiring a local Docker daemon:

```bash
# 1. Set your GCP project
gcloud config set project YOUR_PROJECT_ID
gcloud config set run/region asia-south1

# 2. Store your Google AI Studio API key in Secret Manager
gcloud secrets create gemini-api-key --replication-policy=automatic
echo -n "YOUR_AI_STUDIO_KEY" | gcloud secrets versions add gemini-api-key --data-file=-

# 3. Deploy directly from the project directory
gcloud run deploy campusconnect \
  --source . \
  --region asia-south1 \
  --allow-unauthenticated \
  --set-secrets=GEMINI_API_KEY=gemini-api-key:latest
```

### Option B: Deploy from Google AI Studio / Project IDX
1. In Google AI Studio, export prompt / app or link the repository.
2. Select **Deploy to Cloud Run**.
3. Supply `GEMINI_API_KEY` as an environment variable. Cloud Build will execute `npm run build` and `npm start` automatically.

---

## API Summary

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health status, persistence stats, AI engine mode |
| `POST` | `/api/ai/draft` | Extract structured issue details & clarification |
| `POST` | `/api/tickets` | Confirm and persist ticket with reference number |
| `GET` | `/api/tickets/mine` | List student's submitted tickets |
| `GET` | `/api/tickets/:id` | Fetch ticket with chronological event audit trail |
| `GET` | `/api/staff/tickets` | Staff queue with search, category & status filters |
| `PATCH` | `/api/staff/tickets/:id/assignment` | Assign technician to ticket |
| `POST` | `/api/staff/tickets/:id/status` | Enforce valid state transition & log event note |
| `GET` | `/api/staff/tickets/:id/duplicates` | Retrieve duplicate candidates for ticket |
| `POST` | `/api/staff/duplicate-reviews` | Record human review decision & safe ticket link |
| `GET` | `/api/routing-rules` | Retrieve campus routing guide & provenance rules |
| `POST` | `/api/reset-demo` | Reset database to default seed state for presentations |
