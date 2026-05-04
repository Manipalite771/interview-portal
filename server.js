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

const SYSTEM_PROMPT = `You are a real-time interview assistant for a Transformation Lead Consultant role at Astellas pharma. You receive live speech-to-text from the interview. Route every interviewer utterance to the best matching prepared section.

Respond with EXACTLY one token. No explanation, no preamble, no punctuation.

## Sections (pick the CLOSEST match):

INTRO — "Tell me about yourself", "introduce yourself", "walk me through your background", "your experience", any opening/icebreaker question about who the candidate is. DEFAULT for the start of the interview.

Q1 — TRANSFORMATION END-TO-END: Walk through a transformation initiative, change program, or large-scale project led end-to-end. The messy middle. Biggest project. Most impactful work.

Q2 — FAILURE / SETBACK: Things going wrong, failing, challenges, difficulties, mistakes, lessons learned, tough situations, what would you do differently.

Q3 — CROSS-GEOGRAPHY / CULTURE: Working across countries, regions, cultures, markets, geographies, diverse teams, international experience, India Poland Mexico, global teams, time zones.

Q4 — GCC / MULTI-SITE ENGAGEMENT STRATEGY: Designing engagement or transformation strategy across multiple offices/sites/capability centers/GCCs/hubs. First 90 days. How would you approach this role.

Q5 — COMMUNICATION THAT CHANGED BEHAVIOUR: Communications, messaging, campaigns, internal comms, employee engagement, culture change, values rollout, getting people to actually change what they do.

Q6 — SHAREPOINT / INTRANET / PLATFORMS: Internal platforms, SharePoint, intranets, knowledge management, content portals, digital workplace tools, what makes them work vs die.

Q7 — STAKEHOLDER RESISTANCE: Dealing with resistance, skeptics, difficult stakeholders, pushback, gaining buy-in, influencing without authority, winning over opponents, convincing someone.

Q8 — CXO / EXECUTIVE ENGAGEMENT: Working with senior leadership, C-suite, executives, VPs, directors, board members, presenting to leadership.

Q9 — COACHING / DEVELOPING JUNIORS: Coaching, mentoring, developing, teaching, growing, managing junior or less experienced team members, management style, leadership style with reports.

Q10 — LASTING CAPABILITY / SUSTAINABILITY: Building something that lasted, sustained impact, durable outcomes, outlived a project, scalable solutions, institutional capability, legacy, long-term impact.

Q11 — PLAN BROKE / AMBIGUITY / PIVOT: Adapting when plans changed, navigating uncertainty, ambiguity, pivoting, unclear situations, no clear roadmap, unexpected change.

PHARMA — "What do you know about Astellas", "what do you know about us", "about our company", "our pipeline", "our products", any question testing the candidate's knowledge of Astellas or the pharma industry specifically.

VENDOR — "Why should we hire you from a vendor/agency", "what makes you think you can operate inside pharma/in-house", "transition from vendor to in-house", "why move from consulting", "why Indegene to Astellas".

WHYLEAVE — "Why are you leaving your current company", "why leave Indegene", "why are you looking for a change", "what's motivating this move", "why now".

CURROLE — Current role at Indegene, what do you do today, describe your current responsibilities, day-to-day work, what does your current role look like, tell me about your current position.

ROLEALIGN — Why this role, how does your experience align with this job, why are you a good fit, why Astellas, why this specific role, what attracted you to this position, how does your background match.

FIVEYEAR — Where do you see yourself in 5 years, long-term career goals, short-term and long-term goals, career aspirations, career vision, where is your career heading, how does this role fit your career plan.

TECHTONOTCH — Your role seems very tech/GenAI focused, how would you transition into a non-technical transformation role, this is largely a change management role not a tech role, how do you move from tech to people-focused work, are you too technical for this.

GCCCHALLENGE — Common challenges GCCs face, what are typical problems new capability centers encounter, challenges for pharma GCCs specifically, scaling GCCs, growing pains for new global centers, what issues do you think our GCCs face.

SVCGCC — Transitioning from a service-based/vendor model to a GCC model, how is a GCC different from an outsourcing setup, operating model differences between service delivery and in-house capability centers.

FOCUS — What areas do you want to focus on now, what do you want to work on next, what interests you most about this work, what part of transformation are you most drawn to, where do you want to grow.

STRENGTH — Your strengths, what are you good at, what do colleagues say about you, what is your superpower, competitive advantage, what sets you apart.

WEAKNESS — Your weaknesses, areas for improvement, what are you working on, development areas, what do you struggle with, where do you need to grow.

TOMANDATE — Questions about the Transformation Office mandate, what the TO does, how it operates, Chapters, Stream/Crew/Pod, CxO embedding model, how transformation is structured at Astellas, what kind of work the TO delivers, the internal consulting model, how initiatives are run, how the TO partners with CxO functions, what the role will actually involve day to day.

ASTELLASTRANSFORM — Questions about Astellas's transformation agenda broadly, what are the big strategic challenges, what is SMT, what is CSP2026, the XTANDI cliff, what pressures Astellas faces, the biggest risks, restructuring, the reorg, what does transformation mean at Astellas, the twelve live tensions, pain points.

YEARONE — What would you do in your first year, first 90 days plan (when not specifically about GCCs), how would you approach the role, what would success look like, what would you prioritize, your plan for the first few months, what would you deliver.

ONEASTELLAS — Questions about "One Astellas" as a concept, how to unify culture across sites, how to make distributed teams feel connected, how to build a shared identity, corporate values across geographies, brand consistency, how to prevent silos.

ASKME — "Do you have any questions for me", "any questions", "what would you like to know", "your turn to ask", end of interview questions invitation.

FOLLOWUP — The interviewer is probing deeper into a previous answer: "tell me more", "can you elaborate", "what specifically", "what would you have done differently", "how did you measure that", "sounds like Prosci/ADKAR", "what did your reportee struggle with". This is a follow-up, not a new topic.

## When to respond NONE:
- The candidate is answering (statements starting with "I built...", "We ran...", "In my experience...", "So what we did was...", "The result was...")
- Pure small talk ("how are you", "nice to meet you", "can you hear me okay")
- Logistics ("let me share my screen", "can you see this", "we have about 30 minutes")
- Truly unintelligible or single-word fragments

## CRITICAL RULES:
- If the interviewer is asking, prompting, or directing ANY question — ALWAYS pick the closest section. NEVER return NONE for an interviewer question.
- When in doubt between two categories, pick the more specific one.
- When in doubt between a category and NONE, pick the category.
- Q1 is the catch-all for broad experience questions that don't fit a more specific Q2-Q11.
- INTRO is for the very start — "tell me about yourself" style openers.
- The transcript may be imperfect (speech-to-text errors, fragments, Polish accent). Do your best to interpret intent.
- Valid tokens: INTRO Q1 Q2 Q3 Q4 Q5 Q6 Q7 Q8 Q9 Q10 Q11 PHARMA VENDOR WHYLEAVE CURROLE ROLEALIGN FIVEYEAR TECHTONOTCH GCCCHALLENGE SVCGCC FOCUS STRENGTH WEAKNESS TOMANDATE ASTELLASTRANSFORM YEARONE ONEASTELLAS ASKME FOLLOWUP NONE
- Respond with EXACTLY one of the above tokens`;

const PANEL_MAP = {INTRO:2,Q1:3,Q2:4,Q3:5,Q4:6,Q5:7,Q6:8,Q7:9,Q8:10,Q9:11,Q10:12,Q11:13,PHARMA:14,VENDOR:14,WHYLEAVE:18,CURROLE:-2,ROLEALIGN:-2,FIVEYEAR:-2,TECHTONOTCH:-2,GCCCHALLENGE:-2,SVCGCC:-2,FOCUS:-2,STRENGTH:-2,WEAKNESS:-2,TOMANDATE:-2,ASTELLASTRANSFORM:-2,YEARONE:-2,ONEASTELLAS:-2,ASKME:17,FOLLOWUP:18};

const CUES = {
  Q1: [
    'GenAI Enterprise Adoption — 1,000+ employee BU',
    'First 3 pilots STALLED — skipped diagnosis',
    'Saying "productivity" → people heard "replacement"',
    'Reframed: augmentation, not productivity',
    'SMEs became the quality bar, not the audience',
    'CoP: 3-4 → 90 members',
    '30%+ efficiency gains, 400+ employees impacted',
    'Config cycle: 4-5 months → 5-6 weeks',
    'What outlived the project = durable capability',
  ],
  Q2: [
    'BSVwithU — Bharat Serum digital platform',
    '70% of marketing SOW hadn\'t started',
    'Procurement couldn\'t evaluate digital deliverables',
    'Built evaluation framework WITH them → conversation changed',
    'Change Request process → $32,645 negotiated',
    'SOW redrawn: 25+ deliverables, 40% margin held',
    '$25K AWS + $42K BU vendor savings',
    'Monthly cadence with COO + DT Head — RAG status',
    'MAU grew 75%, renewed Year 2',
  ],
  Q3: [
    'Amgen ELMAC — EU top-5: UK, DE, FR, IT, ES',
    'FTE-based → asset-based repricing across all markets',
    'Germany: audit trails · Italy: relationships · UK: SLA specificity',
    'France: regulatory traceability · Spain: cost transparency',
    'NOT a compromise — shared spine, country-specific config',
    'Quality/CSAT governance global; conversation localized',
    '"One Astellas" won\'t work if uniform — coherent core, configurable identity',
    'Bengaluru full-stack, Warsaw GBS, Mexico medical-digital',
  ],
  Q4: [
    'MOVE 1: Listen first 30-45 days — Mukta, Andżelika, Flavio + 2-3 levels deep',
    '12-month hub vs 18-month vs 3-month — maturity curves are different',
    'MOVE 2: Anchor in CSP2026 + Values & Behaviors',
    'Patient Focus lifted to VISION layer — implicit, not competing',
    'MOVE 3: Calendar IS the editorial arc',
    'Warsaw Bridge move, Mexico first year, Bengaluru scale-up, CSP2026 launch',
    'Success = leaders repeating narrative in own words by month 9',
    'Adoption and behaviour, NOT comms plan',
  ],
  Q5: [
    'Change Makers Council — 26 volunteers, NOT communicators',
    'SMEs, engineers, finance — voices that carry weight in their teams',
    'Co-created Credo language WITH Org Dev, not received from them',
    'Multi-wave: teasers ("Riddle N Fiddle"), video mailers, story competitions',
    'Each wave 7-14 days, breathing room between',
    'Volunteers carried values in their own voice',
    'Not campaign AT people — giving 26 ambassadors a vocabulary',
    'Signal: "Empathy" showing up unprompted in performance reviews by month 4',
    'Council outlasted the Credo launch — durable culture mechanism',
  ],
  Q6: [
    'Built SharePoint utilization tracker for 120+ team members in <1 month',
    'SharePoint as live operational instrument, NOT content repository',
    'Principle 1: Must serve a workflow — repositories die',
    'Principle 2: Adoption metrics from day 1 — not pageviews',
    'Track if Bengaluru reads Warsaw content → "One Astellas" health check',
    'Principle 3: Editorial governance, not editorial control',
    'Federated model — shared spine, each GCC owns narrative',
    '#ChangingTomorrow #AstellasCulture — shared tone, local voice',
  ],
  Q7: [
    'Quantive OKR adoption — leadership level',
    'Leaders weren\'t resistant to goals — resistant to PUBLIC misalignment',
    'Reframed: tool rollout → leadership clarity instrument',
    'Worked 1:1 with most skeptical leaders',
    'Sat with their actual pain — mapped stuck initiatives',
    'Left them with a useful artifact — didn\'t ask them to adopt',
    'They logged back in for their next leadership review',
    'Layered governance cadences + UX optimization',
    '~90% adoption within 6 months',
  ],
  Q8: [
    'CLIENT: AstraZeneca Executive Director — since July 2025',
    'Solutions, agents, data strategy, adoption playbooks',
    'Single conversation → scaled to multi-track program',
    'Treat ED as thought partner, not sponsor — options with trade-offs visible',
    'INTERNAL: Bowler Charts Power BI — built from scratch',
    'Excel dashboard → executive governance instrument',
    'Used in CXO reviews and board meetings',
    'Hard part: getting leaders to treat data as voice of their function',
    'Dashboard: reporting tool → decision instrument',
  ],
  Q9: [
    'Vrinda Bagrait + Raja Rajeswari — GenAI Strategy team, 2025',
    'Both non-technical backgrounds, anxious about GenAI wave',
    'Paired with engineering leads on REAL client use cases from week 1',
    'Learn by sitting IN the work, not adjacent to it',
    'Gave them ownership of CoP sessions and live demos',
    'Weekly coaching: real conversations about ambiguity, not status updates',
    'Protected their permission to say "I don\'t know yet"',
    'Both contributing to live client projects within 6 months',
    'Coaching ≠ frameworks — it\'s courage to sit in ambiguity',
  ],
  Q10: [
    'GenAI Community of Practice — the capability that outlived',
    'Started: 3-4 core members, no shared knowledge, no patterns',
    'Design choice: domain SMEs paired WITH engineering',
    'CoP carried business-context credibility from day 1',
    'Codified: orchestration playbooks, eval frameworks, QA gates',
    'CSL Vifor patterns → reused across NEXT MedWriting & NEXT SciAuto',
    '3-4 → 90 extended team members',
    'Config cycle: 4-5 months → 5-6 weeks',
    'Still running 18 months after project closed — that\'s capability',
    'Chapter earns its name when frameworks alive in delivery, not slides',
  ],
  Q11: [
    'ICAP Stint 3 — Corporate Planning, 2023',
    'Charter: 1 department, 1 Assignment Leader',
    'Reality in 30 days: 5 departments, 6 ALs simultaneously',
    'Built personal cadence per AL — weekly/bi-weekly/ad-hoc',
    'Shared status doc visible to all 6 → they self-prioritized',
    'Let the work surface where to spend time, not defend original charter',
    'Became connective tissue between Corp Planning + Org Dev',
    'Bowlers + Change Makers Council fused into one operating system',
    'Ambiguity is the operating environment — read where energy is',
  ],
  INTRO: [
    'Decade in life sciences — 3 yrs field (Novartis, J&J) + 6 yrs transformation at Indegene',
    'Indegene Bangalore center IS a GCC for pharma clients',
    '12 pharma companies: Sanofi, Amgen EU5, Pfizer, Janssen, AZ, BI, Merck KGaA, CSL Vifor, Gilead, Regeneron, Haleon, Vertex',
    'Transformation ≠ frameworks problem — it\'s a meaning-making problem',
    'People aren\'t resistant — they\'re overwhelmed and unclear on what they own',
    'Operating models + governance cadences + communication architecture',
    'Astellas moment: CSP2026, 3 GCCs scaling, SMT in flight',
    '"Change Communication" = top materiality gap (Feb 2025)',
    'Build role at a build moment — delivery-side GCC perspective',
  ],
  PHARMA: [
    'XTANDI = ~48% revenue, US LOE Aug 2027, Medicare MFP $7,004/30-day Jan 2027',
    'SMT: ¥150B recurring savings by FY2027, core OP margin 27.6% → 30%',
    'April 2025 reorg: Value Creation (Taniguchi) / Value Delivery (Zieler) / Value Enablement',
    'CSP2026 launches late May — first execution wave',
    'PADCEV bright spot (¥210B), VYLOY ramping',
    'IZERVAY: CRL rebuild · VEOZAH: boxed warning reset · Audentes: thesis broken',
    '3 GCCs: Bengaluru (Mukta, 300+), Warsaw (Andżelika, The Bridge), Mexico (Flavio, Jan 2026)',
    'New Values: Integrity, Innovation, Impact + 5 Behaviors',
    '"Change Communication" top materiality gap — this hire fills a diagnosed deficit',
    'CEO Okamura rejected "rescue BD" — deleveraging at 2.2x',
  ],
  VENDOR: [
    'NOT vendor-to-inhouse — delivery side of the GCC model Astellas is building',
    'Been on RECEIVING end of pharma TOs: Sanofi, Amgen, Vertex, AstraZeneca ED',
    'Know what frustrates in-house teams about external partners',
    'Indegene Bangalore = Global Capability Center for pharma clients',
    'Transition: multi-pharma portfolio → one pharma\'s full agenda',
    'Craft transfers: operating models, governance, change adoption, comms architecture',
    'XTANDI bridge, SMT mechanics, "One Astellas" nuance — build in first 60-90 days',
    'Honest about runway — courage > false confidence (Wioleta values this)',
  ],
  WHYLEAVE: [
    'DON\'T disparage Indegene',
    'Indegene = formative — 3 promotions in 5 years, deep pharma exposure',
    'Looking for DEPTH over BREADTH',
    'Running one pharma\'s full agenda inside CxO function = different craft',
    'Astellas at THIS moment — CSP2026, 3 GCCs, Change Communication mandate',
    'Right specific opportunity, not just right next step',
  ],
  ASKME: [
    'Q1 (HIGHEST): "You\'ve written about overwhelmed not resistant — what contributes most to that overwhelm at Astellas right now?"',
    'Q2: "How is the TO shifting from delivering initiatives to building durable change capability? Especially Chapters model."',
    'Q3: "Across India, Poland, Mexico — biggest engagement gap today? What does good look like in 12 months?"',
    'RESERVE (if rapport strong): "What surprised you positively from a Lead Consultant? What would you want different?"',
    'RESERVE (operational): "How do Bengaluru Lead Consultants partner with Managing Principals across time zones?"',
    'End strong — last question should be Q1',
  ],
  FOLLOWUP: [
    'TRAP: "Tell me more about that resistance" → Have ONE specific dialogue moment ready',
    'GenAI: "You\'re asking me to teach the machine to do what I do. Why would I help replace myself?"',
    'TRAP: "What would you have done differently?" → Always have a REAL answer',
    'BSV: "Should have insisted on change-request framework week 1, not month 3"',
    'TRAP: "Sounds like Prosci/ADKAR" → Acknowledge crisply, designed from listening sessions not framework',
    'TRAP: "How did you measure success?" → Adoption metrics, NOT output metrics',
    'Change Makers: "Empathy" showing up unprompted in perf reviews — quarterly HR sampling',
    'TRAP: "What did your reportee struggle with?" → Be specific: Vrinda = confidence in client demos, dry-runs every Tuesday',
    '"I don\'t know" is allowed — better than faking. Wioleta values courage.',
  ],
  CURROLE: [
    'Senior Manager, Strategic Initiatives at Indegene (3 promotions in 5 years)',
    'Leading GenAI Innovation Center for Vertex Pharmaceuticals — roadmap, governance, scale-up',
    'Scaling solutioning engagement with AstraZeneca — directly with Executive Director',
    'Previously: enterprise GenAI adoption (400+ employees), CoP (3→90), Bowler Charts, Change Makers Council',
    'Multi-pharma portfolio: Sanofi, Amgen EU5, Pfizer, Janssen, AZ, BI, CSL Vifor, Gilead, Regeneron, Haleon, Vertex',
    'Indegene Bangalore = Global Capability Center for pharma clients — delivery-side of GCC model',
    'Operating models + governance cadences + communication architecture at scale',
    'Current work sits at intersection of strategy, transformation, and pharma domain',
  ],
  ROLEALIGN: [
    'Three differentiators: pharma fluency (12 companies) + transformation craft + GCC delivery perspective',
    'Been ON the delivery side of a pharma GCC for 4 years — Indegene Bangalore IS a GCC',
    'Astellas moment: CSP2026 launching, 3 GCCs scaling, "Change Communication" = diagnosed gap',
    'Operating models, governance cadences, change adoption at scale — that IS the role',
    'Cross-geography experience: Amgen EU5 (UK, DE, FR, IT, ES), multi-pharma portfolios',
    'Communication architecture: Change Makers Council, Culture Credo, SharePoint instruments',
    'CxO engagement: AstraZeneca ED, Bowler Charts in board reviews',
    'Not a maintenance role — build role at a build moment. My career arc matches that energy.',
  ],
  FIVEYEAR: [
    'Short-term: become the Lead Consultant who builds "One Astellas" engagement architecture across 3 GCCs',
    'Build durable change capability that outlives my involvement — Chapters model alive in delivery',
    'Earn Astellas-specific depth — XTANDI bridge, SMT mechanics, CSP2026 execution',
    'Medium-term: grow into a Principal role within the Transformation Office',
    'Long-term: lead transformation at the intersection of pharma strategy and organizational change',
    'This role is the SPECIFIC next step — depth over breadth, one pharma\'s full agenda inside CxO function',
    'Astellas at this moment = rare alignment between what I want to build and what needs building',
  ],
  TECHTONOTCH: [
    'My tech work was always MEANS to transformation, never the end itself',
    'GenAI adoption: the hard part was NOT the tech — it was reframing "productivity" to "augmentation"',
    'Gave SMEs the role of quality bar — that\'s change management, not engineering',
    'Quantive OKR: sat with leaders\' actual pain, not the tool features — ~90% adoption',
    'Change Makers Council, Culture Credo — zero tech, pure organizational behaviour change',
    'Bowler Charts: hard part was getting leaders to treat data as voice of their function',
    'Tech is one lever. My craft is operating models, governance cadences, communication architecture.',
    'The 12 pharma companies are all change contexts, not tech contexts',
  ],
  GCCCHALLENGE: [
    'Challenge 1: "Three islands" risk — GCCs scaling fast but uncoordinated',
    'Challenge 2: Identity crisis — are we a cost center or a capability hub? Framing matters.',
    'Challenge 3: Maturity mismatch — 12-month hub vs 3-month hub need different messaging',
    'Challenge 4: Talent integration — new joiners don\'t feel connected to the mothership narrative',
    'Challenge 5: Change Communication gap — Astellas flagged this as top materiality gap (Feb 2025)',
    'Challenge 6: Governance fragmentation — each site builds its own cadences, no shared spine',
    'Solution: coherent core + configurable site identity — NOT uniform brand',
    'Bengaluru (full-stack), Warsaw (GBS-heavy), Mexico (medical-digital-innovation) — real differences to respect',
    'Success = leaders in each GCC repeating the narrative in their own words, unprompted',
  ],
  SVCGCC: [
    'Service model: deliver for many clients, breadth over depth, project-based relationships',
    'GCC model: deliver for ONE company, depth over breadth, embedded in the org',
    'Key shift: you ARE the organization, not an external partner — skin in the game changes everything',
    'Indegene Bangalore IS itself a GCC for pharma clients — I\'ve lived the model from inside',
    'Same maturity arc: onboarding waves, capability building, governance cadences, retention',
    'What I bring: I know what makes the model work vs stall — from the delivery side',
    'The craft transfers: operating models, governance, change adoption, communication architecture',
    'What I build in first 60-90 days: Astellas-specific depth — XTANDI, SMT, "One Astellas" nuance',
  ],
  FOCUS: [
    'Area 1: Designing cross-GCC engagement architecture — "One Astellas" that respects site identity',
    'Area 2: Building durable change capability — Chapters model alive in delivery, not just slides',
    'Area 3: Communication architecture that shifts behaviour — not comms plans, adoption mechanisms',
    'Area 4: Coaching the next layer of consultants — capability transfer, not dependency on me',
    'What draws me: the intersection of pharma strategy + organizational transformation + GCC scaling',
    'The moment matters: CSP2026, three GCCs, Change Communication mandate — it\'s a build moment',
    'I want to be in the room where ambiguous strategy becomes things people do differently on Monday morning',
  ],
  STRENGTH: [
    'Execution credibility — I ship end-to-end, not just describe. GenAI: 30%+ efficiency, 400+ employees.',
    'Pharma fluency — 12 companies, EU5 markets, institutional sales to CxO engagement',
    'Coalition building — Change Makers Council (26 cross-BU volunteers), CoP (3→90), multi-stakeholder programs',
    'Communication architecture — not just "comms plans" but instruments that shift behaviour',
    'Navigating ambiguity — ICAP Stint 3 went from 1 AL to 6 ALs; I read where the energy is',
    'Coaching — Vrinda + Raja both contributing to live client projects in 6 months, from non-technical backgrounds',
    'Colleagues say: "simplifies the complex, shares right examples at right time, keeps focus on outcomes" (Rahul Umare)',
    'Evidence: 3 promotions in 5 years, National Winner Flipkart Wired (1st of 3,290 teams), Dean\'s Merit List',
  ],
  WEAKNESS: [
    'Honest answer — not a fake-humble "I\'m a perfectionist"',
    'Depth of Astellas-specific context — XTANDI bridge mechanics, SMT details, internal politics',
    'I\'d build that deliberately in first 60-90 days — listen before designing',
    'Earlier in career: took too long to push back on scope creep (BSV lesson — should have insisted on CR framework week 1)',
    'Learning to let go of work that others can own — as CoP scaled to 90, I had to stop being in the loop',
    'Wioleta values courage and honesty over false confidence — "I don\'t know yet" is allowed',
  ],
  TOMANDATE: [
    'TO = real internal consulting unit, NOT a loose program office',
    'Hierarchy: Managing Principal → Principal → Lead Consultant → Senior Consultant → Consultant',
    'Organised by Chapters: Change Management, Process Excellence, Agile',
    'Delivery via Agile Stream/Crew/Pod framework',
    'CxO-EMBEDDED: Managing Principals partner with CxOs + Chiefs of Staff',
    'Lead Consultant leads significant workstreams within a CxO function',
    'Post Oct 2025: TO + DigitalX under CStO — transformation = strategy execution, not digital bet',
    'Scope: initiative scoping, stakeholder coalitions, adoption metrics, capability building (methods/tools/playbooks)',
    'Coach Senior Consultants + Consultants — build the bench, not just deliver',
    'Change Communication flagged as TOP GAP — this role fills a diagnosed deficit',
  ],
  ASTELLASTRANSFORM: [
    'SMT = ¥150B recurring savings by FY2027 — insourcing, vendor rationalisation, IT streamlining',
    'CSP2026 launches late May — first execution wave of new 5-year plan',
    'XTANDI cliff: ~48% revenue, US LOE Aug 2027, Medicare MFP $7,004 from Jan 2027',
    'April 2025 reorg: Value Creation (R&D) / Value Delivery (Commercial + Medical) / Value Enablement',
    'CDTO eliminated Oct 2025 — transformation now under CStO, strategy-execution framing',
    'CStO Pearson resigned Mar 2026 → Sandor interim — leadership transition at worst moment',
    'Farallon ~3% activist stake — ghost in every margin/efficiency conversation',
    'IZERVAY CRL + ¥115B impairment, VEOZAH boxed warning, Audentes thesis broken',
    'PADCEV bright spot (¥210B forecast), VYLOY ramping',
    '3 GCCs scaling simultaneously — federated governance, no single owner',
    '"Change Communication" = Astellas self-identified weakest capability (Feb 2025)',
  ],
  YEARONE: [
    'Days 1-45: LISTEN — sessions with Mukta, Andżelika, Flavio + 2-3 levels deep per site',
    'Understand what "One Astellas" means in lived reality of each hub at its maturity stage',
    'Days 45-90: Build GCC narrative framework — pillars, tone, hashtag, story types — tested with MDs',
    'Anchor in CSP2026 + new Values & Behaviors as natural editorial spine',
    'Months 3-6: Launch governed cross-GCC SharePoint with adoption metrics from day 1',
    'Deliver at least one CxO-function workstream with Managing Principal sponsorship',
    'Calendar = editorial arc: Warsaw Bridge move, Mexico first year, Bengaluru scale-up, CSP2026 launch',
    'Months 6-12: Coached development of 1-2 Senior Consultants',
    'Success signal: leaders in each GCC repeating the narrative in own words, unprompted, by month 9',
    'Measurable: SharePoint adoption (cross-GCC reads), behaviour adoption (not just awareness)',
  ],
  ONEASTELLAS: [
    '"One Astellas" = formal corporate value: leveraging diverse perspectives to achieve org goals',
    'Won\'t work if it means UNIFORM — must be coherent core + configurable site identity',
    'Bengaluru: full-stack capability hub · Warsaw: GBS/clinical core · Mexico: medical-digital-innovation',
    'Three different maturity curves: messaging that lands in Warsaw may overwhelm Mexico City',
    'New Values: Integrity, Innovation, Impact + 5 Behaviors (Courage, Urgency, One Astellas, Outcome Focus, Accountability)',
    'Patient Focus elevated to VISION layer — implicit everywhere, not a competing value',
    '"Excellence" swapped for "Impact" because of cross-cultural resonance — Astellas is aware',
    'Federated model: each GCC MD owns narrative, shared spine of tone + hashtags',
    'Integrating mechanism = communications layer — no single Global Head of GCCs exists',
    'Legacy-market anxiety (US/EU offshoring fears) — GCC branding must pair with internal narrative for sending sites',
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
        const m = raw.match(/\b(INTRO|Q1[01]?|Q[1-9]|PHARMA|VENDOR|WHYLEAVE|CURROLE|ROLEALIGN|FIVEYEAR|TECHTONOTCH|GCCCHALLENGE|SVCGCC|FOCUS|STRENGTH|WEAKNESS|TOMANDATE|ASTELLASTRANSFORM|YEARONE|ONEASTELLAS|ASKME|FOLLOWUP|NONE)\b/);
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
