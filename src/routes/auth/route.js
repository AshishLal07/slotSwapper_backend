import express from "express";
import {registeration,VerifyUser,loginUser} from "../../controllers/user/controller.js";
import Authenticate from "../../middlewares/auth/authenticate.js";

const authRoutes = express.Router();


authRoutes.route('/registeration').post(registeration);
authRoutes.route('/login').post(loginUser)
authRoutes.route('/me').get(Authenticate,VerifyUser)

export default authRoutes