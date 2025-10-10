/**
 * True Random Helper Logic
 * Uses Web Crypto API for cryptographically secure random numbers
 */

/**
 * Generate a cryptographically secure random index
 * Uses rejection sampling to avoid modulo bias
 * @param max - Maximum value (exclusive)
 * @returns Random index between 0 and max-1
 */
export function getRandomIndex(max: number): number {
  if (max <= 0) {
    throw new Error('Max must be greater than 0');
  }

  // For small max values, use rejection sampling to avoid modulo bias
  const randomBuffer = new Uint32Array(1);
  const range = 2 ** 32; // Maximum value of Uint32
  const limit = range - (range % max); // Largest multiple of max that fits in range

  let randomValue: number;

  // Rejection sampling: keep generating until we get a value in the unbiased range
  do {
    crypto.getRandomValues(randomBuffer);
    randomValue = randomBuffer[0]!;
  } while (randomValue >= limit);

  // Now modulo is safe because we're within a perfect multiple of max
  return randomValue % max;
}

/**
 * Shuffle an array using Fisher-Yates algorithm with crypto random
 * @param array - Array to shuffle
 * @returns Shuffled array
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = getRandomIndex(i + 1);
    const temp = shuffled[i];
    const item = shuffled[j];

    if (temp !== undefined && item !== undefined) {
      shuffled[i] = item;
      shuffled[j] = temp;
    }
  }

  return shuffled;
}

