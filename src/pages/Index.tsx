import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import GameMenu from '@/components/GameMenu';
import GameCanvas from '@/components/GameCanvas';
import GameOverScreen from '@/components/GameOverScreen';
import VictoryScreen from '@/components/VictoryScreen';
import MobileJoystick from '@/components/MobileJoystick';
import Screamer from '@/components/Screamer';

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
      {gameState === 'menu' && <GameMenu onStartGame={initGame} />}

      {gameState === 'playing' && (
        <>
          <GameCanvas
            playerPos={playerPos}
            enemyPos={enemyPos}
            cameraOffset={cameraOffset}
            notes={notes}
            obstacles={obstacles}
            dangerLevel={dangerLevel}
            foundNotes={foundNotes}
            enemySpeed={enemySpeed}
            VIEWPORT_WIDTH={VIEWPORT_WIDTH}
            VIEWPORT_HEIGHT={VIEWPORT_HEIGHT}
            PLAYER_SIZE={PLAYER_SIZE}
            ENEMY_SIZE={ENEMY_SIZE}
            LIGHT_RADIUS={LIGHT_RADIUS}
          />
          <MobileJoystick
            joystickActive={joystickActive}
            joystickPos={joystickPos}
            onJoystickStart={handleJoystickStart}
            onJoystickMove={handleJoystickMove}
            onJoystickEnd={handleJoystickEnd}
          />
        </>
      )}

      <Screamer show={showScreamer} />

      {gameState === 'gameover' && (
        <GameOverScreen
          foundNotes={foundNotes}
          onRetry={initGame}
          onBackToMenu={() => setGameState('menu')}
        />
      )}

      {gameState === 'victory' && (
        <VictoryScreen
          onPlayAgain={initGame}
          onBackToMenu={() => setGameState('menu')}
        />
      )}
    </div>
  );
};

export default Index;
