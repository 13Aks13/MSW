import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddImportJobsTable1760000000001 implements MigrationInterface {
  name = "AddImportJobsTable1760000000001";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "import_jobs" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "bundle_type" varchar(20) NOT NULL,
        "duplicate_policy" varchar(20) NOT NULL,
        "file_path" text NOT NULL,
        "status" varchar(20) NOT NULL DEFAULT 'queued',
        "progress" integer NOT NULL DEFAULT 0,
        "current_step" varchar(255) NOT NULL DEFAULT '',
        "logs" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "report" jsonb,
        "error" text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "completed_at" timestamptz,
        CONSTRAINT "chk_import_jobs_bundle_type" CHECK ("bundle_type" IN ('resource', 'behavior')),
        CONSTRAINT "chk_import_jobs_duplicate_policy" CHECK ("duplicate_policy" IN ('replace', 'skip', 'rename')),
        CONSTRAINT "chk_import_jobs_status" CHECK ("status" IN ('queued', 'processing', 'completed', 'failed'))
      )
    `);

    await queryRunner.query(`CREATE INDEX "idx_import_jobs_status" ON "import_jobs" ("status")`);
    await queryRunner.query(
      `CREATE INDEX "idx_import_jobs_created_at" ON "import_jobs" ("created_at")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "import_jobs"`);
  }
}
