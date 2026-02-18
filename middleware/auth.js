const jwt = require("jsonwebtoken");
module.exports = (req, res, next) => {
  let token = req.headers["authorization"];

  if (!token) {
    return res.status(401).json({ message: "No token" });
  }

  if (token.startsWith("Bearer ")) {
    token = token.split(" ")[1];
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("DECODED ", decoded);
    req.user = decoded;
    req.creator_role = decoded.role;
    next();
  } catch (err) {
    console.log("JWT ERROR :", err.message);
    return res.status(401).json({ message: "Invalid token" });
  }
};
