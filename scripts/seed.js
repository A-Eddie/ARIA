// scripts/seed.js — Populate Firestore with demo data
// Run: node scripts/seed.js
require("dotenv").config({ path: "../backend/.env" });
const admin = require("firebase-admin");
const { v4: uuidv4 } = require("uuid");

// Init Firebase
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  : null;

admin.initializeApp({
  credential: serviceAccount
    ? admin.credential.cert(serviceAccount)
    : admin.credential.applicationDefault(),
});
const db = admin.firestore();

// ── Seed data ─────────────────────────────────────────────────
const COMPANY_ID  = "demo-company-001";
const COMPANY_UID = "demo-uid-001";

const JOBS = [
  { id: "j1", title: "Frontend Developer",  department: "Engineering", location: "Nairobi",  type: "Full-time",  status: "open",   token: "demo-frontend",  description: "Build beautiful React UIs",                     skills: ["React","TypeScript","CSS"],        customQuestions: [], candidatesCount: 3 },
  { id: "j2", title: "Data Analyst",        department: "Analytics",   location: "Remote",   type: "Full-time",  status: "open",   token: "demo-data",      description: "Analyse data and build dashboards",             skills: ["Python","SQL","Tableau"],         customQuestions: [], candidatesCount: 2 },
  { id: "j3", title: "Product Manager",     department: "Product",     location: "Nairobi",  type: "Full-time",  status: "closed", token: "demo-pm",        description: "Lead product strategy and roadmap",            skills: ["Roadmapping","Agile","Analytics"], customQuestions: [], candidatesCount: 4 },
  { id: "j4", title: "DevOps Engineer",     department: "Engineering", location: "Nairobi",  type: "Contract",   status: "open",   token: "demo-devops",    description: "Manage cloud infrastructure and CI/CD pipelines", skills: ["AWS","Docker","Kubernetes"],      customQuestions: ["Describe your experience with Kubernetes.", "How do you handle a production outage?"], candidatesCount: 1 },
  { id: "j5", title: "UI/UX Designer",      department: "Design",      location: "Remote",   type: "Full-time",  status: "open",   token: "demo-design",    description: "Design beautiful, user-centered products",     skills: ["Figma","User Research","Prototyping"], customQuestions: [], candidatesCount: 0 },
];

const CANDIDATES = [
  { id: "c1", name: "Amina Wanjiru",   email: "amina@gmail.com",   role: "Frontend Developer", jobId: "j1", status: "evaluated",   score: 87, verdict: "Strong",            hire_recommendation: "Recommend",           interviewId: "i1", evaluationId: "e1" },
  { id: "c2", name: "Brian Otieno",    email: "brian@gmail.com",   role: "Frontend Developer", jobId: "j1", status: "evaluated",   score: 62, verdict: "Competent",         hire_recommendation: "Consider",            interviewId: "i2", evaluationId: "e2" },
  { id: "c3", name: "Cynthia Mwangi",  email: "cynthia@gmail.com", role: "Data Analyst",        jobId: "j2", status: "hired",       score: 93, verdict: "Exceptional",       hire_recommendation: "Strongly Recommend",  interviewId: "i3", evaluationId: "e3", assignmentId: "a1" },
  { id: "c4", name: "David Kamau",     email: "david@gmail.com",   role: "Frontend Developer", jobId: "j1", status: "interviewing",score: null, verdict: null,             hire_recommendation: null,                  interviewId: null, evaluationId: null },
  { id: "c5", name: "Esther Njoki",    email: "esther@gmail.com",  role: "Product Manager",    jobId: "j3", status: "rejected",    score: 45, verdict: "Needs Development", hire_recommendation: "Do Not Recommend",    interviewId: "i5", evaluationId: "e5" },
  { id: "c6", name: "Felix Omondi",    email: "felix@gmail.com",   role: "DevOps Engineer",    jobId: "j4", status: "pending",     score: null, verdict: null,             hire_recommendation: null,                  interviewId: null, evaluationId: null },
  { id: "c7", name: "Grace Waweru",    email: "grace@gmail.com",   role: "Data Analyst",       jobId: "j2", status: "evaluated",   score: 78, verdict: "Strong",            hire_recommendation: "Recommend",           interviewId: "i7", evaluationId: "e7" },
];

const INTERVIEWS = {
  i1: {
    candidateId: "c1", companyId: COMPANY_ID, jobId: "j1", status: "completed",
    messages: [
      { role: "assistant", content: "Welcome, Amina! I'm ARIA. Let's get started. Can you tell me about your most challenging React project?", timestamp: "2024-04-10T09:00:00Z" },
      { role: "user",      content: "I built a real-time dashboard with 50+ concurrent users using WebSockets and Redux Toolkit. It tracked live logistics data for a fleet of 200 vehicles.", timestamp: "2024-04-10T09:01:20Z" },
      { role: "assistant", content: "That's impressive scale! How did you handle state updates when multiple data streams were coming in simultaneously?", timestamp: "2024-04-10T09:01:40Z" },
      { role: "user",      content: "I used Redux Toolkit with memoized selectors to prevent unnecessary re-renders. Each WebSocket event was normalized before dispatch to avoid stale data.", timestamp: "2024-04-10T09:02:45Z" },
      { role: "assistant", content: "Great architecture thinking. Describe a time you disagreed with a design decision and how you handled it.", timestamp: "2024-04-10T09:03:00Z" },
      { role: "user",      content: "The UX team wanted a complex animated onboarding flow that I felt would hurt load time. I built a performance prototype showing 3s vs 0.8s load. We compromised on a lighter animation set.", timestamp: "2024-04-10T09:04:30Z" },
    ],
    durationMinutes: 12,
  },
  i2: {
    candidateId: "c2", companyId: COMPANY_ID, jobId: "j1", status: "completed",
    messages: [
      { role: "assistant", content: "Hi Brian! Walk me through your experience with modern CSS approaches.", timestamp: "2024-04-11T10:00:00Z" },
      { role: "user",      content: "I mainly use Tailwind CSS. I'm comfortable with Flexbox and Grid, and I've done some CSS-in-JS with Styled Components.", timestamp: "2024-04-11T10:01:10Z" },
      { role: "assistant", content: "Good. How would you debug a performance issue where a React page feels sluggish on scroll?", timestamp: "2024-04-11T10:01:30Z" },
      { role: "user",      content: "I'd open Chrome DevTools Performance tab, record a scroll event, and look for long tasks or layout thrashing.", timestamp: "2024-04-11T10:02:30Z" },
    ],
    durationMinutes: 9,
  },
  i3: {
    candidateId: "c3", companyId: COMPANY_ID, jobId: "j2", status: "completed",
    messages: [
      { role: "assistant", content: "Cynthia, welcome! Describe a data pipeline you built from scratch.", timestamp: "2024-04-08T14:00:00Z" },
      { role: "user",      content: "I built an ETL pipeline in Python processing 2M rows daily from 5 different sources into Snowflake. It fed Tableau dashboards used by the C-suite every morning.", timestamp: "2024-04-08T14:01:30Z" },
      { role: "assistant", content: "What was the hardest technical challenge in that pipeline?", timestamp: "2024-04-08T14:01:50Z" },
      { role: "user",      content: "Schema drift. Different source systems changed column types without warning. I built a schema validation layer using Great Expectations that alerted us before bad data reached production.", timestamp: "2024-04-08T14:03:00Z" },
    ],
    durationMinutes: 15,
  },
};

const EVALUATIONS = {
  e1: { candidateId: "c1", companyId: COMPANY_ID, jobId: "j1", interviewId: "i1", score: 87, verdict: "Strong",      strengths: ["Deep React knowledge","Performance optimization skills","Data-driven decision making"], gaps: ["Limited backend experience","No TypeScript mentioned explicitly"], summary: "Amina demonstrates exceptional frontend expertise with strong architectural thinking and real-world scale experience. Her approach to cross-functional collaboration is mature and evidence-based.", hire_recommendation: "Recommend",          technical_rating: 4, communication_rating: 5, culture_fit_rating: 4 },
  e2: { candidateId: "c2", companyId: COMPANY_ID, jobId: "j1", interviewId: "i2", score: 62, verdict: "Competent",   strengths: ["CSS proficiency","Debugging methodology","Positive attitude"],                         gaps: ["Shallow React depth","No performance optimization experience","Limited examples"], summary: "Brian shows solid foundational skills but lacks depth in advanced React patterns. With 3-6 months of mentorship, he could grow into the role effectively.",  hire_recommendation: "Consider",            technical_rating: 3, communication_rating: 3, culture_fit_rating: 4 },
  e3: { candidateId: "c3", companyId: COMPANY_ID, jobId: "j2", interviewId: "i3", score: 93, verdict: "Exceptional", strengths: ["Large-scale pipeline experience","Proactive data quality ownership","Business acumen"], gaps: ["Presentation skills could improve"], summary: "Cynthia is an outstanding candidate who has already solved the exact problems we face at scale. Her proactive approach to data quality is precisely what the team needs.",  hire_recommendation: "Strongly Recommend",  technical_rating: 5, communication_rating: 4, culture_fit_rating: 5 },
  e5: { candidateId: "c5", companyId: COMPANY_ID, jobId: "j3", interviewId: "i5", score: 45, verdict: "Needs Development", strengths: ["Enthusiasm","Basic product knowledge"], gaps: ["No shipping experience","Weak technical understanding","Poor prioritization framework"], summary: "Esther shows genuine enthusiasm but lacks the hands-on product experience required for this senior role. Recommend revisiting after 2 years of product ownership.", hire_recommendation: "Do Not Recommend", technical_rating: 2, communication_rating: 3, culture_fit_rating: 3 },
  e7: { candidateId: "c7", companyId: COMPANY_ID, jobId: "j2", interviewId: "i7", score: 78, verdict: "Strong",      strengths: ["Strong SQL skills","Clear analytical thinking","Stakeholder communication"], gaps: ["Python could be stronger","No experience with dbt"], summary: "Grace is a capable analyst with solid fundamentals and good business instincts. She would benefit from exposure to modern data stack tooling.", hire_recommendation: "Recommend", technical_rating: 4, communication_rating: 4, culture_fit_rating: 4 },
};

const ASSIGNMENTS = {
  a1: {
    candidateId: "c3", companyId: COMPANY_ID, jobId: "j2",
    welcome_message: "Welcome to the team, Cynthia! Your data expertise is exactly what we've been looking for and we can't wait to see your impact.",
    mentor: "James Mwenda, Head of Analytics",
    onboarding_tasks: [
      { task: "Environment Setup",       description: "Configure Python, dbt, and connect to Snowflake data warehouse",   due: "Day 1-3", priority: "Critical" },
      { task: "Meet the Team",           description: "1:1s with all analytics team members and key business stakeholders", due: "Day 1-3", priority: "High" },
      { task: "Data Catalogue Review",   description: "Study existing data models, naming conventions, and documentation",  due: "Week 1",  priority: "High" },
      { task: "Shadow Current Analyst",  description: "Pair with James on the active Q2 revenue analysis project",          due: "Week 1",  priority: "Medium" },
      { task: "First Independent Report",description: "Produce a KPI summary dashboard for the marketing team",             due: "Week 2",  priority: "Medium" },
    ],
    first_project: {
      title:        "Customer Churn Prediction Model",
      description:  "Build an ML model to predict customer churn 30 days in advance, enabling proactive retention campaigns. Target >80% accuracy and integrate with the existing CRM dashboard.",
      deliverables: ["Exploratory data analysis report", "Trained model with >80% accuracy", "Automated weekly scoring pipeline", "Stakeholder presentation with business impact analysis"],
      deadline:     "End of Month 1",
      tools:        ["Python", "scikit-learn", "dbt", "Snowflake", "Tableau"],
    },
    kpis: ["Model accuracy ≥80%", "Pipeline runs with <5% error rate", "Dashboard adopted by 3+ teams", "Weekly reports delivered on time"],
    learning_resources: ["Internal data wiki", "dbt documentation", "Company analytics handbook"],
    team_introduction: "You'll be joining a team of 4 analysts and 2 data engineers, working closely with Product and Finance.",
  },
};

// ── Seeder ────────────────────────────────────────────────────
async function seed() {
  const batch = db.batch();
  const now   = admin.firestore.FieldValue.serverTimestamp();

  console.log("🌱 Seeding ARIA demo data...\n");

  // Company
  console.log("  → Company");
  batch.set(db.collection("companies").doc(COMPANY_ID), {
    id: COMPANY_ID, name: "TechCorp Kenya", email: "hr@techcorp.co.ke",
    ownerId: COMPANY_UID, plan: "growth", interviewsUsed: 14, interviewsLimit: 50,
    createdAt: now, updatedAt: now,
  });

  // Jobs
  console.log("  → Jobs");
  for (const j of JOBS) {
    batch.set(db.collection("jobs").doc(j.id), { ...j, companyId: COMPANY_ID, createdAt: now, updatedAt: now });
  }

  // Candidates
  console.log("  → Candidates");
  for (const c of CANDIDATES) {
    batch.set(db.collection("candidates").doc(c.id), { ...c, companyId: COMPANY_ID, createdAt: now, updatedAt: now });
  }

  // Interviews
  console.log("  → Interviews");
  for (const [id, iv] of Object.entries(INTERVIEWS)) {
    batch.set(db.collection("interviews").doc(id), { id, ...iv, startedAt: now, completedAt: now });
  }

  // Evaluations
  console.log("  → Evaluations");
  for (const [id, ev] of Object.entries(EVALUATIONS)) {
    batch.set(db.collection("evaluations").doc(id), { id, ...ev, generatedAt: now });
  }

  // Assignments
  console.log("  → Assignments");
  for (const [id, as] of Object.entries(ASSIGNMENTS)) {
    batch.set(db.collection("assignments").doc(id), { id, ...as, createdAt: now });
  }

  await batch.commit();
  console.log("\n✅ Seed complete! Demo data is live in Firestore.");
  console.log("   Company ID:", COMPANY_ID);
  console.log("   Jobs seeded:", JOBS.length);
  console.log("   Candidates:", CANDIDATES.length);
  process.exit(0);
}

seed().catch(e => { console.error("Seed failed:", e); process.exit(1); });
