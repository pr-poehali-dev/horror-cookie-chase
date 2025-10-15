interface MobileJoystickProps {
  joystickActive: boolean;
  joystickPos: { x: number; y: number };
  onJoystickStart: (e: React.TouchEvent | React.MouseEvent) => void;
  onJoystickMove: (e: React.TouchEvent | React.MouseEvent) => void;
  onJoystickEnd: () => void;
}

const MobileJoystick = ({
  joystickActive,
  joystickPos,
  onJoystickStart,
  onJoystickMove,
  onJoystickEnd
}: MobileJoystickProps) => {
  return (
    <div
      id="joystick-base"
      className="fixed bottom-20 left-8 w-32 h-32 bg-[#2d1b1b] rounded-full border-4 border-[#4a2828] flex items-center justify-center md:hidden"
      onTouchStart={onJoystickStart}
      onTouchMove={onJoystickMove}
      onTouchEnd={onJoystickEnd}
      onMouseDown={onJoystickStart}
      onMouseMove={onJoystickMove}
      onMouseUp={onJoystickEnd}
      onMouseLeave={onJoystickEnd}
    >
      <div
        className="w-12 h-12 bg-[#ea384c] rounded-full transition-transform"
        style={{
          transform: `translate(${joystickPos.x}px, ${joystickPos.y}px)`
        }}
      />
    </div>
  );
};

export default MobileJoystick;
