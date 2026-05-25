export function formatQueueNumber(sequence: number, length: number, padCharacter = '0'): string {
  const normalizedLength = Math.max(1, Math.min(6, Math.trunc(length)));
  const normalizedSequence = Math.max(0, Math.trunc(sequence));
  const normalizedPadCharacter = padCharacter.length > 0 ? padCharacter[0] : '0';

  return normalizedSequence.toString().padStart(normalizedLength, normalizedPadCharacter);
}
