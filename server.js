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
    'KEY: "Helping complex orgs move from strategic intent → adoption at scale"',
    'Decade: 3 yrs field (Intas/J&J/Novartis) + 6 yrs transformation at Indegene (a pharma GCC)',
    '12 pharma companies. NOT a GenAI person — strategy-execution leader.',
    'CLOSE: "GCCs + CSP2026 + One Astellas need that bridge between strategy, communication, and execution… ladders up to VALUE for patients."',
  ],
  CAREER: [
    'KEY: Pharma is INTENTIONAL. B.Pharm → field sales → MBA → transformation at scale.',
    'Arc = "from the field to the boardroom" — each phase deepened pharma fluency',
    'Why NOW: CSP2026, 3 GCCs, Change Communication gap. Build role at build moment.',
    'CLOSE with "…ultimately ladders up to VALUE for patients"',
  ],
  WHYASTELLAS: [
    'KEY: Real transformation inflection point — NOT "innovative and patient-focused"',
    'CSP2026 launching, SMT ¥150B, 3 GCCs as CRITICAL ENABLERS not support centers',
    '"Change Communication" = top materiality gap (Feb 2025) — diagnosed deficit',
    'Chance to build alongside someone who has done it twice = learning multiplier',
  ],
  WHYROLE: [
    'KEY: Intersection of 3 things — transformation execution + engagement/comms + GCC capability',
    'Success = repeatable engagement system, not more communication artefacts',
    'Three differentiators: pharma fluency (12 co) + transformation craft + GCC delivery perspective',
    'BUILD role at BUILD moment. "Operating models, governance, change adoption at scale — that IS the role."',
  ],
  SERVICESGCC: [
    'KEY LINE: "Moving from vendor-side execution to enterprise-side capability ownership"',
    'DON\'T be defensive — this transition EXCITES me',
    'Indegene Bangalore IS itself a GCC — I\'ve lived the model from inside',
    'What I build in 60-90 days: Astellas-specific depth (XTANDI, SMT, One Astellas nuance)',
  ],
  TECHSHIFT: [
    'KEY: "The role gives me a broader enterprise canvas for the same capability"',
    'GenAI = one expression of transformation, NOT my identity. Tech is one vehicle.',
    'Proof: Change Makers Council = zero tech, pure behaviour change. OKR = sat with leaders\' pain.',
    'DO NOT SAY "I\'m okay doing less tech" — sounds like compromise',
  ],
  CHANGECULTURE: [
    'KEY: 26 cross-BU volunteers co-authored Credo language WITH OD leadership',
    'Multi-wave campaigns (Riddle N Fiddle / video / story competitions) — consistency beats intensity',
    'Signal: "Empathy" in perf reviews by month 4. Council OUTLASTED the launch.',
    'BRIDGE: "Exactly the muscle for embedding 3 Values + 5 Behaviors across 3 GCCs"',
  ],
  TRISITE: [
    'KEY: "Not flatten three GCCs into one voice — create coherent difference under One Astellas"',
    'India = full-stack (Mukta) · Poland = GBS/clinical (Andżelika) · Mexico = medical-digital (Flavio)',
    '6 steps: Diagnose → Common narrative → Site pillars → SharePoint hub → Governance → Measure',
    'Success = leaders repeating narrative in own words, unprompted, by month 9',
  ],
  SHAREPOINT: [
    'KEY: Operating backbone for engagement, NOT a document dump. Repositories die.',
    '5 questions it must answer: GCC strategy? What\'s changing? My work → Astellas? Stories? Source of truth?',
    'Adoption metrics day 1: cross-GCC reads = "One Astellas" health check',
    'MY PROOF: Built SharePoint tracker for 120+ team in <1 month',
  ],
  SENIORADOPT: [
    'KEY: "Sat with their actual pain — left a useful artifact — didn\'t ask them to adopt"',
    'OKR: Leaders resistant to PUBLIC misalignment. Reframed as clarity instrument. ~90% in 6 months.',
    'Bowler: Excel → Power BI → CXO/board decision instrument. POCs + cadences + data discipline.',
    'CLOSE: "Sustained change at senior levels requires courage — both ours and theirs"',
  ],
  RESISTANCE: [
    'KEY: "I treat resistance as data about what the transformation hasn\'t explained well"',
    'Reframed "productivity" → "augmentation". SMEs became quality bar, not audience.',
    'Dialogue: "You\'re asking me to replace myself" → "Handle repetitive parts so you do what only you can"',
    'Pattern: Diagnose WHY → Segment → Safe pilots → Visible champions → Measure → Iterate',
  ],
  LEADSTYLE: [
    'KEY: "Structured but not rigid. Clarity quickly — then invest in trust."',
    'Coach by giving frameworks + ownership — NOT becoming the bottleneck',
    'Behaviors: Courage (escalate early), Urgency (fast structuring), One Astellas (cross-functional)',
    'Never "I drove..." without naming the coalition. Bridge-building over hero narratives.',
  ],
  FIRST90: [
    'Days 1-30: LISTEN — Mukta/Andżelika/Flavio + 2-3 levels deep per site',
    'Days 30-60: MAP — stakeholder map, narrative audit, SharePoint diagnostic',
    'Days 60-90: LAND — engagement architecture, SharePoint reset, CSP2026 calendar, one quick win',
    'CLOSE: "Visible momentum early, but not by flooding — first the listening map and governance"',
  ],
  GENAI: [
    'KEY: Frame as TRANSFORMATION story. Diagnosis first — mapped WHY resistance, not WHO.',
    'Reframed "productivity" to "augmentation". Coalition with Microsoft+Adobe. CoP 3→90.',
    'Results: 400+ impacted, 30%+ efficiency, config cycle 4-5mo → 5-6wks',
    '"Start small, scale carefully — diverse cohorts. Cultural shift is 5-6 year horizon, not a quarter."',
  ],
  BOWLERS: [
    'KEY: "Tools without governance = more noise. Need data discipline + named accountability + decision-forcing cadence"',
    'Excel → Power BI → CXO/board governance. The SHIFT was governance design, not tech.',
    'POCs per function, reliable data refresh, monthly reviews = decisions not status',
    'ASTELLAS TIE: Same thinking for GCC SharePoint — decision-forcing surface, not repository',
  ],
  COACHING: [
    'KEY: "Don\'t treat people as objects — give them career maps" (Mukta\'s own quote)',
    'Vrinda + Raja: non-technical, paired with engineering on REAL use cases from week 1',
    'Weekly coaching = real conversations about ambiguity. Protected "I don\'t know yet".',
    'Both contributing to live client projects in 6 months. Capability, not just task completion.',
  ],
  FAILURE: [
    'KEY: BSV — should have insisted on change-request framework WEEK 1, not month 3',
    'Learning: "Structure the system before running the work. Governance first."',
    'ALT: GenAI early pilots — over-indexed on tool training, under-indexed on workflow redesign',
    '"Courage is learning from failure publicly — intelligent risk only pays if you metabolise the lesson"',
  ],
  CXOWORK: [
    'KEY: "Being a BRIDGE — execution reality UP, strategic intent DOWN — consistently"',
    'BSV: Monthly with COO. Lead with decision needed → data → recommendation. Options not problems.',
    'AZ: Directly with ED. Single conversation → multi-track program. Value = adoption mechanism.',
    'Bowler Charts used in CXO reviews and board meetings.',
  ],
  CURRENTROLE: [
    'KEY: "At senior altitude, value isn\'t the solution — it\'s the adoption mechanism"',
    'Vertex (Dec 2025): GenAI Innovation Center — roadmap, governance, 4-party coalition',
    'AstraZeneca (Jul 2025): Directly with ED — adoption playbooks for medical/clinical',
    'Senior Manager, 3 promotions in 5 years. 12 pharma companies.',
  ],
  WHYLEAVE: [
    'KEY: "Depth over breadth — running one pharma\'s full agenda inside CxO function = different craft"',
    'PULL not PUSH. Indegene = formative (3 promotions). Never disparage.',
    'Astellas TO = internal consulting with rigour. GCC engagement = rare role.',
    'Personal: building 3rd GCC alongside someone who\'s done it twice = learning multiplier',
  ],
  PHARMACHECK: [
    'KEY: Frame as VALUE FOR PATIENTS — "XTANDI cliff = bridge to next wave of patient value"',
    'XTANDI ~48% revenue, LOE Aug 2027. PADCEV bright spot ¥210B. IZERVAY/VEOZAH rebuilding.',
    'SMT ¥150B savings. April 2025 reorg: Value Creation / Delivery / Enablement.',
    'CSP2026 launches late May — first execution wave.',
  ],
  VALUES: [
    'KEY: Integrity, Innovation, Impact + 5 Behaviors (Courage, Urgency, One Astellas, Outcome Focus, Accountability)',
    '"Excellence" → "Impact" because perfectionism slows progress. Patient Focus = VISION layer.',
    'Change Makers Council = exactly this muscle — values through behaviour not mandate',
    '"Engaging hearts and minds — you can\'t mandate culture, you have to make people want to live it"',
  ],
  TOMANDATE: [
    'TO = real internal consulting. Managing Principal → Principal → Lead Consultant → Sr Consultant → Consultant',
    'Chapters: Change Mgmt, Process Excellence, Agile. Delivery via Stream/Crew/Pod.',
    'CxO-embedded. Lead Consultant leads workstreams within CxO function.',
    'Change Communication = top gap — this role fills a diagnosed deficit.',
  ],
  ONEASTELLAS: [
    'KEY: "Centers of excellence, not islands of excellence" (Mukta\'s own framing)',
    'NOT uniform — coherent core + configurable site identity. 3 maturity curves ≠ same messaging.',
    'Federated: each GCC MD owns narrative, shared spine of tone + hashtags',
    'Success = leaders repeating narrative in own words, unprompted. Communications layer IS the integrating mechanism.',
  ],
  BUDGET: [
    'BSV: $25K AWS savings + $32,645 negotiated + 40% margin maintained. Monthly COO cadence.',
    'Amgen: multi-million USD ops, FTE→asset-based pricing transformation',
    'KEY: "Financial discipline is embedded in how I operate programs — not a separate skill"',
  ],
  GAPS: [
    'GAP 1 (never inside pharma): "Breadth most internal candidates don\'t have. What I\'d learn from you: inside-out craft."',
    'GAP 2 (multi-client not one org): "Multi-geo, multi-stakeholder across 5+ portfolios. Muscle is built."',
    'GAP 3 (5 yrs not 8): "Ten-year arc. Field years = underrated input — customer-empathy problem."',
    'POSTURE: Name it, reframe it, show how you\'d close it. Never pretend gaps don\'t exist.',
  ],
  SANOFI: [
    'KEY: Field reps saw digital as COMPETITIVE — reframed as AMPLIFICATION of relationships',
    '10K HCPs, 47% connected call rate, 7.33% SMS, call duration +20.68%',
    'Coalition: brand managers + field force leadership + digital ops + analytics. Project RENEWED.',
    'ASTELLAS TIE: "Same logic as patient-axis model — organising around customer, not function"',
  ],
  BSV: [
    'KEY: Monthly with COO + DT Head. Lead with decision → data → recommendation.',
    '70% SOW not started → MAU grew 75%, $25K savings, $32K negotiated, Year 2 renewed',
    'Built evaluation framework WITH procurement → changed the conversation',
    'Cross-functional: tech, medical, design, finance, legal. Trust earned through consistency.',
  ],
  ASKME: [
    'BEST: "You\'ve built 3 GCCs. What did you learn in your first build that you applied differently — and what\'s different at Astellas?"',
    '"As India GCC moves set-up → scale, what signals tell you it\'s seen as capability hub?"',
    '"Tri-site agenda — biggest risk: narrative, cadence, engagement, or global perception?"',
    'RULE: Ask 2-3 max. End strong with BEST question. Position as someone who LEARNS from leaders.',
  ],
  FOLLOWUP: [
    '"What differently?" → BSV: CR framework week 1. GenAI: workflow redesign earlier.',
    '"How measure?" → Adoption metrics not output. "Empathy" in perf reviews. ~90% OKR login.',
    '"Reportee struggle?" → Vrinda = confidence in demos, dry-runs every Tuesday for 2 months.',
    '"Sounds textbook" → "Designed from listening sessions, not framework." "I don\'t know" = allowed.',
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
