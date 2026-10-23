import { AppDataSource } from "./data-source.js";

const dataSource = await AppDataSource.initialize();
try {
  await dataSource.undoLastMigration({ transaction: "each" });
  console.log("Reverted the last migration.");
} finally {
  await dataSource.destroy();
}
