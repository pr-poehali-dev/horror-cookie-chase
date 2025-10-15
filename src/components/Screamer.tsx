interface ScreamerProps {
  show: boolean;
}

const Screamer = ({ show }: ScreamerProps) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center z-50 animate-fade-in">
      <img
        src="https://cdn.poehali.dev/files/0952eae0-f588-49c6-986a-59692520ea50.png"
        alt="Screamer"
        className="w-96 h-96 animate-shake"
        style={{ filter: 'brightness(1.5) contrast(1.5)' }}
      />
    </div>
  );
};

export default Screamer;
