const pool = require("../config/db");
const bcrypt = require("bcryptjs");

class UserService {
  async createUser({ firstname, lastname, email, password, role_id, phone_number }) {
    const checkUserQuery = "SELECT id FROM users WHERE email = ? LIMIT 1";
    const [existingUser] = await pool.execute(checkUserQuery, [email]);
    if (existingUser.length > 0) throw new Error("Email already registered.");

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const insertUserQuery = `
      INSERT INTO users (firstname, lastname, email, password, role_id, phone_number) 
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const [result] = await pool.execute(insertUserQuery, [
      firstname, lastname, email, passwordHash, Number(role_id), phone_number
    ]);

    return { userId: result.insertId };
  }

  async getAllUsers() {
    const query = `
      SELECT u.id, u.firstname, u.lastname, u.email, u.phone_number, r.role_name 
      FROM users u 
      LEFT JOIN roles r ON u.role_id = r.id
    `;
    const [rows] = await pool.execute(query);
    return rows;
  }

  async getUserById(id) {
    const query = `
      SELECT u.id, u.firstname, u.lastname, u.email, u.phone_number, r.role_name 
      FROM users u 
      LEFT JOIN roles r ON u.role_id = r.id 
      WHERE u.id = ? LIMIT 1
    `;
    const [rows] = await pool.execute(query, [Number(id)]);
    if (rows.length === 0) throw new Error("User not found.");
    return rows[0];
  }

  async updateUser(id, { firstname, lastname, role_id, phone_number }) {
    const updateQuery = `
      UPDATE users SET firstname = ?, lastname = ?, role_id = ?, phone_number = ? WHERE id = ?
    `;
    const [result] = await pool.execute(updateQuery, [
      firstname, lastname, Number(role_id), phone_number, Number(id)
    ]);
    if (result.affectedRows === 0) throw new Error("User not found or no changes made.");
    return { success: true };
  }

  async deleteUser(id) {
    const deleteQuery = "DELETE FROM users WHERE id = ?";
    const [result] = await pool.execute(deleteQuery, [Number(id)]);
    if (result.affectedRows === 0) throw new Error("User not found.");
    return { success: true };
  }
}

module.exports = new UserService();