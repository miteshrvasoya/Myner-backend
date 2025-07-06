import pool from './db';

export const selectRecord = async (query: string, params: any[] = []) => {
  const { rows } = await pool.query(query, params);
  return rows[0] || null;
};

export const listRecords = async (query: string, params: any[] = []) => {
  const { rows } = await pool.query(query, params);
  return rows;
};

export const insertRecord = async (
  table: string,
  data: Record<string, any>,
  conflictKey: string | null = null,
  updateFields: string[] = []
) => {
  const keys = Object.keys(data);
  const values = Object.values(data);

  const columns = keys.join(', ');
  const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');

  let conflictClause = '';
  if (conflictKey && updateFields.length > 0) {
    const updateSet = updateFields.map((field) => `${field} = EXCLUDED.${field}`).join(', ');
    conflictClause = ` ON CONFLICT (${conflictKey}) DO UPDATE SET ${updateSet}`;
  }

  const query = `INSERT INTO ${table} (${columns}) VALUES (${placeholders})${conflictClause} RETURNING *`;

  const result = await pool.query(query, values);
  return result.rows[0];
};

export const insertManyRecords = async (
  table: string,
  columns: string[],
  values: any[][],
  conflictKey: string | null = null,
  updateFields: string[] = []
) => {
  const client = await pool.connect();

  const columnNames = columns.join(', ');
  const valuePlaceholders = values
    .map((row, i) => `(${row.map((_, j) => `$${i * row.length + j + 1}`).join(', ')})`)
    .join(', ');

  const flatValues = values.flat();

  let conflictClause = '';
  if (conflictKey && updateFields.length > 0) {
    const updateSet = updateFields.map((field) => `${field} = EXCLUDED.${field}`).join(', ');
    conflictClause = ` ON CONFLICT (${conflictKey}) DO UPDATE SET ${updateSet}`;
  }

  const query = `INSERT INTO ${table} (${columnNames}) VALUES ${valuePlaceholders}${conflictClause}`;

  try {
    await client.query('BEGIN');
    await client.query(query, flatValues);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

export const deleteRecords = async (query: string, params: any[] = []) => {
  const { rowCount } = await pool.query(query, params);
  return rowCount;
};
