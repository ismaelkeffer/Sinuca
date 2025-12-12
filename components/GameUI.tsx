import React from 'react';
import { GameState, Player } from '../types';

interface GameUIProps {
  gameState: GameState;
  onReset: () => void;
}

const GameUI: React.FC<GameUIProps> = ({ gameState, onReset }) => {
  const { currentPlayer, player1Group, player2Group, winner, gameStatus } = gameState;

  // Helper to determine display names and colors
  const isPlayer1Turn = currentPlayer === 'player1';

  const getPlayerCardClass = (player: Player) => {
    const isActive = currentPlayer === player && gameStatus !== 'gameover';
    // Ultra responsive padding for landscape
    const baseClass = "flex flex-col items-center p-1.5 landscape:p-2 md:p-6 rounded-lg landscape:rounded-xl md:rounded-2xl transition-all duration-500 w-5/12 relative border-2 overflow-hidden";

    if (isActive) {
      return `${baseClass} bg-gradient-to-br from-blue-800/90 to-blue-900/90 border-yellow-400 shadow-[0_0_15px_rgba(59,130,246,0.4)] md:shadow-[0_0_30px_rgba(59,130,246,0.4)] scale-100 md:scale-105 z-10`;
    }
    return `${baseClass} bg-gray-900/40 border-gray-800 opacity-40 scale-95 grayscale-[0.8]`;
  };

  const GroupIndicator = ({ group }: { group: 'solid' | 'stripe' | null }) => {
    if (!group) return <span className="text-[9px] md:text-[10px] text-gray-500 font-mono tracking-widest uppercase mt-1 md:mt-2">Open Table</span>;

    return (
      <div className="flex flex-col items-center gap-1 md:gap-2 mt-2 md:mt-3">
        <div className="flex gap-1">
          {group === 'solid' ? (
            // Visual representation of solids
            [1, 2, 3].map(i => <div key={i} className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-red-500 shadow-sm" />)
          ) : (
            // Visual representation of stripes
            [1, 2, 3].map(i => <div key={i} className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-white border-2 md:border-4 border-green-600 shadow-sm" />)
          )}
        </div>
        <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-white/80 whitespace-nowrap">
          {group === 'solid' ? 'Solids' : 'Stripes'}
        </span>
      </div>
    );
  };

  return (
    <div className="w-full max-w-[816px] mt-2 md:mt-6 flex flex-col gap-3 md:gap-6 select-none pointer-events-none">

      {/* Top Status Bar - New Addition for prominence */}
      <div className="flex justify-center">
        <div className={`
            px-6 py-2 md:px-10 md:py-3 rounded-full text-xs md:text-sm font-black uppercase tracking-widest transition-colors duration-300 shadow-xl border-2
            ${gameStatus === 'gameover' ? 'bg-purple-600 border-purple-400 text-white' :
            isPlayer1Turn ? 'bg-blue-600 border-blue-400 text-white' : 'bg-orange-600 border-orange-400 text-white'}
         `}>
          {gameStatus === 'gameover'
            ? 'Match Finished'
            : `${currentPlayer === 'player1' ? 'Player 1' : 'Player 2'} Turn`}
        </div>
      </div>

      {/* Main Scoreboard */}
      <div className="flex justify-between items-stretch px-1 md:px-2">

        {/* Player 1 Card */}
        <div className={getPlayerCardClass('player1')}>
          {/* Active Indicator Background Effect */}
          {isPlayer1Turn && gameStatus !== 'gameover' && (
            <div className="absolute inset-0 bg-blue-500/10 animate-pulse rounded-2xl" />
          )}

          <div className="z-10 flex flex-col items-center w-full">
            <span className="text-[10px] md:text-xs font-bold text-blue-400 uppercase tracking-wider mb-0 md:mb-1">Player 1</span>
            <div className="text-3xl md:text-5xl font-black text-white mb-0 md:mb-1 shadow-black drop-shadow-lg">P1</div>
            <GroupIndicator group={player1Group} />
          </div>

          {isPlayer1Turn && gameStatus !== 'gameover' && (
            <div className="absolute -top-3 md:-top-4 bg-yellow-400 text-black text-[9px] md:text-xs font-black px-4 py-1 md:px-6 md:py-2 rounded-full uppercase tracking-widest shadow-[0_0_15px_rgba(250,204,21,0.6)] animate-bounce border-2 border-white z-20 whitespace-nowrap">
              Your Turn
            </div>
          )}
        </div>

        {/* VS Divider */}
        <div className="flex flex-col items-center justify-center w-2/12">
          <div className="w-px h-10 md:h-20 bg-gradient-to-b from-transparent via-white/10 to-transparent" />
          <span className="text-xl md:text-2xl font-black text-white/10 italic my-1 md:my-2">VS</span>
          <div className="w-px h-10 md:h-20 bg-gradient-to-b from-transparent via-white/10 to-transparent" />
        </div>

        {/* Player 2 Card */}
        <div className={getPlayerCardClass('player2')}>
          {/* Active Indicator Background Effect */}
          {!isPlayer1Turn && gameStatus !== 'gameover' && (
            <div className="absolute inset-0 bg-orange-500/10 animate-pulse rounded-2xl" />
          )}

          <div className="z-10 flex flex-col items-center w-full">
            <span className="text-[10px] md:text-xs font-bold text-orange-400 uppercase tracking-wider mb-0 md:mb-1">Player 2</span>
            <div className="text-3xl md:text-5xl font-black text-white mb-0 md:mb-1 shadow-black drop-shadow-lg">P2</div>
            <GroupIndicator group={player2Group} />
          </div>

          {!isPlayer1Turn && gameStatus !== 'gameover' && (
            <div className="absolute -top-3 md:-top-4 bg-yellow-400 text-black text-[9px] md:text-xs font-black px-4 py-1 md:px-6 md:py-2 rounded-full uppercase tracking-widest shadow-[0_0_15px_rgba(250,204,21,0.6)] animate-bounce border-2 border-white z-20 whitespace-nowrap">
              Your Turn
            </div>
          )}
        </div>
      </div>

      {/* Game Over Modal */}
      {gameStatus === 'gameover' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-300 pointer-events-auto">
          <div className="bg-gray-900 border-2 border-white/10 text-white p-6 md:p-12 rounded-3xl shadow-2xl text-center w-full max-w-lg relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/50 to-blue-900/50" />

            <div className="relative z-10">
              <h2 className="text-4xl md:text-6xl font-black mb-4 md:mb-6 text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500 drop-shadow-sm">
                {winner === 'player1' ? 'P1 WINS!' : 'P2 WINS!'}
              </h2>

              <p className="text-gray-300 mb-6 md:mb-10 text-sm md:text-lg">
                Great match! {winner === 'player1' ? 'Player 1' : 'Player 2'} potted the 8-Ball correctly.
              </p>

              <button
                onClick={onReset}
                className="px-8 py-3 md:px-12 md:py-4 bg-white hover:bg-gray-100 text-black rounded-full font-black text-sm md:text-lg tracking-widest shadow-[0_0_30px_rgba(255,255,255,0.3)] transition-all transform hover:scale-105 active:scale-95"
              >
                PLAY AGAIN
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer Rules Summary - Hidden in landscape mobile */}
      <div className="hidden md:block mt-1 md:mt-4 bg-black/40 rounded-xl p-3 md:p-4 text-center border border-white/5 backdrop-blur-md">
        <h3 className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 md:mb-2">Game Rules (8-Ball)</h3>
        <p className="text-[9px] md:text-[11px] text-gray-500 leading-relaxed max-w-2xl mx-auto">
          <strong>Objective:</strong> Pot your group then the 8-Ball. <br className="md:hidden" />
          <strong>Foul:</strong> Potting cue ball resets it. <br className="md:hidden" />
          <strong>Loss:</strong> Potting 8-Ball early or scratching on it.
        </p>
      </div>
    </div>
  );
};

export default GameUI;