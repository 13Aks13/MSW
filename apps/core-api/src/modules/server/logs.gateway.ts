import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  type OnGatewayConnection,
  type OnGatewayDisconnect,
  WebSocketGateway,
} from '@nestjs/websockets';
import type { Socket } from 'socket.io';
import { SOCKET_EVENTS } from '@mc/shared';
import { ServerService } from './server.service.js';
import type { JwtPayload } from '../auth/auth.types.js';

interface LogSocketData {
  stopStream?: () => void;
}

@WebSocketGateway({
  namespace: '/logs',
  cors: { origin: true, credentials: true },
})
export class LogsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(LogsGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly server: ServerService,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    const token = this.extractToken(client);
    if (!token) {
      client.emit(SOCKET_EVENTS.logError, { message: 'Authentication token is required' });
      client.disconnect(true);
      return;
    }

    try {
      await this.jwtService.verifyAsync<JwtPayload>(token);
    } catch {
      client.emit(SOCKET_EVENTS.logError, { message: 'Invalid or expired token' });
      client.disconnect(true);
      return;
    }

    try {
      const stop = await this.server.streamLogs((line) => {
        client.emit(SOCKET_EVENTS.logLine, line);
      });
      (client.data as LogSocketData).stopStream = stop;
      client.emit(SOCKET_EVENTS.logStatus, { connected: true });
    } catch (error) {
      this.logger.warn(`Cannot attach log stream: ${(error as Error).message}`);
      client.emit(SOCKET_EVENTS.logError, { message: (error as Error).message });
    }
  }

  handleDisconnect(client: Socket): void {
    (client.data as LogSocketData).stopStream?.();
  }

  private extractToken(client: Socket): string | null {
    const authToken = client.handshake.auth?.token;
    if (typeof authToken === 'string' && authToken.length > 0) return authToken;

    const header = client.handshake.headers.authorization;
    if (typeof header === 'string' && header.startsWith('Bearer ')) {
      return header.slice('Bearer '.length);
    }

    const queryToken = client.handshake.query?.token;
    return typeof queryToken === 'string' ? queryToken : null;
  }
}
