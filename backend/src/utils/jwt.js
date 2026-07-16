const developmentSecret = 'savewise-development-secret-change-me';

export const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;

  if (secret && secret.trim()) {
    return secret;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET environment variable is required in production');
  }

  return developmentSecret;
};

export const assertJwtConfigured = () => {
  getJwtSecret();
};
