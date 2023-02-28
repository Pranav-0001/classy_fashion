var express = require('express');
const nocache = require('nocache');
var router = express.Router();
const adminHelper=require('../model/adminHelper')
const uuid=require('uuid');
const { response } = require('express');
const fs=require('fs');
const { route } = require('./user');


/* GET users listing. */
let verifyLogin=(req,res,next)=>{
  let admin=req.session.admin
  if(admin){
    next()
  }else{
    res.redirect('/admin/login')
  }
}
router.get('/',nocache(), function(req, res, next) {
  let admin = req.session.admin
  if (admin) {
    res.render('admin/home',{admin});
  }else{
    res.redirect('/admin/login')
  }
  
});

router.get('/login',nocache(), (req, res) => {
  let admin = req.session.admin
  if (admin) {
    res.redirect('/admin')
  } else {
    err = req.session.adminLoginErr
    res.render('admin/login', { err })
    req.session.adminLoginErr = null
  }
 
})
router.post('/login',(req,res)=>{
  
  adminHelper.adminLogin(req.body).then((response)=>{
    if(response.status){
      req.session.admin=response.admin
      res.redirect('/admin')

    }else{
      console.log(response.msg);
      req.session.adminLoginErr=response.msg
      res.redirect('/admin/login')
    }
  })

})
router.get('/products',verifyLogin,(req,res)=>{
  let admin=req.session.admin
  adminHelper.getAllProduct().then((products)=>{
    console.log(products.length);
    res.render('admin/products',{products,admin})
  })
  
})

router.get('/add-product',verifyLogin,(req,res)=>{
  let err=req.session.addProductErr
  let data=req.session.addData
  let admin=req.session.admin
  adminHelper.getCategory().then((category)=>{
    res.render('admin/add-product',{err,data,category,admin})
    req.session.addProductErr=null
    req.session.addData=null
  })
  
  
 
})

router.post('/add-product',(req,res)=>{
  
  // console.log(req.body);
  let images=req.files.images
  req.session.addData=req.body
  adminHelper.addProduct(req.body,images).then((response)=>{
    if(response.status){
      res.redirect('/admin/products')
    }else{
      
      req.session.addProductErr=response
      res.redirect('/admin/add-product')
    }
  })

})

router.get('/user-list',verifyLogin,(req,res)=>{
  let admin=req.session.admin
  adminHelper.getAllUsers().then((users)=>{
    res.render('admin/users',{users,admin})
  })

})


router.get('/ban-user/:id',verifyLogin,(req,res)=>{
  adminHelper.banUser(req.params.id)
  res.redirect('/admin/user-list')
})
router.get('/unblock-user/:id',verifyLogin,(req,res)=>{
  adminHelper.unblockUser(req.params.id)
  res.redirect('/admin/user-list')
})

router.get('/delete-user/:id',verifyLogin,(req,res)=>{
  adminHelper.deleteUser(req.params.id)
  res.redirect('/admin/user-list')
})

router.get('/delete-product/:id',verifyLogin,(req,res)=>{
  adminHelper.deleteProduct(req.params.id)
  res.redirect('/admin/products')
})

router.get('/edit-product/:id',verifyLogin,(req,res)=>{
  let admin=req.session.admin
  err=req.session.editProductErr
  
  delImgErr=req.session.deleteImgErr
  
  adminHelper.editProduct(req.params.id).then((product)=>{
    
  
    adminHelper.getCategory().then((cate)=>{
      res.render('admin/edit-product',{product,err,cate,delImgErr,admin})
    })
    
  })
  req.session.editProductErr=null
  req.session.deleteImgErr=null
  
})

router.post('/edit-product/:id',(req,res)=>{
  adminHelper.updateProduct(req.params.id,req.body).then((response)=>{
    Obj=req.files
    if(Obj){
      count=Object.keys(Obj).length
      console.log(count);
      if(response.status){
        for(i=0;i<count;i++){
          imgId=Object.keys(Obj)[i]
          img=Object.values(Obj)[i]
          img.mv('./public/product-images/'+imgId+'.jpg').then((err)=>{
            if(err){
              console.log(err);
            }
          })
        }
        
        res.redirect('/admin/products') 
      }else{
       
        req.session.editProductErr=response
        res.redirect('/admin/edit-product/'+req.params.id)
      }
    }else{
      if(response.status){
        res.redirect('/admin/products') 
      }else{
        req.session.editProductErr=response
        res.redirect('/admin/edit-product/'+req.params.id)
      }
      
    }
  })
  
})

router.get('/categories',verifyLogin,(req,res)=>{
  adminHelper.getCategory().then((categories)=>{
   let data=req.session.cateData
   let err=req.session.categoryErr
   let category=req.session.editCateData
   let admin=req.session.admin
    console.log(err);
    res.render('admin/categories',{categories,err,data,category,admin})
    req.session.categoryErr=null
    req.session.cateData=null
    req.session.editCateData=null
  })
  
})

router.post('/add-category',(req,res)=>{
  adminHelper.addCategory(req.body).then((data)=>{
    if(data.insertedId){
      
    res.redirect('/admin/categories')
    }else{
      req.session.cateData=req.body
      req.session.categoryErr=data
      res.redirect('/admin/categories')
    }
    
  })
  
  
})
router.get('/delete-category/:id',verifyLogin,(req,res)=>{
  adminHelper.deleteCategory(req.params.id)
  res.redirect('/admin/categories')
})

router.get('/delete-image/:imgId',verifyLogin,(req,res)=>{
  adminHelper.deleteImage(req.params.imgId).then((response)=>{
    if(response.msg){
      req.session.deleteImgErr=response.msg
      let id=response.id
      res.redirect('/admin/edit-product/'+id)
    }else{
      fs.unlink('./public/product-images/'+req.params.imgId+'.jpg',(err)=>{
      if(err){
        console.log(err);
      }
    })
    let id=response.id
      res.redirect('/admin/edit-product/'+id)
    }
    
    
  })
})

router.get('/add-productImg/:id',verifyLogin,(req,res)=>{
  let err=req.session.addProImageErr
  let admin=req.session.admin
  adminHelper.addProductImage(req.params.id).then((product)=>{

    res.render('admin/add-image',{product,err,admin})
  })
  req.session.addProImageErr=null
})

router.post('/add-productImg/:id',(req,res)=>{
  
  adminHelper.saveImage(req.params.id,req.files.Image).then((response)=>{
    if(response.status){
      res.redirect('/admin/products')
    }else{
      req.session.addProImageErr=response
      res.redirect('/admin/add-productImg/'+req.params.id)
    }
  })
})

router.get('/edit-category/:id',(req,res)=>{
  adminHelper.editCategory(req.params.id).then((category)=>{
    req.session.editCateData=category
    res.redirect('/admin/categories')
  })
})

router.post('/edit-category/:id',(req,res)=>{
  adminHelper.updateCategory(req.params.id,req.body).then(()=>{
    res.redirect('/admin/categories')
  })
  
})

router.get('/logout',(req,res)=>{
  req.session.admin=null
  res.redirect('/admin')
})
module.exports = router;
  