import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface Position {
  x: number;
  y: number;
}

interface Note {
  id: number;
  x: number;
  y: number;
  text: string;
  found: boolean;
}

const NOTES_TEXTS = [
  'My bones are screaming for death',
  'The silence is deafening in my skull',
  'I feel them crawling beneath my skin',
  'The darkness whispers my name',
  'They are watching from the shadows',
  'My reflection shows someone else',
  'The trees remember everything',
  'Salt in my wounds, salt in my soul',
  'Time has no meaning in this place',
  'White Lily, you should have stayed away'
];

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const PLAYER_SIZE = 40;
const NOTE_SIZE = 30;
const ENEMY_SIZE = 45;
const LIGHT_RADIUS = 120;

const Index = () => {
  const { toast } = useToast();
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameover' | 'victory'>('menu');
  const [playerPos, setPlayerPos] = useState<Position>({ x: GAME_WIDTH / 2, y: GAME_HEIGHT / 2 });
  const [enemyPos, setEnemyPos] = useState<Position>({ x: 100, y: 100 });
  const [notes, setNotes] = useState<Note[]>([]);
  const [foundNotes, setFoundNotes] = useState(0);
  const [enemySpeed, setEnemySpeed] = useState(0.5);
  const [showScreamer, setShowScreamer] = useState(false);
  const [dangerLevel, setDangerLevel] = useState(0);
  const keysPressed = useRef<Set<string>>(new Set());
  const gameLoopRef = useRef<number>();

  const initGame = useCallback(() => {
    const newNotes: Note[] = NOTES_TEXTS.map((text, i) => ({
      id: i,
      x: Math.random() * (GAME_WIDTH - NOTE_SIZE),
      y: Math.random() * (GAME_HEIGHT - NOTE_SIZE),
      text,
      found: false
    }));
    
    setNotes(newNotes);
    setPlayerPos({ x: GAME_WIDTH / 2, y: GAME_HEIGHT / 2 });
    setEnemyPos({ x: 50, y: 50 });
    setFoundNotes(0);
    setEnemySpeed(0.5);
    setDangerLevel(0);
    setShowScreamer(false);
    setGameState('playing');
  }, []);

  const teleportEnemy = useCallback(() => {
    const angle = Math.random() * Math.PI * 2;
    const distance = 200 + Math.random() * 100;
    const newX = Math.max(0, Math.min(GAME_WIDTH - ENEMY_SIZE, playerPos.x + Math.cos(angle) * distance));
    const newY = Math.max(0, Math.min(GAME_HEIGHT - ENEMY_SIZE, playerPos.y + Math.sin(angle) * distance));
    setEnemyPos({ x: newX, y: newY });
  }, [playerPos]);

  useEffect(() => {
    if (gameState !== 'playing') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current.add(e.key.toLowerCase());
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key.toLowerCase());
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState]);

  useEffect(() => {
    if (gameState !== 'playing') return;

    const gameLoop = () => {
      setPlayerPos(prev => {
        let newX = prev.x;
        let newY = prev.y;
        const speed = 3;

        if (keysPressed.current.has('w') || keysPressed.current.has('arrowup')) newY -= speed;
        if (keysPressed.current.has('s') || keysPressed.current.has('arrowdown')) newY += speed;
        if (keysPressed.current.has('a') || keysPressed.current.has('arrowleft')) newX -= speed;
        if (keysPressed.current.has('d') || keysPressed.current.has('arrowright')) newX += speed;

        newX = Math.max(0, Math.min(GAME_WIDTH - PLAYER_SIZE, newX));
        newY = Math.max(0, Math.min(GAME_HEIGHT - PLAYER_SIZE, newY));

        return { x: newX, y: newY };
      });

      setEnemyPos(prev => {
        const dx = playerPos.x - prev.x;
        const dy = playerPos.y - prev.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0) {
          const moveX = (dx / distance) * enemySpeed;
          const moveY = (dy / distance) * enemySpeed;
          return {
            x: prev.x + moveX,
            y: prev.y + moveY
          };
        }
        return prev;
      });

      const distToEnemy = Math.sqrt(
        Math.pow(playerPos.x - enemyPos.x, 2) + Math.pow(playerPos.y - enemyPos.y, 2)
      );

      if (distToEnemy < 150) {
        setDangerLevel(Math.min(100, (150 - distToEnemy) / 150 * 100));
      } else {
        setDangerLevel(0);
      }

      if (distToEnemy < 30) {
        setShowScreamer(true);
        setTimeout(() => {
          setGameState('gameover');
          setShowScreamer(false);
        }, 1000);
        return;
      }

      notes.forEach(note => {
        if (!note.found) {
          const dist = Math.sqrt(
            Math.pow(playerPos.x - note.x, 2) + Math.pow(playerPos.y - note.y, 2)
          );
          if (dist < 30) {
            setNotes(prev => prev.map(n => n.id === note.id ? { ...n, found: true } : n));
            setFoundNotes(prev => {
              const newCount = prev + 1;
              setEnemySpeed(s => s + 0.3);
              
              toast({
                title: '📜 Записка найдена',
                description: note.text,
                variant: 'destructive',
              });

              if (newCount >= 10) {
                setTimeout(() => setGameState('victory'), 500);
              } else if (newCount % 3 === 0) {
                teleportEnemy();
                toast({
                  title: '⚠️ Silent Salt телепортировался!',
                  description: 'Он становится быстрее...',
                  variant: 'destructive',
                });
              }

              return newCount;
            });
          }
        }
      });

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState, playerPos, enemyPos, enemySpeed, notes, toast, teleportEnemy]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1a0f0f] p-4">
      {gameState === 'menu' && (
        <Card className="p-8 bg-[#2d1b1b] border-[#4a2828] text-center animate-fade-in">
          <h1 className="text-6xl font-horror text-[#ea384c] mb-6 animate-flicker">
            WHITE LILY'S NIGHTMARE
          </h1>
          <p className="text-lg text-[#666666] mb-8 font-mono max-w-md">
            Найди 10 записок в темном лесу. Silent Salt Cookie преследует тебя и ускоряется с каждой найденной запиской. 
            Он может телепортироваться. Не дай ему поймать себя.
          </p>
          <div className="space-y-4 mb-6">
            <div className="text-sm text-[#999] font-mono">
              <p>🎮 Управление: WASD или стрелки</p>
              <p>💡 От тебя исходит слабый свет</p>
              <p>👻 Silent Salt становится быстрее с каждой запиской</p>
            </div>
          </div>
          <Button 
            onClick={initGame}
            className="bg-[#4a2828] hover:bg-[#ea384c] text-white font-horror text-2xl px-8 py-6 transition-all"
          >
            Начать игру
          </Button>
        </Card>
      )}

      {gameState === 'playing' && (
        <div className="relative">
          <div className="mb-4 flex justify-between items-center text-white font-mono">
            <div className="text-[#666666]">
              📜 Записок: <span className="text-[#ea384c] font-bold">{foundNotes}/10</span>
            </div>
            <div className="text-[#666666]">
              ⚡ Скорость врага: <span className="text-[#ea384c] font-bold">{enemySpeed.toFixed(1)}x</span>
            </div>
          </div>

          <div 
            className={`relative bg-[#000a0a] border-4 border-[#2d1b1b] overflow-hidden ${dangerLevel > 50 ? 'animate-shake' : ''}`}
            style={{ 
              width: GAME_WIDTH, 
              height: GAME_HEIGHT,
              backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 35px, rgba(45, 27, 27, 0.1) 35px, rgba(45, 27, 27, 0.1) 36px),
                               repeating-linear-gradient(90deg, transparent, transparent 35px, rgba(45, 27, 27, 0.1) 35px, rgba(45, 27, 27, 0.1) 36px)`
            }}
          >
            <div
              className="absolute rounded-full pointer-events-none"
              style={{
                left: playerPos.x - LIGHT_RADIUS / 2 + PLAYER_SIZE / 2,
                top: playerPos.y - LIGHT_RADIUS / 2 + PLAYER_SIZE / 2,
                width: LIGHT_RADIUS,
                height: LIGHT_RADIUS,
                background: `radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)`,
                animation: 'pulse-glow 2s infinite'
              }}
            />

            {notes.map(note => !note.found && (
              <div
                key={note.id}
                className="absolute text-3xl animate-pulse"
                style={{ left: note.x, top: note.y }}
                title={note.text}
              >
                📜
              </div>
            ))}

            <div
              className="absolute text-4xl transition-all duration-100"
              style={{ left: playerPos.x, top: playerPos.y }}
            >
              🌸
            </div>

            <div
              className="absolute text-4xl transition-opacity"
              style={{ 
                left: enemyPos.x, 
                top: enemyPos.y,
                opacity: dangerLevel > 30 ? 1 : 0.3,
                filter: `drop-shadow(0 0 ${dangerLevel / 5}px red)`
              }}
            >
              ⚔️
            </div>

            {dangerLevel > 50 && (
              <div 
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: `radial-gradient(circle at ${playerPos.x}px ${playerPos.y}px, transparent, rgba(234, 56, 76, ${dangerLevel / 200}))`
                }}
              />
            )}
          </div>

          {dangerLevel > 70 && (
            <div className="mt-2 text-center">
              <p className="text-[#ea384c] font-horror text-xl animate-flicker">
                ⚠️ SILENT SALT БЛИЗКО ⚠️
              </p>
            </div>
          )}
        </div>
      )}

      {showScreamer && (
        <div className="fixed inset-0 bg-black flex items-center justify-center z-50 animate-fade-in">
          <div className="text-9xl animate-shake">⚔️</div>
        </div>
      )}

      {gameState === 'gameover' && (
        <Card className="p-8 bg-[#2d1b1b] border-[#ea384c] text-center animate-fade-in">
          <h2 className="text-5xl font-horror text-[#ea384c] mb-4 animate-flicker">
            GAME OVER
          </h2>
          <p className="text-xl text-[#666666] mb-4 font-mono">
            Silent Salt Cookie поймал тебя
          </p>
          <p className="text-lg text-[#999] mb-6 font-mono">
            Найдено записок: {foundNotes}/10
          </p>
          <div className="space-x-4">
            <Button 
              onClick={initGame}
              className="bg-[#4a2828] hover:bg-[#ea384c] text-white font-horror text-xl px-6 py-4"
            >
              Попробовать снова
            </Button>
            <Button 
              onClick={() => setGameState('menu')}
              variant="outline"
              className="border-[#4a2828] text-[#666666] hover:bg-[#2d1b1b] font-horror text-xl px-6 py-4"
            >
              В меню
            </Button>
          </div>
        </Card>
      )}

      {gameState === 'victory' && (
        <Card className="p-8 bg-[#2d1b1b] border-[#4a2828] text-center animate-fade-in">
          <h2 className="text-5xl font-horror text-white mb-4">
            WHITE LILY УЗНАЛА ПРАВДУ
          </h2>
          <p className="text-xl text-[#666666] mb-6 font-mono max-w-md">
            Ты нашла все 10 записок и раскрыла тёмные секреты этого проклятого места.
            Но некоторые истины лучше оставить погребёнными в темноте...
          </p>
          <div className="space-x-4">
            <Button 
              onClick={initGame}
              className="bg-[#4a2828] hover:bg-[#666666] text-white font-horror text-xl px-6 py-4"
            >
              Играть снова
            </Button>
            <Button 
              onClick={() => setGameState('menu')}
              variant="outline"
              className="border-[#4a2828] text-[#666666] hover:bg-[#2d1b1b] font-horror text-xl px-6 py-4"
            >
              В меню
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default Index;
