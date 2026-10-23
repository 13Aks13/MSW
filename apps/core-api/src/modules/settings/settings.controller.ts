import { Body, Controller, Get, Post, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { ServerPropertyDto } from '@mc/shared';
import { SettingsService } from './settings.service.js';
import { ServerService } from '../server/server.service.js';
import { Roles } from '../../common/decorators/roles.decorator.js';

@ApiTags('settings')
@ApiBearerAuth()
@Controller('settings')
export class SettingsController {
  constructor(
    private readonly settings: SettingsService,
    private readonly server: ServerService,
  ) {}

  @Get('server-properties')
  list(): Promise<ServerPropertyDto[]> {
    return this.settings.list();
  }

  @Put('server-properties')
  @Roles('admin', 'moderator')
  @ApiOperation({ summary: 'Update allow-listed server.properties values (restart required)' })
  update(@Body() updates: Record<string, string>): Promise<ServerPropertyDto[]> {
    return this.settings.update(updates);
  }

  @Post('apply')
  @Roles('admin', 'moderator')
  @ApiOperation({ summary: 'Restart Bedrock to apply pending settings' })
  async apply(): Promise<{ restarted: true }> {
    await this.server.restart();
    return { restarted: true };
  }
}
