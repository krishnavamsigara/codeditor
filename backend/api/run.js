// api/run.js
import axios from 'axios';

const JUDGE0_API = 'https://judge0-ce.p.rapidapi.com';
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;

const languageMap = {
  javascript: 63,
  python: 71,
  c: 50,
  cpp: 54,
  java: 62,
  go: 60,
  php: 68,
  ruby: 72,
  rust: 73,
  typescript: 74,
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  const { code, language } = req.body;
  const language_id = languageMap[language];

  if (!language_id) {
    return res.status(400).json({ error: 'Unsupported language' });
  }

  try {
    const submission = await axios.post(`${JUDGE0_API}/submissions`, {
      source_code: code,
      language_id,
      stdin: ''
    }, {
      headers: {
        'Content-Type': 'application/json',
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
      }
    });

    const token = submission.data.token;

    let result;
    while (true) {
      const status = await axios.get(`${JUDGE0_API}/submissions/${token}`, {
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
        }
      });
      result = status.data;
      if (result.status.id >= 3) break;
      await new Promise(r => setTimeout(r, 1500));
    }

    const output = result.stdout || result.stderr || result.compile_output || 'No output';
    res.json({ output });
  } catch (err) {
    console.error('❌ Judge0 Error:', err.message);
    res.status(500).json({ error: 'Execution failed' });
  }
}
