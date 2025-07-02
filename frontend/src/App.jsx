import React from 'react';
import CodeEditor from './CodeEditor';

const App = () => {
  const styles = {
    container: {
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#0d1117',
      color: '#fff',
      fontFamily: 'Arial, sans-serif',
    },
    header: {
      padding: '10px 20px',
      fontSize: '24px',
      fontWeight: 'bold',
      backgroundColor: '#161b22',
      borderBottom: '1px solid #30363d',
    },
    editorWrapper: {
      flex: 1,
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>⚡ Live Code Lab</div>
      <div style={styles.editorWrapper}>
        <CodeEditor roomId="room123" />
      </div>
    </div>
  );
};

export default App;
