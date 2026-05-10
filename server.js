const http = require('http');
const https = require('https');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8080;
const AWS_KEY = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET = process.env.AWS_SECRET_ACCESS_KEY;
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

const SYSTEM_PROMPT = `You are a real-time interview assistant for Round 2 (culture fit / hiring manager round) of a Transformation Lead Consultant role at Astellas Pharma. The interviewer is Mukta Arora, Managing Director of the Bangalore GCC. She is a senior GCC builder (Lilly, Elanco, now Astellas). Route every interviewer utterance to the best matching prepared section.

Respond with EXACTLY one token. No explanation, no preamble, no punctuation.

## Sections (pick the CLOSEST match):

INTRO — "Tell me about yourself", "introduce yourself", "walk me through your background", "your experience", any opening/icebreaker question about who the candidate is. DEFAULT for the start of the interview.

CAREER — "Walk me through your career", "why pharma", "why transformation", "your career journey", "how did you get here", "your career path", "from pharma sales to transformation".

WHYASTELLAS — "Why Astellas", "what do you know about us", "what attracted you to Astellas", "why this company", "what do you know about our company", "what excites you about Astellas".

WHYROLE — "Why this role", "what attracted you to this position", "how does your experience align", "why are you a good fit", "what makes you right for this role", "how do you see yourself in this role".

SERVICESGCC — "How will you transition from services/vendor to GCC/in-house", "you come from a services company", "vendor to internal", "agency to in-house", "consulting to internal", "how would you operate inside pharma".

TECHSHIFT — "Your profile looks very GenAI/tech heavy", "this role is broader/less technical", "how do you move from tech to people-focused", "are you too technical", "this is a change management role not a tech role".

CHANGECULTURE — "Tell me about a culture change initiative", "culture program", "values rollout", "embedding culture", "change program you led", "engaging hearts and minds", "organizational culture".

TRISITE — "How would you build engagement across India Poland Mexico", "cross-geography engagement", "multi-site strategy", "three GCCs", "global engagement", "One Astellas across sites", "tri-site communication".

SHAREPOINT — "SharePoint", "intranet", "digital platform", "internal platform", "knowledge management platform", "engagement platform", "town square", "digital workplace".

SENIORADOPT — "Driving adoption among senior leaders", "leadership adoption", "getting leaders to adopt", "executive buy-in for tools/processes", "OKR adoption", "Bowler Charts adoption", "governance mechanisms".

RESISTANCE — "Tell me about resistance", "managing resistance", "stakeholder pushback", "difficult stakeholders", "skeptics", "winning over opponents", "dealing with pushback", "people who didn't want to change".

LEADSTYLE — "What is your leadership style", "how do you lead", "describe your management approach", "how do you manage teams", "leadership philosophy".

FIRST90 — "First 90 days", "first three months", "how would you approach the role", "what would you do initially", "your plan for getting started", "how would you ramp up", "onboarding plan".

GENAI — "GenAI adoption", "AI transformation", "enterprise AI", "400 employees", "8 pilots", "50 use cases", "how did you drive adoption of AI", "technology adoption at scale", "GenAI Community of Practice".

BOWLERS — "Bowler Charts", "KPI system", "executive dashboard", "governance dashboard", "Power BI", "how did this become a governance mechanism", "CXO reviews", "board-level reporting".

COACHING — "How do you coach juniors", "developing team members", "mentoring", "growing people", "leadership development", "managing direct reports", "upskilling", "team development".

FAILURE — "Tell me about a failure", "something that didn't go to plan", "biggest mistake", "what went wrong", "lessons learned", "what would you do differently", "setback".

CXOWORK — "Working with C-suite", "senior stakeholders", "executive engagement", "presenting to leadership", "COO", "Executive Director", "Managing Principal", "how do you work with senior leaders".

CURRENTROLE — "What is your current role", "what do you do today", "Vertex", "AstraZeneca", "current responsibilities", "describe your current work", "what are you working on now".

WHYLEAVE — "Why are you leaving", "why leave Indegene", "why are you looking for a change", "what's motivating this move", "you were just promoted".

PHARMACHECK — "What's your read on Astellas portfolio", "XTANDI", "PADCEV", "pipeline", "SMT", "what do you know about our products", "our strategic challenges", "pharma industry knowledge".

VALUES — "Values and Behaviors", "Integrity Innovation Impact", "Courage Urgency One Astellas", "what do you think of our values", "how would you embed values", "why these values".

TOMANDATE — "Transformation Office", "how the TO works", "Chapters", "Stream Crew Pod", "Managing Principal", "what does the role actually involve", "day to day", "how initiatives are run".

ONEASTELLAS — "One Astellas", "unified culture", "shared identity", "how to connect distributed teams", "silos", "coherence across sites", "how to make people feel part of one company".

BUDGET — "Budget management", "financial ownership", "cost management", "have you managed budgets", "P&L", "cost optimization", "vendor negotiations".

GAPS — "You've never worked inside a pharma", "global experience within one org", "years of experience", "multi-geography within one org", "what don't you know", "where are your gaps".

SANOFI — "Sanofi Connect", "omnichannel", "HCP engagement", "digital channels", "field force transformation", "pharma marketing", "multichannel".

BSV — "BSVwithU", "Bharat Serum", "platform management", "women's health", "monthly reporting to COO", "end-to-end project ownership".

ASKME — "Do you have any questions for me", "any questions", "what would you like to know", "your turn to ask", end of interview questions invitation.

FOLLOWUP — The interviewer is probing deeper into a previous answer: "tell me more", "can you elaborate", "what specifically", "what would you have done differently", "how did you measure that", "give me an example", "what was the outcome", "and then what happened".

## When to respond NONE:
- The candidate is answering (statements starting with "I built...", "We ran...", "In my experience...", "So what we did was...", "The result was...")
- Pure small talk ("how are you", "nice to meet you", "can you hear me okay")
- Logistics ("let me share my screen", "can you see this", "we have about 30 minutes")
- Truly unintelligible or single-word fragments

## CRITICAL RULES:
- If the interviewer is asking, prompting, or directing ANY question — ALWAYS pick the closest section. NEVER return NONE for an interviewer question.
- When in doubt between two categories, pick the more specific one.
- When in doubt between a category and NONE, pick the category.
- INTRO is for the very start — "tell me about yourself" style openers.
- The transcript may be imperfect (speech-to-text errors, fragments, Indian accent). Do your best to interpret intent.
- Valid tokens: INTRO CAREER WHYASTELLAS WHYROLE SERVICESGCC TECHSHIFT CHANGECULTURE TRISITE SHAREPOINT SENIORADOPT RESISTANCE LEADSTYLE FIRST90 GENAI BOWLERS COACHING FAILURE CXOWORK CURRENTROLE WHYLEAVE PHARMACHECK VALUES TOMANDATE ONEASTELLAS BUDGET GAPS SANOFI BSV ASKME FOLLOWUP NONE
- Respond with EXACTLY one of the above tokens`;

const PANEL_MAP = {
  INTRO: 1, CAREER: 2, WHYASTELLAS: 3, WHYROLE: 4, SERVICESGCC: 5,
  TECHSHIFT: 6, CHANGECULTURE: 7, TRISITE: 8, SHAREPOINT: 9,
  SENIORADOPT: 10, RESISTANCE: 11, LEADSTYLE: 12, FIRST90: 13,
  GENAI: 14, BOWLERS: 15, COACHING: 16, FAILURE: 17, CXOWORK: 18,
  CURRENTROLE: 19, WHYLEAVE: 20, PHARMACHECK: 21, VALUES: 22,
  TOMANDATE: 23, ONEASTELLAS: 24, BUDGET: 25, GAPS: 26,
  SANOFI: 27, BSV: 28, ASKME: 29, FOLLOWUP: 30
};

const CUES = {
  INTRO: [
    'Decade in life sciences — 3 yrs field (Intas, J&J, Novartis) + 5+ yrs transformation at Indegene',
    'Arc: field sales → MBA NMIMS → strategic transformation at scale',
    'Indegene Bangalore IS a GCC for pharma clients — delivery-side of GCC model',
    '12 pharma companies: Sanofi, Amgen EU5, Pfizer, Janssen, AZ, BI, Merck KGaA, CSL Vifor, Gilead, Regeneron, Haleon, Vertex',
    'Common thread: helping complex orgs move from strategic intent → adoption at scale',
    'Operating models + governance cadences + communication architecture + capability building',
    'Astellas moment: CSP2026, 3 GCCs scaling, SMT, "Change Communication" = top gap',
    'NOT a GenAI person — strategy-execution leader who builds adoption at scale',
    'CLOSE: "What excites me is that GCCs, CSP2026, and One Astellas need exactly that bridge between strategy, communication, and execution."',
  ],
  CAREER: [
    'Anchor 1 — Pharma is INTENTIONAL, not accidental. B.Pharm Manipal → field sales → MBA NMIMS → Indegene',
    'Field sales (Intas, J&J, Novartis): customer ground-truth, HCP behaviour, execution reality',
    'Anchor 2 — Arc is "from the field to the boardroom"',
    'MBA + Indegene moved into transformation execution at scale',
    'Each phase deepened pharma fluency while expanding transformation breadth',
    'Anchor 3 — Why Astellas NOW. CSP2026, 3 GCCs at 3 maturity curves, Change Communication gap',
    'Once-in-a-plan-cycle window to shape activation, not just translate it',
    'Build role at a build moment — and chance to build alongside someone who has done it twice before (learning multiplier)',
    'MUKTA-CUE: Close with "…and ultimately, this all ladders up to VALUE for patients"',
  ],
  WHYASTELLAS: [
    'Real transformation inflection point — NOT generic "innovative company"',
    'CSP2026 launching late May — first execution wave of new 5-year plan',
    'SMT: ¥150B recurring savings by FY2027 — insourcing, vendor rationalisation',
    'April 2025 reorg: Value Creation / Value Delivery / Value Enablement',
    '3 GCCs positioned as CRITICAL ENABLERS, not support centers',
    '"Change Communication" self-identified as TOP materiality gap (Feb 2025)',
    'Transformation is not theoretical here — must show up as operating rhythm, alignment, capability, metrics',
    'Specific: the chance to build the third GCC alongside someone who has done it twice = learning multiplier',
    'AVOID: "Astellas is innovative and patient-focused" — too generic',
  ],
  WHYROLE: [
    'Sits at intersection of THREE things I\'ve built career around:',
    '1. Transformation execution → Bowlers, OKRs, automation, Vertex Innovation Center',
    '2. Engagement/communication strategy → Change Makers, Sanofi Connect, Reg Intel GTM',
    '3. GCC/capability building → GenAI CoP, cross-functional teams, SharePoint tracker',
    'Success = NOT more communication artefacts',
    'Success = repeatable engagement system: India/Poland/Mexico as One Astellas while preserving site strengths',
    'Three differentiators: pharma fluency (12 co) + transformation craft + GCC delivery perspective',
    'Not a maintenance role — BUILD role at a BUILD moment. Career arc matches that energy.',
    'MUKTA-CUE: "Operating models, governance cadences, change adoption at scale — that IS the role"',
  ],
  SERVICESGCC: [
    'DON\'T sound defensive — this transition EXCITES me',
    'Services taught breadth and speed across multiple pharma operating contexts',
    'Limitation: one step removed from long-term enterprise ownership',
    'GCC expectation: own capability building, continuity, institutional memory, internal adoption',
    'My transition: delivering transformation FOR pharma → building transformation capability INSIDE pharma',
    'Indegene Bangalore IS itself a GCC for pharma clients — I\'ve lived the model from inside',
    'Cite: Vertex Innovation Center, AZ solutioning, Bowler Charts, Change Makers Council',
    'KEY LINE: "Moving from vendor-side execution to enterprise-side capability ownership"',
    'What I build in first 60-90 days: Astellas-specific depth — XTANDI, SMT, "One Astellas" nuance',
  ],
  TECHSHIFT: [
    'GenAI is ONE EXPRESSION of transformation — not my identity',
    'Real skill: adoption, operating model, stakeholder transformation. Tech is one vehicle.',
    'GenAI adoption: hard part was NOT tech — reframing "productivity" to "augmentation"',
    'Gave SMEs role of quality bar — that\'s CHANGE MANAGEMENT, not engineering',
    'Change Makers Council, Culture Credo — zero tech, pure organisational behaviour change',
    'Bowler Charts: hard part = getting leaders to treat data as voice of their function',
    'OKR ~90% adoption: sat with leaders\' actual pain, not tool features',
    'KEY LINE: "The role gives me a broader enterprise canvas for the same capability: helping people, processes, tools, and leadership narratives move together"',
    'DO NOT SAY "I am okay doing less tech" — sounds like compromise',
  ],
  CHANGECULTURE: [
    'STRONGEST CULTURE-FIT STORY — Mukta will love this. Do NOT undersell.',
    'Change Makers Council — 26 volunteers, NOT communicators (SMEs, engineers, finance)',
    'Problem: Indegene scaling fast, 4 Core Values articulated at top but not lived day-to-day',
    'Co-authored Credo language WITH OD leadership — of the people, not for them',
    'Multi-wave campaigns: teaser "Riddle N Fiddle", video mailers, story competitions',
    'Each wave 7-14 days, breathing room between — consistency beats intensity',
    'Volunteers carried values in THEIR own voice — influencing without authority',
    'Signal: "Empathy" showing up unprompted in performance reviews by month 4',
    'Council outlasted the launch — self-renewing capability, durable culture mechanism',
    'ASTELLAS BRIDGE: "Exactly the muscle for embedding 3 Values + 5 Behaviors across 3 GCCs — One Astellas in three time zones, one narrative, locally resonant"',
    'MUKTA-CUES: "Engaging hearts and minds", "Consistency beats intensity", "Not internal marketing — relationship architecture"',
  ],
  TRISITE: [
    'ONE OF THE MOST IMPORTANT QUESTIONS — prepare deeply',
    'Step 1: DIAGNOSE before designing — maturity, functional mix, leadership priorities, sentiment, channels',
    'Step 2: Common GCC narrative — One Astellas, but NOT sameness',
    'Step 3: Site-specific story pillars:',
    '  → India: full-stack capability hub (Mukta, 300+)',
    '  → Poland/Warsaw: GBS/clinical core (Andżelika, The Bridge)',
    '  → Mexico: medical-digital-innovation (Flavio, Jan 2026)',
    'Step 4: SharePoint engagement hub — leadership messages, milestones, stories, FAQs, recognition, analytics',
    'Step 5: Governance — editorial calendar, content owners, approval, leadership cadence',
    'Step 6: Measure adoption — visits, repeat users, story submissions, leadership engagement, qualitative pulse',
    'KEY LINE: "The comms job is NOT to flatten three GCCs into one voice. It is to create coherent difference under One Astellas."',
    'Three different maturity curves = different messaging. 12-month hub ≠ 3-month hub.',
    'Success = leaders in each GCC repeating the narrative in own words, unprompted, by month 9',
  ],
  SHAREPOINT: [
    'NOT "I know SharePoint" — treat it as OPERATING BACKBONE for engagement',
    'It should answer 5 questions for every employee and leader:',
    '  1. What is the GCC strategy?',
    '  2. What is changing?',
    '  3. How does my work connect to Astellas priorities?',
    '  4. What stories prove impact?',
    '  5. Where is the latest source of truth?',
    'Architecture: Homepage (narrative + updates) → Strategy (CSP2026 in GCC context) → Site Pages (India/Poland/Mexico) → Engagement Calendar → Leadership Archive → Stories → Recognition → Analytics',
    'NOT a document dump — must serve a WORKFLOW. Repositories die.',
    'Adoption metrics from day 1 — not pageviews but cross-GCC reads = "One Astellas" health check',
    'Federated model: each GCC MD owns narrative, shared spine of tone + hashtags',
    'MY PROOF: Built SharePoint utilization tracker for 120+ team in <1 month',
    'MUKTA-CUE: Think of it as the "digital town square" — connective tissue for cross-GCC governance',
  ],
  SENIORADOPT: [
    'TWO STORIES: OKR/Quantive adoption OR Bowler Charts — pick based on context',
    'OKR STORY:',
    '  Leaders weren\'t resistant to goals — resistant to PUBLIC misalignment',
    '  Reframed: tool rollout → leadership clarity instrument',
    '  Three levers: change enablement (workshops), UX optimisation, governance (cadences)',
    '  Worked 1:1 with most skeptical leaders — sat with THEIR actual pain',
    '  Left them with useful artifact — didn\'t ask them to adopt',
    '  They logged back in for their next leadership review',
    '  ~90% adoption within 6 months',
    'BOWLER STORY:',
    '  Excel → Power BI → artefact that organised CXO reviews',
    '  Assigned POCs per function, data-gathering processes, decision-forcing cadence',
    '  Transformed from reporting → spine of CXO/board strategic decision-making',
    'KEY: "Executive governance tools succeed on three things: data discipline, named accountability, decision-forcing cadence"',
    'MUKTA-CUE: "Sustained behavioral change at senior levels requires courage — both ours and theirs. That\'s the Courage behaviour Astellas talks about."',
  ],
  RESISTANCE: [
    '"I don\'t treat resistance as negativity. I treat it as data about what the transformation has not yet explained well."',
    'Resistance is RATIONAL, not personal',
    'GenAI example: People heard "productivity" as "replacement"',
    '  → Reframed to "augmentation" — SMEs became quality bar, not audience',
    '  → Segmented stakeholders, used pilots, champions, hands-on workshops',
    '  → Measured adoption and iterated',
    'Pattern: Diagnose WHY → Segment stakeholders → Create safe pilots → Visible champions → Measure → Iterate',
    'One specific dialogue moment: "You\'re asking me to teach the machine to do what I do. Why would I help replace myself?"',
    '  → Response: "You\'re not teaching it to replace you. You\'re teaching it to handle the repetitive parts so you can do the parts only you can do."',
    'ASTELLAS BRIDGE: Same approach for GCC engagement — understand what each site fears, not just what they resist',
    'MUKTA-CUE: "Psychological safety mattered — people had to feel safe to admit they didn\'t know how to use these tools"',
  ],
  LEADSTYLE: [
    '"Structured but not rigid"',
    'Create clarity quickly: outcomes, owners, cadence, risks, decisions',
    'Invest in TRUST — transformation depends on informal influence as much as formal governance',
    'Coach by giving frameworks and ownership — NOT by becoming the bottleneck',
    'TIE TO ASTELLAS BEHAVIORS:',
    '  Courage → escalating early, speaking up',
    '  Sense of Urgency → fast structuring of ambiguity',
    '  One Astellas → cross-functional alignment',
    '  Outcome Focus → adoption/value metrics',
    '  Accountability → clear owners and governance',
    'BRIDGE-BUILDING: Never "I drove..." without naming the coalition',
    'MUKTA-CUE: "Don\'t treat people as objects — give them career maps so they see they\'re part of a long-term strategy"',
    'MUKTA-CUE: "Speed with discipline — in regulated environments, speed ≠ chaos. It means clear ownership, fast alignment, documented decisions, early risk escalation"',
  ],
  FIRST90: [
    'Structure: Listen → Map → Narrative → Cadence → Quick Win',
    'Days 1-30: LISTEN TOUR',
    '  → Mukta + Andżelika (Poland) + Flavio (Mexico) + Managing Principal/Principal you report to',
    '  → Kamila Grembowicz (GBS line) + Communications & IR team + CF Division Heads',
    '  → Understand: GCC strategy, TO ways of working, stakeholder map, SharePoint maturity',
    '  → 2-3 levels deep per site — not just leadership',
    'Days 30-60: MAP AND AUDIT',
    '  → Stakeholder influence/interest map across 3 GCCs',
    '  → Brand/narrative audit: what does each GCC say about itself vs One Astellas story?',
    '  → SharePoint diagnostic: IA, governance, content cadence, adoption signals',
    '  → Draft engagement framework: pillars, editorial calendar, stakeholder governance',
    'Days 60-90: LAND THE ARCHITECTURE',
    '  → Engagement architecture proposal',
    '  → SharePoint reset plan',
    '  → CSP2026 activation calendar tied to natural moments (Warsaw move, Mexico first year, India scale)',
    '  → One visible quick win',
    '  → Coaching whoever\'s on the team — capability transfer from day 1',
    'CLOSE: "Bias toward visible momentum early, but NOT by flooding. First create the right listening map and governance so the engine scales."',
    'MUKTA-CUE: Use "hypothesis" language — "My hypothesis would be..." not "I would fix..."',
  ],
  GENAI: [
    'Frame as TRANSFORMATION story, not tech story',
    'Enterprise GenAI adoption: 400+ employees, 8 pilots, 50+ use cases',
    'DIAGNOSIS FIRST: mapped where resistance would come from — not WHO but WHY',
    '  → Fear of job displacement, learning curve, productivity dip during adoption',
    'Coalition over mandate: partnered with Microsoft + Adobe directly',
    'Built CoP: 3-4 core → ~90 extended members',
    'Made early adopters VISIBLE — created safe environment to experiment',
    'Start small, scale carefully: 8 pilots first — diverse cohorts (functional + technical mix)',
    'Measurable: 30%+ efficiency gains, config cycle 4-5 months → 5-6 weeks',
    'ASTELLAS BRIDGE: "AI and analytics are competitive differentiators — but the cultural shift is a 5-6 year horizon, not a quarter"',
    'MUKTA-CUE: "Different functional teams sitting together with technology experts — that\'s where the most differentiated capability gets built" (her exact framing)',
    'MUKTA-CUE: "Psychological safety mattered — people had to feel safe to admit they didn\'t know"',
  ],
  BOWLERS: [
    'Built 0-to-1: Excel dashboard → Power BI executive governance instrument',
    'Used in CXO reviews and BOARD MEETINGS',
    'The SHIFT: dashboard → governance tool. Technology was easy; governance design was value.',
    'Structural choices:',
    '  → Assigned POCs per function (named accountability, not diffused)',
    '  → Established data-gathering processes (reliable refresh, not heroic)',
    '  → Built cadences: monthly review → decision-forcing conversation, not status report',
    'Outcome: spine of CXO and board-level strategic decision-making across corporate planning',
    'DEEPER POINT: "Executive governance tools succeed on three things — data discipline, named accountability, decision-forcing cadence. Tools without governance = more noise."',
    'ASTELLAS TIE: "Directly relevant to GCC SharePoint — not document repository, but connective tissue and decision-forcing surface for cross-GCC engagement governance"',
    'MUKTA-CUE: "Hard part was getting leaders to treat data as voice of their function"',
  ],
  COACHING: [
    'Vrinda Bagrait + Raja Rajeswari — GenAI Strategy team, 2025',
    'Both non-technical backgrounds, anxious about GenAI wave',
    'Approach: Diagnose where they ARE, not where I wish they were (Situational Leadership)',
    'Paired with engineering leads on REAL client use cases from week 1',
    'Learn by sitting IN the work, not adjacent to it',
    'Gave them ownership: CoP sessions, live demos',
    'Weekly coaching: real conversations about ambiguity, not status updates',
    'Protected their permission to say "I don\'t know yet"',
    'Both contributing to live client projects within 6 months',
    'MUKTA-CUE: "Don\'t treat people as objects — give them career maps" (HER exact quote)',
    'MUKTA-CUE: "Consistency beats intensity in coaching too — weekly 1:1s with structure, not heroic interventions"',
    'Coach for CAPABILITY, not just task completion — widen their career horizon',
    'ASTELLAS: JD requires coaching Senior Consultants + Consultants — build the bench, not just deliver',
  ],
  FAILURE: [
    'Pick something REAL, RECENT, SPECIFIC — Mukta values intellectual honesty',
    'BSV STORY: Should have insisted on change-request framework WEEK 1, not month 3',
    '  → 70% of marketing SOW hadn\'t started when I took over',
    '  → Spent first months executing, not governing',
    '  → Should have built the governance structure FIRST, then executed within it',
    '  → Learning: structure the system before running the work',
    'OR GenAI STORY: Early pilots under-delivered because over-indexed on tool training, under-indexed on workflow redesign',
    '  → Tools don\'t change behaviour — redesigned workflows do',
    '  → Subsequent pilots led with workflow',
    'MUKTA-CUE: "Courage is also about learning from failure publicly — it\'s the Behavior Astellas calls out specifically. The intelligent risk only pays off if you actually metabolise the lesson."',
    '"I don\'t know" is ALLOWED — better than faking. Mukta values courage over false confidence.',
  ],
  CXOWORK: [
    'BSV: Monthly presentations to COO + Digital Transformation Head',
    '  → C-suite time = forcing function for clarity',
    '  → Lead with decision needed, then data, then recommendation',
    '  → Most ICs lead with data — that\'s a junior tell',
    '  → Show the bet: MAU growth (75%), cost optimisation ($25K + $32K)',
    '  → Bring options, not problems. Decision accelerates when you do the thinking ahead of room.',
    'AstraZeneca: Working directly with Executive Director (Jul 2025–present)',
    '  → Solutions, agents, data strategy, adoption playbooks',
    '  → Single conversation → scaled to multi-track program',
    '  → At ED level: conversation is about "how to make this stick at scale", not "what"',
    'Bowler Charts: Used in CXO reviews and board meetings',
    'KEY LINE: "Working with C-suite is about being a BRIDGE — translating execution reality UP, strategic intent DOWN — and doing it consistently. Consistency beats intensity."',
    'ASTELLAS: You\'ll work with Managing Principals on CxO-function workstreams',
  ],
  CURRENTROLE: [
    'Senior Manager, Strategic Initiatives at Indegene (3 promotions in 5 years: May 2021 → Jan 2026)',
    'VERTEX (Dec 2025–Present): GenAI Innovation Center',
    '  → Aligning consulting, client stakeholders, delivery, engineering',
    '  → Prioritised roadmap, governance model, scale-up plan',
    '  → Coalition building across 4 parties with different incentives',
    'ASTRAZENECA (Jul 2025–Present): Working directly with Executive Director',
    '  → Solutions, agents, data strategy, adoption playbooks for medical/clinical use cases',
    '  → At ED level: value = adoption mechanism, not the solution itself',
    'Previously: enterprise GenAI adoption (400+ employees), CoP (3→90), Bowler Charts, Change Makers Council',
    'Multi-pharma portfolio: 12 companies across India and EU5',
    'META-LEARNING: "Both current engagements teach me that at senior altitude, value isn\'t the solution — it\'s the adoption mechanism. Exactly why Astellas role is interesting — explicitly about building those mechanisms across 3 GCCs."',
  ],
  WHYLEAVE: [
    'FRAME AS PULL, NOT PUSH — never disparage Indegene',
    'Indegene = formative. 3 promotions in 5 years, deep pharma exposure',
    'Looking for DEPTH over BREADTH',
    'Services: breadth across multiple pharma operating contexts',
    'Next phase: operating INSIDE a global pharma\'s transformation engine',
    'Astellas TO = one of few internal-consulting units with consulting-grade rigour',
    'GCC engagement remit = rare role combining transformation execution + cross-cultural narrative',
    'Personal: chance to build 3rd GCC alongside someone who has done it twice = once-in-a-career learning curve',
    'WHAT TO AVOID: Any complaint about Indegene. She\'ll read that as a values flag.',
    'KEY LINE: "Running one pharma\'s full agenda inside CxO function = different craft"',
  ],
  PHARMACHECK: [
    'XTANDI = ~48% revenue, US LOE Aug 2027, Medicare MFP $7,004/30-day Jan 2027',
    'PADCEV bright spot: ¥210B forecast, first-line metastatic urothelial cancer with pembrolizumab',
    'IZERVAY: geographic atrophy, FDA CRL Nov 2024, Feb 2025 label update recovery',
    'VEOZAH: boxed warning Dec 2024, guidance reset, rebuild underway',
    'VYLOY (Claudin 18.2 gastric) + XOSPATA (AML) ramping',
    'SMT: ¥150B recurring savings by FY2027, core OP margin 27.6% → 30%',
    'April 2025 reorg: Value Creation (Taniguchi) / Value Delivery (Zieler) / Value Enablement',
    'CEO Okamura rejected "rescue BD" — deleveraging at 2.2x',
    'MUKTA-CUE: Frame as VALUE FOR PATIENTS, not revenue lines',
    '"XTANDI cliff matters not just for margin — bridge to next wave of value for patients depends on Strategic Brands ramp + Focus Area pipeline. SMT and GCCs both protect that bridge."',
  ],
  VALUES: [
    'Three Values: Integrity, Innovation, Impact',
    'Five Behaviors: Courage, Sense of Urgency, One Astellas, Outcome Focus, Accountability',
    'Deliberate swap: "Excellence" → "Impact" — because in some cultures, excellence implies perfectionism that slows progress',
    'Patient Focus elevated to VISION layer — implicit everywhere, not a competing value',
    'Why now: CSP2026 requires new ways of working — speed, cross-functional collab, breaking Japan-HQ/regional silos',
    'Connect to YOUR experience: Change Makers Council embedded values through behaviour, not mandate',
    'For Astellas: Values + Behaviors rollout across 3 GCCs = exactly the muscle you\'ve built',
    '"I would embed these not through posters but through repeated leadership signals, peer champions, narrative consistency, and visible rituals"',
    'MUKTA-CUE: "Engaging hearts and minds — you can\'t mandate culture, you have to make people want to live it"',
  ],
  TOMANDATE: [
    'TO = real INTERNAL CONSULTING unit, not a loose program office',
    'Hierarchy: Managing Principal → Principal → Lead Consultant → Senior Consultant → Consultant',
    'Organised by Chapters: Change Management, Process Excellence, Agile',
    'Delivery via Agile Stream/Crew/Pod framework',
    'CxO-EMBEDDED: Managing Principals partner with CxOs + Chiefs of Staff',
    'Lead Consultant: leads significant workstreams within a CxO function',
    'Post Oct 2025: TO + DigitalX under CStO — transformation = strategy execution, not digital bet',
    'CStO Pearson resigned Mar 2026 → Sandor interim — leadership transition',
    'Scope: initiative scoping, stakeholder coalitions, adoption metrics, capability building',
    'Coach Senior Consultants + Consultants — build the bench, not just deliver',
    'Change Communication flagged as TOP GAP — this role fills a diagnosed deficit',
  ],
  ONEASTELLAS: [
    '"One Astellas" = formal corporate value: leveraging diverse perspectives for org goals',
    'WON\'T work if it means UNIFORM — must be coherent core + configurable site identity',
    'Bengaluru: full-stack capability hub · Warsaw: GBS/clinical core · Mexico: medical-digital-innovation',
    'Three different maturity curves: messaging landing in Warsaw may overwhelm Mexico City',
    'Values: Integrity, Innovation, Impact + 5 Behaviors (including One Astellas itself)',
    'Federated model: each GCC MD owns narrative, shared spine of tone + hashtags',
    'Integrating mechanism = communications layer — no single Global Head of GCCs exists',
    'Legacy-market anxiety (US/EU offshoring fears) — GCC branding must pair with internal narrative for sending sites',
    'KEY LINE: "Centers of excellence, not islands of excellence" (Mukta\'s own framing)',
    'Success signal: leaders in each GCC repeating narrative in own words, unprompted',
    'MUKTA-CUE: "Building bridges every day" / "Psychologically safe environment where talent isn\'t dormant"',
  ],
  BUDGET: [
    'BSVwithU: Full budget ownership',
    '  → ~$25,000 annual savings via AWS optimizations + new vendor',
    '  → $32,645 negotiated for Year-1 out-of-scope change requests',
    '  → Co-drafted new SOW: 25+ deliverables quantified, 40% margin maintained',
    '  → Monthly cadence with COO + DT Head — RAG status on financials',
    'Amgen ELMAC: multi-million USD commercial delivery operations',
    '  → FTE-based → asset-based pricing transformation',
    '  → Finance/ops/client collaboration to improve billing efficiency',
    'Indegene internal: tracking costs and revenue for Growth Markets BU',
    'GenAI: managed vendor budgets for Microsoft/Adobe tool rollouts',
    'FRAME: "Financial discipline is not a separate skill — it\'s embedded in how I operate transformation programs"',
  ],
  GAPS: [
    'GAP 1: Never worked INSIDE a global pharma — only adjacent through Indegene',
    '  → "Clear-eyed about this. What I bring is breadth across portfolios most internal candidates don\'t have, + consulting discipline that maps to how TO operates."',
    '  → "What I\'d learn from you: inside-out craft — Japan-HQ rhythms, patient-axis in lived practice, unwritten rules across CxO functions"',
    '  → This is humility + specificity + explicit ask to learn from HER',
    'GAP 2: JD says "extensive global transformational change within complex orgs" — mine is multi-client, not multi-geo within ONE org',
    '  → "Multi-geography, multi-stakeholder, multi-culture across 5+ global pharma portfolios. Translation to one global pharma with 3 GCCs = step-change in depth, but the muscle is built."',
    'GAP 3: 8+ years preferred — you\'re at ~5 years in transformation specifically',
    '  → "Ten-year arc: field sales (3 yrs) + transformation (5+ yrs). Field years = underrated input for GCC engagement — customer-empathy problem. Internal audiences, same craft: meeting them where they are."',
    'POSTURE: Name it, reframe it, show how you\'d close it. Do NOT pretend gaps don\'t exist.',
    'MUKTA-CUE: "Intellectual humility — if she asks something you genuinely don\'t know, say so and offer how you\'d find out. Don\'t bluff."',
  ],
  SANOFI: [
    'Sanofi Connect: omnichannel transformation — digital channels for HCPs not covered by field force',
    '10,000 HCPs enrolled, 47% connected call rate (24.4k calls)',
    'SMS interaction: 7.33% (127k+ messages delivered)',
    'Average call duration increased 20.68% — tele-script + virtual rep training',
    'Unified dashboard: channel performance + HCP 360 view',
    'Real challenge: field reps see digital as COMPETITIVE, not complementary',
    'Change management: help them see omnichannel as AMPLIFICATION of relationships',
    'Stakeholder coalition: brand managers + field force leadership + digital ops + analytics',
    'Project RENEWED based on results — most honest indicator transformation stuck',
    'ASTELLAS TIE: "Same logic as patient-axis model — organising around the customer, not the function"',
  ],
  BSV: [
    'BSVwithU: Women\'s Health & Fertility knowledge platform for doctors',
    'Monthly presentations to COO + Digital Transformation Head',
    'MAU grew 75% in six months (403 → 706)',
    '$25K annual savings (AWS + vendor), $32,645 negotiated change orders',
    'Cross-functional: tech, project, medical, design, finance, legal, client procurement',
    '70% of marketing SOW hadn\'t started — had to execute AND govern simultaneously',
    'Built evaluation framework WITH procurement → changed the conversation',
    'SOW redrawn: 25+ deliverables, 40% margin held',
    'LESSON: Should have insisted on change-request framework week 1, not month 3',
    'C-suite learning: Lead with decision needed → data → recommendation. Options, not problems.',
    'Project RENEWED Year 2 — trust earned through consistent delivery',
  ],
  ASKME: [
    'Q1 (BEST FOR MUKTA): "You\'ve built three GCCs now. What\'s the one thing you wish you\'d known going into your first build that you applied differently to your second and third — and what do you think will be different this time at Astellas?"',
    '  → Invites her to TEACH you = exactly the dynamic she enjoys',
    'Q2: "As India GCC moves from set-up to scale, what signals would tell you it\'s being seen globally as a capability hub rather than support location?"',
    'Q3: "For the tri-site engagement agenda, where\'s the biggest risk today: narrative alignment, leadership cadence, employee engagement, or global stakeholder perception?"',
    'Q4: "How do Bengaluru Lead Consultants partner with Managing Principals across time zones?"',
    'Q5: "What does One Astellas mean to you in the specific context of GCCs with different maturity curves?"',
    'RESERVE: "What surprised you positively from a Lead Consultant? What would you want different?"',
    'RULE: Ask 2-3 max depending on time. End strong with Q1.',
    'POSTURE: Position yourself as someone who learns from leaders, not competes with them',
  ],
  FOLLOWUP: [
    'TRAP: "Tell me more about that" → Have ONE specific detail ready for every story',
    'TRAP: "What would you have done differently?" → Always have a REAL answer',
    '  → BSV: "CR framework week 1, not month 3"',
    '  → GenAI: "Led with workflow redesign earlier, not tool training"',
    'TRAP: "How did you measure success?" → Adoption metrics, NOT output metrics',
    '  → Change Makers: "Empathy" in perf reviews — quarterly HR sampling',
    '  → OKRs: ~90% login adoption within 6 months',
    '  → GenAI: efficiency gains quantified, use cases shipped',
    'TRAP: "Give me a specific example" → Default to the MOST RECENT + SPECIFIC moment',
    'TRAP: "What did your reportee struggle with?" → Vrinda = confidence in client demos, dry-runs every Tuesday',
    '"I don\'t know" is allowed — better than faking. Mukta values courage.',
    'TRAP: "Sounds like textbook change management" → "Designed from listening sessions, not framework"',
  ],
  NONE: []
};

/* ---- AWS Signature V4 for Bedrock ---- */
function hmac(key, data, encoding) {
  return crypto.createHmac('sha256', key).update(data).digest(encoding);
}
function sha256(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}
function signV4(method, host, pathStr, hdrs, body, region, service) {
  const datetime = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  const date = datetime.slice(0, 8);

  const h = {};
  h['content-type'] = hdrs['Content-Type'];
  h['host'] = host;
  h['x-amz-date'] = datetime;

  const signedHeaderKeys = Object.keys(h).sort();
  const signedHeaders = signedHeaderKeys.join(';');
  const canonicalHeaders = signedHeaderKeys.map(k => k + ':' + h[k].trim()).join('\n') + '\n';

  const canonicalPath = '/' + pathStr.split('/').filter(Boolean).map(s => encodeURIComponent(s)).join('/');
  const canonicalRequest = [method, canonicalPath, '', canonicalHeaders, signedHeaders, sha256(body)].join('\n');
  const scope = `${date}/${region}/${service}/aws4_request`;
  const stringToSign = ['AWS4-HMAC-SHA256', datetime, scope, sha256(canonicalRequest)].join('\n');

  let signingKey = hmac('AWS4' + AWS_SECRET, date);
  signingKey = hmac(signingKey, region);
  signingKey = hmac(signingKey, service);
  signingKey = hmac(signingKey, 'aws4_request');
  const signature = hmac(signingKey, stringToSign, 'hex');

  hdrs['x-amz-date'] = datetime;
  hdrs['host'] = host;
  hdrs['Authorization'] = `AWS4-HMAC-SHA256 Credential=${AWS_KEY}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  return hdrs;
}

function callHaiku(transcript) {
  return new Promise((resolve) => {
    const modelId = 'us.anthropic.claude-haiku-4-5-20251001-v1:0';
    const apiPath = '/model/' + encodeURIComponent(modelId) + '/invoke';
    const host = `bedrock-runtime.${AWS_REGION}.amazonaws.com`;

    const body = JSON.stringify({
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 8,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: transcript }]
    });

    const headers = { 'Content-Type': 'application/json' };
    signV4('POST', host, apiPath, headers, body, AWS_REGION, 'bedrock');
    headers['Content-Length'] = Buffer.byteLength(body);

    const opts = {
      hostname: host,
      path: apiPath,
      method: 'POST',
      headers
    };

    const req = https.request(opts, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const j = JSON.parse(data);
          const text = (j.content && j.content[0] && j.content[0].text) || 'NONE';
          resolve(text.trim());
        } catch(e) {
          console.error('Bedrock parse error:', data.slice(0, 300));
          resolve('NONE');
        }
      });
    });
    req.on('error', (e) => { console.error('Bedrock request error:', e.message); resolve('NONE'); });
    req.setTimeout(4000, () => { req.destroy(); resolve('NONE'); });
    req.write(body);
    req.end();
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'POST' && req.url === '/match') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', async () => {
      try {
        const { transcript } = JSON.parse(body);
        if (!transcript || transcript.length < 5) {
          res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
          res.end(JSON.stringify({ panel: -1, label: 'NONE' }));
          return;
        }
        const raw = await callHaiku(transcript);
        const validTokens = Object.keys(PANEL_MAP).join('|');
        const regex = new RegExp(`\\b(${validTokens}|NONE)\\b`);
        const m = raw.match(regex);
        const label = m ? m[1] : 'NONE';
        const panel = PANEL_MAP[label] ?? -1;
        const cues = CUES[label] || [];
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ panel, label, cues }));
      } catch(e) {
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ panel: -1, label: 'NONE' }));
      }
    });
  } else if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end();
  } else {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  }
});

server.listen(PORT, () => console.log(`Listening on :${PORT}`));
