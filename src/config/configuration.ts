export default () => ({
    port: parseInt(process.env.PORT, 10) || 3000,
    database: {
      uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/code-red',
    },
    jwt: {
      secret: process.env.JWT_SECRET || 'secret',
      expiresIn: process.env.JWT_EXPIRES_IN || '1d',
    },
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
    },
    google: {
      mapsApiKey: process.env.GOOGLE_MAPS_API_KEY || '',
    },
  });