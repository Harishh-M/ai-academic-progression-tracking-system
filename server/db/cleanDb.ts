import { pool } from './mysql.js';
import { RowDataPacket } from 'mysql2';

export async function clearAllDatabaseData(): Promise<{ table: string; count: number }[]> {
  const connection = await pool.getConnection();
  try {
    // 1. Fetch all base tables in the current database
    const [tableRows] = await connection.query<RowDataPacket[]>(
      `SELECT TABLE_NAME FROM information_schema.tables 
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE'`
    );

    const tableNames = tableRows.map(row => row.TABLE_NAME as string);
    console.log(`[ClearDB] Found ${tableNames.length} base tables:`, tableNames);

    // 2. Temporarily disable foreign key constraints to allow truncating
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');

    // 3. Truncate each table
    for (const tableName of tableNames) {
      console.log(`[ClearDB] Truncating table: ${tableName}...`);
      await connection.query(`TRUNCATE TABLE \`${tableName}\``);
    }

    // 4. Re-enable foreign key constraints
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    // 5. Verify all tables are empty
    const results: { table: string; count: number }[] = [];
    for (const tableName of tableNames) {
      const [countRows] = await connection.query<RowDataPacket[]>(
        `SELECT COUNT(*) as count FROM \`${tableName}\``
      );
      const count = Number(countRows[0]?.count || 0);
      results.push({ table: tableName, count });
    }

    console.log('[ClearDB] Verification complete. All tables cleared successfully.');
    return results;
  } finally {
    connection.release();
  }
}

// If run directly via CLI
if (process.argv[1]?.endsWith('cleanDb.ts') || process.argv[1]?.endsWith('cleanDb.js')) {
  clearAllDatabaseData()
    .then(async (results) => {
      console.log('\n--- Table Row Counts After Clearing ---');
      for (const res of results) {
        console.log(` - ${res.table}: ${res.count} records`);
      }
      console.log('\nDatabase cleaned successfully while preserving complete table structures and views.');
      await pool.end();
      process.exit(0);
    })
    .catch(async (error) => {
      console.error('[ClearDB] Failed to clear database:', error);
      await pool.end();
      process.exit(1);
    });
}
