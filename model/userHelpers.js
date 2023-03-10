const bcrypt=require('bcrypt')
const model=require('./schema')
const collections=require('./collections');
const nodemailer=require('nodemailer');
const mongoose = require('mongoose');
const { response } = require('express');
const {ObjectId}=mongoose.Types
const uuid=require('uuid')

module.exports={
    userSignUp:(userData)=>{
        console.log(userData);
        let response={}
        

        return new Promise(async(resolve, reject) => {
        var user=await collections.userCollection.findOne({email:userData.email})
        
            if(user){
                response.Err="User Email already exist"
                resolve(response.Err);
            }else{
                userData.password=await bcrypt.hash(userData.password,10)
                
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
                    otpEmail = user.email
                    response.otp = OTP()
                    let otp = response.otp
                    let mailTransporter = nodemailer.createTransport({
                        service: "gmail",
                        auth: {
                            user: "classyfashionclub123@gmail.com",
                            pass: "zylmubqixjssrdhe"
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
    addToCart:(proId,userId,size)=>{
        console.log("size : ",size);
        let proObj={
            item:ObjectId(proId),
            quantity:1,
            size:size.Size
        }
        return new Promise(async(resolve, reject) => {
            

            let userCart=await collections.cartCollection.findOne({user:ObjectId(userId)})
           
           
            if(userCart){
                let proExist=userCart.products.findIndex(product=>product.item==proId)
                console.log(proExist);
                
                if(proExist!=-1 ){
                    collections.cartCollection.updateOne({user:ObjectId(userId),'products.item':ObjectId(proId)},
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
                        quantity:'$products.quantity',
                        size:'$products.size'
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
                        item:1,quantity:1,size:1,product:{$arrayElemAt:['$product',0]}
                    }
                }
            ]).toArray()
            
            console.log(cartItems);
            resolve(cartItems)

        })
    },
    cartCount:(userId)=>{
        return new Promise(async(resolve, reject) => {
            let cart=await collections.cartCollection.findOne({user:ObjectId(userId)})
            if(cart){
                var  count=cart.products.length
                resolve(count);
            }else{
                var count=0
                resolve(count)
            }
        })
    },
    getTotalAmount:(userId)=>{
        return new Promise(async(resolve, reject) => {
            let total=await collections.cartCollection.aggregate([
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
                },
                {
                    $group:{
                        _id:null,
                        total:{$sum:{$multiply:['$quantity',{$convert:{input:'$product.price',to:'int'}}]}},
                        disTotal:{$sum:{$multiply:['$quantity',{$convert:{input:'$product.offerPrice',to:'int'}}]}}
                    }
                }
            ]).toArray()
            resolve(total[0])
        })
        
    },
    changeQuantity:(details)=>{
       
            details.count = parseInt(details.count)
            details.quantity = parseInt(details.quantity)
            console.log(details);
            return new Promise(async(resolve, reject) => {
                // let product=await collections.productCollection.findOne({_id:ObjectId(details.proId)})
                // let cartProduct=await collections.categoryCollection.findOne({_id:ObjectId(details.cartId),'products.item':ObjectId(details.proId)})
                
                
                if(details.count==-1&&details.quantity==1){
                    collections.cartCollection.updateOne({_id:ObjectId(details.cartId)},{
                            $pull:{products:{item:ObjectId(details.proId)}}
                    }).then((response)=>{
                        response.delete=true
                       resolve(response)
                    })


                }else{
                    collections.cartCollection.updateOne({_id:ObjectId(details.cartId),'products.item':ObjectId(details.proId)},
                    {
                        $inc:{'products.$.quantity':details.count}
                    }).then(()=>{
                        resolve({status:true})
                    })
                }
            })
        
    },
    removeCartProduct:(details)=>{
        console.log(details);
        return new Promise((resolve, reject) => {
            collections.cartCollection.updateOne({_id:ObjectId(details.cart)},
            {
                $pull:{products:{item:ObjectId(details.product)}}
            }).then((response)=>{
                resolve({removeProduct:true})
            })
        })
    },
    placeOrder:(orderData,userId,cartProducts,totalPrice,username)=>{
        return new Promise(async(resolve, reject) => {
            let orderDate=new Date()
            let user=await collections.userCollection.findOne({_id:ObjectId(userId)})
            let count=uuid.v4()
            
            
            let proCount=cartProducts.length
            for(i=0;i<proCount;i++){
                let qty=-(cartProducts[i].quantity)
                let produId=cartProducts[i].item
                console.log(produId,qty);
                let product=await collections.productCollection.findOne({_id:produId})

              
                collections.productCollection.updateOne({_id:produId},{$inc:{stock:qty}})
            }
            

            let OrderObj={
                 Address:{
                    name:orderData.fname+' '+orderData.lname,
                    address:orderData.address,
                    town:orderData.town,
                    pincode:orderData.pincode,
                    state:orderData.state,
                    phone:orderData.phone,
                    email:orderData.email,
                    date:orderDate,
                    payment:orderData.payment,
                    index:count
                },
                userId:ObjectId(userId),
                username:username,
                products:cartProducts,
                subTotal:totalPrice.total,
                discTotal:totalPrice.disTotal,
                orderStatus:"orderPlaced"
                
            }
            
            if(orderData?.save=='true'){
                collections.userCollection.updateOne({_id:ObjectId(userId)},{$push:{address:Address}})
            }
            collections.orderCollection.insertOne(OrderObj).then((response)=>{
                collections.cartCollection.deleteOne({user:ObjectId(userId)}).then(()=>{
                    resolve() 
                })
            })

        })
    },
    orders:(userId)=>{
        return new Promise(async(resolve, reject) => {
            let orderData=await collections.orderCollection.find({userId:ObjectId(userId)}).toArray()
            resolve(orderData);

        })
    },
    singleOrder:(orderId,proId,index)=>{
        return new Promise(async(resolve, reject) => {
            let order=await collections.orderCollection.findOne({_id:ObjectId(orderId)})
           
            let singleProductData={
                productData:order.products[index],
                address:order.Address,
                status:order.orderStatus
            }
            resolve(singleProductData);
        })
    },
    getUserInformation:(userId)=>{
        return new Promise(async(resolve, reject) => {
            let userData=await collections.userCollection.findOne({_id:ObjectId(userId)})
            resolve(userData)
        })

    },
    updateUserData:(userId,userData)=>{
        return new Promise((resolve, reject) => {
            
            collections.userCollection.updateOne({_id:ObjectId(userId)},{$set:{
                username:userData.username,
                email:userData.email,
                phone:userData.phone
            }}).then(()=>{
                resolve()
            })
        })
    },
    verifyPassword:(userId,Password)=>{
        return new Promise(async(resolve, reject) => {
            let user=await collections.userCollection.findOne({_id:ObjectId(userId)})
            console.log(Password);
            let response={}
            bcrypt.compare(Password.password,user.password).then((status)=>{
                if(status){
                    response.status=true
                    resolve(response)
                }else{
                    response.error="Wrong Password"
                    resolve(response)
                }
               
            })
        })
    },
    changePassword:(password,user)=>{
       
        let id=user._id
        return new Promise(async(resolve, reject) => {
            let userData=await collections.userCollection.findOne({_id:ObjectId(id)})
            currPass=userData.password
            bcrypt.compare(password,currPass).then(async(status)=>{
                if(status){
                    let Err="Your new password cannot be the same as current password"
                    resolve(Err)
                }else{
                    password=await bcrypt.hash(password,10)
                    collections.userCollection.updateOne({_id:ObjectId(id)},{$set:{
                        password:password
                    }}).then(()=>{
                        
                        resolve()
                    })
                }
            })
        })
    },
    getUserAddress:(userId)=>{
        return new Promise(async(resolve, reject) => {
            let userData=await collections.userCollection.findOne({_id:ObjectId(userId)})
            resolve(userData.address)
        })
    },
    addUserAddress:(userId,addressData)=>{

        return new Promise(async(resolve, reject) => {
            let user=await collections.userCollection.findOne({_id:ObjectId(userId)})
            let count=uuid.v4()
            let address={
                name:addressData.fname+' '+addressData.lname,
                address:addressData.address,
                town:addressData.town,
                pincode:addressData.pincode, 
                state:addressData.state,
                phone:addressData.phone,
                email:addressData.email,
                index:count
            }
            collections.userCollection.updateOne({_id:ObjectId(userId)},{$push:{address:address}})
            resolve()
        })
        

    },
    deleteAddress:(indexId,userId)=>{
        return new Promise((resolve, reject) => { 
            
            collections.userCollection.updateOne({_id:ObjectId(userId)},{$pull:{address:{index:indexId}}}).then((res)=>{
                resolve()
            })
        })
    },
    cancelOrderProducts:(orderId)=>{
        return new Promise(async(resolve, reject) => {
            let order=await collections.orderCollection.findOne({_id:ObjectId(orderId)})
            resolve(order);
        })
    },
    cancelOrder:(orderId,cancelData)=>{
        return new Promise((resolve, reject) => {
            collections.orderCollection.updateOne({_id:ObjectId(orderId)},{$set:{
                orderStatus:"userCancelPending",
                reason:cancelData.reason,
                feedback:cancelData.feedback
            }}).then(()=>{
                resolve()
            })
        })
    },
    getSelectedAddress:(userId,id)=>{
        return new Promise(async(resolve, reject) => {
            let selAddress=await collections.userCollection.aggregate([
                {
                    $match:{_id:ObjectId(userId)}
                },
                {
                    $unwind:'$address'
                },
                {
                    $match:{'address.index':id}
                }
            ]).toArray()
           
           let data=selAddress[0].address
            let name=selAddress[0].address.name
            let arr=name.split(' ')
            
            let address={
                fname:arr[0],
                lname:arr[1],
                address:data.address,
                town:data.town,
                pincode:data.pincode,
                state:data.state,
                phone:data.phone,
                email:data.email
            }
            resolve(address);
        })

    }
    
} 