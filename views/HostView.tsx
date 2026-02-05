
import React, { useState } from 'react';
import { GameState, GameStatus, Participant } from '../types';
import { generateFunQuestion } from '../services/geminiService';

interface HostViewProps {
  gameState: GameState;
  updateState: (state: GameState) => void;
  dbStatus: 'checking' | 'connected' | 'error';
}

const HostView: React.FC<HostViewProps> = ({ gameState, updateState, dbStatus }) => {
  const [manualQuestion, setManualQuestion] = useState('');
  const handleAddManualQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualQuestion.trim()) return;

    updateState({
      ...gameState,
      questionQueue: [...gameState.questionQueue, manualQuestion.trim()]
    });
    setManualQuestion('');
  };

  const handleNext = () => {
    if (gameState.status === GameStatus.LOBBY || gameState.status === GameStatus.QUESTION_ACTIVE || gameState.status === GameStatus.RESULTS) {
      if (gameState.questionQueue.length === 0) {
        updateState({ ...gameState, status: GameStatus.LOBBY, question: '' });
      } else {
        const [nextQ, ...remainingQueue] = gameState.questionQueue;
        updateState({
          ...gameState,
          question: nextQ,
          questionQueue: remainingQueue,
          status: GameStatus.QUESTION_ACTIVE,
          participants: gameState.participants.map(p => ({ ...p, answer: '', isSubmitted: false }))
        });
      }
    }
  };

  const handleBack = () => {
    if (gameState.status === GameStatus.QUESTION_ACTIVE || gameState.status === GameStatus.RESULTS) {
      const newQueue = gameState.question ? [gameState.question, ...gameState.questionQueue] : gameState.questionQueue;
      updateState({
        ...gameState,
        status: GameStatus.LOBBY,
        question: '',
        questionQueue: newQueue
      });
    }
  };

  const handleReset = async () => {
    console.log("Attempting full reset...");
    if (confirm("Are you sure you want to RESET EVERYTHING? All players will be kicked and questions cleared.")) {
      try {
        await updateState({
          status: GameStatus.LOBBY,
          question: '',
          questionQueue: [],
          participants: []
        });
        console.log("Reset successful.");
        alert("Game has been reset.");
      } catch (err) {
        console.error("Reset failed:", err);
        alert("Reset failed. Check connection.");
      }
    }
  };

  const kickParticipant = (id: string) => {
    updateState({
      ...gameState,
      participants: gameState.participants.filter(p => p.id !== id)
    });
  };

  const removeFromQueue = (index: number) => {
    const newQueue = [...gameState.questionQueue];
    newQueue.splice(index, 1);
    updateState({
      ...gameState,
      questionQueue: newQueue
    });
  };

  return (
    <div className="min-h-screen bg-zinc-950 p-6 flex flex-col items-center">
      <div className="max-w-6xl w-full space-y-6">
        <header className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4 text-center sm:text-left">
          <div>
            <h2 className="text-2xl sm:text-3xl font-display text-white">HOST CONTROL PANEL</h2>
            <p className="text-zinc-500 text-sm sm:text-base">Manage your contestants and questions</p>
          </div>
          <div className="px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-400 text-xs sm:text-sm font-semibold whitespace-nowrap">
            {gameState.participants.length}/5 PLAYERS
          </div>
        </header>

        {dbStatus === 'error' && (
          <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl flex items-center gap-4 text-red-500 animate-pulse">
            <i className="fa-solid fa-triangle-exclamation text-2xl"></i>
            <div>
              <p className="font-black uppercase tracking-widest text-sm">Database Sync Error</p>
              <p className="text-xs opacity-80">Players won't see questions. Please check if Supabase 'game_sessions' table exists and Realtime is ON.</p>
            </div>
          </div>
        )}

        {/* Current Game Status - Full Width at Top */}
        <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 space-y-6">
          <div className="p-6 bg-black border-2 border-zinc-800 rounded-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3">
              <span className={`px-2 py-1 rounded text-[10px] font-bold tracking-widest ${gameState.status === GameStatus.QUESTION_ACTIVE ? 'bg-emerald-500/20 text-emerald-500' : 'bg-zinc-500/20 text-zinc-500'}`}>
                {gameState.status}
              </span>
            </div>
            <span className="text-xs text-zinc-500 uppercase font-bold tracking-widest block mb-2">Active Question</span>
            <p className="text-xl text-zinc-100 font-medium font-display leading-tight">
              {gameState.question || "WAITING TO START..."}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap gap-4">
            <button
              onClick={handleBack}
              disabled={gameState.status === GameStatus.LOBBY}
              className="flex-1 min-w-[120px] bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-lg"
            >
              <i className="fa-solid fa-backward"></i> BACK
            </button>

            <button
              onClick={handleNext}
              disabled={gameState.status === GameStatus.LOBBY && gameState.questionQueue.length === 0}
              className="flex-[3] min-w-[200px] bg-blue-600 hover:bg-blue-700 disabled:opacity-30 py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-3 text-lg shadow-lg active:scale-95"
            >
              <i className="fa-solid fa-forward"></i>
              {gameState.status === GameStatus.LOBBY ? 'START SHOW' : 'NEXT QUESTION'}
              {gameState.questionQueue.length > 0 &&
                <span className="bg-black/30 px-2 py-0.5 rounded text-sm">{gameState.questionQueue.length}</span>
              }
            </button>

            <div className="flex flex-1 gap-4">
              <button
                onClick={async () => {
                  const latest = await (await import('../services/supabaseService')).fetchInitialGameState();
                  if (latest) updateState(latest);
                }}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                title="Force Cloud Sync"
              >
                <i className="fa-solid fa-cloud-arrow-down"></i>
              </button>

              <button
                onClick={handleReset}
                className="flex-1 bg-zinc-800 hover:bg-red-900/40 hover:text-red-400 py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                title="Reset Everything"
              >
                <i className="fa-solid fa-rotate-right"></i>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Sidebar & Other controls */}
          <section className="lg:col-span-8 space-y-6">
            <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 space-y-4">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <i className="fa-solid fa-plus-circle mr-3 text-blue-500"></i>
                Add Question
              </h3>

              {/* Manual Entry only */}
              <form onSubmit={handleAddManualQuestion} className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    placeholder="Type your question here..."
                    value={manualQuestion}
                    onChange={(e) => setManualQuestion(e.target.value)}
                    className="flex-1 bg-black border border-zinc-700 rounded-xl px-4 py-3 text-base sm:text-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-display tracking-wide"
                  />
                  <button
                    type="submit"
                    disabled={!manualQuestion.trim()}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-6 sm:px-8 py-3 rounded-xl font-bold text-xs sm:text-sm tracking-widest uppercase transition-all whitespace-nowrap shadow-lg shadow-blue-900/20"
                  >
                    ADD TO QUEUE
                  </button>
                </div>
              </form>
            </div>
          </section>

          {/* Sidebar */}
          <aside className="lg:col-span-4 space-y-6">
            {/* Queue */}
            <section className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden flex flex-col max-h-[400px]">
              <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
                <h3 className="font-bold flex items-center gap-2">
                  <i className="fa-solid fa-list-ol text-blue-500"></i>
                  Upcoming Queue
                </h3>
                <span className="text-xs bg-zinc-800 px-2 py-1 rounded text-zinc-400">{gameState.questionQueue.length}</span>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {gameState.questionQueue.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-zinc-600 text-sm italic">Queue is empty</p>
                    <p className="text-zinc-700 text-[10px] mt-1 uppercase tracking-tighter">Add questions above</p>
                  </div>
                ) : (
                  gameState.questionQueue.map((q, i) => (
                    <div key={i} className="group flex items-start gap-3 p-3 bg-black/40 border border-zinc-800/50 rounded-xl hover:border-zinc-700 transition-colors">
                      <span className="text-zinc-600 font-display text-lg leading-none">{i + 1}</span>
                      <p className="flex-1 text-sm text-zinc-300 line-clamp-2">{q}</p>
                      <button
                        onClick={() => removeFromQueue(i)}
                        className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-500 transition-all"
                      >
                        <i className="fa-solid fa-trash-can text-xs"></i>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Players */}
            <section className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
              <div className="p-4 border-b border-zinc-800 bg-zinc-900/50">
                <h3 className="font-bold flex items-center gap-2">
                  <i className="fa-solid fa-users text-purple-500"></i>
                  Active Players
                </h3>
              </div>
              <div className="p-4 space-y-3">
                {gameState.participants.length === 0 ? (
                  <p className="text-zinc-600 text-sm text-center py-4 italic">Waiting for players...</p>
                ) : (
                  gameState.participants.map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-3 bg-black/40 border border-zinc-800/50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${p.isSubmitted ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'}`}></div>
                        <span className="font-medium text-sm">{p.name}</span>
                      </div>
                      <button
                        onClick={() => kickParticipant(p.id)}
                        className="text-zinc-700 hover:text-red-500 transition-colors px-1"
                      >
                        <i className="fa-solid fa-user-minus text-xs"></i>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default HostView;
