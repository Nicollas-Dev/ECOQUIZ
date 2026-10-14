import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { Button } from "./Button";

export function PinPanel({ pin }: { pin: string }) {
  const [copied, setCopied] = useState(false);

  const copyPin = async () => {
    await navigator.clipboard.writeText(pin);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <section className="rounded-lg border border-eco-200 bg-white p-5 shadow-sm" aria-label="PIN da sala">
      <p className="text-sm font-semibold text-eco-700">PIN da sala</p>
      <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <strong className="text-5xl font-black tracking-normal text-eco-950 sm:text-6xl">{pin}</strong>
        <Button type="button" variant="secondary" icon={copied ? <Check size={18} /> : <Copy size={18} />} onClick={copyPin}>
          {copied ? "Copiado" : "Copiar PIN"}
        </Button>
      </div>
    </section>
  );
}
