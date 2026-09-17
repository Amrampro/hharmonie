// Always roll back unfinished work, including validation returns from handlers.
export async function releaseTransaction(connection, committed) {
  if (!connection) return;
  try {
    if (!committed) await connection.rollback();
    connection.release();
  } catch (error) {
    console.error("Transaction cleanup failed:", error);
    // Never return a connection with an unresolved transaction to the pool.
    connection.destroy();
  }
}
