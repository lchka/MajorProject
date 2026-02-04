import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

const UserSecurity = {
  hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  },

  comparePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  },
};

export default UserSecurity;
