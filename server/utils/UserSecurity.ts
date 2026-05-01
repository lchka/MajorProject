import bcrypt from "bcrypt";
// Utility module for user security, providing functions to hash passwords and compare plaintext passwords with hashed versions. This is essential for securely handling user authentication in the application, ensuring that user passwords are not stored in plaintext and that we can verify user credentials during login.
const SALT_ROUNDS = 10;

const UserSecurity = {
  hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  },

  comparePassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  },
};

export default UserSecurity;
