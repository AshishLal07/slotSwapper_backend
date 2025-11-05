import dotenv from 'dotenv';
dotenv.config()

export default {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 5000,
  api: {
    serverUrl:process.env.SERVER_URL,
    clientUrl: process.env.CLIENT_URL,
  },
  database: {
    url: process.env.MONGODB_URI,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
  },
};
