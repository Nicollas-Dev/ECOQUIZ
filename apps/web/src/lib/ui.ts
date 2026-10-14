import { clsx, type ClassValue } from "clsx";

export const cn = (...values: ClassValue[]) => clsx(values);

export const optionClass = (label: string) => {
  const key = label.toLowerCase();
  return key === "a" || key === "b" || key === "c" || key === "d" ? `answer-${key}` : "answer-a";
};

export const formatScore = (score: number) => new Intl.NumberFormat("pt-BR").format(score);
