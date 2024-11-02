/** @type {import("drizzle-kit").Config} */
export default {
    dialect: 'postgresql',
    schema: "./configs/schema.jsx",
    dbCredentials: {
      url: 'NEXT_PUBLIC_DB_CONNECTION_STRING', // Adjust with actual values
    },
  };
  