import crypto from 'crypto';

export interface VerificationResult {
  verified: boolean;
  originalHash: string;
  currentHash: string;
  status: 'VERIFIED' | 'TAMPERED';
  message: string;
  verifiedAt: string;
  fileSizeBytes: number;
}

export class CryptoVault {
  /**
   * Calculates a SHA-256 hash string for a buffer or string
   */
  public static calculateSha256(data: Buffer | string): string {
    const hash = crypto.createHash('sha256');
    hash.update(data);
    return hash.digest('hex');
  }

  /**
   * Verifies file integrity by recalculating the SHA-256 hash and comparing it
   */
  public static verifyFileIntegrity(
    currentData: Buffer | string,
    recordedHash: string
  ): VerificationResult {
    const currentHash = this.calculateSha256(currentData);
    const verified = currentHash.toLowerCase() === recordedHash.toLowerCase();
    const size = typeof currentData === 'string' ? Buffer.byteLength(currentData, 'utf-8') : currentData.length;

    return {
      verified,
      originalHash: recordedHash,
      currentHash,
      status: verified ? 'VERIFIED' : 'TAMPERED',
      message: verified
        ? 'Evidence integrity verified: Cryptographic SHA-256 checksum matches chain of custody.'
        : 'Warning: Cryptographic hash mismatch detected! Evidence has been altered or tampered with.',
      verifiedAt: new Date().toISOString(),
      fileSizeBytes: size,
    };
  }
}
