import { useEffect, useMemo, useState } from "react";

export function TimerBar({
  endsAt,
  serverNow,
  durationSeconds
}: {
  endsAt?: number;
  serverNow: number;
  durationSeconds: number;
}) {
  const [clientNow, setClientNow] = useState(Date.now());
  const serverOffset = useMemo(() => serverNow - Date.now(), [serverNow]);

  useEffect(() => {
    const interval = window.setInterval(() => setClientNow(Date.now()), 250);
    return () => window.clearInterval(interval);
  }, []);

  const remainingMs = endsAt ? Math.max(0, endsAt - (clientNow + serverOffset)) : 0;
  const remainingSeconds = Math.ceil(remainingMs / 1000);
  const percent = durationSeconds > 0 ? Math.max(0, Math.min(100, (remainingMs / (durationSeconds * 1000)) * 100)) : 0;

  return (
    <div className="grid gap-2" aria-label={`Tempo restante: ${remainingSeconds} segundos`}>
      <div className="flex items-center justify-between text-sm font-bold text-eco-700">
        <span>Tempo</span>
        <span>{remainingSeconds}s</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-eco-100">
        <div className="h-full rounded-full bg-eco-700 transition-[width]" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
