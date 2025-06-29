🧪 Data Alchemist
AI-Powered Platform for Smart Data Cleaning, Validation, and Prioritization

Data Alchemist helps you turn messy datasets into meaningful insights using cutting-edge AI. Whether you're cleaning up CSVs or building custom rule sets, this tool is designed to make the process smooth, intelligent, and efficient.

🌟 Key Features
🤖 AI-Powered Data Intelligence
Smart detection of file types like Clients, Workers, Tasks

Automatic header normalization & mapping

Intelligent data correction suggestions

Natural language data querying

Cross-file relationship detection

📊 Deep Data Validation
Real-time inline data checks

Referential integrity across files

Outlier detection, type consistency

Interactive error summaries

Handles bulk datasets simultaneously

⚙️ Business Rules Engine
Define rules in plain English

Rule types: co-run, phase window, load limits, slot restrictions, etc.

AI-generated rules based on data patterns

Pre-execution rule testing

Export rules as structured JSON

🎯 Advanced Prioritization
Multiple scoring methods: sliders, drag-drop, pairwise (AHP)

Use pre-set templates or define custom weights

Scientific weighting via Analytic Hierarchy Process

Auto-detects priority fields from uploaded data

📦 Export Toolkit
Clean, validated CSVs

Configured business rules (JSON)

Priority settings & validation reports

Metadata logs for audit or version control

🚀 Quick Start
📦 Requirements
Node.js v18+

npm or yarn

🛠 Installation
bash
Copy
Edit
git clone https://github.com/your-username/data-alchemist.git
cd data-alchemist
npm install
# or
yarn install
▶️ Run the app
bash
Copy
Edit
npm run dev
# or
yarn dev
Open http://localhost:3000

🏗 Build for Production
bash
Copy
Edit
npm run build
npm start
🧑‍💻 How It Works
1. Upload Files
Drag-and-drop or browse to upload CSV/XLSX files

AI classifies and prepares each file type automatically

2. Clean & Validate
Real-time validation of formats, types, relationships

Cross-file checks for referential integrity

Apply smart AI suggestions

Use natural language search on the grid

3. Create Business Rules
Pick a rule type (7+ categories)

Describe the rule in English

AI structures and validates it

Export ready-to-use JSON rules

4. Prioritize Data
Define fields to prioritize

Choose weighting method (slider, AHP, etc.)

Apply profiles or set custom logic

Export priority matrices

5. Export Everything
Download a ZIP containing:

Cleaned data

Rules (JSON)

Weights

Validation reports

Metadata

🏗️ Tech Stack
Layer	Tech
Frontend	Next.js 13.5, React 18, TypeScript
Styling	Tailwind CSS, shadcn/ui
State Mgmt	Zustand
Data Parse	PapaParse, XLSX
Animations	Framer Motion
Tables	TanStack Table v8
File Export	JSZip, FileSaver.js

🗂 Project Structure
bash
Copy
Edit
data-alchemist/
├── app/                # Next.js app router pages
├── components/         # UI and logic components
│   ├── ai/             # AI features (chat, suggesters)
│   ├── data/           # Table grid and file views
│   ├── layout/         # Layouts and containers
│   ├── steps/          # Step-wise flows (upload, validate, export)
│   ├── validation/     # Validation results & logic
├── store/              # Zustand state
├── utils/              # AI, file parsing, validation logic
├── types/              # Shared TypeScript types
🔧 Config
.env.local
env
Copy
Edit
NEXT_PUBLIC_APP_NAME=Data Alchemist
NEXT_PUBLIC_VERSION=1.0.0
🧪 Customization
➕ Add New Rule Types
Update RULE_TYPES in RuleBuilder.tsx

Add validation logic in utils/validators.ts

Update AI logic in utils/aiDataParser.ts

➕ Add Custom Validator
In validators.ts:

ts
Copy
Edit
export function customValidator(data: any[], headers: string[]): ValidationResult {
  // your logic here
}
📁 Sample Files
Use the "Download Sample Data" button inside the app, or manually test with:

sample_clients.csv

sample_workers.csv

sample_tasks.csv

Each includes realistic sample fields and relationships.

🤝 Contributing
Fork this repo

Create a feature branch: git checkout -b feature/your-feature

Commit: git commit -m 'Add your feature'

Push: git push origin feature/your-feature

Open a Pull Request

Guidelines
Use TypeScript + Tailwind CSS

Follow file structure & conventions

Add tests where needed

Update this README if adding features

🐞 Troubleshooting
❗ "Module not found" errors?
bash
Copy
Edit
npm install
# OR reset:
rm -rf node_modules package-lock.json
npm install
❗ Build errors?
bash
Copy
Edit
npm run build
# Fix TS errors
❗ App slows down with big files?
App is optimized for ~10,000 rows per file

For more, consider backend/offloading logic

📈 Roadmap
✅ Coming in v2.0
Real-time team collaboration

ML-based insights

REST & GraphQL APIs

Dashboard builder

✅ Coming in v2.1
Database integration

Scheduled background jobs

Multi-tenant support

📄 License
MIT — see LICENSE file.

🙌 Credits
shadcn/ui

TanStack Table

Framer Motion

Lucide Icons
