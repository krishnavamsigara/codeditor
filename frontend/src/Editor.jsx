import React, { useEffect, useState, useRef } from 'react';
import Editor from '@monaco-editor/react';
import io from 'socket.io-client';
import axios from 'axios';
import './codeEditor.css';

const socket = io('https://codeditor-backend.vercel.app/ ');

export default function CodeEditor({ roomId = 'room1' }) {
  const [code, setCode] = useState('// Start coding');
  const [output, setOutput] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [fontSize, setFontSize] = useState(14);
  const ignoreNext = useRef(false);

  useEffect(() => {
    socket.emit('join-room', { roomId });

    socket.on('sync', ({ code, language }) => {
      setCode(code);
      setLanguage(language);
    });

    socket.on('code-change', (newCode) => {
      ignoreNext.current = true;
      setCode(newCode);
    });

    socket.on('language-change', (newLang) => {
      setLanguage(newLang);
    });

    socket.on('execution-result', (result) => {
      setOutput(result);
    });

    return () => {
      socket.off('sync');
      socket.off('code-change');
      socket.off('language-change');
      socket.off('execution-result');
    };
  }, [roomId]);

  const handleChange = (newCode) => {
    if (ignoreNext.current) {
      ignoreNext.current = false;
      return;
    }
    setCode(newCode);
    socket.emit('code-change', { roomId, code: newCode });
  };

  const handleLangChange = (e) => {
    const lang = e.target.value;
    setLanguage(lang);
    socket.emit('language-change', { roomId, language: lang });
  };

  const handleRun = async () => {
    try {
      const res = await axios.post('https://codeditor-backend.vercel.app/run', {
        code,
        language,
        roomId
      });
      setOutput(res.data.output);
    } catch (err) {
      setOutput('Error running code');
    }
  };

  return (
    <div className="main-container">
      <div className="editor-section">
        <div className="controls">
          <div className="control-group">
            <label>Language:</label>
            <select value={language} onChange={handleLangChange}>
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="cpp">C++</option>
              <option value="java">Java</option>
              <option value="c">C</option>
              <option value="go">Go</option>
              <option value="php">PHP</option>
              <option value="ruby">Ruby</option>
              <option value="rust">Rust</option>
              <option value="typescript">TypeScript</option>
            </select>
          </div>

          <div className="control-group">
            <label>Font Size:</label>
            <select value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))}>
              <option value={12}>12</option>
              <option value={14}>14</option>
              <option value={16}>16</option>
              <option value={18}>18</option>
              <option value={20}>20</option>
            </select>
          </div>

          <button onClick={handleRun}>Run</button>
        </div>

        <Editor
          height="80vh"
          defaultLanguage={language}
          language={language}
          value={code}
          onChange={handleChange}
          theme="vs-dark"
          options={{
            fontSize: fontSize,
            minimap: { enabled: false },
          }}
        />
      </div>

      <div className="output-section">
        <h3>Output</h3>
        <pre>{output}</pre>
      </div>
    </div>
  );
}
