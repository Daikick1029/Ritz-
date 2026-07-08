import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import axios from 'axios';

interface ChatMessage {
  userId: string;
  username: string;
  message: string;
  timestamp: Date;
  role: 'hider' | 'admin';
}

interface OniPageProps {
  token: string;
  onLogout: () => void;
}

interface Participant {
  id: string;
  name: string;
  joinedAt: Date;
}

const OniPage: React.FC<OniPageProps> = ({ token, onLogout }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [capturedCount, setCapturedCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Socket.io接続
  useEffect(() => {
    const newSocket = io('http://localhost:5000', {
      auth: { token },
    });

    newSocket.on('connect', () => {
      console.log('Socket接続成功');
      newSocket.emit('authenticate', token);
    });

    newSocket.on('auth_success', (data) => {
      console.log('認証成功:', data);
    });

    newSocket.on('receive_message', (message: ChatMessage) => {
      setMessages((prev) => [...prev, message]);
    });

    newSocket.on('participant_captured_broadcast', (data) => {
      console.log('参加者が捕捉されました:', data.participantId);
      setCapturedCount((prev) => prev + 1);
      setMessages((prev) => [
        ...prev,
        {
          userId: 'system',
          username: 'システム',
          message: `参加者が捕捉されました`,
          timestamp: new Date(data.timestamp),
          role: 'admin',
        },
      ]);
    });

    newSocket.on('error', (error) => {
      console.error('Socket エラー:', error);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [token]);

  // メッセージスクロール
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 参加者一覧取得
  useEffect(() => {
    const fetchParticipants = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/game/participants', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setParticipants(response.data);
      } catch (error) {
        console.error('参加者取得エラー:', error);
      }
    };

    fetchParticipants();
    const interval = setInterval(fetchParticipants, 3000);

    return () => clearInterval(interval);
  }, [token]);

  // メッセージ送信
  const handleSendMessage = () => {
    if (!newMessage.trim() || !socket) return;

    socket.emit('send_message', newMessage);
    setNewMessage('');
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>鬼ページ</h1>
        <button onClick={onLogout} style={styles.logoutBtn}>
          ログアウト
        </button>
      </div>

      <div style={styles.mainContent}>
        {/* 左: 参加者情報 */}
        <div style={styles.section}>
          <h2>参加者情報</h2>

          <div style={styles.stats}>
            <div style={styles.statBox}>
              <h3>参加者数</h3>
              <p style={styles.statNumber}>{participants.length}</p>
            </div>
            <div style={styles.statBox}>
              <h3>捕捉数</h3>
              <p style={styles.statNumber}>{capturedCount}</p>
            </div>
            <div style={styles.statBox}>
              <h3>残り</h3>
              <p style={styles.statNumber}>{participants.length - capturedCount}</p>
            </div>
          </div>

          <h3>参加者一覧</h3>
          <div style={styles.participantList}>
            {participants.map((participant) => (
              <div key={participant.id} style={styles.participantItem}>
                <span>{participant.name}</span>
                <small>{new Date(participant.joinedAt).toLocaleTimeString()}</small>
              </div>
            ))}
          </div>
        </div>

        {/* 右: メッセージ */}
        <div style={styles.section}>
          <h2>メッセージ</h2>
          <div style={styles.chatBox}>
            {messages.length === 0 ? (
              <p style={styles.emptyMessage}>メッセージはまだありません</p>
            ) : (
              messages.map((msg, idx) => (
                <div
                  key={idx}
                  style={{
                    ...styles.message,
                    backgroundColor: msg.role === 'admin' ? '#e3f2fd' : '#f5f5f5',
                  }}
                >
                  <strong>{msg.username}:</strong> {msg.message}
                  <small style={styles.timestamp}>
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </small>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <div style={styles.messageForm}>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="メッセージを入力..."
              style={styles.messageInput}
            />
            <button onClick={handleSendMessage} style={styles.sendBtn}>
              送信
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    height: '100vh',
    backgroundColor: '#f5f5f5',
  } as React.CSSProperties,
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
  } as React.CSSProperties,
  logoutBtn: {
    padding: '10px 20px',
    backgroundColor: '#f44336',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  } as React.CSSProperties,
  mainContent: {
    display: 'flex',
    gap: '20px',
    height: 'calc(100% - 80px)',
  } as React.CSSProperties,
  section: {
    flex: 1,
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    overflowY: 'auto',
  } as React.CSSProperties,
  stats: {
    display: 'flex',
    gap: '15px',
    marginBottom: '20px',
  } as React.CSSProperties,
  statBox: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: '15px',
    borderRadius: '4px',
    textAlign: 'center',
  } as React.CSSProperties,
  statNumber: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#2196f3',
    margin: '10px 0 0 0',
  } as React.CSSProperties,
  participantList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  } as React.CSSProperties,
  participantItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px',
    backgroundColor: '#f9f9f9',
    borderRadius: '4px',
    border: '1px solid #eee',
    fontSize: '14px',
  } as React.CSSProperties,
  chatBox: {
    border: '1px solid #ddd',
    borderRadius: '4px',
    padding: '10px',
    maxHeight: '400px',
    overflowY: 'auto',
    marginBottom: '10px',
  } as React.CSSProperties,
  message: {
    padding: '10px',
    marginBottom: '10px',
    borderRadius: '4px',
    fontSize: '14px',
  } as React.CSSProperties,
  timestamp: {
    display: 'block',
    fontSize: '12px',
    color: '#999',
    marginTop: '5px',
  } as React.CSSProperties,
  messageForm: {
    display: 'flex',
    gap: '10px',
  } as React.CSSProperties,
  messageInput: {
    flex: 1,
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
  } as React.CSSProperties,
  sendBtn: {
    padding: '10px 20px',
    backgroundColor: '#2196f3',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  } as React.CSSProperties,
  emptyMessage: {
    textAlign: 'center',
    color: '#999',
  } as React.CSSProperties,
};

export default OniPage;
