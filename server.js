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
    '"I\'ve spent the last decade in life sciences — first three years on the ground at Novartis and J&J, last six leading transformation across pharma portfolios at Indegene\'s Bangalore center, which is itself a GCC for pharma clients..."',
    '"The common thread is not technology — it\'s helping complex organisations move from strategic intent to adoption at scale..."',
    '"What caught me about this role is the moment — CSP2026 launching, three GCCs scaling, Change Communication flagged as the top gap..."',
    'CLOSE WITH: "...and ultimately, all of that ladders up to VALUE for patients."',
  ],
  CAREER: [
    '"Pharma was intentional — B.Pharm from Manipal, then three years in field sales because I wanted ground-truth on how HCPs and patients actually experience the system..."',
    '"The arc is from the field to the boardroom — each phase deepened pharma fluency while expanding transformation breadth..."',
    '"Why Astellas now — CSP2026 is a once-in-a-plan-cycle window. The chance to build alongside someone who has done it twice before is a learning multiplier..."',
    'CLOSE WITH: "...and that all ladders up to VALUE for patients."',
  ],
  WHYASTELLAS: [
    '"What attracts me is that Astellas is at a real transformation inflection point — CSP2026 coming in, SMT as enterprise priority, operating model shifted around Value Creation, Delivery, Enablement..."',
    '"The three GCCs are being positioned as critical enablers rather than support centers — that\'s the kind of environment where transformation has to show up as operating rhythm..."',
    '"Change Communication was self-identified as the top materiality gap in February 2025 — so this isn\'t a nice-to-have hire, it\'s a diagnosed deficit..."',
    'AVOID: Don\'t say "Astellas is innovative and patient-focused" — too generic.',
  ],
  WHYROLE: [
    '"This role sits at the intersection of three things I\'ve built my career around — transformation execution, engagement and communication strategy, and GCC capability building..."',
    '"I would see success not as producing more communication artefacts, but as creating a repeatable engagement system that helps India, Poland, Mexico operate as One Astellas..."',
    '"Three differentiators: pharma fluency across twelve companies, transformation craft, and a GCC delivery-side perspective most candidates don\'t have..."',
    '"It\'s a build role at a build moment — and my career arc matches that energy."',
  ],
  SERVICESGCC: [
    '"That transition is exactly what excites me — from delivering transformation for pharma clients to building transformation capability inside Astellas itself..."',
    '"In services I learned breadth and speed, but the limitation is you\'re one step removed from long-term enterprise ownership — a GCC requires continuity, institutional memory..."',
    '"Indegene\'s Bangalore center is itself a GCC for pharma clients — I\'ve lived the model from inside for four years..."',
    '"Moving from vendor-side execution to enterprise-side capability ownership."',
  ],
  TECHSHIFT: [
    '"I see GenAI as one expression of my transformation experience, not the center of my identity — the transferable part is the discipline behind it..."',
    '"Prioritising use cases, aligning sponsors, creating governance, managing resistance, building adoption playbooks — those same muscles apply to GCC engagement, SharePoint, CSP activation..."',
    '"Change Makers Council was zero tech, pure organisational behaviour change. OKR adoption was about sitting with leaders\' pain, not tool features..."',
    '"The role gives me a broader enterprise canvas for the same capability."',
  ],
  CHANGECULTURE: [
    '"We co-founded the Change Makers Council — 26 volunteers across BUs, deliberately not communicators. SMEs, engineers, finance — people whose voices carry weight in their teams..."',
    '"We co-authored the Credo language with OD leadership — multi-wave campaigns, each 7-14 days, breathing room between — consistency beats intensity..."',
    '"The signal was when Empathy started showing up unprompted in performance reviews by month four. The Council outlasted the launch — it became a durable mechanism..."',
    'BRIDGE: "This is exactly the muscle for embedding three Values and five Behaviors across three GCCs — One Astellas in three time zones."',
  ],
  TRISITE: [
    '"The comms job is not to flatten three GCCs into one voice — it\'s to create coherent difference under One Astellas..."',
    '"First I\'d diagnose — each site has different maturity, functional mix, leadership priorities. India is full-stack, Poland is GBS-clinical, Mexico is medical-digital..."',
    '"Then a shared narrative spine, site-specific pillars, a SharePoint engagement hub, editorial governance, and adoption metrics from day one..."',
    '"Success looks like leaders in each GCC repeating the narrative in their own words, unprompted, by month nine."',
  ],
  SHAREPOINT: [
    '"I would treat SharePoint as the operating backbone for engagement, not a repository — it should answer five questions: What\'s the GCC strategy? What\'s changing? How does my work connect?..."',
    '"It must serve a workflow — repositories die. Adoption metrics from day one — not pageviews but cross-GCC reads as a One Astellas health check..."',
    '"Federated model — each GCC MD owns their narrative, shared spine of tone and hashtags..."',
    '"I built a SharePoint utilization tracker for 120+ team members in under a month — operational instrument, not content dump."',
  ],
  SENIORADOPT: [
    '"Leaders weren\'t resistant to goals — they were resistant to public misalignment. I reframed Quantive as a leadership clarity instrument, not a tool rollout..."',
    '"I worked one-on-one with the most skeptical leaders — sat with their actual pain, mapped one of their stuck initiatives, and walked away. Didn\'t ask them to adopt. Just left a useful artifact..."',
    '"They logged back in on their own for their next leadership review. ~90% adoption within six months..."',
    '"Executive governance succeeds on three things — data discipline, named accountability, and decision-forcing cadence."',
  ],
  RESISTANCE: [
    '"I don\'t treat resistance as negativity — I treat it as data about what the transformation hasn\'t yet explained well..."',
    '"People heard productivity as replacement. We reframed to augmentation — gave SMEs the role of quality bar, not audience..."',
    '"One senior writer told me: You\'re asking me to teach the machine to replace myself — I said: You\'re teaching it to handle the repetitive parts so you can do what only you can do..."',
    '"Pattern: diagnose why, segment stakeholders, safe pilots, visible champions, measure, iterate."',
  ],
  LEADSTYLE: [
    '"I\'m structured but not rigid — I like to create clarity quickly on outcomes, owners, cadence, risks, and decisions — but I also invest in trust because transformation depends on informal influence..."',
    '"I coach by giving people frameworks and ownership, not by becoming the bottleneck..."',
    '"Speed with discipline — in regulated environments, speed means clear ownership, fast alignment, documented decisions, early risk escalation..."',
    'NEVER say "I drove..." without naming the coalition.',
  ],
  FIRST90: [
    '"First thirty days I would listen — sessions with you, Andżelika, Flavio, and two to three levels deep into each site. Not to validate a pre-built strategy but to understand what One Astellas means in lived reality..."',
    '"Days thirty to sixty I would map — stakeholder influence map, brand audit across GCCs, SharePoint diagnostic, draft the engagement framework..."',
    '"Days sixty to ninety I would land one visible quick win, the SharePoint reset plan, and a CSP2026 activation calendar tied to natural moments — Warsaw Bridge move, Mexico first year, India scale..."',
    '"My bias is visible momentum early, but not by flooding — first the listening map and governance so the engine scales."',
  ],
  GENAI: [
    '"The first three pilots stalled — not because the tech didn\'t work, but because we\'d skipped the diagnosis. We ran listening sessions and heard that our language was wrong — we were saying productivity when people heard replacement..."',
    '"We reframed around augmentation, built a CoP that paired SMEs with engineering, made wins visible weekly, partnered with Microsoft and Adobe..."',
    '"400+ employees impacted, 30%+ efficiency gains, configuration cycle dropped from four-five months to five-six weeks — but what outlived the project was the CoP growing from 3 to 90..."',
    '"The cultural shift to data-driven decision-making is a five-six year horizon, not a quarter — start small, scale carefully."',
  ],
  BOWLERS: [
    '"I built the Bowler Chart system from zero on Power BI — the technology was the easy part. The hard part was getting leaders to treat their data as the voice of their function in board meetings..."',
    '"Structural choices: assigned POCs per function for named accountability, established reliable data-gathering processes, built cadences where monthly reviews became decision-forcing conversations, not status reports..."',
    '"It transformed from a reporting tool into the spine of CXO and board-level strategic decision-making..."',
    '"Directly relevant to GCC SharePoint — connective tissue and decision-forcing surface, not a document repository."',
  ],
  COACHING: [
    '"Vrinda and Raja both joined from non-technical backgrounds, anxious about the GenAI wave. I paired them with engineering leads on real client use cases from week one — learn by sitting in the work, not adjacent..."',
    '"Gave them ownership of CoP sessions and live demos. Weekly coaching — real conversations about ambiguity, not status updates. Protected their permission to say I don\'t know yet..."',
    '"Both contributing to live client projects within six months. Coaching isn\'t teaching frameworks — it\'s giving people the courage to sit in ambiguity..."',
    '"Don\'t treat people as objects — give them career maps so they see they\'re part of a long-term strategy."',
  ],
  FAILURE: [
    '"When I took over BSVwithU, 70% of the marketing SOW hadn\'t started. I spent the first months executing, not governing — I should have insisted on a change-request framework in week one, not month three..."',
    '"The learning was clear — structure the system before running the work. Governance first, then execution within it..."',
    '"We got there — 75% MAU growth, project renewed Year 2 — but the lesson was about sequencing..."',
    '"Courage is also about learning from failure publicly — the intelligent risk only pays off if you actually metabolise the lesson."',
  ],
  CXOWORK: [
    '"Working with C-suite is about being a bridge — translating execution reality up, and strategic intent down — and doing it consistently. Consistency beats intensity..."',
    '"At BSV I presented monthly to the COO — lead with the decision needed, then data, then recommendation. Bring options, not problems..."',
    '"With AstraZeneca\'s ED, a single solution conversation scaled into a multi-track program — at that level the value is the adoption mechanism, not the solution itself..."',
    '"Bowler Charts ended up in CXO reviews and board meetings — that\'s the altitude I\'m comfortable at."',
  ],
  CURRENTROLE: [
    '"Both current engagements are teaching me that at senior altitude, the value isn\'t the solution — it\'s the adoption mechanism. Which is exactly why this role is interesting..."',
    '"At Vertex I\'m aligning four parties with different incentives — consulting, client, delivery, engineering — around a prioritised roadmap and governance model..."',
    '"With AstraZeneca\'s Executive Director, a single conversation has scaled into solutions, agents, data strategy, and adoption playbooks for medical use cases..."',
    '"Senior Manager, three promotions in five years, twelve pharma companies."',
  ],
  WHYLEAVE: [
    '"Indegene has been formative — three promotions in five years, deep pharma exposure. What I\'m looking for now is depth over breadth..."',
    '"Running one pharma\'s full transformation agenda inside a CxO function is a different craft than running multiple portfolios from outside..."',
    '"The Astellas TO is one of the few internal-consulting units with consulting-grade rigour, and the GCC engagement remit is rare..."',
    '"The chance to build alongside someone who has done it twice is a once-in-a-career learning curve."',
  ],
  PHARMACHECK: [
    '"XTANDI is roughly 48% of revenue with US LOE in August 2027 — that\'s the financial gravity behind SMT and the GCC scaling. The bridge to next-wave patient value depends on Strategic Brands ramp..."',
    '"PADCEV is the bright spot at ¥210B. IZERVAY is rebuilding after the CRL. VEOZAH is in safety-driven reset..."',
    '"CSP2026 launches late May — first execution wave. April 2025 reorg: Value Creation, Delivery, Enablement..."',
    '"The reason this matters for patients: SMT and GCCs both protect the bridge to the next wave of therapies."',
  ],
  VALUES: [
    '"Three Values — Integrity, Innovation, Impact. Five Behaviors — Courage, Sense of Urgency, One Astellas, Outcome Focus, Accountability..."',
    '"The deliberate swap from Excellence to Impact — because in some cultures, excellence implies perfectionism that slows progress. Patient Focus elevated to the vision layer..."',
    '"I would embed these not through posters but through repeated leadership signals, peer champions, narrative consistency, and visible rituals — exactly what the Change Makers Council did..."',
    '"You can\'t mandate culture — you have to make people want to live it. Engaging hearts and minds."',
  ],
  TOMANDATE: [
    '"The TO is a real internal consulting unit — Managing Principal, Principal, Lead Consultant, Senior Consultant, Consultant — organised by Chapters..."',
    '"CxO-embedded — Managing Principals partner with CxOs and Chiefs of Staff. Lead Consultant leads significant workstreams within a CxO function..."',
    '"Change Communication was flagged as the top capability gap — this role fills a diagnosed deficit..."',
    '"Post October 2025, TO and DigitalX sit under the CStO — transformation is now strategy execution, not a digital bet."',
  ],
  ONEASTELLAS: [
    '"One Astellas won\'t work if it means uniform — it must be coherent core with configurable site identity. Three different maturity curves need different messaging..."',
    '"Bengaluru is full-stack, Warsaw is GBS-clinical, Mexico is medical-digital-innovation — those are real differences to respect, not flatten..."',
    '"Federated model — each GCC MD owns their narrative, shared spine of tone and hashtags. Communications layer IS the integrating mechanism..."',
    '"Centers of excellence, not islands of excellence — leaders repeating the narrative in their own words, unprompted."',
  ],
  BUDGET: [
    '"At BSV I owned the full budget — delivered $25K in AWS savings, negotiated $32,645 for out-of-scope changes, maintained 40% margin. Monthly RAG status to the COO..."',
    '"At Amgen, multi-million USD operations — transformed pricing from FTE-based to asset-based through finance-ops-client collaboration..."',
    '"Financial discipline isn\'t a separate skill — it\'s embedded in how I operate transformation programs."',
  ],
  GAPS: [
    '"I\'m clear-eyed that I\'ve worked alongside global pharma rather than inside one — what I bring is breadth across portfolios most internal candidates don\'t have. What I\'d learn from you is the inside-out craft..."',
    '"My experience is multi-geography, multi-stakeholder, multi-culture across five-plus portfolios — the translation to one pharma with three GCCs is a step-change in depth, but the muscle is built..."',
    '"Ten-year arc including field sales — those years are an underrated input for GCC engagement because it\'s a customer-empathy problem. Internal audiences, same craft..."',
    'POSTURE: Name it, reframe it, show how you\'d close it. Don\'t pretend.',
  ],
  SANOFI: [
    '"The real challenge wasn\'t the channels — field reps saw digital as competitive with their relationships. The change management work was helping them see omnichannel as amplification, not replacement..."',
    '"10,000 HCPs enrolled, 47% connected call rate, SMS at 7.33%, call duration up 20% — but the real proof is the project was renewed..."',
    '"Built a coalition across brand managers, field force leadership, digital ops, and analytics — no single party could deliver alone..."',
    '"Same logic as the patient-axis model — organising around the customer, not the function."',
  ],
  BSV: [
    '"When I took over, 70% of the SOW hadn\'t started. Built an evaluation framework with procurement — once they had a framework, the conversation completely changed..."',
    '"Monthly cadence with the COO and DT Head — lead with the decision needed, then data, then recommendation. Options, not problems..."',
    '"MAU grew 75%, negotiated $32K for change requests, $25K in savings, margin held at 40%. Project renewed Year 2..."',
    '"Trust is earned through consistent delivery, not a single impressive moment."',
  ],
  ASKME: [
    '"You\'ve built three GCCs now — what\'s the one thing you wish you\'d known in your first build that you applied differently to your second and third?"',
    '"As India moves from set-up to scale, what signals would tell you it\'s being seen globally as a capability hub rather than a support location?"',
    '"For the tri-site engagement agenda — where do you see the biggest risk today?"',
    'Ask 2-3 max. End with the FIRST question. Position as someone who learns from leaders.',
  ],
  FOLLOWUP: [
    '"What differently?" → "BSV: CR framework week one, not month three." / "GenAI: led with workflow redesign earlier, not tool training."',
    '"How did you measure?" → "Adoption metrics not output — Empathy showing up in perf reviews, ~90% OKR login rate, efficiency gains quantified."',
    '"What did your reportee struggle with?" → "Vrinda — confidence in client-facing demos. We did dry-runs every Tuesday for two months."',
    '"Sounds textbook" → "I designed from listening sessions, not from the framework." / "I don\'t know" is allowed — courage over false confidence.',
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
