const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { secret, expiresIn } = require("../config/jwtConfig");
const Admin = require("../models/Admin.js");
const config = require("../config/db.js");

exports.signUp = async (username, pin) => {
  const hashedPin = bcrypt.hashSync(pin, 8);

  const user = await Admin.create({
    username,
    pin: hashedPin,
    role: "admin",
  });

  return user;
};

exports.login = async (username, pin) => {
  const user = await Admin.findOne({ where: { username } });

  if (!user) {
    throw new Error("Admin not found.");
  }

  const isPinValid = bcrypt.compareSync(pin, user.pin);
  if (!isPinValid) {
    throw new Error("Invalid PIN.");
  }

  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    {
      expiresIn: "24h",
    }
  );

  return token;
};
