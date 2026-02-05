
import React from 'react';
import { GameState, GameStatus } from '../types';

interface DisplayViewProps {
  gameState: GameState;
}

const DisplayView: React.FC<DisplayViewProps> = ({ gameState }) => {
  return (
    <div className="min-h-screen bg-black overflow-hidden flex flex-col relative">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid opacity-20"></div>
      <div className="absolute -top-40 -left-40 w-80 h-80 bg-blue-600/10 blur-[100px] rounded-full"></div>
      <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-purple-600/10 blur-[100px] rounded-full"></div>

      <header className="relative z-10 pt-8 sm:pt-12 pb-6 sm:pb-8 px-6 sm:px-12 text-center">
        <h1 className="text-6xl sm:text-8xl md:text-9xl font-display bg-gradient-to-b from-blue-400 to-blue-600 bg-clip-text text-transparent drop-shadow-[0_0_25px_rgba(59,130,246,0.6)] tracking-tighter leading-none">QnA</h1>
        <div className="h-1 w-16 sm:w-24 bg-blue-500 mx-auto mt-4 rounded-full"></div>
      </header>

      <main className="flex-1 relative z-10 px-12 flex flex-col justify-center max-w-7xl mx-auto w-full pb-20">
        {gameState.status === GameStatus.LOBBY && (
          <div className="text-center space-y-12">
            <h2 className="text-2xl sm:text-4xl text-zinc-400 font-light">JOIN THE SHOW</h2>
            <div className="flex flex-wrap justify-center gap-6 sm:gap-12">
              {gameState.participants.map((p, i) => {
                return (
                  <div key={p.id} className="w-48 sm:w-64 h-64 sm:h-80 rounded-3xl border-2 transition-all duration-700 flex flex-col items-center justify-center space-y-4 sm:space-y-6 bg-zinc-900/80 border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.3)] animate-in zoom-in-50 fade-in duration-500">
                    <div className="w-16 sm:w-24 h-16 sm:h-24 bg-blue-600 rounded-full flex items-center justify-center text-3xl sm:text-5xl font-bold shadow-lg">
                      {p.name[0].toUpperCase()}
                    </div>
                    <span className="text-xl sm:text-3xl font-display text-white">{p.name}</span>
                    <div className="px-3 py-1 bg-blue-500/10 rounded-full text-[8px] sm:text-[10px] font-black text-blue-500 tracking-widest uppercase animate-pulse border border-blue-500/20">CONNECTED</div>
                  </div>
                );
              })}
              {gameState.participants.length === 0 && (
                <div className="w-full flex justify-center">
                  <div className="px-6 py-3 sm:px-8 sm:py-4 bg-zinc-900/50 border border-dashed border-zinc-800 rounded-3xl text-zinc-600 font-display text-lg sm:text-2xl tracking-widest">
                    WAITING FOR CONTESTANTS...
                  </div>
                </div>
              )}
            </div>
            <p className="text-lg sm:text-xl text-zinc-600 italic">Total Players: {gameState.participants.length}</p>
          </div>
        )}

        {(gameState.status === GameStatus.QUESTION_ACTIVE || gameState.status === GameStatus.RESULTS) && (
          <div className="space-y-12 w-full">
            {/* Big Question Banner */}
            <div className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-[1.5rem] sm:rounded-[2.5rem] p-6 sm:p-12 text-center shadow-2xl">
              <span className="text-blue-500 font-bold tracking-[0.2em] sm:tracking-[0.3em] uppercase text-xs sm:text-sm mb-3 sm:mb-4 block">Current Question</span>
              <h2 className="text-2xl sm:text-5xl md:text-6xl font-bold leading-tight">
                {gameState.question || "Prepare yourselves..."}
              </h2>
            </div>

            {/* Answers Grid - DYNAMIC SIZING */}
            <div className={`grid gap-4 sm:gap-8 justify-center grid-cols-1 ${gameState.participants.length === 2 ? 'sm:grid-cols-2 max-w-5xl mx-auto' :
                gameState.participants.length === 3 ? 'sm:grid-cols-3' :
                  gameState.participants.length === 4 ? 'sm:grid-cols-2 lg:grid-cols-4' :
                    gameState.participants.length >= 5 ? 'sm:grid-cols-3 lg:grid-cols-5' :
                      'max-w-2xl mx-auto'
              }`}>
              {gameState.participants.map((p, i) => (
                <div
                  key={p.id}
                  className={`relative flex flex-col h-auto sm:h-[32rem] rounded-[1.5rem] sm:rounded-[2.5rem] border-2 transition-all duration-500 p-6 sm:p-8 ${p.isSubmitted ? 'bg-zinc-900/90 border-blue-500/50 shadow-[0_0_40px_rgba(59,130,246,0.1)]' : 'bg-black/40 border-zinc-800'}`}
                >
                  <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-8">
                    <div className="w-8 h-8 sm:w-12 sm:h-12 bg-blue-600 rounded-lg sm:rounded-2xl flex items-center justify-center font-bold text-base sm:text-xl shadow-lg transform rotate-3">
                      {p.name[0].toUpperCase()}
                    </div>
                    <span className="font-display text-xl sm:text-4xl truncate text-zinc-100">{p.name}</span>
                  </div>

                  <div className="flex-1 flex flex-col items-center justify-center p-4">
                    {p.isSubmitted ? (
                      <div className="w-full animate-in zoom-in-95 fade-in duration-500 overflow-hidden">
                        <p className="text-xl sm:text-4xl font-bold text-center text-white font-display leading-snug break-words tracking-wide px-2">
                          "{p.answer}"
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-6">
                        <div className="relative">
                          <div className="w-24 h-24 border-4 border-zinc-900 border-t-blue-500 rounded-full flex items-center justify-center animate-spin">
                          </div>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <i className="fa-solid fa-keyboard text-3xl text-zinc-700 animate-pulse"></i>
                          </div>
                        </div>
                        <span className="text-zinc-600 text-sm font-black uppercase tracking-[0.3em] animate-pulse">Thinking...</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

    </div>
  );
};

export default DisplayView;
