const crypto = require('crypto');

const createOneTimeToken = () => {
  const token = crypto.randomBytes(32).toString('hex');
  return { token, hash: crypto.createHash('sha256').update(token).digest('hex') };
};

const hashToken = (token) => crypto.createHash('sha256').update(String(token)).digest('hex');

module.exports = { createOneTimeToken, hashToken };
