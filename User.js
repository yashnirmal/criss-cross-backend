const mongoose = require('mongoose')
 
const User = mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique:true },
  password: { type: String, required: true },
  wins: { type: Number,default:0},
  losses: { type: Number,default:0},
});

module.exports = mongoose.model('User',User)

