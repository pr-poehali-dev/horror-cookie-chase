import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface VictoryScreenProps {
  onPlayAgain: () => void;
  onBackToMenu: () => void;
}

const VictoryScreen = ({ onPlayAgain, onBackToMenu }: VictoryScreenProps) => {
  return (
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
          onClick={onPlayAgain}
          className="bg-[#4a2828] hover:bg-[#666666] text-white font-horror text-xl px-6 py-4"
        >
          Играть снова
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

export default VictoryScreen;
