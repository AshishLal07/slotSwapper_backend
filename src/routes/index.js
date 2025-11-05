import express from "express";
import authRoutes from "./auth/route.js";
import eventRoutes from "./event/route.js";
import Authenticate from "../middlewares/auth/authenticate.js";

const route = express.Router();

route.use('/auth', authRoutes)
route.use('/event',Authenticate, eventRoutes)

export default route