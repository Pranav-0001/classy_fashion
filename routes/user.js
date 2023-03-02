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
  console.log(req.body);
  userHelper.addToCart(proId, userId,req.body).then(() => {
    res.redirect('/cart')
  })
})

router.post('/change-quantity',(req,res)=>{
  userHelper.changeQuantity(req.body).then(async(response)=>{
    
    
    res.json(response)
  })
})

router.post('/remove-cart-product',(req,res)=>{
  userHelper.removeCartProduct(req.body).then((response)=>{
    res.json(response)
  })
})
router.get('/place-order',verifyLogin,async(req,res)=>{

  let user=req.session.user
  let cartProducts=await userHelper.getCartProducts(req.session.user._id)
  let totalPrice=await userHelper.getTotalAmount(req.session.user._id)
  totalPrice.saving=totalPrice.total-totalPrice.disTotal
  
  res.render('user/placeOrder',{totalPrice,user})
})

router.get('/place-order-success-page',(req,res)=>{
  res.render('user/order-success',{user:req.session.user})
})

router.post('/place-order',async(req,res)=>{
  
  userId=req.session.user._id
  let cartProducts=await userHelper.getCartProducts(req.session.user._id)
  let totalPrice=await userHelper.getTotalAmount(req.session.user._id)
  userHelper.placeOrder(req.body,userId,cartProducts,totalPrice).then(()=>{
    res.render('user/order-success',{user:req.session.user})
  }) 
})

router.get('/orders',verifyLogin,(req,res)=>{

  userHelper.orders(req.session.user._id).then((orderData)=>{
    console.log(orderData[0].products);
  })
  res.render('user/orders')
})

module.exports = router;  
