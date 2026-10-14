import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import { X } from "lucide-react";

export function Dialog({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { ref.current?.showModal(); return () => ref.current?.close(); }, []);
  return <dialog ref={ref} onCancel={onClose} className="dialog" aria-label={title}>
    <div className="flex items-center justify-between gap-4 border-b border-eco-200 pb-4">
      <h2 className="text-xl font-bold">{title}</h2>
      <button type="button" className="icon-button" title="Fechar" aria-label="Fechar" onClick={onClose}><X size={20} /></button>
    </div>
    <div className="mt-5">{children}</div>
  </dialog>;
}
