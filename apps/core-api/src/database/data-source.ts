import { config as loadEnv } from 'dotenv';
import { DataSource } from 'typeorm';
import { buildDataSourceOptions } from './data-source.options.js';

loadEnv({ path: ['.env', '../../.env'], quiet: true });

export const AppDataSource = new DataSource(buildDataSourceOptions((key) => process.env[key]));

export default AppDataSource;
