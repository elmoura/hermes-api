import { createHash, randomBytes, timingSafeEqual } from 'crypto';
import { Injectable } from '@nestjs/common';

@Injectable()
export class Md5HashService {
  /**
   * Token opaco em formato MD5 (hex) derivado de entropia aleatória.
   */
  randomMd5Token(): string {
    return this.encrypt(randomBytes(32).toString('hex'));
  }

  encrypt(plain: string): string {
    return createHash('md5').update(plain, 'utf8').digest('hex');
  }

  /**
   * Confere se `digest` (MD5 em hex) corresponde a `plain`.
   * MD5 não é reversível; o nome segue a convenção de API do projeto.
   */
  decrypt(digest: string, plain: string): boolean {
    const expected = this.encrypt(plain);
    if (digest.length !== expected.length) {
      return false;
    }

    try {
      return timingSafeEqual(
        Buffer.from(digest, 'hex'),
        Buffer.from(expected, 'hex'),
      );
    } catch {
      return false;
    }
  }
}
