
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Role, GameState, GameStatus, Participant, ChannelMessage } from './types';
import HostView from './views/HostView';
import ParticipantView from './views/ParticipantView';
import DisplayView from './views/DisplayView';
import { supabase, syncGameState, subscribeToGameUpdates, fetchInitialGameState } from './services/supabaseService';

const INITIAL_STATE: GameState = {
  status: GameStatus.LOBBY,
  question: '',
  questionQueue: [],
  participants: []
};

const App: React.FC = () => {
  const [role, setRole] = useState<Role | null>(null);
  const [gameState, setGameState] = useState<GameState>(INITIAL_STATE);
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [joinName, setJoinName] = useState('');
  const [dbStatus, setDbStatus] = useState<'checking' | 'connected' | 'error'>('checking');

  const channelRef = useRef<BroadcastChannel | null>(null);
  const stateRef = useRef<GameState>(gameState);
  const roleRef = useRef<Role | null>(role);

  // Sync refs with state
  useEffect(() => {
    stateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    roleRef.current = role;

    // Auto-return players to lobby selection if the room is wiped
    if (role === Role.PARTICIPANT && participantId) {
      const isStillInGame = gameState.participants.some(p => p.id === participantId);
      if (!isStillInGame && gameState.status === GameStatus.LOBBY && gameState.participants.length === 0) {
        setRole(null);
        setParticipantId(null);
      }
    }
  }, [role, gameState.participants, gameState.status, participantId]);

  // Initial Fetch & Real-time Subscription
  useEffect(() => {
    const init = async () => {
      try {
        setDbStatus('checking');
        // Check if keys are actually present in the environment
        const hasKeys = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY;

        if (!hasKeys) {
          setDbStatus('error');
          return;
        }

        const serverState = await fetchInitialGameState();
        if (serverState) {
          setGameState(serverState);
        }
        setDbStatus('connected');
      } catch (err) {
        console.error("Supabase Error:", err);
        setDbStatus('error');
      }
    };

    init();

    // Subscribe to changes from Supabase
    const unsubscribe = subscribeToGameUpdates((newState) => {
      if (JSON.stringify(newState) !== JSON.stringify(stateRef.current)) {
        setGameState(newState);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const updateGlobalState = useCallback(async (newState: GameState) => {
    // Local Update
    setGameState(newState);

    // Broadcast for same-browser speed
    channelRef.current?.postMessage({
      type: 'UPDATE_STATE',
      state: newState
    });

    // Cloud Persistence
    try {
      await syncGameState(newState);
      setDbStatus('connected');
    } catch (err) {
      console.error("Failed to sync to cloud:", err);
      setDbStatus('error');
    }
  }, []);

  // Initialize Local Channel
  useEffect(() => {
    channelRef.current = new BroadcastChannel('quick_five_channel');

    const handleMessage = (event: MessageEvent<ChannelMessage>) => {
      if (event.data.type === 'UPDATE_STATE') {
        if (JSON.stringify(event.data.state) !== JSON.stringify(stateRef.current)) {
          setGameState(event.data.state);
        }
      }
    };

    channelRef.current.onmessage = handleMessage;

    return () => {
      channelRef.current?.close();
    };
  }, []);

  const handleJoin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmedName = joinName.trim();
    if (!trimmedName) return;

    // Fetch latest state to avoid overwriting others who just joined
    const latestState = await fetchInitialGameState() || stateRef.current;

    if (latestState.participants.length >= 5) {
      alert("Room is full! Max 5 people.");
      setIsJoining(false);
      return;
    }

    const newId = Math.random().toString(36).substring(7);
    const newParticipant: Participant = {
      id: newId,
      name: trimmedName,
      answer: '',
      isSubmitted: false
    };

    const newState = {
      ...latestState,
      participants: [...latestState.participants, newParticipant]
    };

    setParticipantId(newId);
    setRole(Role.PARTICIPANT);
    updateGlobalState(newState);
    setIsJoining(false);
    setJoinName('');
  };

  if (!role) {
    return (
      <div className="min-h-screen bg-black bg-grid flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full space-y-8 bg-zinc-900/50 p-8 rounded-3xl border border-zinc-800 backdrop-blur-sm transition-all relative">

          <div className="absolute -top-4 -right-4">
            {dbStatus === 'connected' ? (
              <div className="flex items-center gap-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold px-2 py-1 rounded-full border border-emerald-500/20">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                SYNCED
              </div>
            ) : dbStatus === 'checking' ? (
              <div className="flex items-center gap-1 bg-blue-500/10 text-blue-500 text-[10px] font-bold px-2 py-1 rounded-full border border-blue-500/20">
                <i className="fa-solid fa-spinner fa-spin"></i>
                CONNECTING
              </div>
            ) : (
              <div className="flex items-center gap-1 bg-red-500/10 text-red-500 text-[10px] font-bold px-2 py-1 rounded-full border border-red-500/20">
                <i className="fa-solid fa-bolt"></i>
                OFFLINE
              </div>
            )}
          </div>

          <h1 className="text-6xl font-display text-blue-500 led-glow">QnA</h1>
          <p className="text-zinc-400 text-lg">Interactive Game Show Platform</p>

          <div className="grid grid-cols-1 gap-4 pt-8">
            {!isJoining ? (
              <>
                <button
                  onClick={() => setRole(Role.HOST)}
                  className="group relative px-6 py-4 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-all border border-zinc-700 flex items-center justify-between"
                >
                  <div className="text-left">
                    <span className="block font-bold text-lg">Host Room</span>
                    <span className="text-sm text-zinc-500">Control the flow and questions</span>
                  </div>
                  <i className="fa-solid fa-crown text-amber-500 group-hover:scale-110 transition-transform"></i>
                </button>

                <button
                  onClick={() => setIsJoining(true)}
                  className="group relative px-6 py-4 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-all border border-zinc-700 flex items-center justify-between"
                >
                  <div className="text-left">
                    <span className="block font-bold text-lg">Join as Player</span>
                    <span className="text-sm text-zinc-500">Submit your answers in real-time</span>
                  </div>
                  <i className="fa-solid fa-user text-blue-500 group-hover:scale-110 transition-transform"></i>
                </button>

                <button
                  onClick={() => setRole(Role.DISPLAY)}
                  className="group relative px-6 py-4 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-all border border-zinc-700 flex items-center justify-between"
                >
                  <div className="text-left">
                    <span className="block font-bold text-lg">Display Screen</span>
                    <span className="text-sm text-zinc-500">Perfect for LED boards & projectors</span>
                  </div>
                  <i className="fa-solid fa-tv text-purple-500 group-hover:scale-110 transition-transform"></i>
                </button>
              </>
            ) : (
              <form onSubmit={handleJoin} className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="text-left">
                  <label className="block text-sm font-bold text-zinc-500 uppercase tracking-widest mb-2">Enter Your Name</label>
                  <input
                    autoFocus
                    type="text"
                    value={joinName}
                    onChange={(e) => setJoinName(e.target.value)}
                    placeholder="e.g. Alex"
                    className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-4 text-white text-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    maxLength={15}
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsJoining(false)}
                    className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 py-4 rounded-xl font-bold transition-colors"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    disabled={!joinName.trim()}
                    className="flex-[2] bg-blue-600 hover:bg-blue-700 disabled:opacity-30 text-white py-4 rounded-xl font-bold transition-all"
                  >
                    JOIN GAME
                  </button>
                </div>
              </form>
            )}
          </div>

          {dbStatus === 'error' && (
            <div className="mt-8 p-6 bg-red-950/30 border border-red-500/30 rounded-2xl text-left space-y-4">
              <div className="flex items-center gap-3 text-red-500">
                <i className="fa-solid fa-triangle-exclamation text-xl"></i>
                <h3 className="font-bold text-sm uppercase tracking-widest">Setup Incomplete</h3>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Your browser cannot communicate with the database. Please ensure you have run this in your **Supabase SQL Editor**:
              </p>
              <pre className="bg-black/50 p-3 rounded text-[10px] text-blue-400 overflow-x-auto border border-white/5 font-mono">
                {`create table if not exists game_sessions (
  id text primary key,
  state jsonb,
  updated_at timestamp default now()
);

alter publication supabase_realtime 
add table game_sessions;

alter table game_sessions 
disable row level security;`}
              </pre>
              <div className="pt-2 flex flex-col gap-2">
                <button
                  onClick={() => window.location.reload()}
                  className="w-full py-2 bg-red-500/20 hover:bg-red-500/30 text-red-500 text-[10px] font-bold rounded-lg transition-colors"
                >
                  REFRESH AFTER RUNNING SQL
                </button>
                <p className="text-[10px] text-zinc-600 text-center italic">If you already ran this, check your .env.local keys.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      {role === Role.HOST && <HostView gameState={gameState} updateState={updateGlobalState} dbStatus={dbStatus} />}
      {role === Role.PARTICIPANT && <ParticipantView gameState={gameState} updateState={updateGlobalState} participantId={participantId!} dbStatus={dbStatus} />}
      {role === Role.DISPLAY && <DisplayView gameState={gameState} />}

      <div className="fixed bottom-4 left-4 flex gap-2 z-50">
        <button
          onClick={() => { setRole(null); setParticipantId(null); setIsJoining(false); }}
          className="p-2 px-3 bg-zinc-800/80 hover:bg-red-900/40 rounded-full text-zinc-500 hover:text-red-400 transition-colors text-xs flex items-center gap-2"
        >
          <i className="fa-solid fa-arrow-left"></i> Exit Role
        </button>
        {dbStatus === 'error' && (
          <div className="p-2 px-3 bg-red-500/20 border border-red-500/30 rounded-full text-red-500 text-[10px] font-bold tracking-widest flex items-center gap-2">
            <i className="fa-solid fa-circle-exclamation"></i> SYNC ERROR
          </div>
        )}
      </div>
    </>
  );
};

export default App;
