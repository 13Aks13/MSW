import { PACK_TYPES, type PackType } from "@mc/shared";
import { IsEnum, IsOptional } from "class-validator";

export class ImportQueryDto {
  @IsEnum(PACK_TYPES)
  type!: PackType;

  @IsOptional()
  @IsEnum(["skip", "replace"])
  onDuplicate?: "skip" | "replace";
}

export class BundleQueryDto {
  @IsOptional()
  @IsEnum(["skip", "replace"])
  onDuplicate?: "skip" | "replace";
}
