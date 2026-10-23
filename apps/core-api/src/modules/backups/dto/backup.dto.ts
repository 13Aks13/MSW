import { IsOptional, IsUUID } from 'class-validator';

export class CreateBackupDto {
  @IsOptional()
  @IsUUID('4')
  worldId?: string;
}

export class RestoreBackupDto {
  @IsUUID('4')
  worldId!: string;
}
