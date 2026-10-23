import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { DashboardDto, ServerStatsDto, ServerStatusDto } from '@mc/shared';
import { ServerService } from './server.service.js';
import { Roles } from '../../common/decorators/roles.decorator.js';

@ApiTags('server')
@ApiBearerAuth()
@Controller('server')
export class ServerController {
  constructor(private readonly server: ServerService) {}

  @Get('status')
  status(): Promise<ServerStatusDto> {
    return this.server.status();
  }

  @Get('stats')
  stats(): Promise<ServerStatsDto> {
    return this.server.stats();
  }

  @Get('dashboard')
  dashboard(): Promise<DashboardDto> {
    return this.server.dashboard();
  }

  @Post('start')
  @HttpCode(202)
  @Roles('admin', 'moderator')
  start(): Promise<void> {
    return this.server.start();
  }

  @Post('stop')
  @HttpCode(202)
  @Roles('admin', 'moderator')
  stop(): Promise<void> {
    return this.server.stop();
  }

  @Post('restart')
  @HttpCode(202)
  @Roles('admin', 'moderator')
  restart(): Promise<void> {
    return this.server.restart();
  }

  @Post('command')
  @Roles('admin', 'moderator')
  @ApiOperation({ summary: 'Send a command to the Bedrock console' })
  command(@Body('command') command: string): Promise<{ output: string }> {
    return this.server.sendCommand(command).then((output) => ({ output }));
  }

  @Get('logs')
  @Header('Content-Type', 'text/plain; charset=utf-8')
  async logs(@Query('tail') tail?: string): Promise<string> {
    const parsed = Number(tail ?? 500);
    return this.server.logsText(Number.isFinite(parsed) ? Math.min(Math.max(parsed, 1), 10_000) : 500);
  }
}
