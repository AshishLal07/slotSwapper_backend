import * as bcrypt from "bcryptjs";
import JWT from 'jsonwebtoken';
import config from "../configs/config.js";

export const hashPassword = async (password) => {
  try {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ message: "An error occured", error: error.message });
  }
};

export const comparePassword = async (password, hashedPassword) => {
  try {
    return bcrypt.compare(password, hashedPassword);
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ message: "An error occured", error: error.message });
  }
};


export const  TokenGenerator = async (UserCheck) => {
  const token = JWT.sign({ _id: UserCheck._id }, config.jwt.secret, {
    expiresIn: "7d",
  });
  return token;
};