// importing libraries
const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);   
const cors = require("cors")
const port = process.env.PORT || 5050
const mongoose = require('mongoose')
const User = require("./User.js")


const connection_url =
  "mongodb+srv://admin:admin@cluster0.hcbbvuo.mongodb.net/?retryWrites=true&w=majority";

app.use(cors())
mongoose.connect(connection_url)

mongoose.connection.on('connected',(data,err)=>{
  console.log("Connected to DB")
})

const {Server} = require("socket.io")  // server class from socket.io

// setting constants
let arr = new Array(9);

function checkForWin(num, symbol) {
  let index = num - 1;

  function horizontalMatch() {
    // for horizontal match
    if (index < 3) {
      // +3,+6
      if (arr[index + 3] == symbol && arr[index + 6] == symbol) {
        return true;
      }
    } else if (index < 6) {
      // -3,+3
      if (arr[index - 3] == symbol && arr[index + 3] == symbol) {
        return true;
      }
    } else {
      // -6,-3
      if (arr[index - 3] == symbol && arr[index - 6] == symbol) {
        return true;
      }
    }
    return false;
  }
  
  function verticalMatch() {
    // for vertical match
    if (index % 3 == 0) {
      // +1,+2
      if (arr[index + 1] == symbol && arr[index + 2] == symbol) {
        return true;
      }
    } else if (index % 3 == 1) {
      // -1,+1
      if (arr[index - 1] == symbol && arr[index + 1] == symbol) {
        return true;
      }
    } else {
      // -2,-1
      if (arr[index - 1] == symbol && arr[index - 2] == symbol) {
        return true;
      }
    }

    return false;
  }

  function diagonalMatch() {
    // for diagonal match
    if (
      (arr[0] == symbol && arr[4] == symbol && arr[8] == symbol) ||
      (arr[2] == symbol && arr[4] == symbol && arr[6] == symbol)
    ) {
      return true;
    }

    return false;
  }

  if (diagonalMatch() || horizontalMatch() || verticalMatch()) {
    // alert(symbol + " Won!!!");
    return true;
  }
}

// middlewares
app.use(express.json());
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*"),
  res.setHeader("Access-Control-Allow-Headers", "*");
  next();
});



// IO object creation

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// listening to calls and functions
var ROOM="";
io.on("connection",(socket)=>{

    socket.on("move-played-to-backend",(data)=>{
      arr[data.num-1]=(data.nextMove=="X")?"O":"X";
      socket.broadcast.emit("move-played-from-backend",{arr,nextMove:data.nextMove,chance:true});
      if(checkForWin(data.num,(data.nextMove=="X")?"O":"X")){
        // socket.broadcast.emit("move-played-from-backend",{arr,nextMove:data.nextMove,chance:false});
        // socket.emit("game-won",(data.nextMove=="X")?"O":"X");
        // io.emit("game-won",(data.nextMove=="X")?"O":"X");
        io.emit("game-won",data.name);
      }
      
    })

    socket.on("join-room",(room)=>{
      ROOM =room
      if(room!=socket.id){
        // socket.to(room).emit("chance-to-play",true);
        socket.to(room).emit("chance-to-play",true);
      }
    })

    socket.on("clear-array",()=>{
      arr = Array(9).fill("");
    })
})



app.get("/", (req, res) => {
  res.send("<h1>Hello world</h1>");
});

// MongoDB code api calls
app.post("/user",(req,res)=>{
  let u = req.body;
  User.create(u,(err,data)=>{
    if(err){
      res.status(500).send({ status: "error", msg: err });
    }
    else{
      res.status(200).send({ status: "ok", msg: "user created" });
    }
  })
})

app.get("/user",(req,res)=>{
  let u = req.query
  User.findOne(
    u,
    (err, data) => {
      if (err) {
        res
          .status(500)
          .send({ status: "error", msg: "server error or user not found",error:err });
      } else {
        if (!data) {
          res.status(500).send({ status: "error", msg: "user not found" });
        }
        res.status(200).send({ status: "ok", msg: "found", data: data });
      }
    }
  );
})

app.get("/score",(req,res)=>{
  let e = req.query
  console.log(e)
  User.findOne(e,(err,data)=>{
    if (err) {
      res.status(500).send({
          status: "error",
          msg: "server error or user not found",
          error: err,
        });
    } else {
      if (!data) {
        res.status(500).send({ status: "error", msg: "user not found" });
      }
      res.status(200).send({ status: "ok", msg: "found", data: {wins:data.wins,losses:data.losses,name:data.name}});
    }
  })

})

app.post("/score",(req,res)=>{
  let e = req.query
  let w = req.body.wins
  let l = req.body.losses
  console.log(e,w,l)
  User.updateOne(e,{$set:{wins:w,losses:l}},(err,data)=>{
    if (err) {
      res.status(500).send({
          status: "error",
          msg: "server error or user not found",
          error: err,
        });
    } else {
      if (!data) {
        res.status(500).send({ status: "error", msg: "user not found" });
      }
      res.status(200).send({ status: "ok", msg: "found", data: {wins:data.wins,losses:data.losses,name:data.name}});
    }
  })

})




server.listen(port, () => {
  console.log("listening on :",port);
});
