const { verify } = require("jsonwebtoken");
const { secret } = require("../config/jwtConfig");

function authMiddleware(req, res, next) {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  try {
    const decoded = verify(token, secret);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: "Token is not valid" });
  }
}

// For API routes that require authentication
const verifyToken = (req, res, next) => {
  const token = req.headers["x-access-token"];
  if (!token) {
    return res.status(403).send({ message: "No token provided!" });
  }

  jwt.verify(token, config.secret, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "Unauthorized!" });
    }
    req.userId = decoded.id;
    next();
  });
};

module.exports = { verifyToken, authMiddleware };
