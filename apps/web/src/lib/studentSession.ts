const keyForPin = (pin: string) => `ecoquiz:student:${pin}`;

export const saveStudentNickname = (pin: string, nickname: string) => {
  window.sessionStorage.setItem(keyForPin(pin), nickname);
};

export const getStudentNickname = (pin: string) => window.sessionStorage.getItem(keyForPin(pin));

export const clearStudentNickname = (pin: string) => {
  window.sessionStorage.removeItem(keyForPin(pin));
  window.sessionStorage.removeItem(`ecoquiz:participant:${pin}`);
  window.sessionStorage.removeItem(`ecoquiz:answers:${pin}`);
};
