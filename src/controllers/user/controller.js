import { hashPassword, comparePassword ,TokenGenerator} from "../../utils/auth.js";
import User from '../../models/user/schema.js'

const registeration = async (req, res) => {
  try {
    const {  userName, email, password,  } =
      req.body;
    
    if (
      !userName ||
      !email ||
      !password 
      // !cpassword 
    ) {
      return res
        .status(422)
        .json({ status: 400, error: "All fields are required" });
    }

    // if (!(password === cpassword)) {
    //   return res
    //     .status(422)
    //     .json({ message: "Password does not match", status: 400 });
    // }
    
    const userExist = await User.findOne({ userName });
    if (userExist) {
      return res.status(400).json({
        message: "User Already exist, please login",
        status: 400,
      });
    }
    //create the role by
    let hasPassword = await hashPassword(password);

    let newUser = await User.create({userName,email:email.toLowerCase(), password:hasPassword});   

    const token = await TokenGenerator(newUser._id);    

    return res
      .status(200)
      .json({ message: "User created successfully", status: 200, data:{token, user:{name:userName, _id:newUser._id, email}} });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "An error occured", error: error.message });
  }
};


const VerifyUser = async (req,res) => {
   
  if(!req.userId || !req.userName || !req.email ){
      return res.status(401).json({message:"Unauthorize user try again later"})
    }

    return res.status(200).json({message:"Verified sucessfully", data:{id:req.userId ,name:req.userName ,email:req.email}});

}

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Please fill the fields", status: 400 });
    }

    const userLogin = await User.findOne(
      { email: email.toLowerCase() }
    );
    console.log(userLogin);
    
    if (!userLogin) {
      return res
        .status(400)
        .json({ message: "Invalid Credentials", status: 400 });
    }

    if (!userLogin.password) {
      return res
        .status(404)
        .json({ message: "Please update your information", status: 400 });
    }

    const passwordMatch = await comparePassword(password, userLogin.password);

    if (!passwordMatch) {
      return res
        .status(400)
        .json({ message: "Invalid Credentials", status: 400 });
    }

    const token = await TokenGenerator(userLogin._id);

    return res.status(200).json({
      message: "User Login successfully",
     data:{token, user:{name:userLogin.userName, id:userLogin._id, email:userLogin.email}},
      status: 200,
    });
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ message: "An error occured", error: err.message });
  }
};



export  {registeration,VerifyUser,loginUser};