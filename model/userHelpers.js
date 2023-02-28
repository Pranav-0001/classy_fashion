const bcrypt=require('bcrypt')
const model=require('./schema')
const collections=require('./collections');
const nodemailer=require('nodemailer');
const mongoose = require('mongoose');
const {ObjectId}=mongoose.Types

module.exports={
    userSignUp:(userData)=>{
        console.log(userData);
        let response={}
        let emailRegx=/^(\w){3,16}@([A-Za-z]){5,8}.([A-Za-z]){2,3}$/gm
        let passwordRegx=/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,16}$/gm
        let usernameRegx=/^([A-Za-z_]){4,12}$/gm
        let phoneRegx=/^([0-9]){10}$/gm

        return new Promise(async(resolve, reject) => {
        var user=await collections.userCollection.findOne({email:userData.email})
        
            if(userData.password!=userData.repassword){
                response.Err="Passwords Doest match"
                resolve(response.Err)
            }else if(userData.username==''){
                response.Err="username field is Empty"
                resolve(response.Err);
            }else if(usernameRegx.test(userData.username)==false){
                response.Err="Username can only conatain Letters and _.Should contain atleast 4 letters and max 12"
                resolve(response.Err);
            }else if(userData.phone==''){
                response.Err="Mobile number field is Empty"
                resolve(response.Err);
            }else if(phoneRegx.test(userData.phone)==false){
                response.Err="Invalid Mobile, Should contain 10 numbers"
                resolve(response.Err);
            }else if(userData.email==''){
                response.Err="email field is Empty"
                resolve(response.Err);
            }else if(userData.password==''){
                response.Err="password field is Empty"
                resolve(response.Err);
            }else if(userData.repassword==''){
                response.Err="Need to confirm your Password"
                resolve(response.Err);
            }else if(emailRegx.test(userData.email)==false){
                response.Err="Enter a valid email address"
                resolve(response.Err);
            }else if(passwordRegx.test(userData.password)==false){
                response.Err="Password Should contain atleast one uppercase ,lowercase and  number"
                resolve(response.Err);
            }else if(user){
                response.Err="User Email already exist"
                resolve(response.Err);
            }else{
                userData.password=await bcrypt.hash(userData.password,10)
                console.log(userData.password);
                userData={
                    username:userData.username,
                    phone:userData.phone,
                    email:userData.email,
                    gender:userData.gender,
                    password:userData.password,
                    status:true
                }
                collections.userCollection.insertOne(userData).then((d)=>{
                    console.log(d);
                })
                response.status=true
                resolve(response)

            }
        })
    },
    userLogin:(userData)=>{
        return new Promise(async(resolve, reject) => {
           let response={}
            let user=await collections.userCollection.findOne({email:userData.email})
            if(user){
                if(user.status){
                    bcrypt.compare(userData.password,user.password).then((status)=>{
                        if(status){
                        console.log(status);
                        response.user=user
                        response.status=true
                        resolve(response)
                        }else if(userData.password==''){
                            response.msg="Password Field required"
                        resolve(response)
                        }else{
                        response.msg="Invalid Password"
                        resolve(response)
                    }
                    })
                }else{
                response.msg="Your account is banned by admin. Please connect with our helpline"
                resolve(response) 
                }
            }else if(userData.email==''){
                response.msg="Email Field required"
                resolve(response) 
            }
            else{
                response.msg="Invalid Email"
                resolve(response) 
            }
        })
    },
    otpVerify:(data)=>{
        let response={}
        return new Promise(async(resolve, reject) => {
            let user=await collections.userCollection.findOne({email:data.email})
            if(user){
                if(user.status){
                    otpEmail=user.email
                response.otp=OTP()
               let otp=response.otp
                let mailTransporter=nodemailer.createTransport({
                    service:"gmail",
                    auth:{
                        user:"classyfashionclub123@gmail.com",
                        pass:"zylmubqixjssrdhe"
                    }
                })
                
                let details={
                    from:"classyfashionclub123@gmail.com",
                    to:otpEmail,
                    subject:"Classy Fashion Club",
                    text: otp+" is your Classy Fashion Club verification code. Do not share OTP with anyone "
                }

                mailTransporter.sendMail(details,(err)=>{
                    if(err){
                        console.log(err);
                    }else{
                        console.log("OTP Send Successfully ");
                    }
                })

                function OTP(){
                    OTP=Math.random()*1000000
                    OTP=Math.floor(OTP)
                    return OTP
                }
                response.user=user
                response.status=true
                
                resolve(response)
                }else{
                    response.err="User Email is Banned.Please Contact With us"
                    resolve(response)
                }
            }else{
                response.err="User Email not registered"
                resolve(response)
            }
        })
    },
    getProducts:()=>{
        return new Promise(async(resolve, reject) => {
            let products=await collections.productCollection.find().toArray()
            resolve(products);
        })
    },
    getProduct:(proId)=>{
        return new Promise(async(resolve, reject) => {
            let product=await collections.productCollection.findOne({_id: ObjectId(proId)})
            resolve(product);
        })
    },
    getCategory:()=>{
        return new Promise(async(resolve, reject) => {
            let response={}
            let brands=await collections.productCollection.distinct("brand")
            
            response.brands=brands
            let category=await collections.categoryCollection.find().toArray()
            response.category=category
            resolve(response)
        })
    },
    latestProduct:()=>{
        return new Promise(async(resolve, reject) => {
            let pro=await collections.productCollection.find().sort({_id:-1}).limit(4).toArray()
            resolve(pro)
        })
    },
    addToCart:(proId,userId)=>{
        let proObj={
            item:ObjectId(proId),
            quantity:1
        }
        return new Promise(async(resolve, reject) => {
            

            let userCart=await collections.cartCollection.findOne({user:ObjectId(userId)})
            if(userCart){
                let proExist=userCart.products.findIndex(product=>product.item==proId)
                console.log(proExist);
                if(proExist!=-1){
                    collections.cartCollection.updateOne({'products.item':ObjectId(proId)},
                    {
                        $inc:{'products.$.quantity':1}
                    }).then(()=>{
                        resolve()
                    })
                }else{
                    collections.cartCollection.updateOne({user:ObjectId(userId)},{
                        $push:{products:proObj}
                    }).then(()=>{
                        resolve()
                    })
                }
            }else{
                let cartObj={
                    user:ObjectId(userId),
                    products:[proObj]
                }
                collections.cartCollection.insertOne(cartObj).then(()=>{
                    resolve()
                })
            }
        })
    },
    getCartProducts:(userId)=>{
        return new Promise(async(resolve, reject) => {
            let cartItems=await collections.cartCollection.aggregate([
                {
                    $match:{user:ObjectId(userId)}
                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity'
                    }
                },{
                    $lookup:{
                        from:'products',
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    }
                },
                {
                    $project:{
                        item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                    }
                }
            ]).toArray()
           
            resolve(cartItems)
        })
    }
}