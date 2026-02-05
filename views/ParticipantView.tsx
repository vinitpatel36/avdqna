
import React, { useState, useEffect } from 'react';
import { GameState, GameStatus } from '../types';

interface ParticipantViewProps {
  gameState: GameState;
  participantId: string;
  updateState: (state: GameState) => void;
  dbStatus: 'checking' | 'connected' | 'error';
}

const ParticipantView: React.FC<ParticipantViewProps> = ({ gameState, participantId, updateState, dbStatus }) => {
  const [answer, setAnswer] = useState('');
  const me = gameState.participants.find(p => p.id === participantId);

  // Clear answer field when status changes to Lobby or a new Question starts
  useEffect(() => {
    if (gameState.status === GameStatus.QUESTION_ACTIVE && !me?.isSubmitted) {
      setAnswer('');
    }
  }, [gameState.status, gameState.question]);

  if (!me) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-bold text-red-500">You have been disconnected</h2>
        <p className="text-zinc-500 mt-2">The host might have removed you or the room reset.</p>
      </div>
    );
  }

  const handleSubmit = () => {
    if (!answer.trim()) return;

    const newParticipants = gameState.participants.map(p =>
      p.id === participantId ? { ...p, answer: answer.trim(), isSubmitted: true } : p
    );

    updateState({
      ...gameState,
      participants: newParticipants
    });
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center p-6">
      <div className="max-w-md w-full space-y-8">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-xl font-bold">
              {me.name[0].toUpperCase()}
            </div>
            <div>
              <h2 className="font-bold text-lg">{me.name}</h2>
              <span className="text-xs text-blue-500 font-semibold tracking-widest uppercase">Contestant</span>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold ${gameState.status === GameStatus.QUESTION_ACTIVE ? 'bg-emerald-500/10 text-emerald-500' : 'bg-zinc-800 text-zinc-500'}`}>
            {gameState.status === GameStatus.QUESTION_ACTIVE ? 'LIVE' : 'WAITING'}
          </div>
        </header>

        {dbStatus === 'error' && (
          <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl flex items-center gap-3 text-red-500">
            <i className="fa-solid fa-bolt-lightning text-xl"></i>
            <p className="text-xs font-bold uppercase tracking-widest">Connectivity Lost - Updates might be delayed</p>
          </div>
        )}

        {gameState.status === GameStatus.LOBBY && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-12 text-center space-y-4">
            <div className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="fa-solid fa-clock text-3xl text-zinc-600 animate-pulse"></i>
            </div>
            <h3 className="text-2xl font-display text-white">READY UP!</h3>
            <p className="text-zinc-500">Waiting for the host to set the next question. Get ready to type fast!</p>
          </div>
        )}

        {gameState.status === GameStatus.QUESTION_ACTIVE && (
          <div className="space-y-6">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-xl">
              <h4 className="text-[10px] sm:text-xs text-zinc-500 uppercase font-bold tracking-widest mb-4">The Question</h4>
              <p className="text-xl sm:text-2xl font-semibold leading-snug">{gameState.question}</p>
            </div>

            {me.isSubmitted ? (
              <div className="bg-emerald-950/20 border border-emerald-900/50 rounded-2xl p-8 text-center space-y-2">
                <i className="fa-solid fa-check-circle text-4xl text-emerald-500 mb-2"></i>
                <h3 className="text-xl font-bold text-white">Answer Submitted!</h3>
                <p className="text-emerald-500/70 text-sm">Hang tight, waiting for others...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <textarea
                  autoFocus
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Type your answer here..."
                  className="w-full h-32 bg-zinc-900 border border-zinc-700 rounded-xl p-4 text-lg sm:text-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none shadow-inner"
                />
                <button
                  onClick={handleSubmit}
                  disabled={!answer.trim()}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-30 text-white py-4 rounded-xl font-bold text-lg transition-all shadow-lg active:scale-[0.98]"
                >
                  SUBMIT ANSWER
                </button>
              </div>
            )}
          </div>
        )}

        {gameState.status === GameStatus.RESULTS && (
          <div className="bg-purple-950/20 border border-purple-900/50 rounded-2xl p-8 text-center space-y-2">
            <i className="fa-solid fa-flag-checkered text-4xl text-purple-500 mb-2"></i>
            <h3 className="text-xl font-bold text-white">Results are on screen!</h3>
            <p className="text-purple-500/70 text-sm">Check the main display to see the winner.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ParticipantView;
