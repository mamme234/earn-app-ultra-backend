require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

// ✅ CONNECT MONGO
mongoose.connect(process.env.MONGO_URI)
.then(()=>console.log("DB Connected"))
.catch(err=>console.log("DB Error:",err));

// ✅ USER MODEL
const User = mongoose.model("User",{
  username: {type:String, unique:true},
  coins: {type:Number, default:0},
  refs: {type:Number, default:0},
  deposit: {type:Number, default:0},
  level: {type:Number, default:1},
  telegram: {type:Boolean, default:false},
  tiktok: {type:Boolean, default:false},
  youtube: {type:Boolean, default:false}
});

// ✅ TEST ROUTE
app.get("/", (req,res)=>{
  res.send("Server is running");
});

// LOGIN + REFERRAL
app.post("/login", async (req,res)=>{
  try{
    let {username, ref} = req.body;
    let user = await User.findOne({username});

    if(!user){
      user = new User({username});
      await user.save();

      // Add referral to referrer
      if(ref){
        let refUser = await User.findOne({username:ref});
        if(refUser){
          refUser.refs += 1;
          await refUser.save();
        }
      }
    }

    res.json({user});
  }catch(e){
    console.log(e);
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
    res.json({coins:user.coins});
  }catch(e){
    console.log(e);
    res.status(500).json({error:"tap error"});
  }
});

// SOCIAL TASK REWARD
app.post("/reward", async (req,res)=>{
  try{
    let {username,type} = req.body;
    let user = await User.findOne({username});
    if(!user) return res.json({error:"No user"});

    if(type==="tg" && !user.telegram){
      user.coins += 500;
      user.telegram = true;
    }
    if(type==="tiktok" && !user.tiktok){
      user.coins += 1000;
      user.tiktok = true;
    }
    if(type==="yt" && !user.youtube){
      user.coins += 500;
      user.youtube = true;
    }

    await user.save();
    res.json({user});
  }catch(e){
    console.log(e);
    res.status(500).json({error:"reward error"});
  }
});

// DEPOSIT
app.post("/deposit", async (req,res)=>{
  try{
    let {username, amount} = req.body;
    let user = await User.findOne({username});
    if(!user) return res.json({error:"No user"});

    user.deposit += parseFloat(amount);
    await user.save();
    res.json({message:`Deposit successful: ${amount} USDT`, user});
  }catch(e){
    console.log(e);
    res.status(500).json({error:"deposit error"});
  }
});

// WITHDRAW
app.post("/withdraw", async (req,res)=>{
  try{
    let {username, amount, wallet} = req.body;
    let user = await User.findOne({username});
    if(!user) return res.json({error:"No user"});

    let neededCoins = amount*100;

    // Withdraw rules
    if(user.refs < 10 && user.deposit === 0) 
      return res.json({error:"Need 10 referrals & 20 USDT minimum to withdraw"});

    if(user.deposit>0 && (user.refs<5 || user.level<5))
      return res.json({error:`Deposit ${user.deposit} USDT: Need 5 Referrals & Level 5`});

    if(user.coins < neededCoins)
      return res.json({error:"Not enough coins"});

    user.coins -= neededCoins;
    await user.save();

    res.json({message:`Withdraw success ${amount} USDT to ${wallet}`});
  }catch(e){
    console.log(e);
    res.status(500).json({error:"withdraw error"});
  }
});

// START SERVER
app.listen(process.env.PORT || 3000, ()=>{
  console.log("Server running");
});
