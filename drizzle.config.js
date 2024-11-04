/** @type {import("drizzle-kit").Config} */
export default {
    dialect: 'postgresql',
    schema: "./configs/schema.jsx",
    dbCredentials: {
      url: 'postgresql://coursei-1_owner:SMclEXfkT4r6@ep-fragrant-star-a5239xip.us-east-2.aws.neon.tech/coursei-1?sslmode=require', // Adjust with actual values
    },
  };
  