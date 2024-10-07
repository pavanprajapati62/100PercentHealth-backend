const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) {
    return res.status(403).send({ message: "No token provided!" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      // Check for specific JWT errors
      if (err.name === "TokenExpiredError") {
        return res.status(401).send({ message: "Token expired!" });
      }
      if (err.name === "JsonWebTokenError") {
        return res.status(401).send({ message: "Invalid token!" });
      }
      return res.status(401).send({ message: "Unauthorized!" });
    }

    // Ensure decoded contains the expected properties
    req.userId = decoded.DID || decoded.id || decoded.SID;
    req.userRole = decoded.role;
    next();
  });
};

const isAdmin = (req, res, next) => {
  if (req.userRole === "admin") {
    next();
  } else {
    res.status(403).send({ message: "Require Admin Role!" });
  }
};

const isDoctor = (req, res, next) => {
  if (req.userRole === "doctor") {
    next();
  } else {
    res.status(403).send({ message: "Require Doctor Role!" });
  }
};

const isStore = (req, res, next) => {
  if (req.userRole === "store") {
    next();
  } else {
    res.status(403).send({ message: "Require Store Role!" });
  }
};

const isAdminOrDoctor = (req, res, next) => {
  if (req.userRole === "admin" || req.userRole === "doctor") {
    next();
  } else {
    res.status(403).send({ message: "Require Admin Or Doctor Role!" });
  }
};

const isStoreOrAdmin = (req, res, next) => {
  if (req.userRole === "store" || req.userRole === "admin") {
    next();
  } else {
    res.status(403).send({ message: "Require Store Or Admin Role!" });
  }
};

const isStoreOrDoctor = (req, res, next) => {
  if (req.userRole === "store" || req.userRole === "doctor") {
    next();
  } else {
    res.status(403).send({ message: "Require Store Or Doctor Role!" });
  }
};

module.exports = { verifyToken, isAdmin, isDoctor, isStore, isAdminOrDoctor, isStoreOrAdmin, isStoreOrDoctor };
