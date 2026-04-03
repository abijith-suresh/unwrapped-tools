export type HashAlgorithm = "SHA-1" | "SHA-256" | "SHA-384" | "SHA-512";

export interface HashResult {
  algorithm: HashAlgorithm;
  hex: string;
}

export const HASH_ALGORITHMS: HashAlgorithm[] = ["SHA-1", "SHA-256", "SHA-384", "SHA-512"];

export async function hashText(text: string, algorithm: HashAlgorithm): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const buffer = await crypto.subtle.digest(algorithm, data);

  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function hashTextWithAlgorithms(text: string): Promise<HashResult[]> {
  return Promise.all(
    HASH_ALGORITHMS.map(async (algorithm) => ({
      algorithm,
      hex: await hashText(text, algorithm),
    }))
  );
}
