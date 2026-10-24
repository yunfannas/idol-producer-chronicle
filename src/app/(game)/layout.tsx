import { GameProvider } from "@/components/game/game-provider";
import { BottomNav } from "@/components/shell/bottom-nav";

export default function GameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <GameProvider>
      <div className="relative mx-auto flex min-h-full w-full max-w-lg flex-1 flex-col">
        <div className="flex-1 pb-24">{children}</div>
        <BottomNav />
      </div>
    </GameProvider>
  );
}
