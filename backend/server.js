const express=require("express");
const mongoose=require("mongoose");
const cors=require("cors");
require("dotenv").config();

const app=express();
app.use(express.json());
app.use(cors());

// DB
mongoose.connect(process.env.MONGO_URI)
.then(()=>console.log("DB Connected"))
.catch(err=>console.log(err));

// MODEL
const User=mongoose.model("User",{
username:String,
coins:{type:Number,default:0},
refs:{type:Number,default:0},
referredBy:String,
daily:Date,
telegram:{type:Boolean,default:false}
});

// LOGIN
app.post("/login",async(req,res)=>{
let {username,ref}=req.body;

let user=await User.findOne({username});

if(!user){
user=new User({username});

if(ref && ref!==username){
let refUser=await User.findOne({username:ref});
if(refUser){
refUser.refs+=1;
refUser.coins+=500;
await refUser.save();
user.referredBy=ref;
}
}

await user.save();
}

res.json(user);
});

// TAP
app.post("/tap",async(req,res)=>{
let user=await User.findOne({username:req.body.username});
if(!user) return res.json({error:"No user"});
user.coins+=1;
await user.save();
res.json(user);
});

// DAILY
app.post("/daily",async(req,res)=>{
let user=await User.findOne({username:req.body.username});
let now=new Date();

if(user.daily && now-user.daily<86400000)
return res.json({message:"Already claimed"});

user.daily=now;
user.coins+=200;
await user.save();

res.json({message:"Daily +200",user});
});

// SPIN
app.post("/spin",async(req,res)=>{
let user=await User.findOne({username:req.body.username});
let win=Math.floor(Math.random()*100)+1;
user.coins+=win;
await user.save();
res.json({win,user});
});

// TELEGRAM
app.post("/join-telegram",async(req,res)=>{
let user=await User.findOne({username:req.body.username});
if(user.telegram) return res.json({error:"Already claimed"});
user.telegram=true;
user.coins+=500;
await user.save();
res.json(user);
});

// WITHDRAW
app.post("/withdraw",async(req,res)=>{
let {username,amount}=req.body;

let user=await User.findOne({username});
if(!user) return res.json({error:"No user"});

if(user.refs<10)
return res.json({error:"Need 10 referrals"});

let need=amount*100;
if(user.coins<need)
return res.json({error:"Not enough coins"});

user.coins-=need;
await user.save();

res.json({message:"Withdraw requested"});
});

// START
app.listen(process.env.PORT,()=>console.log("Server running"));
