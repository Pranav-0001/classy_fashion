var express = require('express');
var router = express.Router();
const userHelper=require('../model/userHelpers')
const nocache=require('nocache');
/* GET home page. */

let verifyLogin=(req,res,next)=>{
  let user=req.session.user
  if(user){
    next()
  }else{
    res.redirect('/login')
  }
}

router.get('/',nocache(), function(req, res, next) {
  user=req.session.user
  userHelper.latestProduct().then((product)=>{
  res.render('user/index', {user,product});
  })
  
});

router.get('/signup',nocache(),(req,res)=>{
  Err=req.session.signupErr
  signData= req.session.signupData
  user=req.session.user
  if(user){
    res.redirect('/')
  }else{
    res.render('user/signup',{Err,signData})
    req.session.signupErr=null
    req.session.signupData=null
  }
 
 
})

router.post("/signup",(req,res)=>{
  userHelper.userSignUp(req.body).then((response)=>{
    if(response.status){
      req.session.user=req.body
      res.redirect('/')
    }else{
      console.log(response);
      req.session.signupErr=response
      req.session.signupData=req.body
      res.redirect('/signup')
    }
  })
})

router.get('/login',nocache(),(req,res)=>{
  data=req.session.loginData
  Err= req.session.loginErr
  user=req.session.user
  if(user){
    res.redirect('/')
  }else{
    res.render('user/login',{Err,data})
  req.session.loginErr=null
  req.session.loginData=null
  }
  
})
router.post('/login',(req,res)=>{
  console.log(req.body);
  userHelper.userLogin(req.body).then((response)=>{
    if(response.status){
      req.session.user=response.user
      res.redirect('/')
    }else{
      req.session.loginErr=response.msg
      req.session.loginData=req.body
      res.redirect('/login')
      console.log(response.msg);
    }
  })
})
router.get('/logout',(req,res)=>{
  req.session.user=null
  res.redirect('/login')
})

router.get('/otp-login',nocache(),(req,res)=>{
  user=req.session.user
  if(user){
    res.redirect('/')
  }else{
    otp=req.session.otp
  data=req.session.otpData
  err=req.session.otpErr
  invalid=req.session.InvalidOtp
  res.render('user/otp-login',{otp,data,err,invalid})
  req.session.otpErr=null
  }
  
})

router.post('/sent-otp',(req,res)=>{
  userHelper.otpVerify(req.body).then((response)=>{
    if(response.status){
      req.session.otp=response.otp
      req.session.otpData=req.body
      req.session.otpUser=response.user
      res.redirect('/otp-login')
    }else{
      req.session.otpErr=response.err
      req.session.otpData=req.body
      res.redirect('/otp-login')
    }
  })
})

router.post('/otp-login',(req,res)=>{
  otp=req.session.otp
  userOtp=req.body.otp
  user=req.session.otpUser
  if(otp==userOtp){
    req.session.user=user
    req.session.otp=null
    res.redirect('/')
  }else{
    req.session.InvalidOtp="Invalid Otp"
    res.redirect('/otp-login')
  }
})

router.get('/shop',(req,res)=>{
  user=req.session.user
  userHelper.getProducts().then((product)=>{
    userHelper.getCategory().then((response)=>{
      category=response.category
      brands=response.brands
      res.render('user/shop',{product,user,category,brands})
    })
  })
})

router.get('/product/:id',(req,res)=>{
  user=req.session.user
  userHelper.getProduct(req.params.id).then((product)=>{



    res.render('user/single-product',{product,user})
  })
  
})

router.get('/cart',verifyLogin,(req,res)=>{
  
  let user=req.session.user._id
  userHelper.getCartProducts(user).then((products)=>{
    console.log(products);
    res.render('user/cart',{user:req.session.user ,products})
  })
  
})

router.get('/add-to-cart/:id',verifyLogin,(req,res)=>{
  let proId=req.params.id
  let userId=req.session.user._id
  userHelper.addToCart(proId,userId).then(()=>{
    res.redirect('/cart')
  })
})

module.exports = router;  
