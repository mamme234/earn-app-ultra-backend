require('dotenv').config();
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

// ✅ MODEL  
const User = mongoose.model("User",{  
    username:String,  
    coins:{type:Number,default:0},  
    refs:{type:Number,default:0},  
    telegram:{type:Boolean,default:false}  
});  

// ✅ TEST ROUTE  
app.get("/",(req,res)=> res.send("Server is running") );  

// LOGIN + REFERRAL
app.post("/login", async (req,res)=>{
    try{
        let {username, ref} = req.body;

        let user = await User.findOne({username});
        if(!user){
            user = new User({username});
            await user.save();

            // Referral reward
            if(ref){
                let parent = await User.findOne({username: ref});
                if(parent){
                    parent.refs += 1;
                    parent.coins += 100;
                    await parent.save();
                }
            }
        }

        res.json({user});
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

        res.json({user});
    }catch(e){
        res.status(500).json({error:"tap error"});
    }
});

// DAILY
app.post("/daily", async (req,res)=>{
    try{
        let user = await User.findOne({username:req.body.username});
        user.coins += 200;
        await user.save();

        res.json({message:"Daily +200",user});
    }catch(e){
        res.status(500).json({error:"daily error"});
    }
});

// SPIN
app.post("/spin", async (req,res)=>{
    try{
        let user = await User.findOne({username:req.body.username});
        let win = Math.floor(Math.random()*100)+1;
        user.coins += win;
        await user.save();

        res.json({win,user});
    }catch(e){
        res.status(500).json({error:"spin error"});
    }
});

// TELEGRAM
app.post("/join-telegram", async (req,res)=>{
    try{
        let user = await User.findOne({username:req.body.username});
        if(user.telegram) return res.json({user});

        user.telegram = true;
        user.coins += 500;
        await user.save();

        res.json({user});
    }catch(e){
        res.status(500).json({error:"telegram error"});
    }
});

// REWARD
app.post("/reward", async (req,res)=>{
    try{
        let {username,type} = req.body;
        let user = await User.findOne({username});
        if(type==="tiktok") user.coins += 1000;
        if(type==="youtube") user.coins += 500;
        await user.save();
        res.json({user});
    }catch(e){
        res.status(500).json({error:"reward error"});
    }
});

// WITHDRAW
app.post("/withdraw", async (req,res)=>{
    try{
        let {username,amount} = req.body;
        let user = await User.findOne({username});
        let need = amount*1000; // 1000 coins = 1 USDT

        if(user.coins < need){
            return res.json({error:"Not enough coins"});
        }

        user.coins -= need;
        await user.save();

        res.json({message:"Withdraw success"});
    }catch(e){
        res.status(500).json({error:"withdraw error"});
    }
});

// START SERVER
app.listen(process.env.PORT || 3000, ()=> console.log("Server running") );
