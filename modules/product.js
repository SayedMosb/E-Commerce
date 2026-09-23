const mongoose =require('mongoose');
const productShema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    price:{
        type:Number,
        required:true
    },
     stock: {
        type: Number,
        required: true,
        min: 0
    }
})



module.exports = mongoose.model('Product',productShema);