import jwt from 'jsonwebtoken';
import User from '../../models/user/schema.js';


const Authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
   
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res
        .status(401)
        .json({ error: "Access denied. No token provided." });
    }

    const verifyToken = jwt.verify(token, process.env.JWT_SECRET);
    if (!verifyToken) return res.status(401).json({ error: "Invalid token" });
    const rootUser = await User.findOne(
      { _id: verifyToken._id })

        if (!rootUser) {
      return res.status(401).json({ error: "Invalid token" });
    }
    
     req.userId = rootUser._id;
     req.userName = rootUser.userName;
     req.email = rootUser.email;
     next();
  }catch(err){
    console.log(err);
    
    if (
      err.message === "jwt expired" ||
      err.message === "invalid signature"
    ) {
      return res.status(500).json({ error: "Invalid token" });
    } else {
      return res.status(500).json({ error: "Something went wrong" });
    }
  }
}
export default Authenticate;