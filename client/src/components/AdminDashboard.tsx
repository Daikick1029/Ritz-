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

interface AdminDashboardProps {
  token: string;
  onLogout: () => void;
}

interface Participant {
  id: string;
  name: string;
  joinedAt: Date;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ token, onLogout }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newParticipantName, setNewParticipantName] = useState('');
  const [announcementText, setAnnouncementText] = useState('');
  const [sessionStatus, setSessionStatus] = useState('waiting');
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
      setMessages((prev) => [
        ...prev,
        {
          userId: 'system',
          username: 'システム',
          message: announcement.content,
          timestamp: new Date(announcement.timestamp),
          role: 'admin',
        },
      ]);
    });

    newSocket.on('participant_captured_broadcast', (data) => {
      console.log('参加者が捕捉されました:', data.participantId);
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
  }, [token]);

  // 参加者追加
  const handleAddParticipant = async () => {
    if (!newParticipantName.trim()) return;

    try {
      const response = await axios.post(
        'http://localhost:5000/api/game/participants',
        { name: newParticipantName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setParticipants((prev) => [...prev, response.data]);
      setNewParticipantName('');
    } catch (error) {
      console.error('参加者追加エラー:', error);
    }
  };

  // 参加者削除
  const handleRemoveParticipant = async (id: string) => {
    try {
      await axios.delete(`http://localhost:5000/api/game/participants/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setParticipants((prev) => prev.filter((p) => p.id !== id));
    } catch (error) {
      console.error('参加者削除エラー:', error);
    }
  };

  // 一斉連絡送信
  const handleBroadcast = () => {
    if (!announcementText.trim() || !socket) return;

    socket.emit('broadcast_announcement', announcementText);
    setAnnouncementText('');
  };

  // 参加者捕捉
  const handleCaptureParticipant = (participantId: string) => {
    if (!socket) return;
    socket.emit('participant_captured', participantId);
  };

  // セッション開始
  const handleStartSession = async () => {
    try {
      await axios.post(
        'http://localhost:5000/api/game/session/start',
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSessionStatus('playing');
    } catch (error) {
      console.error('セッション開始エラー:', error);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>運営ダッシュボード</h1>
        <button onClick={onLogout} style={styles.logoutBtn}>
          ログアウト
        </button>
      </div>

      <div style={styles.mainContent}>
        {/* 左: 参加者管理 */}
        <div style={styles.section}>
          <h2>参加者管理</h2>

          <div style={styles.addParticipantForm}>
            <input
              type="text"
              value={newParticipantName}
              onChange={(e) => setNewParticipantName(e.target.value)}
              placeholder="参加者の名前を入力"
              style={styles.input}
            />
            <button onClick={handleAddParticipant} style={styles.addBtn}>
              追加
            </button>
          </div>

          <div style={styles.sessionControl}>
            <p>セッション状態: <strong>{sessionStatus}</strong></p>
            <button onClick={handleStartSession} style={styles.startBtn}>
              セッション開始
            </button>
          </div>

          <h3>参加者一覧 ({participants.length})</h3>
          <div style={styles.participantList}>
            {participants.map((participant) => (
              <div key={participant.id} style={styles.participantItem}>
                <span>{participant.name}</span>
                <div>
                  <button
                    onClick={() => handleCaptureParticipant(participant.id)}
                    style={styles.captureBtn}
                  >
                    捕捉
                  </button>
                  <button
                    onClick={() => handleRemoveParticipant(participant.id)}
                    style={styles.removeBtn}
                  >
                    削除
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 右: チャット & 一斉連絡 */}
        <div style={styles.section}>
          <h2>一斉連絡</h2>
          <div style={styles.announcementForm}>
            <textarea
              value={announcementText}
              onChange={(e) => setAnnouncementText(e.target.value)}
              placeholder="一斉連絡内容を入力"
              style={styles.textarea}
            />
            <button onClick={handleBroadcast} style={styles.broadcastBtn}>
              全員に送信
            </button>
          </div>

          <h2>メッセージ</h2>
          <div style={styles.chatBox}>
            {messages.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  ...styles.message,
                  backgroundColor: msg.role === 'admin' ? '#e3f2fd' : '#f5f5f5',
                }}
              >
                <strong>{msg.username}:</strong> {msg.message}
              </div>
            ))}
            <div ref={messagesEndRef} />
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
  addParticipantForm: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
  } as React.CSSProperties,
  input: {
    flex: 1,
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
  } as React.CSSProperties,
  addBtn: {
    padding: '10px 20px',
    backgroundColor: '#4caf50',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  } as React.CSSProperties,
  sessionControl: {
    marginBottom: '20px',
    padding: '15px',
    backgroundColor: '#fff3cd',
    borderRadius: '4px',
  } as React.CSSProperties,
  startBtn: {
    padding: '10px 20px',
    backgroundColor: '#2196f3',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
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
  } as React.CSSProperties,
  captureBtn: {
    padding: '5px 10px',
    marginRight: '5px',
    backgroundColor: '#ff9800',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  } as React.CSSProperties,
  removeBtn: {
    padding: '5px 10px',
    backgroundColor: '#f44336',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  } as React.CSSProperties,
  announcementForm: {
    marginBottom: '20px',
  } as React.CSSProperties,
  textarea: {
    width: '100%',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    marginBottom: '10px',
    minHeight: '100px',
    fontFamily: 'Arial, sans-serif',
  } as React.CSSProperties,
  broadcastBtn: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#2196f3',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold',
  } as React.CSSProperties,
  chatBox: {
    border: '1px solid #ddd',
    borderRadius: '4px',
    padding: '10px',
    maxHeight: '300px',
    overflowY: 'auto',
  } as React.CSSProperties,
  message: {
    padding: '10px',
    marginBottom: '10px',
    borderRadius: '4px',
    fontSize: '14px',
  } as React.CSSProperties,
};

export default AdminDashboard;
