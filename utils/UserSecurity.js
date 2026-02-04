import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

const UserSecurity = {
  hashPassword(password) {
    return bcrypt.hash(password, SALT_ROUNDS);
  },

  comparePassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
  },
};

export default UserSecurity;