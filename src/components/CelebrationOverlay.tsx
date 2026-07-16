type CelebrationOverlayProps = {
  visible: boolean;
};

const pieces = Array.from({ length: 18 }, (_, index) => ({
  id: index,
  left: `${6 + index * 5}%`,
  delay: `${(index % 6) * 0.12}s`,
  duration: `${2.6 + (index % 5) * 0.2}s`,
}));

export default function CelebrationOverlay({ visible }: CelebrationOverlayProps) {
  if (!visible) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-teal-950/15 backdrop-blur-[2px]" />
      <div className="absolute inset-x-0 top-20 mx-auto flex max-w-md flex-col items-center rounded-3xl border border-teal-200/70 bg-white/90 px-6 py-5 text-center shadow-2xl shadow-teal-900/15">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-teal-600">축하합니다</p>
        <h3 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">고정비 100% 완료</h3>
        <p className="mt-2 text-sm text-slate-600">이제부터 벌어들이는 금액은 온전한 순이익으로 따로 쌓입니다.</p>
      </div>
      {pieces.map((piece) => (
        <span
          key={piece.id}
          className="confetti-piece absolute top-0 h-4 w-2 rounded-full"
          style={{
            left: piece.left,
            animationDelay: piece.delay,
            animationDuration: piece.duration,
          }}
        />
      ))}
    </div>
  );
}
