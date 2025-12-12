import React from 'react';
import { GameState, Player } from '../types';

interface GameUIProps {
  gameState: GameState;
  onReset: () => void;
}

const GameUI: React.FC<GameUIProps> = ({ gameState, onReset }) => {
  const { currentPlayer, player1Group, player2Group, winner, gameStatus } = gameState;
  const isPlayer1Turn = currentPlayer === 'player1';

  // --- Components ---

  const MenuButton = () => (
    <button className="w-12 h-12 bg-green-500 rounded-lg border-b-4 border-green-700 flex flex-col items-center justify-center gap-1 active:border-b-0 active:translate-y-1 transition-all shadow-lg hover:brightness-110">
      <div className="w-6 h-1 bg-white rounded-full shadow-sm"></div>
      <div className="w-6 h-1 bg-white rounded-full shadow-sm"></div>
      <div className="w-6 h-1 bg-white rounded-full shadow-sm"></div>
    </button>
  );

  const StarLevel = ({ level, colorClass }: { level: number, colorClass: string }) => (
    <div className="relative w-12 h-12 flex items-center justify-center">
      {/* Star Shape Simulation using SVG */}
      <svg viewBox="0 0 24 24" className={`w-full h-full drop-shadow-md ${colorClass} fill-current`}>
        <path d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.48 8.279-7.416-3.967-7.417 3.967 1.481-8.279-6.064-5.828 8.332-1.151z" />
      </svg>
      <span className="absolute text-white font-black text-xs pt-1">{level}</span>
    </div>
  );

  const Avatar = ({ player, photoUrl }: { player: Player, photoUrl?: string }) => {
    const isActive = currentPlayer === player && gameStatus !== 'gameover';
    const borderColor = isActive ? 'border-yellow-400' : 'border-gray-500';

    // Gradient border look
    return (
      <div className={`relative w-14 h-14 md:w-16 md:h-16 rounded-xl border-4 ${borderColor} bg-gray-800 shadow-lg overflow-hidden transition-all duration-300 ${isActive ? 'scale-110 ring-2 ring-yellow-400/50 z-10' : 'opacity-80 grayscale-[0.5]'}`}>
        {photoUrl ? (
          <img src={photoUrl} alt={player} className="w-full h-full object-cover" />
        ) : (
          // Fallback Avatar
          <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <span className="text-xl font-bold text-white">{player === 'player1' ? 'P1' : 'P2'}</span>
          </div>
        )}
      </div>
    );
  }

  const PlayerInfoBar = ({ player, group, name, align }: { player: Player, group: 'solid' | 'stripe' | null, name: string, align: 'left' | 'right' }) => {
    const isLeft = align === 'left';
    // Simplified ball indicators
    const balls = [];
    if (group) {
      if (group === 'solid') {
        for (let i = 1; i <= 7; i++) balls.push({ id: i, color: 'bg-red-500' }); // Simplified color
      } else {
        for (let i = 9; i <= 15; i++) balls.push({ id: i, color: 'bg-yellow-400 border-2 border-green-600' }); // Simplified color
      }
    } else {
      // Show placeholders if groups not set
      for (let i = 0; i < 7; i++) balls.push({ id: i, color: 'bg-gray-700' });
    }

    // Determine balls aiming/remaining logic would go here, for now just static list
    // In a real app we would filter out potted balls. 
    // For UI demo, showing all 7 indicators.

    return (
      <div className={`flex flex-col ${isLeft ? 'items-end' : 'items-start'} justify-center w-32 md:w-48`}>
        {/* Name Bar */}
        <div className={`
                w-full h-6 bg-gray-900/80 rounded-full flex items-center px-3 border border-white/10
                ${isLeft ? 'justify-end' : 'justify-start'}
                ${currentPlayer === player ? 'bg-gradient-to-r from-gray-800 to-blue-900 border-blue-500/50' : ''}
            `}>
          <span className="text-white font-bold text-xs md:text-sm tracking-wide">{name}</span>
        </div>

        {/* Balls Indicator - Underneath */}
        <div className={`flex gap-1 mt-1 ${isLeft ? 'justify-end' : 'justify-start'}`}>
          {balls.slice(0, 7).map((b, i) => ( // Show first 5-6 to fit
            <div key={i} className={`w-3 h-3 md:w-4 md:h-4 rounded-full shadow-sm ${b.color}`}></div>
          ))}
        </div>
      </div>
    )
  }

  const CentralDisplay = () => (
    <div className="flex flex-col items-center mx-2 md:mx-4">
      <div className="bg-black/60 rounded-xl border border-yellow-600/30 px-3 py-1 flex items-center gap-2">
        {/* Coins Icon */}
        <div className="w-4 h-4 md:w-5 md:h-5 bg-yellow-500 rounded-full border border-yellow-200 shadow-[0_0_10px_orange]"></div>
        <span className="text-yellow-400 font-black text-sm md:text-xl font-mono">200</span>
      </div>
    </div>
  )

  const Controls = () => (
    <div className="flex items-center gap-2 md:gap-4 ml-2">
      {/* Cue Control */}
      <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gray-200 border-4 border-gray-400 shadow-inner flex items-center justify-center relative cursor-pointer active:scale-95 transition-transform">
        <div className="w-2 h-2 bg-red-600 rounded-full absolute top-2 right-3"></div> {/* Spin dot simulation */}
        <div className="text-[8px] text-gray-500 absolute bottom-1">SPIN</div>
      </div>
      {/* Cues Selector */}
      <button className="w-10 h-10 md:w-12 md:h-12 bg-blue-500 rounded-lg border-b-4 border-blue-700 flex items-center justify-center active:border-b-0 active:translate-y-1 transition-all">
        <div className="w-8 h-8 relative">
          <div className="absolute w-[2px] h-full bg-yellow-200 left-1/2 -rotate-45 transform origin-center border border-black/20"></div>
          <div className="absolute w-[2px] h-full bg-white left-1/2 rotate-12 transform origin-center border border-black/20 ml-1"></div>
        </div>
      </button>
    </div>
  )


  return (
    <div className="w-full flex justify-between items-start pointer-events-auto">
      {/* Main Top Bar Container */}
      <div className="w-full bg-gradient-to-b from-gray-800 via-gray-900 to-black/90 border-b border-white/10 shadow-2xl flex items-center justify-between px-2 py-2 md:px-6 md:py-3 z-50 rounded-b-xl lg:rounded-b-none lg:rounded-xl mx-auto max-w-[1200px]">

        {/* Left Group */}
        <div className="flex items-center gap-2 md:gap-4">
          <MenuButton />

          {/* Player 1 Section */}
          <div className="flex items-center gap-2">
            <StarLevel level={43} colorClass="text-pink-500" />
            {/* Balls & Name - Hidden on very small screens or adapted? keeping simple for now */}
            <div className="flex items-center gap-[-4px]"> {/* Negative gap for overlap if needed */}
              <PlayerInfoBar player="player1" group={player1Group} name="Emely" align="left" />
              <Avatar player="player1" photoUrl="https://api.dicebear.com/7.x/avataaars/svg?seed=Emely" /> {/* Using DiceBear for avatar content */}
            </div>
          </div>
        </div>

        {/* Center */}
        <CentralDisplay />

        {/* Right Group */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Player 2 Section */}
          <div className="flex items-center gap-2">
            <Avatar player="player2" photoUrl="https://api.dicebear.com/7.x/avataaars/svg?seed=Mike" />
            <PlayerInfoBar player="player2" group={player2Group} name="Mike" align="right" />
            <StarLevel level={46} colorClass="text-blue-500" />
          </div>

          <Controls />
        </div>

      </div>

      {/* Game Over Modal (Original Logic Preserved but styled slightly better) */}
      {gameStatus === 'gameover' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-300 pointer-events-auto">
          <div className="bg-gray-900 border-2 border-white/10 text-white p-6 md:p-12 rounded-3xl shadow-2xl text-center w-full max-w-lg relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/50 to-blue-900/50" />

            <div className="relative z-10">
              <h2 className="text-4xl md:text-6xl font-black mb-4 md:mb-6 text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500 drop-shadow-sm">
                {winner === 'player1' ? 'J1 VENCEU!' : 'J2 VENCEU!'}
              </h2>

              <p className="text-gray-300 mb-6 md:mb-10 text-sm md:text-lg">
                Ótima partida! {winner === 'player1' ? 'Jogador 1' : 'Jogador 2'} encaçapou a bola 8 corretamente.
              </p>

              <button
                onClick={onReset}
                className="px-8 py-3 md:px-12 md:py-4 bg-white hover:bg-gray-100 text-black rounded-full font-black text-sm md:text-lg tracking-widest shadow-[0_0_30px_rgba(255,255,255,0.3)] transition-all transform hover:scale-105 active:scale-95"
              >
                JOGAR NOVAMENTE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameUI;