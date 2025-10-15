import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface GameMenuProps {
  onStartGame: () => void;
}

const GameMenu = ({ onStartGame }: GameMenuProps) => {
  return (
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
        onClick={onStartGame}
        className="bg-[#4a2828] hover:bg-[#ea384c] text-white font-horror text-2xl px-8 py-6 transition-all"
      >
        Начать игру
      </Button>
    </Card>
  );
};

export default GameMenu;
