const mongoose=require('mongoose')
const model=require('./schema')

module.exports={
    userCollection:mongoose.model("user",model.userSchema).collection,
    adminCollection:mongoose.model("admin",model.adminSchema).collection,
    productCollection:mongoose.model("products",model.productSchema).collection,
    categoryCollection:mongoose.model("categories",model.categorySchema).collection,
    cartCollection:mongoose.model('cart',model.cartSchema).collection
} 