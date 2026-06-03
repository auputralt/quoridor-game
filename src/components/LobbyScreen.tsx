import { useState } from 'react';
import { UseOnlineReturn } from '../hooks/useOnline';

interface Props {
  online: UseOnlineReturn;
  onBack: () => void;
}

export function LobbyScreen({ online, onBack }: Props) {
  const [tab, setTab] = useState<'create' | 'join'>('create');
  const [joinCode, setJoinCode] = useState('');

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 animate-fade-in">
      <div className="w-full max-w-sm">
        <h2 className="text-3xl font-bold text-white text-center mb-8">Online</h2>

        {/* Tabs */}
        <div className="flex bg-white/5 rounded-2xl p-1 mb-6 border border-white/10">
          {(['create', 'join'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                tab === t
                  ? 'bg-white text-black'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              {t === 'create' ? 'Create' : 'Join'}
            </button>
          ))}
        </div>

        {/* Create tab */}
        {tab === 'create' && (
          <div className="bg-[#111] border border-white/10 rounded-2xl p-6 text-center space-y-4">
            {online.waiting && online.roomCode ? (
              <>
                <p className="text-white/30 text-sm">Share this code:</p>
                <p className="text-4xl font-mono font-bold text-white tracking-[0.3em]">
                  {online.roomCode}
                </p>
                <p className="text-white/20 text-xs animate-pulse">
                  Waiting for opponent…
                </p>
                <p className="text-white/15 text-xs">Or share link:</p>
                <p className="text-white/25 text-xs font-mono break-all">
                  {window.location.href}?room={online.roomCode}
                </p>
              </>
            ) : (
              <>
                <p className="text-white/30 text-sm mb-2">
                  Create a room and share the code
                </p>
                <button
                  onClick={online.createRoom}
                  className="w-full py-3 rounded-2xl font-semibold bg-white text-black hover:bg-white/90 transition-colors"
                >
                  Create Room
                </button>
              </>
            )}
          </div>
        )}

        {/* Join tab */}
        {tab === 'join' && (
          <div className="bg-[#111] border border-white/10 rounded-2xl p-6 space-y-4">
            <p className="text-white/30 text-sm text-center">
              Enter the 6-character room code
            </p>
            <input
              type="text"
              maxLength={6}
              value={joinCode}
              onChange={(e) =>
                setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))
              }
              placeholder="ABCDEF"
              className="w-full py-3 px-4 text-center text-2xl font-mono tracking-[0.3em] bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-colors"
            />
            <button
              onClick={() => {
                if (joinCode.length === 6) online.joinRoom(joinCode);
              }}
              disabled={joinCode.length !== 6}
              className="w-full py-3 rounded-2xl font-semibold bg-white text-black hover:bg-white/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Join Room
            </button>
          </div>
        )}

        {/* Error display */}
        {online.opponentDisconnected && (
          <div className="mt-4 bg-red-900/30 border border-red-800/50 rounded-2xl p-3 text-center text-red-400 text-sm">
            Opponent disconnected. Try a new room.
          </div>
        )}

        <button
          onClick={onBack}
          className="w-full mt-6 py-2.5 text-white/30 hover:text-white/60 text-sm transition-colors"
        >
          ← Back
        </button>
      </div>
    </div>
  );
}
