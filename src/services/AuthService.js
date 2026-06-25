const pool = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

class AuthService {
  async loginUser({ email, password }) {
    const query = `
      SELECT u.*, r.role_name FROM users u 
      LEFT JOIN roles r ON u.role_id = r.id WHERE u.email = ? LIMIT 1
    `;
    const [users] = await pool.execute(query, [email]);
    if (users.length === 0) throw new Error("Invalid email or password.");

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error("Invalid email or password.");

    const payload = {
      id: user.id,
      role_id: user.role_id,
      role_name: user.role_name,
    };

    // Generate both short-lived Access and long-lived Refresh tokens
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "15m",
    });
    const refreshToken = jwt.sign(
      { id: user.id },
      process.env.JWT_REFRESH_SECRET || "refresh_secret",
      { expiresIn: "7d" },
    );

    return {
      accessToken,
      refreshToken,
      user: {
        firstname: user.firstname,
        lastname: user.lastname,
        role_name: user.role_name,
      },
    };
  }

  async refreshSession(token) {
    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_REFRESH_SECRET || "refresh_secret",
      );
      const query = `
        SELECT u.id, u.role_id, r.role_name FROM users u 
        LEFT JOIN roles r ON u.role_id = r.id WHERE u.id = ? LIMIT 1
      `;
      const [users] = await pool.execute(query, [decoded.id]);
      if (users.length === 0) throw new Error("User session no longer valid.");

      const user = users[0];
      const newAccessToken = jwt.sign(
        { id: user.id, role_id: user.role_id, role_name: user.role_name },
        process.env.JWT_SECRET,
        { expiresIn: "15m" },
      );
      return { accessToken: newAccessToken };
    } catch (err) {
      throw new Error("Session expired or invalid refresh token.");
    }
  }
}

module.exports = new AuthService();
