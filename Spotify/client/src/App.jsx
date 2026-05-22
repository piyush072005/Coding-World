import { useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { GoogleLogin } from '@react-oauth/google';
import {
  Disc3,
  Forward,
  Home,
  Pause,
  Play,
  Search,
  SkipBack,
  Users,
} from 'lucide-react';
import { tracks } from './tracks';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

function formatTime(totalSeconds) {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) {
    return '0:00';
  }
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, '0');
  return `${minutes}:${seconds}`;
}

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || 'Request failed');
  }
  return payload;
}

function App() {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const [nameInput, setNameInput] = useState('');
  const [idInput, setIdInput] = useState('');
  const [friendIdInput, setFriendIdInput] = useState('');

  const [user, setUser] = useState(null);
  const [friends, setFriends] = useState([]);
  const [statusMessage, setStatusMessage] = useState('');
  const [incomingInvite, setIncomingInvite] = useState(null);
  const [session, setSession] = useState(null);

  const [playerState, setPlayerState] = useState({
    trackIndex: 0,
    currentTime: 0,
    isPlaying: false,
  });

  const audioRef = useRef(null);
  const socketRef = useRef(null);
  const isApplyingRemote = useRef(false);
  const lastTickRef = useRef(0);

  const activeTrack = useMemo(() => tracks[playerState.trackIndex] || tracks[0], [playerState.trackIndex]);

  const isInSession = Boolean(session?.sessionId);

  const syncPatch = (patch) => {
    if (!session?.sessionId || !socketRef.current || isApplyingRemote.current) {
      return;
    }
    socketRef.current.emit('session:update', {
      sessionId: session.sessionId,
      patch,
    });
  };

  const fetchFriends = async (userId) => {
    const payload = await apiRequest(`/api/friends/${userId}`);
    setFriends(payload.friends || []);
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    const credential = credentialResponse?.credential;
    if (!credential) {
      setStatusMessage('Google login did not return a credential.');
      return;
    }

    try {
      const payload = await apiRequest('/api/auth/google', {
        method: 'POST',
        body: JSON.stringify({ credential }),
      });

      setUser(payload.user);
      localStorage.setItem('ustunes.userId', payload.user.id);
      setStatusMessage(
        payload.created
          ? `Welcome ${payload.user.name}. Your new ID is ${payload.user.id}.`
          : `Welcome back ${payload.user.name}.`,
      );
    } catch (error) {
      setStatusMessage(error.message);
    }
  };

  const connectSocket = (userId) => {
    const socket = io(API_BASE, {
      query: { userId },
    });

    socket.on('friends:invite-received', ({ fromUserId, fromName }) => {
      setIncomingInvite({ fromUserId, fromName });
      setStatusMessage(`Invite received from ${fromName}`);
    });

    socket.on('friends:invite-sent', ({ toUserId }) => {
      setStatusMessage(`Invite sent to ${toUserId}`);
    });

    socket.on('friends:list-updated', ({ userId: updatedUserId, friends: nextFriends }) => {
      if (updatedUserId === userId) {
        setFriends(nextFriends || []);
      }
    });

    socket.on('session:started', (payload) => {
      setSession(payload);
      isApplyingRemote.current = true;
      setPlayerState((prev) => ({
        ...prev,
        ...payload.state,
      }));
      setStatusMessage('Listen Together mode started.');
      setTimeout(() => {
        isApplyingRemote.current = false;
      }, 0);
    });

    socket.on('session:remote-update', ({ patch }) => {
      isApplyingRemote.current = true;
      setPlayerState((prev) => ({ ...prev, ...patch }));

      const audio = audioRef.current;
      if (audio && Number.isFinite(patch.currentTime) && Math.abs(audio.currentTime - patch.currentTime) > 1) {
        audio.currentTime = patch.currentTime;
      }
      setTimeout(() => {
        isApplyingRemote.current = false;
      }, 0);
    });

    socket.on('session:ended', ({ reason }) => {
      setSession(null);
      setStatusMessage(reason || 'Session ended.');
    });

    socket.on('error:message', ({ error }) => {
      setStatusMessage(error || 'Socket error');
    });

    socketRef.current = socket;
  };

  useEffect(() => {
    const boot = async () => {
      const savedUserId = localStorage.getItem('ustunes.userId');
      if (!savedUserId) {
        return;
      }
      try {
        const payload = await apiRequest('/api/users/login', {
          method: 'POST',
          body: JSON.stringify({ userId: savedUserId }),
        });
        setUser(payload.user);
      } catch {
        localStorage.removeItem('ustunes.userId');
      }
    };

    boot();
  }, []);

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    fetchFriends(user.id).catch((error) => {
      setStatusMessage(error.message);
    });
    connectSocket(user.id);

    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [user?.id]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    if (playerState.isPlaying) {
      audio.play().catch(() => {
        setStatusMessage('Press play to start audio.');
      });
      return;
    }

    audio.pause();
  }, [playerState.isPlaying, playerState.trackIndex]);

  const handleCreateAccount = async () => {
    try {
      const payload = await apiRequest('/api/users/login', {
        method: 'POST',
        body: JSON.stringify({ name: nameInput }),
      });
      setUser(payload.user);
      localStorage.setItem('ustunes.userId', payload.user.id);
      setStatusMessage(`Welcome ${payload.user.name}. Your ID is ${payload.user.id}.`);
    } catch (error) {
      setStatusMessage(error.message);
    }
  };

  const handleLoginById = async () => {
    try {
      const payload = await apiRequest('/api/users/login', {
        method: 'POST',
        body: JSON.stringify({ userId: idInput }),
      });
      setUser(payload.user);
      localStorage.setItem('ustunes.userId', payload.user.id);
      setStatusMessage(`Welcome back ${payload.user.name}.`);
    } catch (error) {
      setStatusMessage(error.message);
    }
  };

  const handleAddFriend = async () => {
    if (!user?.id) {
      return;
    }
    try {
      await apiRequest('/api/friends/add', {
        method: 'POST',
        body: JSON.stringify({ userId: user.id, friendId: friendIdInput }),
      });
      setFriendIdInput('');
      await fetchFriends(user.id);
      setStatusMessage('Friend added. You can now listen together.');
    } catch (error) {
      setStatusMessage(error.message);
    }
  };

  const handleGoogleError = () => {
    setStatusMessage('Google sign-in was cancelled or failed to load.');
  };

  const handleInvite = (friendId) => {
    socketRef.current?.emit('friends:invite', { toUserId: friendId });
  };

  const handleAcceptInvite = () => {
    if (!incomingInvite) {
      return;
    }
    socketRef.current?.emit('session:accept', { fromUserId: incomingInvite.fromUserId });
    setIncomingInvite(null);
  };

  const handlePlayPause = () => {
    const audio = audioRef.current;
    const nextPlayState = !playerState.isPlaying;
    const patch = {
      trackIndex: playerState.trackIndex,
      isPlaying: nextPlayState,
      currentTime: audio?.currentTime || playerState.currentTime,
    };
    setPlayerState((prev) => ({ ...prev, ...patch }));
    syncPatch(patch);
  };

  const handleSkip = (direction) => {
    const nextTrackIndex = (playerState.trackIndex + direction + tracks.length) % tracks.length;
    const patch = {
      trackIndex: nextTrackIndex,
      currentTime: 0,
      isPlaying: true,
    };
    setPlayerState((prev) => ({ ...prev, ...patch }));
    syncPatch(patch);
  };

  const handleSelectTrack = (trackIndex) => {
    const patch = {
      trackIndex,
      currentTime: 0,
      isPlaying: true,
    };
    setPlayerState((prev) => ({ ...prev, ...patch }));
    syncPatch(patch);
  };

  const handleSeek = (event) => {
    const nextTime = Number(event.target.value);
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = nextTime;
    }
    setPlayerState((prev) => ({ ...prev, currentTime: nextTime }));
    syncPatch({ currentTime: nextTime });
  };

  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    setPlayerState((prev) => ({ ...prev, currentTime: audio.currentTime }));

    if (!isInSession || !playerState.isPlaying || isApplyingRemote.current) {
      return;
    }

    const now = Date.now();
    if (now - lastTickRef.current > 1500) {
      lastTickRef.current = now;
      syncPatch({ currentTime: audio.currentTime, isPlaying: true, trackIndex: playerState.trackIndex });
    }
  };

  const handleAudioEnd = () => {
    handleSkip(1);
  };

  if (!user) {
    return (
      <main className="auth-shell min-h-screen">
        <div className="auth-card">
          <h1 className="auth-title">UsTunes</h1>
          <p className="auth-subtitle">Listen together with one friend in real-time.</p>

          <label className="field-label">Create new profile</label>
          <div className="flex gap-2">
            <input
              className="pill-input"
              placeholder="Your name"
              value={nameInput}
              onChange={(event) => setNameInput(event.target.value)}
            />
            <button className="pill-button pill-button-green" onClick={handleCreateAccount}>
              Create
            </button>
          </div>

          <div className="auth-divider">
            <span>or</span>
          </div>

          <label className="field-label">Continue with Google</label>
          {googleClientId ? (
            <div className="google-login-wrap">
              <GoogleLogin onSuccess={handleGoogleSuccess} onError={handleGoogleError} shape="pill" />
            </div>
          ) : (
            <p className="status-text">Set VITE_GOOGLE_CLIENT_ID to enable Google login.</p>
          )}

          <label className="field-label mt-4">Login with 10-digit ID</label>
          <div className="flex gap-2">
            <input
              className="pill-input"
              placeholder="1234567890"
              maxLength={10}
              value={idInput}
              onChange={(event) => setIdInput(event.target.value.replace(/\D/g, ''))}
            />
            <button className="pill-button" onClick={handleLoginById}>
              Login
            </button>
          </div>

          <p className="status-text mt-4">{statusMessage || 'Create a profile to get your unique 10-digit UsTunes ID.'}</p>
        </div>
      </main>
    );
  }

  return (
    <div className="app-shell">
      <audio
        ref={audioRef}
        src={activeTrack.src}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleAudioEnd}
      />

      <aside className="sidebar">
        <div>
          <h1 className="brand">UsTunes</h1>
          <p className="user-id">ID {user.id}</p>
        </div>

        <nav className="nav-links">
          <button className="nav-pill nav-pill-active">
            <Home size={16} />
            Home
          </button>
          <button className="nav-pill">
            <Search size={16} />
            Search
          </button>
          <button className="nav-pill">
            <Disc3 size={16} />
            Library
          </button>
        </nav>

        <div className="friend-panel">
          <div className="panel-title-row">
            <h2>Friends</h2>
            <Users size={14} />
          </div>

          <div className="flex gap-2 mt-2">
            <input
              className="pill-input"
              placeholder="Add by 10-digit ID"
              maxLength={10}
              value={friendIdInput}
              onChange={(event) => setFriendIdInput(event.target.value.replace(/\D/g, ''))}
            />
            <button className="pill-button" onClick={handleAddFriend}>
              Add
            </button>
          </div>

          <div className="friend-list">
            {friends.length === 0 ? (
              <p className="muted-text">No friends yet.</p>
            ) : (
              friends.map((friend) => (
                <div key={friend.id} className="friend-item">
                  <div>
                    <p className="friend-name">{friend.name}</p>
                    <p className="friend-id">{friend.id}</p>
                  </div>
                  <button className="pill-button pill-button-green" onClick={() => handleInvite(friend.id)}>
                    Invite
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </aside>

      <main className="content">
        <header className="hero-panel">
          <p className="caps-label">Listen Together</p>
          <h2>Two listeners. One queue. Zero lag vibes.</h2>
          <p className="muted-text">
            Invite one friend from your list and both players stay synchronized for play, pause, skip, and seek.
          </p>
          <p className="status-text mt-3">
            {statusMessage || (isInSession ? `Session active: ${session.sessionId}` : 'Ready to start a shared session.')}
          </p>
        </header>

        <section>
          <h3 className="section-title">Featured Queue</h3>
          <div className="track-grid">
            {tracks.map((track, index) => (
              <button
                key={track.id}
                className={`track-card ${index === playerState.trackIndex ? 'track-card-active' : ''}`}
                onClick={() => handleSelectTrack(index)}
              >
                <div className="cover" style={{ backgroundImage: track.coverGradient }}>
                  <span>UT</span>
                </div>
                <p className="track-title">{track.title}</p>
                <p className="track-subtitle">{track.artist}</p>
                <p className="track-duration">{track.durationLabel}</p>
              </button>
            ))}
          </div>
        </section>

        {incomingInvite ? (
          <section className="invite-banner">
            <p>
              <strong>{incomingInvite.fromName}</strong> invited you to Listen Together.
            </p>
            <div className="flex gap-2">
              <button className="pill-button pill-button-green" onClick={handleAcceptInvite}>
                Accept
              </button>
              <button className="pill-button" onClick={() => setIncomingInvite(null)}>
                Dismiss
              </button>
            </div>
          </section>
        ) : null}
      </main>

      <footer className="player-bar">
        <div className="now-playing">
          <div className="cover mini" style={{ backgroundImage: activeTrack.coverGradient }}>
            <span>UT</span>
          </div>
          <div>
            <p className="track-title">{activeTrack.title}</p>
            <p className="track-subtitle">{activeTrack.artist}</p>
          </div>
        </div>

        <div className="player-controls">
          <div className="control-buttons">
            <button className="circle-button" onClick={() => handleSkip(-1)}>
              <SkipBack size={16} />
            </button>
            <button className="circle-button circle-button-green" onClick={handlePlayPause}>
              {playerState.isPlaying ? <Pause size={18} /> : <Play size={18} />}
            </button>
            <button className="circle-button" onClick={() => handleSkip(1)}>
              <Forward size={16} />
            </button>
          </div>

          <div className="seek-row">
            <span>{formatTime(playerState.currentTime)}</span>
            <input
              className="seek-input"
              type="range"
              min="0"
              max={Number.isFinite(audioRef.current?.duration) ? audioRef.current.duration : 0}
              step="0.1"
              value={playerState.currentTime}
              onChange={handleSeek}
            />
            <span>{formatTime(audioRef.current?.duration || 0)}</span>
          </div>
        </div>

        <div className="session-indicator">
          <p className="caps-label">Session</p>
          <p>{isInSession ? 'Connected' : 'Solo'}</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
