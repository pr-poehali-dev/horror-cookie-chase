import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';

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

interface TreeObstacle {
  id: number;
  x: number;
  y: number;
  type: 'tree' | 'bush' | 'grave';
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

const MAP_WIDTH = 2400;
const MAP_HEIGHT = 1800;
const VIEWPORT_WIDTH = 800;
const VIEWPORT_HEIGHT = 600;
const PLAYER_SIZE = 40;
const NOTE_SIZE = 30;
const ENEMY_SIZE = 60;
const LIGHT_RADIUS = 100;

const Index = () => {
  const { toast } = useToast();
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameover' | 'victory'>('menu');
  const [playerPos, setPlayerPos] = useState<Position>({ x: MAP_WIDTH / 2, y: MAP_HEIGHT / 2 });
  const [enemyPos, setEnemyPos] = useState<Position>({ x: 100, y: 100 });
  const [cameraOffset, setCameraOffset] = useState<Position>({ x: 0, y: 0 });
  const [notes, setNotes] = useState<Note[]>([]);
  const [obstacles, setObstacles] = useState<TreeObstacle[]>([]);
  const [foundNotes, setFoundNotes] = useState(0);
  const [enemySpeed, setEnemySpeed] = useState(0.8);
  const [showScreamer, setShowScreamer] = useState(false);
  const [dangerLevel, setDangerLevel] = useState(0);
  const [joystickActive, setJoystickActive] = useState(false);
  const [joystickPos, setJoystickPos] = useState<Position>({ x: 0, y: 0 });
  const [isMoving, setIsMoving] = useState(false);
  const keysPressed = useRef<Set<string>>(new Set());
  const gameLoopRef = useRef<number>();
  const bgMusicRef = useRef<HTMLAudioElement | null>(null);
  const stepSoundRef = useRef<HTMLAudioElement | null>(null);

  const initGame = useCallback(() => {
    const newObstacles: TreeObstacle[] = [];
    for (let i = 0; i < 80; i++) {
      const types: ('tree' | 'bush' | 'grave')[] = ['tree', 'bush', 'grave'];
      newObstacles.push({
        id: i,
        x: Math.random() * (MAP_WIDTH - 60),
        y: Math.random() * (MAP_HEIGHT - 60),
        type: types[Math.floor(Math.random() * types.length)]
      });
    }
    
    const newNotes: Note[] = NOTES_TEXTS.map((text, i) => {
      const treeIndex = Math.floor(Math.random() * newObstacles.length);
      const tree = newObstacles[treeIndex];
      return {
        id: i,
        x: tree.x + 20,
        y: tree.y - 10,
        text,
        found: false
      };
    });
    
    setObstacles(newObstacles);
    setNotes(newNotes);
    setPlayerPos({ x: MAP_WIDTH / 2, y: MAP_HEIGHT / 2 });
    setEnemyPos({ x: 200, y: 200 });
    setFoundNotes(0);
    setEnemySpeed(0.8);
    setDangerLevel(0);
    setShowScreamer(false);
    setGameState('playing');

    if (bgMusicRef.current) {
      bgMusicRef.current.currentTime = 0;
      bgMusicRef.current.play().catch(() => {});
    }
  }, []);

  const teleportEnemy = useCallback(() => {
    const angle = Math.random() * Math.PI * 2;
    const distance = 300 + Math.random() * 200;
    const newX = Math.max(0, Math.min(MAP_WIDTH - ENEMY_SIZE, playerPos.x + Math.cos(angle) * distance));
    const newY = Math.max(0, Math.min(MAP_HEIGHT - ENEMY_SIZE, playerPos.y + Math.sin(angle) * distance));
    setEnemyPos({ x: newX, y: newY });
  }, [playerPos]);

  useEffect(() => {
    bgMusicRef.current = new Audio('https://cdn.pixabay.com/download/audio/2022/03/15/audio_4a3f9f3efd.mp3');
    bgMusicRef.current.loop = true;
    bgMusicRef.current.volume = 0.3;

    stepSoundRef.current = new Audio('https://cdn.pixabay.com/download/audio/2022/03/10/audio_c8c4c1d9f0.mp3');
    stepSoundRef.current.volume = 0.2;

    return () => {
      if (bgMusicRef.current) {
        bgMusicRef.current.pause();
      }
    };
  }, []);

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

  const handleJoystickStart = (e: React.TouchEvent | React.MouseEvent) => {
    setJoystickActive(true);
    e.preventDefault();
  };

  const handleJoystickMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!joystickActive) return;
    
    const joystickBase = document.getElementById('joystick-base');
    if (!joystickBase) return;

    const rect = joystickBase.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const deltaX = clientX - centerX;
    const deltaY = clientY - centerY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const maxDistance = 40;

    if (distance > maxDistance) {
      const angle = Math.atan2(deltaY, deltaX);
      setJoystickPos({ x: Math.cos(angle) * maxDistance, y: Math.sin(angle) * maxDistance });
    } else {
      setJoystickPos({ x: deltaX, y: deltaY });
    }
  };

  const handleJoystickEnd = () => {
    setJoystickActive(false);
    setJoystickPos({ x: 0, y: 0 });
  };

  useEffect(() => {
    if (gameState !== 'playing') return;

    const gameLoop = () => {
      let moved = false;

      setPlayerPos(prev => {
        let newX = prev.x;
        let newY = prev.y;
        const speed = 3;

        if (keysPressed.current.has('w') || keysPressed.current.has('arrowup')) {
          newY -= speed;
          moved = true;
        }
        if (keysPressed.current.has('s') || keysPressed.current.has('arrowdown')) {
          newY += speed;
          moved = true;
        }
        if (keysPressed.current.has('a') || keysPressed.current.has('arrowleft')) {
          newX -= speed;
          moved = true;
        }
        if (keysPressed.current.has('d') || keysPressed.current.has('arrowright')) {
          newX += speed;
          moved = true;
        }

        if (joystickActive) {
          const joySpeed = 3;
          newX += (joystickPos.x / 40) * joySpeed;
          newY += (joystickPos.y / 40) * joySpeed;
          moved = Math.abs(joystickPos.x) > 5 || Math.abs(joystickPos.y) > 5;
        }

        newX = Math.max(PLAYER_SIZE, Math.min(MAP_WIDTH - PLAYER_SIZE, newX));
        newY = Math.max(PLAYER_SIZE, Math.min(MAP_HEIGHT - PLAYER_SIZE, newY));

        return { x: newX, y: newY };
      });

      setIsMoving(moved);

      if (moved && stepSoundRef.current && stepSoundRef.current.paused) {
        stepSoundRef.current.currentTime = 0;
        stepSoundRef.current.play().catch(() => {});
      } else if (!moved && stepSoundRef.current) {
        stepSoundRef.current.pause();
      }

      setCameraOffset({
        x: Math.max(0, Math.min(MAP_WIDTH - VIEWPORT_WIDTH, playerPos.x - VIEWPORT_WIDTH / 2)),
        y: Math.max(0, Math.min(MAP_HEIGHT - VIEWPORT_HEIGHT, playerPos.y - VIEWPORT_HEIGHT / 2))
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

      if (distToEnemy < 200) {
        setDangerLevel(Math.min(100, (200 - distToEnemy) / 200 * 100));
      } else {
        setDangerLevel(0);
      }

      if (distToEnemy < 40) {
        setShowScreamer(true);
        if (bgMusicRef.current) bgMusicRef.current.pause();
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
          if (dist < 40) {
            setNotes(prev => prev.map(n => n.id === note.id ? { ...n, found: true } : n));
            setFoundNotes(prev => {
              const newCount = prev + 1;
              setEnemySpeed(s => s + 0.4);
              
              toast({
                title: '📜 Записка найдена',
                description: note.text,
                variant: 'destructive',
              });

              if (newCount >= 10) {
                if (bgMusicRef.current) bgMusicRef.current.pause();
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
  }, [gameState, playerPos, enemyPos, enemySpeed, notes, toast, teleportEnemy, joystickActive, joystickPos]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1a0f0f] p-4">
      {gameState === 'menu' && (
        <Card className="p-8 bg-[#2d1b1b] border-[#4a2828] text-center animate-fade-in max-w-xl">
          <h1 className="text-6xl font-horror text-[#ea384c] mb-6 animate-flicker">
            WHITE LILY'S NIGHTMARE
          </h1>
          <p className="text-lg text-[#666666] mb-8 font-mono">
            Найди 10 записок в темном лесу. Silent Salt Cookie преследует тебя и ускоряется с каждой найденной запиской. 
            Он может телепортироваться. Не дай ему поймать себя.
          </p>
          <div className="space-y-4 mb-6">
            <div className="text-sm text-[#999] font-mono">
              <p>🎮 ПК: WASD или стрелки</p>
              <p>📱 Телефон: виртуальный джойстик</p>
              <p>💡 От тебя исходит слабый свет</p>
              <p>🌲 Записки прикреплены к деревьям</p>
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
              ⚡ Скорость: <span className="text-[#ea384c] font-bold">{enemySpeed.toFixed(1)}x</span>
            </div>
          </div>

          <div 
            className={`relative bg-[#000a0a] border-4 border-[#2d1b1b] overflow-hidden ${dangerLevel > 50 ? 'animate-shake' : ''}`}
            style={{ 
              width: VIEWPORT_WIDTH, 
              height: VIEWPORT_HEIGHT,
              backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 35px, rgba(45, 27, 27, 0.05) 35px, rgba(45, 27, 27, 0.05) 36px),
                               repeating-linear-gradient(90deg, transparent, transparent 35px, rgba(45, 27, 27, 0.05) 35px, rgba(45, 27, 27, 0.05) 36px)`
            }}
          >
            <div
              className="absolute rounded-full pointer-events-none"
              style={{
                left: playerPos.x - cameraOffset.x - LIGHT_RADIUS / 2 + PLAYER_SIZE / 2,
                top: playerPos.y - cameraOffset.y - LIGHT_RADIUS / 2 + PLAYER_SIZE / 2,
                width: LIGHT_RADIUS,
                height: LIGHT_RADIUS,
                background: `radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%)`,
                animation: 'pulse-glow 2s infinite'
              }}
            />

            {obstacles.map(obstacle => {
              const screenX = obstacle.x - cameraOffset.x;
              const screenY = obstacle.y - cameraOffset.y;
              if (screenX < -60 || screenX > VIEWPORT_WIDTH || screenY < -60 || screenY > VIEWPORT_HEIGHT) return null;
              
              return (
                <div
                  key={obstacle.id}
                  className="absolute text-4xl opacity-70"
                  style={{ left: screenX, top: screenY }}
                >
                  {obstacle.type === 'tree' ? '🌲' : obstacle.type === 'bush' ? '🌿' : '🪦'}
                </div>
              );
            })}

            {notes.map(note => {
              if (note.found) return null;
              const screenX = note.x - cameraOffset.x;
              const screenY = note.y - cameraOffset.y;
              if (screenX < -30 || screenX > VIEWPORT_WIDTH || screenY < -30 || screenY > VIEWPORT_HEIGHT) return null;

              return (
                <div
                  key={note.id}
                  className="absolute text-2xl animate-pulse"
                  style={{ left: screenX, top: screenY }}
                  title={note.text}
                >
                  📜
                </div>
              );
            })}

            <div
              className="absolute text-4xl transition-all duration-100"
              style={{ 
                left: playerPos.x - cameraOffset.x, 
                top: playerPos.y - cameraOffset.y 
              }}
            >
              🌸
            </div>

            <img
              src="https://cdn.poehali.dev/files/0952eae0-f588-49c6-986a-59692520ea50.png"
              alt="Silent Salt Cookie"
              className="absolute transition-opacity"
              style={{ 
                left: enemyPos.x - cameraOffset.x - 10, 
                top: enemyPos.y - cameraOffset.y - 10,
                width: ENEMY_SIZE,
                height: ENEMY_SIZE,
                opacity: dangerLevel > 30 ? 1 : 0.4,
                filter: `drop-shadow(0 0 ${dangerLevel / 3}px #8B5CF6)`,
                objectFit: 'contain'
              }}
            />

            {dangerLevel > 50 && (
              <div 
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: `radial-gradient(circle at ${playerPos.x - cameraOffset.x}px ${playerPos.y - cameraOffset.y}px, transparent, rgba(139, 92, 246, ${dangerLevel / 300}))`
                }}
              />
            )}
          </div>

          <div
            id="joystick-base"
            className="fixed bottom-20 left-8 w-32 h-32 bg-[#2d1b1b] rounded-full border-4 border-[#4a2828] flex items-center justify-center md:hidden"
            onTouchStart={handleJoystickStart}
            onTouchMove={handleJoystickMove}
            onTouchEnd={handleJoystickEnd}
            onMouseDown={handleJoystickStart}
            onMouseMove={handleJoystickMove}
            onMouseUp={handleJoystickEnd}
            onMouseLeave={handleJoystickEnd}
          >
            <div
              className="w-12 h-12 bg-[#ea384c] rounded-full transition-transform"
              style={{
                transform: `translate(${joystickPos.x}px, ${joystickPos.y}px)`
              }}
            />
          </div>

          {dangerLevel > 70 && (
            <div className="mt-2 text-center">
              <p className="text-[#8B5CF6] font-horror text-xl animate-flicker">
                ⚠️ SILENT SALT БЛИЗКО ⚠️
              </p>
            </div>
          )}
        </div>
      )}

      {showScreamer && (
        <div className="fixed inset-0 bg-black flex items-center justify-center z-50 animate-fade-in">
          <img
            src="https://cdn.poehali.dev/files/0952eae0-f588-49c6-986a-59692520ea50.png"
            alt="Screamer"
            className="w-96 h-96 animate-shake"
            style={{ filter: 'brightness(1.5) contrast(1.5)' }}
          />
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
        <Card className="p-8 bg-[#2d1b1b] border-[#4a2828] text-center animate-fade-in max-w-xl">
          <h2 className="text-5xl font-horror text-white mb-4">
            WHITE LILY УЗНАЛА ПРАВДУ
          </h2>
          <p className="text-xl text-[#666666] mb-6 font-mono">
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
