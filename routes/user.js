var express = require('express');
var router = express.Router();
const userHelper = require('../model/userHelpers')
const nocache = require('nocache');
const collections = require('../model/collections');
/* GET home page. */

let verifyLogin = (req, res, next) => {
  let user = req.session.user
  if (user) {
    next()
  } else {
    res.redirect('/login')
  }
}

router.get('/', nocache(), async function (req, res, next) {
  user = req.session.user
  let cartCount = 0
  if (user) {
    let userId = req.session.user._id
    cartCount = await userHelper.cartCount(userId)
  }


  userHelper.latestProduct().then((product) => {
    res.render('user/index', { user, product, cartCount });
  })

});

router.get('/signup', nocache(), (req, res) => {
  Err = req.session.signupErr
  signData = req.session.signupData
  user = req.session.user
  if (user) {
    res.redirect('/')
  } else {
    res.render('user/signup', { Err, signData })
    req.session.signupErr = null
    req.session.signupData = null
  }


})

router.post("/signup", (req, res) => {
  userHelper.userSignUp(req.body).then((response) => {
    if (response.status) {
      req.session.user = req.body
      res.redirect('/')
    } else {
      console.log(response);
      req.session.signupErr = response
      req.session.signupData = req.body
      res.redirect('/signup')
    }
  })
})

router.get('/login', nocache(), (req, res) => {
  data = req.session.loginData
  Err = req.session.loginErr
  user = req.session.user
  if (user) {
    res.redirect('/')
  } else {
    res.render('user/login', { Err, data })
    req.session.loginErr = null
    req.session.loginData = null
  }

})
router.post('/login', (req, res) => {
  console.log(req.body);
  userHelper.userLogin(req.body).then((response) => {
    if (response.status) {
      req.session.user = response.user
      res.redirect('/')
    } else {
      req.session.loginErr = response.msg
      req.session.loginData = req.body
      res.redirect('/login')
      console.log(response.msg);
    }
  })
})
router.get('/logout', (req, res) => {
  req.session.user = null
  res.redirect('/login')
})

router.get('/otp-login', nocache(), async (req, res) => {
  user = req.session.user
  if (user) {
    res.redirect('/')
  } else {
    otp = req.session.otp
    data = req.session.otpData
    err = req.session.otpErr
    invalid = req.session.InvalidOtp
    res.render('user/otp-login', { otp, data, err, invalid })
    req.session.otpErr = null
  }

})

router.post('/sent-otp', (req, res) => {
  userHelper.otpVerify(req.body).then((response) => {
    if (response.status) {
      req.session.otp = response.otp
      req.session.otpData = req.body
      req.session.otpUser = response.user
      res.redirect('/otp-login')
    } else {
      req.session.otpErr = response.err
      req.session.otpData = req.body
      res.redirect('/otp-login')
    }
  })
})

router.post('/otp-login', (req, res) => {
  otp = req.session.otp
  userOtp = req.body.otp
  user = req.session.otpUser
  if (otp == userOtp) {
    req.session.user = user
    req.session.otp = null
    res.redirect('/')
  } else {
    req.session.InvalidOtp = "Invalid Otp"
    res.redirect('/otp-login')
  }
})

router.get('/shop', async (req, res) => {
  user = req.session.user
  let cartCount = 0
  if (user) {
    let userId = user._id
    cartCount = await userHelper.cartCount(userId)
  }


  userHelper.getProducts().then((product) => {
    userHelper.getCategory().then((response) => {
      category = response.category
      brands = response.brands
      res.render('user/shop', { product, user, category, brands, cartCount })
    })
  })
})

router.get('/product/:id', async (req, res) => {
  user = req.session.user
  let cartCount = await userHelper.cartCount(user?._id)
  userHelper.getProduct(req.params.id).then((product) => {



    res.render('user/single-product', { product, user, cartCount })
  })

})

router.get('/cart', verifyLogin, async (req, res) => {
  
  let user = req.session.user._id
  let cartCount = await userHelper.cartCount(user)
  
  let total;
  if(cartCount>0){
     total=await userHelper.getTotalAmount(user)
     let savings=total.total-total.disTotal
     let disc=Math.floor((savings*100)/total.total)
     let delivery=(total.disTotal<1500)?100:null;
     total.disTotal=total.disTotal+delivery
     total.savings=savings
     total.disc=disc
     total.delivery=delivery
  }
  
  userHelper.getCartProducts(user).then((products) => {
    res.render('user/cart', { user: req.session.user, products, cartCount,total })
  })

})

router.post('/add-to-cart/:id', verifyLogin, (req, res) => {
  let proId = req.params.id
  let userId = req.session.user._id
 
  userHelper.addToCart(proId, userId,req.body).then(() => {
    res.redirect('/cart')
  })
})

router.post('/change-quantity',(req,res)=>{
  userHelper.changeQuantity(req.body).then(async(response)=>{
    let total=await userHelper.getTotalAmount(req.session.user._id)
    let savings=total.total-total.disTotal
    response.total=total
    response.disc=Math.floor((savings*100)/total.total)
    
    res.json(response)
  })
})

router.post('/remove-cart-product',(req,res)=>{
  userHelper.removeCartProduct(req.body).then((response)=>{
    res.json(response)
  })
})
router.get('/place-order',verifyLogin,async(req,res)=>{
  let Err=req.session.placeOrderErr
  let user=req.session.user
  let cartProducts=await userHelper.getCartProducts(req.session.user._id)
  let totalPrice=await userHelper.getTotalAmount(req.session.user._id)
  totalPrice.saving=totalPrice.total-totalPrice.disTotal
  
  res.render('user/placeOrder',{totalPrice,user,Err})
  req.session.placeOrderErr=null
})

router.get('/place-order-success-page',(req,res)=>{
  
  res.render('user/order-success',{user:req.session.user})
  
})

router.post('/place-order',async(req,res)=>{
   
  userId=req.session.user._id
  let username=req.session.user.username
  let cartProducts=await userHelper.getCartProducts(req.session.user._id)
  let totalPrice=await userHelper.getTotalAmount(req.session.user._id)
  userHelper.placeOrder(req.body,userId,cartProducts,totalPrice,username).then(()=>{
    
      res.render('user/order-success',{user:req.session.user})
     
     
  })  
})

router.get('/orders',verifyLogin,(req,res)=>{

  userHelper.orders(req.session.user._id).then((orderData)=>{
    console.log(orderData);
    res.render('user/orders',{orderData,user:req.session.user})
  })
  
})

router.get('/orderItem/:orderId/:proId/:index',verifyLogin,(req,res)=>{
  let orderId=req.params.orderId
  let proId=req.params.proId
  let index=req.params.index
  
  userHelper.singleOrder(orderId,proId,index).then((singleOrder)=>{
    
    res.render('user/singleOrder',{singleOrder,user:req.session.user})
  })
})

router.get('/profile', verifyLogin,async (req, res) => {

  let userData=await userHelper.getUserInformation(req.session.user._id)
 
  res.render('user/profile', { user: req.session.user ,userData })
})

router.post('/update-user-data',(req,res)=>{
  userHelper.updateUserData(req.session.user._id,req.body)
  res.redirect('/profile')
})

router.get('/Change-password',verifyLogin,(req,res)=>{
  let upass=req.session.pass
  let response=req.session.res
  let Err=req.session.verifyErr
console.log(upass);
  res.render('user/change-password',{user:req.session.user,upass,response,Err})
  req.session.pass=null
  req.session.res=null
  req.session.verifyErr=null
})

router.post('/verify-password',(req,res)=>{
  userHelper.verifyPassword(req.session.user._id,req.body).then((response)=>{
    if(response.status){
      req.session.pass=req.body.password
      req.session.res=response.status
      res.redirect('/change-password')
    }else{
      req.session.verifyErr=response.error
      res.redirect('/change-password')
    }
  })
})

router.post('/change-password',(req,res)=>{
  
  let pass=req.body.newpass
  userHelper.changePassword(pass,req.session.user).then((Err)=>{
    if(Err){
      req.session.verifyErr=Err
      res.redirect('/change-password')
    }else{
   
      res.redirect('/')

    }
  })
})


router.get('/address-manage',verifyLogin,(req,res)=>{
  userHelper.getUserAddress(req.session.user._id).then((address)=>{

    res.render('user/address',{address,user:req.session.user,address})
  })
  
})

router.get('/add-address/:id',verifyLogin,(req,res)=>{
  res.render('user/add-address',{user:req.session.user})
})

router.post('/add-address/:id',(req,res)=>{
  console.log(req.body);
  userHelper.addUserAddress(req.params.id,req.body).then(()=>{
    res.redirect('/address-manage')
  })
})

router.get('/delete-address/:index/:id',(req,res)=>{
  userHelper.deleteAddress(req.params.index,req.params.id).then(()=>{
    res.redirect('/address-manage')
  })
})

module.exports = router;   
 