import React from 'react';

const TestComponent = () => {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      backgroundColor: '#282c34',
      color: 'white',
      fontSize: '2rem',
      fontFamily: 'Arial, sans-serif',
      textAlign: 'center',
      padding: '20px'
    }}>
      <div>
        <h1>Test Component</h1>
        <p>If you can see this, React is working correctly!</p>
      </div>
    </div>
  );
};

export default TestComponent;
