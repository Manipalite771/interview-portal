const http = require('http');
const https = require('https');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');
const WebSocket = require('ws');

const PORT = process.env.PORT || 8080;
const AWS_KEY = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET = process.env.AWS_SECRET_ACCESS_KEY;
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const DEEPGRAM_KEY = process.env.DEEPGRAM_KEY || 'cdf41b28cb9349ac6ddfe7c5e8836babdc0c1151';
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const htmlR1 = fs.readFileSync(path.join(__dirname, 'index-wioleta.html'), 'utf8');
const serverR1 = JSON.stringify({note: 'Round 1 voice matching uses same /match endpoint with Wioleta-tuned categories'});

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

WEAKNESS — "What is your weakness", "areas for improvement", "what are you working on", "development areas", "what do you struggle with", "where do you need to grow", "what would your manager say you need to improve".

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
- Valid tokens: INTRO CAREER WHYASTELLAS WHYROLE SERVICESGCC TECHSHIFT CHANGECULTURE TRISITE SHAREPOINT SENIORADOPT RESISTANCE LEADSTYLE FIRST90 GENAI BOWLERS COACHING FAILURE CXOWORK CURRENTROLE WHYLEAVE PHARMACHECK VALUES TOMANDATE ONEASTELLAS BUDGET GAPS WEAKNESS SANOFI BSV ASKME FOLLOWUP NONE
- Respond with EXACTLY one of the above tokens`;

const PANEL_MAP = {
  INTRO: 1, CAREER: 2, WHYASTELLAS: 3, WHYROLE: 4, SERVICESGCC: 5,
  TECHSHIFT: 6, CHANGECULTURE: 7, TRISITE: 8, SHAREPOINT: 9,
  SENIORADOPT: 10, RESISTANCE: 11, LEADSTYLE: 12, FIRST90: 13,
  GENAI: 14, BOWLERS: 15, COACHING: 16, FAILURE: 17, CXOWORK: 18,
  CURRENTROLE: 19, WHYLEAVE: 20, PHARMACHECK: 21, VALUES: 22,
  TOMANDATE: 23, ONEASTELLAS: 24, BUDGET: 25, GAPS: 26, WEAKNESS: 27,
  SANOFI: 28, BSV: 29, ASKME: 30, FOLLOWUP: 31
};

const CUES = {
  INTRO: [
    'DECADE IN LIFE SCIENCES|"First three years on the ground at Novartis and J&J, last six leading transformation at Indegene — which is itself a GCC for pharma clients."',
    'STRATEGY → ADOPTION AT SCALE|"The common thread is helping complex organisations move from strategic intent to adoption at scale."',
    'WHY ASTELLAS NOW|"CSP2026 launching, three GCCs scaling, Change Communication flagged as the top capability gap."',
    'CLOSE WITH PATIENTS|"...and ultimately, all of that ladders up to VALUE for patients."',
  ],
  CAREER: [
    'PHARMA WAS INTENTIONAL|"B.Pharm Manipal, then field sales — I wanted ground-truth on how HCPs and patients actually experience the system."',
    'ARC: FIELD TO BOARDROOM|"Each phase deepened pharma fluency while expanding transformation breadth."',
    'WHY ASTELLAS NOW|"CSP2026 is a once-in-a-plan-cycle window. Building alongside someone who has done it twice = learning multiplier."',
    'CLOSE WITH PATIENTS|"...and that all ladders up to VALUE for patients."',
  ],
  WHYASTELLAS: [
    'TRANSFORMATION INFLECTION|"CSP2026 coming in, SMT as enterprise priority, operating model shifted to Value Creation / Delivery / Enablement."',
    'GCCs = CRITICAL ENABLERS|"Three GCCs positioned as enablers, not support centers — transformation has to show up as operating rhythm."',
    'DIAGNOSED DEFICIT|"Change Communication was the top materiality gap, Feb 2025 — this isn\'t nice-to-have, it\'s a diagnosed deficit."',
    'AVOID|Don\'t say "Astellas is innovative and patient-focused" — too generic.',
  ],
  WHYROLE: [
    'INTERSECTION OF THREE|"Transformation execution + engagement/comms strategy + GCC capability building."',
    'NOT ARTEFACTS — SYSTEMS|"Success is a repeatable engagement system, not more communication artefacts."',
    '3 DIFFERENTIATORS|"Pharma fluency (12 companies) + transformation craft + GCC delivery-side perspective."',
    'BUILD ROLE AT BUILD MOMENT|"My career arc matches that energy."',
  ],
  SERVICESGCC: [
    'THIS EXCITES ME|"From delivering transformation for pharma clients to building transformation capability inside Astellas itself."',
    'BREADTH → DEPTH|"Services taught breadth, but you\'re one step removed from long-term enterprise ownership. A GCC requires continuity, institutional memory."',
    'I\'VE LIVED THE MODEL|"Indegene Bangalore is itself a GCC for pharma clients — I\'ve been inside for four years."',
    'KEY LINE|"Moving from vendor-side execution to enterprise-side capability ownership."',
  ],
  TECHSHIFT: [
    'GENAI = ONE EXPRESSION|"Not my identity. The transferable part is the discipline behind it."',
    'SAME MUSCLES APPLY|"Prioritising use cases, aligning sponsors, governance, resistance, adoption playbooks — applies to GCC engagement, SharePoint, CSP."',
    'PROOF: ZERO-TECH WINS|"Change Makers Council = pure behaviour change. OKR = sat with leaders\' pain, not tool features."',
    'BROADER CANVAS|"The role gives me a broader enterprise canvas for the same capability."',
  ],
  CHANGECULTURE: [
    '26 VOLUNTEERS, NOT COMMS|"Co-founded Change Makers Council — SMEs, engineers, finance. People whose voices carry weight in their teams."',
    'CO-AUTHORED WITH OD|"Multi-wave campaigns, 7-14 days each, breathing room between. Consistency beats intensity."',
    'EMPATHY IN PERF REVIEWS|"Signal: Empathy showing up unprompted by month four. Council outlasted the launch — durable mechanism."',
    'ASTELLAS BRIDGE|"Exactly the muscle for embedding 3 Values + 5 Behaviors across 3 GCCs."',
  ],
  TRISITE: [
    'COHERENT DIFFERENCE|"Not flatten three GCCs into one voice — create coherent difference under One Astellas."',
    '3 DIFFERENT SITES|"India = full-stack, Poland = GBS-clinical, Mexico = medical-digital. Different maturity = different messaging."',
    '6 STEPS|"Diagnose → common narrative → site pillars → SharePoint hub → governance → adoption metrics."',
    'SUCCESS SIGNAL|"Leaders in each GCC repeating the narrative in their own words, unprompted, by month nine."',
  ],
  SHAREPOINT: [
    'OPERATING BACKBONE|"Not a repository — it should answer: What\'s the strategy? What\'s changing? How does my work connect?"',
    'WORKFLOW OR DIE|"Must serve a workflow — repositories die. Cross-GCC reads = One Astellas health check."',
    'FEDERATED MODEL|"Each GCC MD owns narrative, shared spine of tone and hashtags."',
    'MY PROOF|"Built SharePoint tracker for 120+ team in under a month — operational instrument."',
  ],
  SENIORADOPT: [
    'RESISTANT TO PUBLIC MISALIGNMENT|"Not resistant to goals. Reframed Quantive as leadership clarity instrument."',
    'SAT WITH THEIR PAIN|"Worked 1:1, mapped their stuck initiative, walked away. Left a useful artifact. Didn\'t ask them to adopt."',
    '~90% IN 6 MONTHS|"They logged back in on their own for their next leadership review."',
    'THREE THINGS|"Data discipline + named accountability + decision-forcing cadence."',
  ],
  RESISTANCE: [
    'RESISTANCE = DATA|"I treat it as data about what the transformation hasn\'t yet explained well."',
    'PRODUCTIVITY → AUGMENTATION|"People heard replacement. Reframed — SMEs became quality bar, not audience."',
    'SPECIFIC DIALOGUE|"You\'re asking me to replace myself → You\'re handling repetitive parts so you can do what only you can do."',
    'PATTERN|"Diagnose why → segment → safe pilots → visible champions → measure → iterate."',
  ],
  LEADSTYLE: [
    'STRUCTURED BUT NOT RIGID|"Create clarity quickly — outcomes, owners, cadence, risks, decisions — then invest in trust."',
    'FRAMEWORKS + OWNERSHIP|"Coach by giving people ownership, not by becoming the bottleneck."',
    'SPEED WITH DISCIPLINE|"In regulated environments: clear ownership, fast alignment, documented decisions, early risk escalation."',
    'COALITION NOT HERO|Never say "I drove..." without naming the coalition.',
  ],
  FIRST90: [
    'DAYS 1-30: LISTEN|"Sessions with you, Andżelika, Flavio, 2-3 levels deep. What does One Astellas mean in lived reality?"',
    'DAYS 30-60: MAP|"Stakeholder influence map, brand audit across GCCs, SharePoint diagnostic, draft engagement framework."',
    'DAYS 60-90: LAND|"One quick win, SharePoint reset, CSP2026 activation calendar — Warsaw move, Mexico first year, India scale."',
    'POSTURE|"Visible momentum early, but not by flooding — first the listening map and governance."',
  ],
  GENAI: [
    'FIRST 3 PILOTS STALLED|"Not tech failure — we skipped diagnosis. Said productivity, people heard replacement."',
    'REFRAMED TO AUGMENTATION|"CoP paired SMEs with engineering, wins visible weekly, partnered Microsoft + Adobe."',
    '400+ IMPACTED, CoP 3→90|"30%+ efficiency, config cycle 4-5mo → 5-6wks. What outlived = the CoP still running."',
    'LONG HORIZON|"Cultural shift is 5-6 year horizon, not a quarter. Start small, scale carefully."',
  ],
  BOWLERS: [
    'GOVERNANCE, NOT TECH|"Built from zero on Power BI — hard part was getting leaders to treat data as voice of their function."',
    'STRUCTURAL CHOICES|"POCs per function, reliable data processes, monthly cadences = decision-forcing, not status."',
    'NOW IN BOARD MEETINGS|"Transformed from reporting tool into spine of CXO/board strategic decision-making."',
    'ASTELLAS TIE|"Same thinking for GCC SharePoint — decision-forcing surface, not repository."',
  ],
  COACHING: [
    'PAIRED WITH REAL WORK|"Vrinda + Raja: non-technical, paired with engineering on real client use cases from week one."',
    'OWNERSHIP + PERMISSION|"Gave them CoP sessions and demos. Protected their permission to say I don\'t know yet."',
    'BOTH CONTRIBUTING IN 6 MONTHS|"Coaching isn\'t frameworks — it\'s giving people courage to sit in ambiguity."',
    'MUKTA\'S OWN WORDS|"Don\'t treat people as objects — give them career maps."',
  ],
  FAILURE: [
    'BSV: GOVERNANCE WEEK 1|"70% of SOW hadn\'t started. Should have insisted on CR framework week one, not month three."',
    'LESSON: SYSTEM BEFORE WORK|"Structure the governance first, then execute within it."',
    'STILL DELIVERED|"75% MAU growth, renewed Year 2 — but the lesson was about sequencing."',
    'COURAGE TO ADMIT|"Intelligent risk only pays off if you metabolise the lesson publicly."',
  ],
  CXOWORK: [
    'BRIDGE UP AND DOWN|"Translating execution reality up, strategic intent down — consistently. Consistency beats intensity."',
    'BSV: DECISION → DATA → REC|"Monthly with COO. Lead with decision needed. Bring options, not problems."',
    'AZ: SINGLE → MULTI-TRACK|"With ED, single conversation scaled into multi-track. At that altitude, value = adoption mechanism."',
    'BOARD ALTITUDE|"Bowler Charts in CXO reviews and board meetings — that\'s the altitude I\'m comfortable at."',
  ],
  CURRENTROLE: [
    'VALUE = ADOPTION MECHANISM|"Both engagements teach me: at senior altitude, value isn\'t the solution — it\'s the adoption mechanism."',
    'VERTEX: 4-PARTY COALITION|"Aligning consulting, client, delivery, engineering around roadmap and governance."',
    'AZ: DIRECTLY WITH ED|"Single conversation scaled into solutions, agents, data strategy, adoption playbooks."',
    '3 PROMOTIONS, 12 PHARMA|"Senior Manager in five years. Twelve pharma companies."',
  ],
  WHYLEAVE: [
    'DEPTH OVER BREADTH|"Indegene was formative — three promotions. Looking for depth: one pharma\'s full agenda inside CxO function."',
    'DIFFERENT CRAFT|"Running one pharma\'s transformation agenda is a different craft than multiple portfolios from outside."',
    'ASTELLAS TO = RARE|"One of few internal-consulting units with rigour. GCC engagement remit is rare."',
    'LEARNING MULTIPLIER|"Building alongside someone who has done it twice is a once-in-a-career learning curve."',
  ],
  PHARMACHECK: [
    'XTANDI = FINANCIAL GRAVITY|"48% of revenue, US LOE Aug 2027. That\'s why SMT and GCC scaling matter."',
    'PORTFOLIO STATUS|"PADCEV bright spot ¥210B. IZERVAY rebuilding post-CRL. VEOZAH in safety reset."',
    'CSP2026 FIRST WAVE|"Launches late May. April 2025 reorg: Value Creation / Delivery / Enablement."',
    'FRAME AS PATIENTS|"SMT and GCCs both protect the bridge to the next wave of therapies for patients."',
  ],
  VALUES: [
    '3 VALUES + 5 BEHAVIORS|"Integrity, Innovation, Impact. Courage, Urgency, One Astellas, Outcome Focus, Accountability."',
    'EXCELLENCE → IMPACT|"Because perfectionism slows progress in some cultures. Patient Focus = vision layer."',
    'EMBED THROUGH BEHAVIOUR|"Not posters — leadership signals, peer champions, narrative consistency, visible rituals."',
    'HEARTS AND MINDS|"You can\'t mandate culture — you have to make people want to live it."',
  ],
  TOMANDATE: [
    'REAL INTERNAL CONSULTING|"MP → Principal → Lead Consultant → Sr Consultant → Consultant. Organised by Chapters."',
    'CxO-EMBEDDED|"Managing Principals partner with CxOs. Lead Consultant leads workstreams within CxO function."',
    'DIAGNOSED DEFICIT|"Change Communication = top gap. This role fills it."',
    'NOW UNDER CStO|"Post Oct 2025, TO + DigitalX under CStO. Transformation = strategy execution, not digital bet."',
  ],
  ONEASTELLAS: [
    'COHERENT CORE + CONFIG|"Won\'t work if uniform. Three maturity curves need different messaging."',
    '3 DIFFERENT IDENTITIES|"Bengaluru full-stack, Warsaw GBS-clinical, Mexico medical-digital. Respect, don\'t flatten."',
    'FEDERATED MODEL|"Each GCC MD owns narrative, shared spine. Comms layer IS the integrating mechanism."',
    'MUKTA\'S FRAMING|"Centers of excellence, not islands of excellence."',
  ],
  BUDGET: [
    'BSV: FULL OWNERSHIP|"$25K AWS savings, $32,645 negotiated, 40% margin held. Monthly RAG to COO."',
    'AMGEN: MULTI-MILLION|"FTE → asset-based pricing. Finance-ops-client collaboration."',
    'EMBEDDED DISCIPLINE|"Financial discipline isn\'t separate — it\'s embedded in how I operate programs."',
  ],
  GAPS: [
    'NEVER INSIDE PHARMA|"Breadth most internal candidates don\'t have. What I\'d learn from you: inside-out craft."',
    'MULTI-CLIENT NOT ONE ORG|"Multi-geo, multi-stakeholder across 5+ portfolios. Step-change in depth, but muscle is built."',
    '5 YRS NOT 8|"Ten-year arc. Field years = underrated input for GCC engagement — customer-empathy problem."',
    'POSTURE|Name it, reframe it, show how you\'d close it. Don\'t pretend.',
  ],
  WEAKNESS: [
    'ASTELLAS-SPECIFIC DEPTH|"I don\'t yet have the inside-out context — XTANDI bridge mechanics, Japan-HQ rhythms, internal politics. I\'d build that in 60-90 days deliberately."',
    'LETTING GO AT SCALE|"As CoP scaled to 90, I had to stop being in every loop. My instinct is to stay close — learning to let others own it fully."',
    'GOVERNANCE BEFORE EXECUTION|"Earlier in career: took too long to push back on scope creep. BSV taught me — CR framework week one, not month three."',
    'HONESTY > FAKE HUMBLE|Don\'t say "I\'m a perfectionist." She values courage and intellectual honesty.',
  ],
  SANOFI: [
    'COMPETITIVE → AMPLIFICATION|"Field reps saw digital as competitive. Reframed: omnichannel amplifies relationships, not replaces."',
    'NUMBERS + RENEWAL|"10K HCPs, 47% call rate, 7.33% SMS, duration +20%. Project renewed = real proof."',
    'COALITION|"Brand managers + field force + digital ops + analytics. No single party alone."',
    'PATIENT-AXIS LOGIC|"Same logic — organising around the customer, not the function."',
  ],
  BSV: [
    'FRAMEWORK WITH PROCUREMENT|"70% SOW not started. Built evaluation framework with them — conversation changed."',
    'COO MONTHLY CADENCE|"Decision needed → data → recommendation. Options, not problems."',
    'RESULTS|"MAU +75%, $32K negotiated, $25K savings, margin 40%. Renewed Year 2."',
    'TRUST THROUGH CONSISTENCY|"Trust is earned through consistent delivery, not a single impressive moment."',
  ],
  ASKME: [
    'BEST QUESTION|"You\'ve built three GCCs — what did you learn in your first that you applied differently to your second and third?"',
    'CAPABILITY HUB SIGNALS|"As India moves set-up → scale, what signals tell you it\'s seen as capability hub?"',
    'BIGGEST RISK|"For the tri-site agenda — where do you see the biggest risk today?"',
    'RULE|Ask 2-3 max. End with BEST question. Position as learner, not competitor.',
  ],
  FOLLOWUP: [
    'WHAT DIFFERENTLY?|BSV: "CR framework week one." GenAI: "Workflow redesign earlier, not tool training."',
    'HOW MEASURE?|"Adoption metrics not output. Empathy in perf reviews. ~90% OKR login. Efficiency quantified."',
    'REPORTEE STRUGGLE?|"Vrinda — confidence in client demos. Dry-runs every Tuesday for two months."',
    'SOUNDS TEXTBOOK?|"Designed from listening sessions, not framework." "I don\'t know" = allowed.',
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
    req.setTimeout(3000, () => { req.destroy(); resolve('NONE'); });
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
  } else if (req.url === '/r1' || req.url === '/round1' || req.url === '/wioleta') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(htmlR1);
  } else {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  }
});

server.listen(PORT, () => console.log(`Listening on :${PORT}`));

/* ---- Deepgram WebSocket Proxy ---- */
const wss = new WebSocketServer({ server });

wss.on('connection', (clientWs) => {
  console.log('[DG] Client connected');

  const dgUrl = 'wss://api.deepgram.com/v1/listen?' +
    'model=nova-2&language=en&smart_format=true&' +
    'interim_results=true&utterance_end_ms=1500&vad_events=true&' +
    'endpointing=400&encoding=linear16&sample_rate=16000&channels=1';

  const dgWs = new WebSocket(dgUrl, {
    headers: { 'Authorization': 'Token ' + DEEPGRAM_KEY }
  });

  let dgReady = false;

  dgWs.on('open', () => {
    dgReady = true;
    clientWs.send(JSON.stringify({ type: 'dgReady' }));
    console.log('[DG] Deepgram connection open');
  });

  dgWs.on('message', (msg) => {
    try {
      const data = JSON.parse(msg.toString());
      if (data.type === 'Results') {
        const alt = data.channel && data.channel.alternatives && data.channel.alternatives[0];
        if (alt) {
          clientWs.send(JSON.stringify({
            type: 'transcript',
            text: alt.transcript || '',
            isFinal: data.is_final || false,
            speechFinal: data.speech_final || false
          }));
        }
      } else if (data.type === 'UtteranceEnd') {
        clientWs.send(JSON.stringify({ type: 'utteranceEnd' }));
      }
    } catch(e) {}
  });

  dgWs.on('error', (err) => {
    console.error('[DG] Deepgram error:', err.message);
    clientWs.send(JSON.stringify({ type: 'error', msg: err.message }));
  });

  dgWs.on('close', () => {
    console.log('[DG] Deepgram closed');
    dgReady = false;
  });

  clientWs.on('message', (msg) => {
    if (dgReady && dgWs.readyState === WebSocket.OPEN) {
      dgWs.send(msg);
    }
  });

  clientWs.on('close', () => {
    console.log('[DG] Client disconnected');
    if (dgWs.readyState === WebSocket.OPEN) {
      dgWs.close();
    }
  });
});
