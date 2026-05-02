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

const SYSTEM_PROMPT = `You classify interview questions into one of 11 categories. You will receive a transcript snippet from a live job interview. Determine which prepared question (Q1-Q11) the interviewer is asking about BY MEANING, not keywords.

The categories:
Q1: End-to-end transformation led by the candidate, the messy middle of execution
Q2: A transformation that failed or didn't go as planned, setbacks, mistakes, recovery
Q3: Cross-geography or cross-cultural leadership, working across countries/markets/regions
Q4: Designing engagement strategy across multiple GCCs/capability centers/sites
Q5: Communication strategy that actually shifted behaviour or culture change
Q6: SharePoint, intranet, internal platforms, content sites — what makes them work or die
Q7: Senior stakeholder who resisted, was skeptical, or pushed back — and how they were won over
Q8: CxO-level, executive-level, board-level stakeholder engagement or work
Q9: Coaching, mentoring, or developing junior team members or direct reports
Q10: A capability, system, or practice the candidate built that outlived the specific project
Q11: A moment when the plan broke, pivoted, or the candidate had to navigate ambiguity

Rules:
- Respond with EXACTLY one token: Q1 Q2 Q3 Q4 Q5 Q6 Q7 Q8 Q9 Q10 Q11 or NONE
- No explanation, no preamble, no punctuation — just the label
- Respond NONE if the transcript is the candidate answering (not asking), is small talk, or doesn't match any category
- Respond NONE if it's unclear or too ambiguous
- Classify by MEANING and INTENT, not by surface keywords
- A single word is never enough — you need a question or prompt from the interviewer`;

const PANEL_MAP = {Q1:3,Q2:4,Q3:5,Q4:6,Q5:7,Q6:8,Q7:9,Q8:10,Q9:11,Q10:12,Q11:13};

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
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ panel, label }));
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
