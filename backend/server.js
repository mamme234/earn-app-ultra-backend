const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors());

// CONNECT DB
mongoose.connect(process.env.MONGO_URI)
.then(()=>console.log("DB Connected"))
.catch(err=>console.log(err));

// MODEL
const User = mongoose.model("User",{
  username: String,
  coins: { type:Number, default:0 },
  refs: { type:Number, default:0 },

  telegram: { type:Boolean, default:false },
  tiktok: { type:Boolean, default:false },
  youtube: { type:Boolean, default:false },

  referredBy: { type:String, default:null }
});

// TEST
app.get("/",(req,res)=>res.send("Server running"));

// LOGIN + REFERRAL
app.post("/login", async (req,res)=>{
try{
  let {username, ref} = req.body;

  let user = await User.findOne({username});

  if(!user){
    user = new User({username});

    if(ref && ref !== username){
      let refUser = await User.findOne({username:ref});
      if(refUser){
        refUser.refs += 1;
        refUser.coins += 100;
        await refUser.save();

        user.referredBy = ref;
        user.coins += 100;
      }
    }

    await user.save();
  }

  res.json(user);
}catch(e){
  res.status(500).json({error:"login error"});
}
});

// TAP
app.post("/tap", async (req,res)=>{
try{
  let user = await User.findOne({username:req.body.username});
  if(!user) return res.json({error:"No user"});

  user.coins += 1;
  await user.save();

  res.json(user);
}catch{
  res.status(500).json({error:"tap error"});
}
});

// TELEGRAM
app.post("/join-telegram", async (req,res)=>{
try{
  let user = await User.findOne({username:req.body.username});

  if(user.telegram) return res.json(user);

  user.telegram = true;
  user.coins += 500;

  await user.save();
  res.json(user);
}catch{
  res.status(500).json({error:"tg error"});
}
});

// REWARD
app.post("/reward", async (req,res)=>{
try{
  let {username,type} = req.body;
  let user = await User.findOne({username});

  if(type==="tiktok"){
    if(user.tiktok) return res.json(user);
    user.tiktok = true;
    user.coins += 1000;
  }

  if(type==="youtube"){
    if(user.youtube) return res.json(user);
    user.youtube = true;
    user.coins += 500;
  }

  await user.save();
  res.json(user);
}catch{
  res.status(500).json({error:"reward error"});
}
});

// WITHDRAW
app.post("/withdraw", async (req,res)=>{
try{
  let {username,amount} = req.body;
  let user = await User.findOne({username});

  let need = amount*100;

  if(user.coins < need){
    return res.json({error:"Not enough coins"});
  }

  user.coins -= need;
  await user.save();

  res.json({message:"Withdraw success"});
}catch{
  res.status(500).json({error:"withdraw error"});
}
});

app.listen(process.env.PORT || 3000, ()=>{
console.log("Server running");
});
