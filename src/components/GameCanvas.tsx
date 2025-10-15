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

interface GameCanvasProps {
  playerPos: Position;
  enemyPos: Position;
  cameraOffset: Position;
  notes: Note[];
  obstacles: TreeObstacle[];
  dangerLevel: number;
  foundNotes: number;
  enemySpeed: number;
  VIEWPORT_WIDTH: number;
  VIEWPORT_HEIGHT: number;
  PLAYER_SIZE: number;
  ENEMY_SIZE: number;
  LIGHT_RADIUS: number;
}

const GameCanvas = ({
  playerPos,
  enemyPos,
  cameraOffset,
  notes,
  obstacles,
  dangerLevel,
  foundNotes,
  enemySpeed,
  VIEWPORT_WIDTH,
  VIEWPORT_HEIGHT,
  PLAYER_SIZE,
  ENEMY_SIZE,
  LIGHT_RADIUS
}: GameCanvasProps) => {
  return (
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
          if (screenX < -80 || screenX > VIEWPORT_WIDTH || screenY < -80 || screenY > VIEWPORT_HEIGHT) return null;
          
          const getObstacleImage = () => {
            if (obstacle.type === 'tree') {
              return 'https://cdn.poehali.dev/files/69bc9e51-70a8-4af0-b002-2829274f9fc0.jpeg';
            } else if (obstacle.type === 'bush') {
              return 'https://cdn.poehali.dev/files/295ea2ce-f1a9-4227-9a4b-fdb96c3f5cc6.jpeg';
            }
            return null;
          };

          const imageUrl = getObstacleImage();
          
          if (imageUrl) {
            return (
              <img
                key={obstacle.id}
                src={imageUrl}
                alt={obstacle.type}
                className="absolute opacity-80"
                style={{ 
                  left: screenX, 
                  top: screenY,
                  width: obstacle.type === 'tree' ? 70 : 60,
                  height: obstacle.type === 'tree' ? 70 : 60,
                  objectFit: 'contain',
                  filter: 'brightness(0.7) contrast(1.2)'
                }}
              />
            );
          }

          return (
            <div
              key={obstacle.id}
              className="absolute text-4xl opacity-70"
              style={{ left: screenX, top: screenY }}
            >
              🪦
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

        <img
          src="https://cdn.poehali.dev/files/918bcd77-9671-4bae-a96d-596d5cfda64d.png"
          alt="White Lily Cookie"
          className="absolute transition-all duration-100"
          style={{ 
            left: playerPos.x - cameraOffset.x - 10, 
            top: playerPos.y - cameraOffset.y - 10,
            width: PLAYER_SIZE + 20,
            height: PLAYER_SIZE + 20,
            objectFit: 'contain'
          }}
        />

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

      {dangerLevel > 70 && (
        <div className="mt-2 text-center">
          <p className="text-[#8B5CF6] font-horror text-xl animate-flicker">
            ⚠️ SILENT SALT БЛИЗКО ⚠️
          </p>
        </div>
      )}
    </div>
  );
};

export default GameCanvas;