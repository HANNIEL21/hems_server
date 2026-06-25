const pool = require("../config/db");

class RoleService {
  async createRole({ role_name, description }) {
    const checkQuery = "SELECT id FROM roles WHERE role_name = ? LIMIT 1";
    const [existing] = await pool.execute(checkQuery, [role_name]);
    if (existing.length > 0) {
      throw new Error("Role name already exists.");
    }

    const insertQuery = "INSERT INTO roles (role_name, description) VALUES (?, ?)";
    const [result] = await pool.execute(insertQuery, [role_name, description]);
    return { id: result.insertId };
  }

  async getAllRoles() {
    const query = "SELECT id, role_name, description, created_at FROM roles ORDER BY id ASC";
    const [rows] = await pool.execute(query);
    return rows;
  }

  async getRoleById(id) {
    const query = "SELECT id, role_name, description, created_at FROM roles WHERE id = ? LIMIT 1";
    const [rows] = await pool.execute(query, [Number(id)]);
    if (rows.length === 0) {
      throw new Error("Role not found.");
    }
    return rows[0];
  }

  async updateRole(id, { role_name, description }) {
    const checkQuery = "SELECT id FROM roles WHERE role_name = ? AND id != ? LIMIT 1";
    const [existing] = await pool.execute(checkQuery, [role_name, Number(id)]);
    if (existing.length > 0) {
      throw new Error("Role name is already taken by another resource.");
    }

    const updateQuery = "UPDATE roles SET role_name = ?, description = ? WHERE id = ?";
    const [result] = await pool.execute(updateQuery, [role_name, description, Number(id)]);
    
    if (result.affectedRows === 0) {
      throw new Error("Role not found or no changes made.");
    }
    return { success: true };
  }

  async deleteRole(id) {
    const checkUsersQuery = "SELECT id FROM users WHERE role_id = ? LIMIT 1";
    const [users] = await pool.execute(checkUsersQuery, [Number(id)]);
    if (users.length > 0) {
      throw new Error("Cannot delete role; it is currently assigned to operational staff.");
    }

    const deleteQuery = "DELETE FROM roles WHERE id = ?";
    const [result] = await pool.execute(deleteQuery, [Number(id)]);
    if (result.affectedRows === 0) {
      throw new Error("Role not found.");
    }
    return { success: true };
  }
}

module.exports = new RoleService();