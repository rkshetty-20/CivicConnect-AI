import jwt from 'jsonwebtoken';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'civicconnect_super_secret_jwt_key_123!', {
    expiresIn: '30d',
  });
};

export default generateToken;
