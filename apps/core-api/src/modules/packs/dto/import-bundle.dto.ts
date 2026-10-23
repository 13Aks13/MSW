import { IsEnum, IsOptional } from 'class-validator';
import { PACK_TYPES, type PackType } from '@mc/shared';

export class ImportQueryDto {
  @IsEnum(PACK_TYPES)
  type!: PackType;

  @IsOptional()
  @IsEnum(['skip', 'replace'])
  onDuplicate?: 'skip' | 'replace';
}

export class BundleQueryDto {
  @IsOptional()
  @IsEnum(['skip', 'replace'])
  onDuplicate?: 'skip' | 'replace';
}
