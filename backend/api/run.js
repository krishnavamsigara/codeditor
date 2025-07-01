// /api/run.js
import axios from 'axios';

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

const JUDGE0_API = 'https://judge0-ce.p.rapidapi.com';

export default async function handler(req, res) {
  const { code, language } = req.body;
  const langId = languageMap[language];
  if (!langId) return res.status(400).json({ error: 'Unsupported language' });

  try {
    const submission = await axios.post(`${JUDGE0_API}/submissions`, {
      source_code: code,
      language_id: langId,
      stdin: ''
    }, {
      headers: {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
        'Content-Type': 'application/json'
      }
    });

    const token = submission.data.token;

    let result;
    while (true) {
      const status = await axios.get(`${JUDGE0_API}/submissions/${token}`, {
        headers: {
          'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
        }
      });

      result = status.data;
      if (result.status.id >= 3) break;
      await new Promise(r => setTimeout(r, 1500));
    }

    const output = result.stdout || result.stderr || result.compile_output || 'No output';
    res.json({ output });

  } catch (error) {
    console.error('Judge0 error:', error);
    res.status(500).json({ error: 'Execution error' });
  }
}
