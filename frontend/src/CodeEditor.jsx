import { useEffect, useState, useRef } from 'react';
import Editor from '@monaco-editor/react';
import axios from 'axios';
import io from 'socket.io-client';

const baseURL = import.meta.env.VITE_API_URL;


const socket = io(baseURL, {
  transports: ['websocket'],
  autoConnect: true,
});

export default function CodeEditor({ roomId = 'room1' }) {
  const [code, setCode] = useState('// Start coding');
  const [output, setOutput] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [fontSize, setFontSize] = useState(16);
  const preventEmit = useRef(false);

  useEffect(() => {
    socket.emit('join-room', { roomId });

    socket.on('sync', ({ code, language }) => {
      setCode(code);
      setLanguage(language);
    });

    socket.on('code-change', (newCode) => {
      preventEmit.current = true;
      setCode(newCode);
    });

    socket.on('language-change', (newLang) => {
      setLanguage(newLang);
    });

    socket.on('output-change', (newOutput) => {
      setOutput(newOutput);
    });

    return () => {
      socket.off('sync');
      socket.off('code-change');
      socket.off('language-change');
      socket.off('output-change');
    };
  }, [roomId]);

  const handleChange = (newCode) => {
    if (preventEmit.current) {
      preventEmit.current = false;
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

  const handleFontSizeChange = (e) => {
    setFontSize(parseInt(e.target.value));
  };

  const handleRun = async () => {
    try {
      const res = await axios.post(`${baseURL}/run`, { code, language });
      const out = res.data.output;
      setOutput(out);
      socket.emit('output-change', { roomId, output: out });
    } catch (err) {
      const errMsg = 'Error running code';
      setOutput(errMsg);
      socket.emit('output-change', { roomId, output: errMsg });
    }
  };

  // 👇 Styles
  const styles = {
    editorContainer: {
      display: 'flex',
      height: '100vh',
      overflow: 'hidden',
    },
    editorLeft: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#1e1e1e',
    },
    toolbar: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '10px',
      background: '#2e2e2e',
    },
    editorWrapper: {
      flex: 1,
    },
    editorRight: {
      width: '30%',
      background: '#121212',
      color: 'white',
      padding: '10px',
      overflowY: 'auto',
    },
    select: {
      padding: '5px',
      backgroundColor: '#1e1e1e',
      color: 'white',
      border: '1px solid #444',
      borderRadius: '4px',
    },
    button: {
      padding: '6px 12px',
      backgroundColor: '#4CAF50',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
    }
  };

  return (
    <div style={styles.editorContainer}>
      <div style={styles.editorLeft}>
        <div style={styles.toolbar}>
          <select style={styles.select} value={language} onChange={handleLangChange}>
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="cpp">C++</option>
            <option value="java">Java</option>
            <option value="c">C</option>
          </select>

          <select style={styles.select} value={fontSize} onChange={handleFontSizeChange}>
            {[12, 14, 16, 18, 20, 24, 28].map((size) => (
              <option key={size} value={size}>{size}px</option>
            ))}
          </select>

          <button style={styles.button} onClick={handleRun}>Run</button>
        </div>

        <div style={styles.editorWrapper}>
          <Editor
            defaultLanguage={language}
            language={language}
            value={code}
            onChange={handleChange}
            theme="vs-dark"
            options={{
              fontSize,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              wordWrap: 'on',
            }}
          />
        </div>
      </div>

      <div style={styles.editorRight}>
        <h3>Output:</h3>
        <pre>{output || 'No output yet'}</pre>
      </div>
    </div>
  );
}
