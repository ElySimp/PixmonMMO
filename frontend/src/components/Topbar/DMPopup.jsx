import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';

const DMPopup = ({ friend, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [msg, setMsg] = useState('');
  const popupRef = useRef(null);

  useEffect(() => {
    const popup = window.open(
      '',
      `DM_${friend.name}`,
      'width=400,height=500,left=200,top=200,resizable,scrollbars'
    );
    popup.document.title = `Chat with ${friend.name}`;
    const container = popup.document.createElement('div');
    popup.document.body.appendChild(container);
    popupRef.current = popup;

    const cleanup = () => {
      popup.close();
    };
    popup.onbeforeunload = cleanup;
    return cleanup;
  }, [friend]);

  useEffect(() => {
    if (!popupRef.current) return;
    const popup = popupRef.current;
    ReactDOM.render(
      <div style={{
        background: '#18191a', color: '#fff', minHeight: '100vh', fontFamily: 'sans-serif', padding: 0, margin: 0
      }}>
        <div style={{ background: '#232323', padding: '1rem', fontWeight: 'bold' }}>
          Chat with {friend.name}
          <button style={{ float: 'right', background: 'none', color: '#fff', border: 'none', fontSize: 20, cursor: 'pointer' }} onClick={onClose}>×</button>
        </div>
        <div style={{
          minHeight: 200, maxHeight: 300, overflowY: 'auto', background: '#232323',
          margin: '1rem', borderRadius: 8, padding: '1rem'
        }}>
          {messages.length === 0 && <div style={{ color: '#aaa' }}>No messages yet.</div>}
          {messages.map((m, i) => (
            <div key={i} style={{
              marginBottom: 8, padding: '0.5rem 1rem', borderRadius: 12,
              background: m.from === 'me' ? '#0275D8' : '#333', color: '#fff', maxWidth: '70%', alignSelf: m.from === 'me' ? 'flex-end' : 'flex-start'
            }}>{m.text}</div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, margin: '1rem' }}>
          <input
            style={{
              flex: 1, padding: '0.5rem 1rem', borderRadius: 6, border: '1px solid #232323',
              background: '#222', color: '#fff', fontSize: 16
            }}
            value={msg}
            onChange={e => setMsg(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') sendMsg(); }}
            placeholder="Type a message..."
          />
          <button
            style={{
              background: 'linear-gradient(45deg, #0275D8, #0056b3)', color: '#fff',
              border: 'none', borderRadius: 6, padding: '0.5rem 1.2rem', fontSize: 16, fontWeight: 'bold', cursor: 'pointer'
            }}
            onClick={() => sendMsg()}
          >Send</button>
        </div>
      </div>,
      popupRef.current.document.body
    );

    function sendMsg() {
      if (msg.trim() === '') return;
      setMessages([...messages, { from: 'me', text: msg }]);
      setMsg('');
    }
    // eslint-disable-next-line
  }, [messages, msg, friend, onClose]);

  return null;
};

export default DMPopup;