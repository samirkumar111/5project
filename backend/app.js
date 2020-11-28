const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser')
let error_handling = require('./Status/error_handling');
let success_handling = require('./Status/success_handling');
var cors = require('cors');
const verify_Token_reception = require('./VerifyTokens/verify_Token_reception');
const verify_Token_admin = require('./VerifyTokens/verify_Token_admin');
const verify_Token_general = require('./VerifyTokens/verify_Token_general');
const token_expire = '15m'
const jwt = require('jsonwebtoken');
require('dotenv').config()

//CreateConection
var connDB =
 mysql.createConnection({
    host: 'localhost',
    user: 'user',
    password: 'user1234',
    database: 'hotel_database',
    insecureAuth : true
});



//Connection
connDB.connect((error) => {
    if(error){
        console.log("connDB.connect((error)"); 
        console.log(error);    
        connDB.connect();    
    }
    else{
        console.log('Mysql connected');
    }
})


const app = express();
app.use(cors())
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));




app.listen('5023', () => {
    console.log("on port 5023")
});

app.get('', (req,res) => {
    res.send("Καλώς ήρθατε στο Api του Hotel Managment System");
});

  

//GlobalFunctons----------------------------------
function GetAllFromTable(table_name){
    return new Promise((resolve,reject)=>{
        sql = "SELECT * FROM "+table_name
        connDB.query(sql,(err, result) => {
            if (err){
                console.log("GetAllFromTable");
                console.log(err);
                resolve (false);
            }
            else{
                resolve (result);
            }
        })
    });
}

function ChangeFromat(date){
    var d  = date.split("-");
    var new_date = d[2]+"/"+d[1]+"/"+d[0]
    return  (new_date);
}



//GlobalFunctons----End---------------------------
//Acount=====================================================================================================
function CheckRefreshTokenReception(token){
    return new Promise((resolve,reject)=>{
        sql = "SELECT * FROM refress_tokens_reception where token = '"+token+"'";
        connDB.query(sql,(err, result) => {
            if (err || result.length<1){
                console.log("CheckRefreshTokenReception");
                console.log(err);
                resolve (false);
            }
            else{
                resolve (true);
            }
        })
    });
}


function CheckRefreshTokenAdmin(token){
    return new Promise((resolve,reject)=>{
        sql = "SELECT * FROM refress_tokens_admin where token = '"+token+"'";
        connDB.query(sql,(err, result) => {
            if (err || result.length<1){
                console.log("CheckRefreshTokenAdmin",err);
                //console.log(err);
                resolve (false);
            }
            else{
                resolve (true);
            }
        })
    });
}


function AddTokenReception(token){
    return new Promise((resolve,reject)=>{
        sql = "insert into refress_tokens_reception values(?)";
        connDB.query(sql,[token],(err, result) => {
            if (err){
                console.log("AddTokenReception");
                console.log(err);
                resolve (false);
            }
            else{
                resolve (true);
            }
        })
    });
}



function AddTokenAdmin(token){
    return new Promise((resolve,reject)=>{
        sql = "insert into refress_tokens_admin values(?)";
        connDB.query(sql,[token],(err, result) => {
            if (err){
                console.log("AddTokenAdmin");
                console.log(err);
                resolve (false);
            }
            else{
                resolve (true);
            }
        })
    });
}

function DeleteTokenReception(token){
    return new Promise((resolve,reject)=>{
        sql = "delete from refress_tokens_reception where token = ?";
        connDB.query(sql,[token],(err, result) => {
            //console.log("result",result.affectedRows)
            //console.log("token",token1)
            //console.log("fwfwfwf\n");

            if (err || result.affectedRows<1){
                console.log("DeleteTokenReception");
                console.log(err);
                resolve (false);
            }
            else{
                resolve (true);
            }
        })
    });
}



function DeleteTokenAdmin(token){
    return new Promise((resolve,reject)=>{
        sql = "delete from refress_tokens_admin where token = '"+token+"'";
        connDB.query(sql,(err, result) => {
            
            if (err || result.affectedRows<1){
                
                console.log("DeleteTokenAdmin","error",token);
                console.log(sql);
                //console.log(err);
                resolve (false);
            }
            else{
                resolve (true);
            }
            console.log("\n");
        })
    });
}


app.post("/token_reception", async (req,res) => {
   
    const refress_token = req.body.refress_token
    //console.log("bode",req.body.refress_token)
    var refress_token1 = refress_token
    //console.log("1")
    if(refress_token == null) return res.sendStatus(401)
    
    rf = await CheckRefreshTokenReception(refress_token)
    //console.log("2",rf)
    if(!rf) return res.sendStatus(403)
    //console.log("3",rf)
    jwt.verify(refress_token,process.env.REFRESH_TOKEN_KEY_RECEPTION , async (err,user)=>{
        //console.log(user.user,err)
        if(err) return res.sendStatus(403) 
        await DeleteTokenReception(refress_token1);
        const access_token = generateAccessTokenforReception({user :user.user})
        const refress_token = jwt.sign({user :user.user},process.env.REFRESH_TOKEN_KEY_RECEPTION);
        await AddTokenReception(refress_token);
        //const obj = {"access_token": access_token ,"refress_token": refress_token}
        res.send({"access_token": access_token ,"refress_token": refress_token});
        //console.log(obj)
    });
});

app.delete("/token_reception", async (req,res) => {
    const refress_token = req.body.refress_token
    //console.log("refress_token",req.body.refress_token)
    result = await DeleteTokenReception(refress_token)
    if(result){
        res.send(success_handling("success"))
    }else{
        res.send(error_handling("success"))
    }
});


app.post("/token_admin", async (req,res) => {
   
    const refress_token = req.body.refress_token
    //console.log("body",req.body.refress_token)
    var refress_token1 = refress_token
    //console.log("1")
    if(refress_token == null) return res.sendStatus(401)
    //console.log("2")
    rf = await CheckRefreshTokenAdmin(refress_token)
    console.log("token_admin ",refress_token,"\n")
    if(!rf) { 
        console.log("token_admin not found ")
        return res.sendStatus(403)
    }

    //console.log("3",rf)
    jwt.verify(refress_token,process.env.REFRESH_TOKEN_KEY_ADMIN , async (err,user)=>{
        //console.log(user.user,err)
        if(err) return res.sendStatus(403) 
        console.log("refress_token1 ",refress_token1,"\n")
        if(await DeleteTokenAdmin(refress_token1)){
            const access_token = generateAccessTokenforAdmin({user :user.user})
            const refress_token = jwt.sign({user :user.user},process.env.REFRESH_TOKEN_KEY_ADMIN);
            await AddTokenAdmin(refress_token);
            res.send({"access_token": access_token ,"refress_token": refress_token});
        }else{
            res.sendStatus(401)
        }
    });
});


app.delete("/token_admin", async (req,res) => {
    const refress_token = req.body.refress_token    
    result = await DeleteTokenAdmin(refress_token)
    if(result){
        res.send(success_handling("success"))
    }else{
        res.send(error_handling("error"))
    }
});
//login

app.post("/login/admin",async (req,res) => {

    const employee = req.body.data ;
    //console.log("employeeconsole.log("employee",employee)
    ressu = await CheckAdmin(employee.user_name,employee.password)
    if(ressu == false){
        res.send(error_handling("mpompa"))
    }else{
        ressu= JSON.parse(JSON.stringify(ressu[0]));
        ressu = (({ id, first_name ,last_name }) => ({ id, first_name ,last_name }))(ressu);
        const employee1 = {user: ressu};
        const access_token = generateAccessTokenforAdmin(employee1)
        const refress_token = jwt.sign(employee1,process.env.REFRESH_TOKEN_KEY_ADMIN);
        await AddTokenAdmin(refress_token);
        res.send({"access_token": access_token ,"refress_token": refress_token});
        //console.log(ressu)
    }
});

///
app.post("/login/employee",async (req,res) => {

    const employee =req.body.data ;
    //console.log("employeeconsole.log("employee",employee)
    ressu = await CheckLogin(employee.user_name,employee.password)
    if(ressu == false){
        res.send(error_handling("mpompa"))
    }else{
        ressu= JSON.parse(JSON.stringify(ressu[0]));
        ressu = (({ id, first_name ,last_name }) => ({ id, first_name ,last_name }))(ressu);
        const employee1 = {user: ressu};
        const access_token = generateAccessTokenforReception(employee1)
        const refress_token = jwt.sign(employee1,process.env.REFRESH_TOKEN_KEY_RECEPTION);
        await AddTokenReception(refress_token);
        res.send({"access_token": access_token ,"refress_token": refress_token});
        //console.log(ressu)
    }
});



function generateAccessTokenforReception(employee){
    return jwt.sign(employee,process.env.ACCESS_TOKEN_KEY_RECEPTION,{
        expiresIn: token_expire 
        });
}

function generateAccessTokenforAdmin(employee){
    return jwt.sign(employee,process.env.ACCESS_TOKEN_KEY_ADMIN,{
        expiresIn: token_expire 
        });
}




app.get("/authCheck",verify_Token_general, (req,res) => {
    //console.log("auchCheck\n")
    //res.send(success_handling("joirjgrgrg"))
});


//EndAcount==================================================================================================

///Empolyees
app.post("/employee",verify_Token_admin, async (req,res) => {
    employee  =req.body.data ;
    console.log(employee)
    if(await RegisterEmpolyee(employee)==true){
        res.send(success_handling("mpompa"))
    }else{
        res.send(error_handling("error"));

    }
});


app.put("/employee",verify_Token_admin, async (req,res) => {
    //console.log(req.body.data)
    current_employee = req.body.data
    //console.log(current_employee.birthday,ChangeFromat(current_employee.birthday))

    //console.log("Επεξεργασια employee")
   // console.log(current_room)
    if(await UpdateEmployee(current_employee)){
          res.send(success_handling(""));
    }else{
         res.send(error_handling(""));
    }
});

app.delete("/employee", verify_Token_admin, async(req,res) => {
    //console.log(req.body)
    employee = req.body;
    //console.log("Διαγραφη πελάτη",costumer);
    const result = await DeleteEmployee(employee);
    if(result){
        res.send(success_handling("success delete costumer"))
    }else{
        res.send(error_handling("error in delete costumer"))
    }
});





app.get("/employee/:id",verify_Token_admin,  async (req,res) => {
    employee_id = req.params.id;
  //  console.log("employee_id",employee_id)
    if (employee_id =="!" || employee_id ==="!"){
       
        result = await GetAllFromTable("employees");
    }else{
        result = await GetEmployeeById(employee_id);
    }
    res.send(result);
    
});

function GetEmployeeById(employee_id){
    return new Promise((resolve,reject)=>{
        sql = "";
        if (parseFloat(employee_id)==employee_id){
            sql = " select * from employees where afm  like '%"+employee_id+"%'"
        }else{
            sql = " select * from employees where last_name  like '%"+employee_id+"%'"
        }
        connDB.query(sql,(err, result) => {
            if (err){
                console.log("GetEmployeeById");
                console.log(err);
                resolve ([]);
            }
            else{
                resolve (result);
            }
        })
    });
}

function CheckLogin(username,password){
    //console.log(username,password)
    return new Promise((resolve,reject)=>{
        sql = "select * from employees where username=? and password =?";
        
        connDB.query(sql,[username,password],(err, result) => {
            if (err){
                console.log("CheckLogin");
                console.log(err);
                resolve (false);
            }
            else{
                resolve (result);
            }
        })
    });
}

function CheckAdmin(username,password){
    //console.log(username,password)
    return new Promise((resolve,reject)=>{
        sql = "select * from administrators where username=? and password =?";
        
        connDB.query(sql,[username,password],(err, result) => {
            if (err){
                console.log("CheckAdmin");
                console.log(err);
                resolve (false);
            }
            else{
                resolve (result);
            }
        })
    });
}

function RegisterEmpolyee(employee){
    return new Promise((resolve,reject)=>{
        first_name = employee.first_name;
        last_name= employee.last_name;
        birthday= ChangeFromat(employee.birthday);
        sex= employee.sex;
        address= employee.address;
        city= employee.city;
        phone= employee.phone;
        amka= employee.amka;
        adt= employee.adt;
        afm= employee.afm;
        username= employee.username;
        password= employee.password;
        sql = "INSERT INTO employees (first_name,last_name,birthday,sex,address,city,phone,amka,adt,afm,username,password) " +
        "VALUES (?,?,?,?,?,?,?,?,?,?,?,?);"
        connDB.query(sql,[first_name,last_name,birthday,sex,address,city,phone,amka,adt,afm,username,password],(err, result) => {
            if (err){
                console.log("RegisterEmpolyee");
                console.log(err);
                resolve (false);
            }
            else{
                resolve (true);
            }
        })
    });
}


function UpdateEmployee(employee){
    return new Promise((resolve,reject)=>{
        id = employee.id;
        first_name=  employee.first_name;
        last_name=  employee.last_name;
        birthday=  ChangeFromat(employee.birthday);
        sex=  employee.sex;
        address=  employee.address;
        city=  employee.city;
        phone=  employee.phone;
        amka=  employee.amka;
        adt=  employee.adt;
        afm=  employee.afm;
        username= employee.username;
        password=  employee.password ;
        sql = "UPDATE  employees set first_name = ?, last_name = ?, birthday = ?, sex = ?, address = ?, city = ?,phone =?"+
        ",amka =?,adt =?,afm =?,username =?,password=?   where id = ?"
        connDB.query(sql,[first_name , last_name , birthday , sex , address , city ,phone,
            amka ,adt ,afm,username ,password, id],(err, result) => {
           // console.log(result.affectedRows);
            if (err || result.affectedRows == 0){
                console.log("UpdateEmployee");
                console.log(err);
                resolve (false);
            }
            else{
                resolve (true);
            }
        })
    });
}

function DeleteEmployee(employee){
    return new Promise((resolve,reject)=>{
        id = employee.id;
        sql = "delete from employees where id = ?"
        connDB.query(sql,[id+25],(err, result) => {
           // console.log(result);
            if (err || result.affectedRows<1){
                console.log("DeleteEmployee");
                console.log(err);
                resolve (false);
            }
            else{
                resolve (true);
            }
        })
    });
}


///Costumers
app.post("/costumer",verify_Token_reception, async (req,res) => {
    costumer  =req.body.data ;
    
    if(await RegisterCostumer(costumer)==true){
        res.send(success_handling("mpompa"))
    }else{
        res.send(error_handling("error"));

    }
});

app.put("/costumer",verify_Token_reception, async (req,res) => {
    //console.log(req.body.data)
    current_costumer = req.body.data
    //console.log(current_employee.birthday,ChangeFromat(current_employee.birthday))

    //console.log("Επεξεργασια employee")
   // console.log(current_room)
    if(await UpdateCostumer(current_costumer)){
          res.send(success_handling(""));
    }else{
         res.send(error_handling(""));
    }
});

app.delete("/costumer",verify_Token_reception,async (req,res) => {
    costumer = req.body;
    //console.log("Διαγραφη πελάτη",costumer);
    const result = await DeleteCostumer(costumer);
    if(result){
        res.send(success_handling("success delete costumer"))
    }else{
        res.send(error_handling("error in delete costumer"))
    }
});


app.get("/costumer/:id",verify_Token_reception, async (req,res) => {
    costumer_id = req.params.id;
    //console.log(req.headers.auth_token)
    result = [];
    if (costumer_id =="!"){
        result = await GetAllFromTable("costumers");
    }else{
        result = await GetCostumerById(costumer_id);
    }
    res.send(result)
    
});


app.get("/costumer_auth/:id",async (req,res) => {
    costumer_id = req.params.id;
   // console.log("costumer_id",costumer_id)
    result = await GetCostumerById(costumer_id);
    if(result!=false){
        res.send(success_handling(result));
    }else{
        res.send(error_handling("jiorg"));
    }
    
    
});



function RegisterCostumer(costumer){
    return new Promise((resolve,reject)=>{
        last_name = costumer.last_name;
        first_name = costumer.first_name;
        birthday = costumer.birthday;
        sex = costumer.sex;
        phone = costumer.phone;
        adt =  costumer.adt;
        sql = "INSERT INTO costumers (last_name,first_name,birthday,sex,phone,adt) " +
        "VALUES (?,?,?,?,?,?);"
        connDB.query(sql,[last_name,first_name,birthday,sex,phone,adt],(err, result) => {
            if (err){
                console.log("RegisterCostumer");
                console.log(err);
                resolve (false);
            }
            else{
                resolve (true);
            }
        })
    });
}



function GetCostumerById(costumer_id){
    return new Promise((resolve,reject)=>{
        sql = "";
        if (parseFloat(costumer_id)==costumer_id){
            sql = " select * from costumers where phone  like '%"+costumer_id+"%'"
        }else{
            sql = " select * from costumers where last_name  like '%"+costumer_id+"%'"
        }
        connDB.query(sql,(err, result) => {
            if (err){
                console.log("GetCostumerById");
                console.log(err);
                resolve ([]);
            }
            else{
                resolve (result);
            }
        })
    });
}

function UpdateCostumer(costumer){
    return new Promise((resolve,reject)=>{
        id = costumer.id;
        first_name=  costumer.first_name;
        last_name=  costumer.last_name;
        birthday =  ChangeFromat(costumer.birthday);
        sex =  costumer.sex;
        phone=  costumer.phone;
        adt=  costumer.adt;
        sql = "UPDATE  costumers set first_name = ?, last_name = ?, birthday = ?, sex = ?,phone = ?"+
        ",adt =? where id = ?"
        connDB.query(sql,[first_name , last_name , birthday , sex ,phone, adt ,id],(err, result) => {
           // console.log(result.affectedRows);
            if (err || result.affectedRows == 0){
                console.log("UpdateCostumer");
                console.log(err);
                resolve (false);
            }
            else{
                resolve (true);
            }
        })
    });
}


function DeleteCostumer(costumer){
    return new Promise((resolve,reject)=>{
        id = costumer.id;
        sql = "delete from costumers where id = ?"
        connDB.query(sql,[id],(err, result) => {
           // console.log(result);
            if (err || result.affectedRows<1){
                console.log("DeleteCostumer");
                console.log(err);
                resolve (false);
            }
            else{
                resolve (true);
            }
        })
    });
}



///Reservationverify_Token_reception


app.get("/reservation/:id", async (req,res) => {
    res_id = req.params.id
    if (res_id ==0 || res_id =="0"){
        result = await GetAllFromTable("booking");
    }else{
        result = await GetReservartionById(res_id);
    }
    res.send(result);
});




function GetReservartionById(reser_id){
    return new Promise((resolve,reject)=>{
        sql = " select * from booking where costumer_id  like '%"+reser_id+"%' or id like '%"+reser_id+"'"
        connDB.query(sql,(err, result) => {
            if (err){
                console.log("GetCostumerById");
                console.log(err);
                resolve ([]);
            }
            else{
                resolve (result);
            }
        })
    });
}

app.post("/reservation", async (req,res) => {
    reservation = req.body.data 
    reservation.arrival = ChangeFromat(reservation.arrival);
    reservation.departure = ChangeFromat(reservation.departure);
    //console.log(reservation)
    var result = Object.keys(reservation).map(key => ({ key, value: reservation[key] }));
    //console.log(result);
    let colums = ""
    let colums_value = ""
    let query = "INSERT INTO booking (";
    for (let i = 0; i<result.length; i++){
        //console.log(result[i].key+" = "+result[i].value);
        colums += result[i].key + ", "        
        if (typeof result[i].value === "string"){
            colums_value += "'"+result[i].value + "', "
        }else{
            colums_value += result[i].value + ", "
        }
    }
    colums = colums.substring(0, colums.length - 2);
    colums_value = colums_value.substring(0, colums_value.length - 2);
    query += colums +") VALUES ("+colums_value+");"
    //console.log(query);
    if(await RegisterReservaton(query)){
        res.send(success_handling("mpompa"))
    }else{
        res.send(error_handling("error"));

    }
    //res.send(reservation)*/

});

app.put("/reservation",  (req,res) => {
    res.send("Επεξεργασια κρατησης");
});

app.delete("/reservation", (req,res) => {
    res.send("Διαγραφη κρατησης");
});




function RegisterReservaton(reservation){

    return new Promise((resolve,reject)=>{
        /*date = reservation.date;
        rec_id = reservation.rec_id;
        costumer_id = reservation.costumer_id;
        room_id = reservation.room_id;
        arrival = reservation.arrival;
        departure = reservation.departure;
        num_of_abults = reservation.num_of_abults;
        num_of_minors = reservation.num_of_minors;
        parking_space = reservation.parking_space;
        diet = reservation.diet;
        cost = reservation.cost;*/
        sql = "INSERT INTO booking (date,rec_id,costumer_id,room_id,arrival,departure,num_of_abults,"+
            "num_of_minors,parking_space,diet,cost) VALUES (?,?,?,?,?,?,?,?,?,?,?);"
        //connDB.query(sql,[date,rec_id,costumer_id,room_id,arrival,departure,num_of_abults,
        //    num_of_minors,parking_space,diet,cost],(err, result) => {
        connDB.query(reservation,(err, result) => {
            if (err){
                console.log("RegisterCostumer");
                console.log(err);
                resolve (false);
            }
            else{
                resolve (true);
            }
        })
    });
}


//Prices
app.put("/prices",verify_Token_admin, (req,res) => {
    updated_prices = req.body.prices
    if(UpdatePrices(updated_prices)==true){
        res.send(success_handling(""));
    }else{
        res.send(error_handling(""));
    }
    
});

app.get("/prices",verify_Token_admin, async (req,res) => {
    result = await GetAllFromTable("prices")
    if(result==false){
        res.send(error_handling("error"))
    }else{
        res.send(result[0])
    }
});

app.get("/prices/reception",verify_Token_reception, async (req,res) => {
    result = await getRecPrices()
    if(result == false){
        res.send(error_handling("error"))
    }else{
        res.send(success_handling(result[0]))
    }
});



function getRecPrices(){
    return new Promise((resolve,reject)=>{
        sql = "select only_breakfast,half_board,full_diet,parking,tax from prices  ";
        connDB.query(sql,(err, result) => {
            if (err){
                console.log("getRecPrices");
                console.log(err);
                resolve (false);
            }
            else{
                resolve (result);
            }
        })
    });
}

function UpdatePrices(prices){
    return new Promise((resolve,reject)=>{
        air_condition= parseInt(prices.air_condition)
        pool=prices.pool
        wifi= prices.wifi
        only_breakfast= prices.only_breakfast
        half_board= prices.half_board
        full_diet= prices.full_diet
        parking= prices.parking
        normal= prices.normal
        family= prices.family
        price_of_bed= prices.price_of_bed
        tax= parseInt(prices.tax)
        //console.log(air_condition,pool,wifi ,only_breakfast,half_board, full_diet,
      //      parking,normal,family,price_of_bed,tax)
        sql = "update prices set air_condition=?,pool=?,wifi=? ,only_breakfast=?,half_board=?"+
        " ,full_diet=?,parking=?,normal=?,family=?,price_of_bed=?,tax=? where id =1";
        connDB.query(sql,[air_condition,pool,wifi ,only_breakfast,half_board, full_diet,
            parking,normal,family,price_of_bed,tax],(err, result) => {
            if (err){
                console.log("UpdatePrices");
                console.log(err);
                resolve (false);
            }
            else{
                resolve (true);
            }
        })
    });
}
//Rooms
app.post("/room", verify_Token_admin,async (req,res) => {
    create_room = req.body.room
    console.log("Καταχωρηση δωματιου")
    console.log(create_room)
    if(await CreateRoom(create_room)){
          res.send(success_handling(""));
    }else{
         res.send(error_handling(""));
    }
});

app.put("/room",verify_Token_admin,async (req,res) => {
    current_room = req.body.room
    console.log("Επεξεργασια δωματιου")
   // console.log(current_room)
    if(await UpdateRoom(current_room)){
          res.send(success_handling(""));
    }else{
         res.send(error_handling(""));
    }
});

app.delete("/room", (req,res) => {
    res.send("Διαγραφη δωματιου");
});


app.get("/room/:id", verify_Token_admin ,async (req,res) => {
    room_id = req.params.id;
    //console.log("room_id",room_id)
    if (room_id ==0 || room_id =="0"){
       
        result = await GetAllFromTable("rooms");
    }else{
        result = await GetRoomById(room_id);
    }
    res.send(result);
    
   
});

app.get("/room/topick/:filter", verify_Token_reception ,async (req,res) => {
    room_filter = req.params.filter;
    //console.log("room_filter",room_filter)
    result = await GetRoomsForReservation(room_filter);
    //console.log("result",result)
     if (result === false ){
        res.send(error_handling("error"));
     }else{
        res.send(result);
     }
    //res.send(success_handling(""));
    
   
});


function GetRoomsForReservation(filter){
    return new Promise((resolve,reject)=>{
        sql = "select * from rooms where "+filter;
        connDB.query(sql,[filter],(err, result) => {
            //console.log(sql)
            if (err){
                console.log("GetRoomsForReservation");
                console.log(err);
                resolve (false);
            }
            else{
                resolve (result);
            }
        })
    });
}

app.get("/rooms", verify_Token_admin, async (req,res) => {
    rooms = await GetAllFromTable("rooms");
    if (rooms==false){
        res.send("error");
    }else{
        res.send(rooms);
    }
});

app.get("/room_max_id",verify_Token_admin,  async (req,res) => {
    max = await GetRoomMaxId();
    res.send(success_handling(max+1));

});

function GetRoomById(room_id){
    return new Promise((resolve,reject)=>{
        sql = "select * from rooms where id = ?";
        connDB.query(sql,[room_id],(err, result) => {
            if (err){
                console.log("GetRoomById");
                console.log(err);
                resolve ([]);
            }
            else{
                resolve (result);
            }
        })
    });
}

function GetRoomMaxId(){
    return new Promise((resolve,reject)=>{
        sql = "select MAX(id) as id from rooms ";
        connDB.query(sql,(err, result) => {
            if (err){
                console.log("GetRoomMaxId");
                console.log(err);
                resolve (0);
            }
            else{
                resolve (result[0].id);
            }
        })
    });
}


function CreateRoom(body){
    return new Promise((resolve,reject)=>{
        type = body.type;
        num_of_beds= body.num_of_beds;
        air_condition= body.air_condition;
        pool= body.pool;
        wifi= body.wifi;
        price= body.price;    
        sql = "insert into rooms (type,num_of_beds,air_condition,pool,wifi,price) values (?,?,?,?,?,?);"
        connDB.query(sql,[type,num_of_beds,air_condition,pool,wifi,price],(err, result) => {
            if (err){
                console.log("CreateRoom");
                console.log(err);
                resolve (false);
            }
            else{
                resolve (true);
            }
        })
    });
}


function UpdateRoom(room){
    return new Promise((resolve,reject)=>{
        type = room.type;
        num_of_beds= room.num_of_beds;
        air_condition= room.air_condition;
        pool= room.pool;
        wifi= room.wifi;
        price= room.price;  
        id = room.id  
        sql = "UPDATE  rooms set type = ?, num_of_beds = ?, air_condition = ?, pool = ?, wifi = ?, price = ? where id = ?"
        connDB.query(sql,[type,num_of_beds,air_condition,pool,wifi,price,id],(err, result) => {
           // console.log(result.affectedRows);
            if (err || result.affectedRows ==0){
                console.log("UpdateRoom");
                console.log(err);
                resolve (false);
            }
            else{
                resolve (true);
            }
        })
    });
}

//cookies

function RegisterCookie(cookie){
    return new Promise((resolve,reject)=>{
        sql = "insert into cookies values(?)"
        connDB.query(sql,[cookie],(err, result) => {
           // console.log(result.affectedRows);
            if (err){
                console.log("RegisterCookie");
                console.log(err);
                resolve (false);
            }
            else{
                resolve (true);
            }
        })
    });
}













function handle_mysql_disconnect(_connDB){ 
_connDB.on('error', function(error){
     if(!error.fatal)  return;
     if(error.code !== 'PROTOCOL_CONNECTION_LOST')  throw error;

     process_log.warn("re-connecting with mysql server!");

     connDB = mysql.createConnection({
        host: 'localhost',
        user: 'user',
        password: 'user1234',
        database: 'hotel_database',
        insecureAuth : true
    });

     handle_mysql_disconnect(connDB);
     connDB.connect();
 });
}

handle_mysql_disconnect(connDB);