import type { MigrationInterface, QueryRunner } from "typeorm";

export class FixImportJobsStatusConstraint1760000000002 implements MigrationInterface {
  name = "FixImportJobsStatusConstraint1760000000002";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop the existing check constraint
    await queryRunner.query(`ALTER TABLE "import_jobs" DROP CONSTRAINT "chk_import_jobs_status"`);

    // Add the correct check constraint matching the shared types
    await queryRunner.query(`
      ALTER TABLE "import_jobs" 
      ADD CONSTRAINT "chk_import_jobs_status" 
      CHECK ("status" IN ('queued', 'active', 'completed', 'failed', 'cancelled'))
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert to the previous constraint
    await queryRunner.query(`ALTER TABLE "import_jobs" DROP CONSTRAINT "chk_import_jobs_status"`);

    await queryRunner.query(`
      ALTER TABLE "import_jobs" 
      ADD CONSTRAINT "chk_import_jobs_status" 
      CHECK ("status" IN ('queued', 'processing', 'completed', 'failed'))
    `);
  }
}
