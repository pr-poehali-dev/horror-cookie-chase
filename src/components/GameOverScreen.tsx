import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface GameOverScreenProps {
  foundNotes: number;
  onRetry: () => void;
  onBackToMenu: () => void;
}

const GameOverScreen = ({ foundNotes, onRetry, onBackToMenu }: GameOverScreenProps) => {
  return (
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
          onClick={onRetry}
          className="bg-[#4a2828] hover:bg-[#ea384c] text-white font-horror text-xl px-6 py-4"
        >
          Попробовать снова
        </Button>
        <Button 
          onClick={onBackToMenu}
          variant="outline"
          className="border-[#4a2828] text-[#666666] hover:bg-[#2d1b1b] font-horror text-xl px-6 py-4"
        >
          В меню
        </Button>
      </div>
    </Card>
  );
};

export default GameOverScreen;
