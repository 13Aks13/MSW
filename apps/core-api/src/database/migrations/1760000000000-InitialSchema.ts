import type { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1760000000000 implements MigrationInterface {
  name = 'InitialSchema1760000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "email" varchar(320) NOT NULL,
        "password_hash" varchar(255) NOT NULL,
        "role" varchar(20) NOT NULL DEFAULT 'admin',
        "is_active" boolean NOT NULL DEFAULT true,
        "last_login_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "uq_users_email" UNIQUE ("email"),
        CONSTRAINT "chk_users_role" CHECK ("role" IN ('admin', 'moderator', 'viewer'))
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "packs" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" varchar(255) NOT NULL,
        "pack_uuid" uuid NOT NULL,
        "version" varchar(50) NOT NULL,
        "version_array" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "type" varchar(20) NOT NULL,
        "folder_name" varchar(255) NOT NULL,
        "icon_path" text,
        "size_bytes" bigint NOT NULL DEFAULT 0,
        "dependencies" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "manifest" jsonb NOT NULL,
        "source_bundle" varchar(255),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "uq_packs_pack_uuid" UNIQUE ("pack_uuid"),
        CONSTRAINT "uq_packs_folder" UNIQUE ("type", "folder_name"),
        CONSTRAINT "chk_packs_type" CHECK ("type" IN ('resource', 'behavior'))
      )
    `);

    await queryRunner.query(`CREATE INDEX "idx_packs_type" ON "packs" ("type")`);
    await queryRunner.query(`CREATE INDEX "idx_packs_name_lower" ON "packs" (lower("name"))`);

    await queryRunner.query(`
      CREATE TABLE "worlds" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" varchar(255) NOT NULL,
        "slug" varchar(255) NOT NULL,
        "seed" varchar(255),
        "gamemode" varchar(50) NOT NULL DEFAULT 'survival',
        "difficulty" varchar(50) NOT NULL DEFAULT 'normal',
        "status" varchar(20) NOT NULL DEFAULT 'ready',
        "folder_name" varchar(255) NOT NULL,
        "size_bytes" bigint NOT NULL DEFAULT 0,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "uq_worlds_name" UNIQUE ("name"),
        CONSTRAINT "uq_worlds_slug" UNIQUE ("slug"),
        CONSTRAINT "chk_worlds_status" CHECK ("status" IN ('draft', 'ready', 'active', 'error'))
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "world_packs" (
        "world_id" uuid NOT NULL,
        "pack_id" uuid NOT NULL,
        "kind" varchar(20) NOT NULL,
        CONSTRAINT "pk_world_packs" PRIMARY KEY ("world_id", "pack_id"),
        CONSTRAINT "chk_world_packs_kind" CHECK ("kind" IN ('resource', 'behavior')),
        CONSTRAINT "fk_world_packs_world" FOREIGN KEY ("world_id")
          REFERENCES "worlds" ("id") ON DELETE CASCADE,
        CONSTRAINT "fk_world_packs_pack" FOREIGN KEY ("pack_id")
          REFERENCES "packs" ("id") ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "backups" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "world_id" uuid,
        "world_name" varchar(255) NOT NULL,
        "file_name" varchar(255) NOT NULL,
        "size_bytes" bigint NOT NULL DEFAULT 0,
        "status" varchar(20) NOT NULL DEFAULT 'creating',
        "error" text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "uq_backups_file_name" UNIQUE ("file_name"),
        CONSTRAINT "chk_backups_status" CHECK ("status" IN ('creating', 'ready', 'failed')),
        CONSTRAINT "fk_backups_world" FOREIGN KEY ("world_id")
          REFERENCES "worlds" ("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`CREATE INDEX "idx_backups_created_at" ON "backups" ("created_at")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "backups"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "world_packs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "worlds"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "packs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
  }
}
