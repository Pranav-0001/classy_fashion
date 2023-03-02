const bcrypt=require('bcrypt');
const collections=require('./collections');
const uuid=require('uuid')
const mongoose=require('mongoose')
const fs=require('fs');
const { categoryCollection } = require('./collections');

const {ObjectId}=mongoose.Types

module.exports={
    adminLogin:(admindata)=>{
        console.log(admindata);
        let response={}
        return new Promise(async(resolve, reject) => {
            let admin=await collections.adminCollection.findOne({email:admindata.email})
            if(admin){
                bcrypt.compare(admindata.password,admin.password).then((status)=>{
                    if(status){
                    console.log(status);
                    response.admin=admin
                    response.status=true
                    resolve(response)
                    }else if(admindata.password==''){
                        response.msg="Password Field required"
                    resolve(response)
                    }else{
                    response.msg="Invalid Password"
                    resolve(response)
                }
                })
            }else if(admindata.email==''){
                response.msg="Email Field required"
                resolve(response) 
            }else{
                response.msg="Invalid Email"
                resolve(response) 
            }
        })
    },
    addProduct: (productData, Images) => {
        console.log(Images);
        console.log(productData);

        let response={}

        return new Promise((resolve, reject) => {
        if (Images.length > 5) {
                response.err = "Max 5 images are allowed"
                resolve(response.err);
            } else if (Images.length < 2) {
                response.err = "5 Images Required"
                resolve(response.err);
            } else if(!productData.S && !productData.M && !productData.L && !productData.XL && !productData.XXL){
                response.err = "Should select one size"
                resolve(response.err);
            }else {
                let count = Images.length
                console.log(count);
                let imgId = []
                let size=[]
                if(productData.S=='on')size.push('S'); else size.push('')
                if(productData.M=='on')size.push('M'); else size.push('')
                if(productData.L=='on')size.push('L'); else size.push('')
                if(productData.XL=='on')size.push('XL'); else size.push('')
                if(productData.XXL=='on')size.push('S'); else size.push('')
                
                if (count) {
                    for (i = 0; i < count; i++) {
                        imgId[i] = uuid.v4()
                        Images[i].mv('./public/product-images/' + imgId[i] + '.jpg', (err, done) => {
                            if (err) {
                                console.log(err);
                            }
                        })
                    }

                productData.price = parseInt(productData.price)
                productData.discount = parseInt(productData.discount)
                productData.stock = parseInt(productData.stock)

                let offer = (productData.price * productData.discount) / 100
                let offerPrice = productData.price - offer
                productData.offerPrice = parseInt(offerPrice)
                productData.savings = parseInt(offer)
                productData.size=size



                productData.Images = imgId
                collections.productCollection.insertOne(productData).then((data) => {   
                    response.status = true
                    resolve(response)
                })
            } else {
                response.err = "Minimum 2 images Required"
                resolve(response.err);
            }
            }
        })


    },
    getAllProduct:()=>{
        return new Promise(async(resolve, reject) => {
            let product=await collections.productCollection.find().toArray()
           resolve(product)
            
        })
    },
    getAllUsers:()=>{
        return new Promise(async(resolve, reject) => {
            let users=await collections.userCollection.find().toArray()
            resolve(users);
        })
    },
    banUser:(userId)=>{
        return new Promise((resolve, reject) => {
            collections.userCollection.updateOne({_id:ObjectId(userId)},{$set:{status:false}}).then((data)=>{
                console.log(data);
            })
        })
    },
    unblockUser:(userId)=>{
        return new Promise((resolve, reject) => {
            collections.userCollection.updateOne({_id:ObjectId(userId)},{$set:{status:true}}).then((data)=>{
                console.log(data);
            })
        })
    },
    deleteUser:(userId)=>{
        return new Promise((resolve, reject) => {
            collections.userCollection.deleteOne({_id:ObjectId(userId)})
        })
    },
    deleteProduct:(proId)=>{
        return new Promise(async(resolve, reject) => {
            pro=await collections.productCollection.findOne({_id:ObjectId(proId)})
            let count=pro.Images.length
            for(i=0;i<count;i++){
                fs.unlink('./public/product-images/'+pro.Images[i]+'.jpg',(err)=>{
                    if(err){
                        console.log(err);
                    }
                })
            }
            collections.productCollection.deleteOne({_id:ObjectId(proId)})
        })
    },
    editProduct:(proId)=>{
        return new Promise(async(resolve, reject) => {
            pro=await collections.productCollection.findOne({_id:ObjectId(proId)})
            resolve(pro)
            
        })
    },
    updateProduct:(proId,productData)=>{
        console.log(productData);
        priceRegx=/^([0-9]){1,6}$/gm
        productRegx=/^([A-Za-z 0-9]){4,80}$/gm
        brandRegx=/^([A-Za-z ]){3,12}$/gm
        discountRegx=/^([0-9]){1,2}$/gm
        stockRegx=/^([0-9]){1,5}$/gm
        desRegx=/^([A-Za-z0-9 ,_.-]){5,500}$/gm
        let response={}
        return new Promise(async(resolve, reject) => {
            if(productData.product==''){
                response.err="Title field is empty"
                resolve(response.err);
            }else if(productData.brand==''){
                response.err="Brand filed is empty"
                resolve(response.err);
            }else if(productData.price==''){
                response.err="Price field is empty"
                resolve(response.err);
            }else if(productData.stock==''){
                response.err="Stock field is empty"
                resolve(response.err);
            }else if(productData.category==''){
                response.err="Please choose any category"
                resolve(response.err);
            }else if(productData.description==''){
                response.err="Description field is empty"
                resolve(response.err);
            }else if(productRegx.test(productData.product)==false){
                response.err="Invalid Product name,Product name should contain atleast 4 letters"
                resolve(response.err);
            }else if(brandRegx.test(productData.brand)==false){
                response.err="Invalid Brand name,Brand name should contain atleast 4 letters"
                resolve(response.err);
            }else if(!productData.S && !productData.M && !productData.L && !productData.XL && !productData.XXL){
                response.err="Choose any Size"
                resolve(response.err);
            }
            else if(priceRegx.test(productData.price)==false){
                response.err="Price field only allows Numbers"
                resolve(response.err);
            }else if(discountRegx.test(productData.discount)==false){
                response.err="discount field only allows Numbers and range should between 0-99"
                resolve(response.err);
            }else if(stockRegx.test(productData.stock)==false){
                response.err="Stock field only allows Numbers"
                resolve(response.err);
            }else if(desRegx.test(productData.description)==false){
                response.err="Description field should contain atleast 5 words"
                resolve(response.err);
            }
            else{

                product=await collections.productCollection.findOne({_id:ObjectId(proId)})
                productData.price = parseInt(productData.price)
                productData.discount = parseInt(productData.discount)
                productData.stock = parseInt(productData.stock)
                let size=[]
                if(productData.S=='on')size.push('S'); else size.push('')
                if(productData.M=='on')size.push('M'); else size.push('')
                if(productData.L=='on')size.push('L'); else size.push('')
                if(productData.XL=='on')size.push('XL'); else size.push('')
                if(productData.XXL=='on')size.push('S'); else size.push('')
                let offer = (productData.price * productData.discount) / 100
                let offerPrice = productData.price - offer
                productData.offerPrice = parseInt(offerPrice)
                productData.savings = parseInt(offer)
                collections.productCollection.updateOne({_id:ObjectId(proId)},{$set:{
                    product:productData.product,
                    brand:productData.brand,
                    price:productData.price,
                    discount:productData.discount,
                    category:productData.category,
                    stock:productData.stock,
                    description:productData.description,
                    offerPrice:productData.offerPrice,
                    savings:productData.savings,
                    size:size
                }})
                response.status=true
                response.pro=product
                resolve(response)
            }
        })
    },
    addCategory:(cate)=>{ 
        console.log(cate);
        regx=/^([a-zA-Z ]){3,20}$/gm

        return new Promise(async(resolve, reject) => { 
            cate.category=cate.category
            category=await collections.categoryCollection.findOne({category:{$regex:cate.category,$options:"i"}})
           
            
            if(cate.category==''){ 
                resolve("field Empty")
            }else if(regx.test(cate.category)==false){
                resolve("Invalid input")
            }else if(category){
                resolve("Category Already Exist")
            }
            else{
                collections.categoryCollection.insertOne(cate).then((data)=>{
                resolve(data);
            })
            }
        })
        
    },
    getCategory:()=>{
        return new Promise(async(resolve, reject) => {
            let category=await collections.categoryCollection.find().toArray()
            resolve(category)
        })
    },
    deleteCategory:(cateId)=>{
        return new Promise((resolve, reject) => {
            collections.categoryCollection.deleteOne({_id:ObjectId(cateId)})
        })
    },
    deleteImage:(imgId)=>{
        return new Promise(async(resolve, reject) => {
            let response={}
            let product=await collections.productCollection.findOne({Images:{$in:[imgId]}})
           
            let count=product.Images.length
            console.log(count);
            if(count<=2){
                response.msg="Can't Delete , Minimum 2 Images required"
                response.id=product._id
                resolve(response)
            }else{
                response.id=product._id
            collections.productCollection.updateMany({},{$pull:{Images:{$in:[imgId]},Images:imgId}})
            resolve(response)
            }
        })
    },
    addProductImage:(proId)=>{
        return new Promise(async(resolve, reject) => {
            let product=await collections.productCollection.findOne({_id:ObjectId(proId)})
            resolve(product)
        })
    },
    saveImage:(proId,Image)=>{
        return new Promise(async(resolve, reject) => {
            let product=await collections.productCollection.findOne({_id:ObjectId(proId)})
            let count=product.Images.length
            let response={}
            if(count>=5){
                response.err="Maximum 5 images are Accepted"
                resolve(response.err)
            }else{
            let imgId=uuid.v4()
            collections.productCollection.updateOne({_id:ObjectId(proId)},{$push:{Images:imgId}})
            Image.mv('./public/product-images/'+imgId+'.jpg',(err)=>{
                if(err){
                    console.log(err);
                }
            })
            response.status=true
            resolve(response)
            } 
        })
    },
    editCategory:(cateId)=>{
        return new Promise(async(resolve, reject) => {
            let category=await collections.categoryCollection.findOne({_id:ObjectId(cateId)})
            resolve(category);
        })
    },
    updateCategory:(cateId,cate)=>{
        return new Promise((resolve, reject) => {
            collections.categoryCollection.updateOne({_id:ObjectId(cateId)},{$set:{category:cate.category}})
            resolve()
        })
    }
}