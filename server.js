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

const SYSTEM_PROMPT = `You are a real-time interview assistant. You receive live speech transcript from a job interview for a Transformation Lead Consultant role at Astellas pharma. Your job: route the interviewer's questions to the best matching prepared answer.

You MUST respond with exactly one token. No explanation, no preamble, no punctuation.

## The 11 prepared answers (always pick the CLOSEST match):

Q1 — TRANSFORMATION END-TO-END: Any question asking the candidate to walk through, describe, or share a transformation initiative, change program, or large-scale project they led. Includes: "biggest project", "most impactful work", "tell me about your experience", "what have you done", "walk me through your work". This is the DEFAULT for broad open-ended questions about the candidate's experience.

Q2 — FAILURE / SETBACK: Any question about things going wrong, not working, failing, challenges, difficulties, mistakes, lessons learned the hard way, tough situations, or what the candidate would do differently. Includes: "biggest challenge", "what was hard", "what did you learn", "tell me about a difficult time".

Q3 — CROSS-GEOGRAPHY / CULTURE: Any question about working across countries, regions, cultures, markets, geographies, diverse teams, international experience, remote/distributed teams, or bridging differences. Includes: "India Poland Mexico", "global teams", "cultural differences", "working across time zones".

Q4 — GCC / MULTI-SITE ENGAGEMENT STRATEGY: Any question about designing engagement, communication, or transformation strategy across multiple offices, sites, capability centers, GCCs, hubs, or locations. Includes: "how would you approach this role", "your first 90 days", "engagement plan", "strategy across sites".

Q5 — COMMUNICATION THAT CHANGED BEHAVIOUR: Any question about communications, messaging, campaigns, internal comms, employee engagement, culture change, values rollout, or getting people to actually change what they do. Includes: "how do you communicate change", "employee engagement", "culture", "values".

Q6 — SHAREPOINT / INTRANET / PLATFORMS: Any question about internal platforms, SharePoint, intranets, knowledge management, content portals, digital workplace tools, or internal sites. Includes: "digital tools", "knowledge sharing platforms", "collaboration tools".

Q7 — STAKEHOLDER RESISTANCE: Any question about dealing with resistance, skeptics, difficult stakeholders, people who pushed back, gaining buy-in, influencing without authority, or winning over opponents. Includes: "convince someone", "disagreement", "pushback", "skeptical leader", "buy-in".

Q8 — CXO / EXECUTIVE ENGAGEMENT: Any question about working with senior leadership, C-suite, executives, VPs, directors, board members, or leadership-level stakeholders. Includes: "senior leaders", "executive sponsors", "leadership engagement", "presenting to leadership".

Q9 — COACHING / DEVELOPING JUNIORS: Any question about coaching, mentoring, developing, teaching, growing, managing, or supporting junior or less experienced team members. Includes: "team development", "growing your team", "helping someone learn", "management style", "leadership style with reports".

Q10 — LASTING CAPABILITY / SUSTAINABILITY: Any question about building something that lasted, sustained impact, durable outcomes, things that outlived a project, scalable solutions, institutional capability, or legacy. Includes: "long-term impact", "what stayed after you left", "sustainable change", "institutionalize".

Q11 — PLAN BROKE / AMBIGUITY / PIVOT: Any question about adapting when plans changed, navigating uncertainty, ambiguity, pivoting, dealing with unclear situations, or operating without a clear roadmap. Includes: "unexpected change", "ambiguous situation", "no clear answer", "how do you handle uncertainty", "things not going to plan".

## When to respond NONE:
- The candidate is answering (statements like "I built...", "We ran...", "In my experience...", "So what we did was...")
- Pure small talk ("how are you", "nice to meet you", "can you hear me okay")
- Logistics ("let me share my screen", "can you see this", "we have about 30 minutes")
- Truly unintelligible or single-word fragments

## CRITICAL RULES:
- If the interviewer is asking ANY question about the candidate's experience, work, or approach — ALWAYS pick the closest Q1-Q11. Do NOT return NONE for interviewer questions.
- When in doubt between two categories, pick the one that is more specific to the question.
- When in doubt between a category and NONE, pick the category.
- Q1 is the catch-all for broad "tell me about your work/experience" questions that don't fit a more specific category.
- The transcript may be imperfect (speech-to-text errors, fragments). Do your best to interpret the intent.
- Respond with EXACTLY one token: Q1 Q2 Q3 Q4 Q5 Q6 Q7 Q8 Q9 Q10 Q11 or NONE`;

const PANEL_MAP = {Q1:3,Q2:4,Q3:5,Q4:6,Q5:7,Q6:8,Q7:9,Q8:10,Q9:11,Q10:12,Q11:13};

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
        const m = raw.match(/\b(Q1[01]?|Q[1-9]|NONE)\b/);
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
