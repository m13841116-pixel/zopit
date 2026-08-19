import { getPrisma } from '../../prisma.js';
import crypto from 'crypto';

export interface PaymentLogEntry {
  requestId: string;
  gateway?: string;
  action: string;
  status: string;
  targetUrl?: string;
  httpStatus?: number;
  durationMs?: number;
  dnsMs?: number;
  connectMs?: number;
  tlsMs?: number;
  errorMessage?: string;
  errorCode?: string;
  requestBody?: any;
  responseBody?: any;
  orderId?: string;
  userId?: number;
}

export class PaymentLogger {
  static generateRequestId(): string {
    if (typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  static maskSensitiveData(payload: any): string | null {
    if (!payload) return null;
    
    let parsedPayload: any;
    if (typeof payload === 'string') {
      try {
        parsedPayload = JSON.parse(payload);
      } catch {
        return payload;
      }
    } else {
      parsedPayload = JSON.parse(JSON.stringify(payload));
    }

    const recursiveMask = (obj: any) => {
      if (!obj || typeof obj !== 'object') return;
      for (const key of Object.keys(obj)) {
        if (typeof obj[key] === 'string' || typeof obj[key] === 'number') {
          const lowerKey = key.toLowerCase();
          const strVal = String(obj[key]);
          
          if (lowerKey === 'merchantid' || lowerKey === 'merchant' || lowerKey === 'terminalid') {
            obj[key] = strVal.length > 4 ? '***' + strVal.substring(strVal.length - 4) : '***';
          } 
          else if (lowerKey === 'iban' || lowerKey === 'shaba') {
            obj[key] = strVal.length > 4 ? '***' + strVal.substring(strVal.length - 4) : '***';
          } 
          else if (lowerKey === 'mobile' || lowerKey === 'cellnumber') {
            obj[key] = strVal.length > 3 ? '***' + strVal.substring(strVal.length - 3) : '***';
          }
          else if (['key', 'secret', 'token', 'authorization', 'x-api-key', 'x-proxy-secret'].includes(lowerKey)) {
            obj[key] = '[MASKED]';
          }
          else if (lowerKey === 'callbackurl') {
            try {
              const url = new URL(strVal);
              obj[key] = url.origin + url.pathname;
            } catch (e) {
              // Ignore invalid url
            }
          }
        } else if (typeof obj[key] === 'object') {
          recursiveMask(obj[key]);
        }
      }
    };

    recursiveMask(parsedPayload);
    return JSON.stringify(parsedPayload);
  }

  static async logPaymentEvent(entry: PaymentLogEntry): Promise<void> {
    const maskedReq = this.maskSensitiveData(entry.requestBody);
    const maskedRes = this.maskSensitiveData(entry.responseBody);

    try {
      const prisma = getPrisma();
      await prisma.paymentLog.create({
        data: {
          requestId: entry.requestId,
          gateway: entry.gateway || 'ZIBAL',
          action: entry.action,
          status: entry.status,
          targetUrl: entry.targetUrl,
          httpStatus: entry.httpStatus,
          durationMs: entry.durationMs,
          dnsMs: entry.dnsMs,
          connectMs: entry.connectMs,
          tlsMs: entry.tlsMs,
          errorMessage: entry.errorMessage,
          errorCode: entry.errorCode,
          requestBody: maskedReq,
          responseBody: maskedRes,
          orderId: entry.orderId,
          userId: entry.userId,
        }
      });
    } catch (dbError: any) {
      console.error(`[PaymentLogger] FATAL: Failed to save log to database: ${dbError.message}`);
    }
  }
}
