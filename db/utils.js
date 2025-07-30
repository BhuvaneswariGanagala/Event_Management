const { Client } = require("pg");

const conn=new Client({
    host:"localhost",
    port:5432,
    user:"postgres",
    password:"Bhuvana@123",
    database:"Event_management"
})

conn.connect((err)=>{
    if(err) throw err;
    console.log("connected to Database successfully");
})
conn.query("SELECT * FROM events",(err,res)=>{
    if(!err){
        // console.log(res.rows);
    }
    else{
        console.log(err.message)
    }
    conn.end;
})
module.exports = conn;