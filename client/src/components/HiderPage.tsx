import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface ChatMessage {
  userId: string;
  username: string;
  message: string;
  timestamp: Date;
  role: 'hider' | 'admin';
}

interface HiderPageProps {
  token: string;
  onLogout: () => void;
}

const HiderPage: React.FC<HiderPageProps> = ({ token, onLogout }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [announcements, setAnnouncements] = useState<string[]>([]);
  const [capturedStatus, setCapturedStatus] = useState(false);
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

    newSocket.on('announcement', (announcement) => {
      console.log('一斉連絡:', announcement);
      setAnnouncements((prev) => [...prev, announcement.content]);
      setMessages((prev) => [
        ...prev,
        {
          userId: 'system',
          username: '運営',
          message: announcement.content,
          timestamp: new Date(announcement.timestamp),
          role: 'admin',
        },
      ]);
    });

    newSocket.on('participant_captured_broadcast', (data) => {
      console.log('誰かが捕捉されました');
      setCapturedStatus(true);
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

  // メッセージ送信
  const handleSendMessage = () => {
    if (!newMessage.trim() || !socket) return;

    socket.emit('send_message', newMessage);
    setNewMessage('');
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>隠れる側ページ</h1>
        <button onClick={onLogout} style={styles.logoutBtn}>
          ログアウト
        </button>
      </div>

      <div style={styles.mainContent}>
        {/* 運営からのお知らせ */}
        <div style={styles.announcementSection}>
          <h2>運営からのお知らせ</h2>
          <div style={styles.announcementBox}>
            {announcements.length === 0 ? (
              <p style={styles.emptyMessage}>お知らせはまだありません</p>
            ) : (
              announcements.map((announcement, idx) => (
                <div key={idx} style={styles.announcementItem}>
                  📢 {announcement}
                </div>
              ))
            )}
          </div>
        </div>

        {/* ステータス表示 */}
        <div style={styles.statusSection}>
          <h2>ステータス</h2>
          <div
            style={{
              ...styles.statusBox,
              backgroundColor: capturedStatus ? '#ffebee' : '#e8f5e9',
            }}
          >
            {capturedStatus ? (
              <>
                <p style={{ color: '#c62828', fontSize: '18px', fontWeight: 'bold' }}>
                  ❌ 捕捉されました！
                </p>
                <p>ゲームを見守りましょう</p>
              </>
            ) : (
              <>
                <p style={{ color: '#2e7d32', fontSize: '18px', fontWeight: 'bold' }}>
                  ✅ 隠れている！
                </p>
                <p>チャットで隠れ仲間と交流しましょう</p>
              </>
            )}
          </div>
        </div>

        {/* チャット */}
        <div style={styles.chatSection}>
          <h2>隠れる側チャット</h2>
          <div style={styles.chatBox}>
            {messages.length === 0 ? (
              <p style={styles.emptyMessage}>メッセージはまだありません</p>
            ) : (
              messages.map((msg, idx) => (
                <div
                  key={idx}
                  style={{
                    ...styles.message,
                    backgroundColor: msg.role === 'admin' ? '#fff3cd' : '#f0f0f0',
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
              disabled={capturedStatus}
            />
            <button
              onClick={handleSendMessage}
              style={styles.sendBtn}
              disabled={capturedStatus}
            >
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
    flexDirection: 'column',
    gap: '20px',
    height: 'calc(100% - 80px)',
  } as React.CSSProperties,
  announcementSection: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
  } as React.CSSProperties,
  announcementBox: {
    maxHeight: '150px',
    overflowY: 'auto',
    padding: '10px',
    backgroundColor: '#fff9c4',
    borderRadius: '4px',
  } as React.CSSProperties,
  announcementItem: {
    padding: '10px',
    marginBottom: '5px',
    backgroundColor: 'white',
    borderRadius: '4px',
    fontSize: '14px',
  } as React.CSSProperties,
  statusSection: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
  } as React.CSSProperties,
  statusBox: {
    padding: '20px',
    borderRadius: '4px',
    textAlign: 'center',
  } as React.CSSProperties,
  chatSection: {
    flex: 1,
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
  } as React.CSSProperties,
  chatBox: {
    flex: 1,
    border: '1px solid #ddd',
    borderRadius: '4px',
    padding: '10px',
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

export default HiderPage;
