export class MessageEncryption {
  private static readonly ALGORITHM = 'AES-GCM';
  private static readonly KEY_LENGTH = 256;
  private static readonly IV_LENGTH = 12;

  // Convert encryption key from base64 to Uint8Array
  private static async importKey(base64Key: string): Promise<CryptoKey> {
    const keyBytes = Uint8Array.from(atob(base64Key), c => c.charCodeAt(0));
    
    // Validate key length
    if (keyBytes.length * 8 !== this.KEY_LENGTH) {
      throw new Error(`Invalid key length. Expected ${this.KEY_LENGTH} bits but got ${keyBytes.length * 8} bits`);
    }

    return await crypto.subtle.importKey(
      'raw',
      keyBytes,
      this.ALGORITHM,
      false,
      ['encrypt', 'decrypt']
    );
  }

  // Generate a random IV
  private static generateIV(): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(this.IV_LENGTH));
  }

  // Encrypt message
  public static async encrypt(message: string, base64Key: string): Promise<string> {
    try {
      const key = await this.importKey(base64Key);
      const iv = this.generateIV();
      const encodedMessage = new TextEncoder().encode(message);

      const encryptedData = await crypto.subtle.encrypt(
        {
          name: this.ALGORITHM,
          iv
        },
        key,
        encodedMessage
      );

      // Combine IV and encrypted data
      const combined = new Uint8Array(iv.length + new Uint8Array(encryptedData).length);
      combined.set(iv);
      combined.set(new Uint8Array(encryptedData), iv.length);

      // Convert to base64
      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt message');
    }
  }

  // Decrypt message
  public static async decrypt(encryptedMessage: string, base64Key: string): Promise<string> {
    try {
      const key = await this.importKey(base64Key);
      const combined = Uint8Array.from(atob(encryptedMessage), c => c.charCodeAt(0));

      // Extract IV and encrypted data
      const iv = combined.slice(0, this.IV_LENGTH);
      const encryptedData = combined.slice(this.IV_LENGTH);

      const decryptedData = await crypto.subtle.decrypt(
        {
          name: this.ALGORITHM,
          iv
        },
        key,
        encryptedData
      );

      return new TextDecoder().decode(decryptedData);
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt message');
    }
  }
}