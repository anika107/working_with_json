const express = require('express');
const session = require('express-session');
const path = require('path');
const fs = require('fs')
const mongoose = require('mongoose')
const { promisify } = require('util');
const { resolve } = require('path');
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const app = express();
const Users = require('./models/user')


app.use(express.urlencoded( { extended : false}));
app.set('view engine','ejs');
app.use(express.json());
app.use(express.static(path.join(__dirname, '/public')));



app.use(session({
    secret: 'anonymous',
    resave: true,
    saveUninitialized: true,
})); 

async function getFiles(dir) {
    const subdirs = await readdir(dir);
    const files = await Promise.all(subdirs.map(async (subdir) => {
      const res = resolve(dir, subdir);
      return (await stat(res)).isDirectory() ? getFiles(res) : res;
    }));
    return files.reduce((a, f) => a.concat(f), []);
}

app.get('/login', (req, res) =>{
    
    res.render('login', {
        msg: ""
    })
})

app.get('/signup', (req, res) =>{
    
    res.render('signup', {
        msg: ""
    })
})

app.get('/update_users', (req, res) =>{
    /*
    if(req.session.username != null){
        res.redirect('/dashboard')
    }
    */
    const doc = fs.readFileSync('config.json')
    const tostring = doc.toString()
    const data = JSON.parse(tostring)
    res.render('update_users', {
        data: data
    })
})

app.post('/create_account',(req, res) =>{
    Users.find({ username: req.body.username }, (err, data)=>{
        if(err){
            throw err;
        }
        else if(data){
            const user = new Users({
                username: req.body.username,
                password: req.body.password
            });
            user.save().then((result) => {
              res.render('login', {
                msg: "The account is created successfully."
              })
            })
            .catch((err) => console.log("Error" + err));
        }
        else{
            return res.send("No User Found")
        }
    })
})

app.get('/dashboard', (req,res) =>{
    /*
    if(req.session.username != null){
        res.redirect('/login')
    }
    */
    getFiles("roles")
  .then(files =>{
     if(files.length == 0){
         res.render('dashboard',{
             msg: "Any config.json file not found. Please check roles directory and try again.",
             rolenames: "",
             inputs: ""
         })
     }
     else{
     console.log(files[0].slice(-11))
     var rolenames = []
     var inputs = []
     var cnt = 0
     for(var i = 0; i < files.length; i ++){
         tmp = files[i].slice(-11)
         if(tmp == "config.json"){
            const doc = fs.readFileSync(files[i])
            const tostring = doc.toString()
            const data = JSON.parse(tostring)

            rolenames[cnt] = data.config[0].Rolename;
            param = data.config[0].Parameter
            var user=[]
            for(var j = 0;j < param.length; j ++){
                user.push(param[j])
            }
            inputs[cnt] = user
            /*
            var param = data.config[0].Parameter[0].new_user[0]
            inputs[cnt] = Object.keys(param)
            */
            cnt ++;
         }
     }
     console.log(inputs)
     res.render('dashboard', {
        rolenames: rolenames,
        inputs: inputs,
        msg: ""
    }) 
}
  }
  ).catch(e => console.error(e));
    
})

/*
app.post('/update', (req, res) =>{
    const username = req.body.username
    const password = req.body.password
    const is_root = req.body.is_root
    const module = req.body.module
    const version = req.body.version
    
    const doc = fs.readFileSync('config.json')
    const tostring = doc.toString()
    const data = JSON.parse(tostring)
    
    var flag = 0
    for(var i = 0; i < data.config[0].new_user.length; i++) {
        data.config[0].new_user[i].Username = username[i]
        data.config[0].new_user[i].Password = password[i]
        data.config[0].new_user[i].is_root = is_root[i]
    }

    const toJson = JSON.stringify(data, null, 2)
    fs.writeFileSync('config.json', toJson)
    res.redirect('/update_users')
})
*/

app.post('/add', (req, res) =>{
    console.log("i am here")
    console.log("req.body", req.body)
    var key = Object.keys(req.body)
    var rolenames = []
    var inputs = []
    getFiles("roles").then(files =>{
       var cnt = 0
       for(var i = 0; i < files.length; i ++){
           tmp = files[i].slice(-11)
           if(tmp == "config.json"){
              const doc = fs.readFileSync(files[i])
              const tostring = doc.toString()
              const data = JSON.parse(tostring)
              rolenames[cnt] = data.config[0].Rolename;
              param = data.config[0].Parameter
              var user=[]
              for(var j = 0;j < param.length; j ++){
                user.push(Object.keys(param[j]))
             }
            inputs[cnt] = user
              cnt ++;
           }
       }
            console.log("inputs", inputs)
            for(var i = 0; i < rolenames.length; i ++){
            
            var found_user = []
            var cnt = 0, flag = 0
            for(var j = 0; j < inputs[i][0].length; j ++){
                var name_role = "_"+inputs[i][0][j]+"_"+rolenames[i]
                x = name_role.length * (-1)
                console.log(name_role, x)
                flag= 0
                var found_key = []
                cnt = 0
                for(var k = 0; k < key.length; k ++){
                    console.log("name_role", name_role, name_role.length)
                    console.log("key[k].slice(x)", key[k].slice(x), key[k].slice(x).length)
                    if(name_role == key[k].slice(x)){
                        found_key[cnt] = key[k]
                        cnt ++
                        console.log("found")
                        flag = 1
                    }
                }
                if(flag == 1){
                    var all = req.body
                    if(all[found_key[0]] instanceof Array){
                        console.log("inside")
                        for(var d = 0; d < all[found_key[0]].length; d ++){
                            var obj = {}
                            obj["rolename"] = rolenames[i]
                            for(var k = 0; k < found_key.length; k ++){
                                x = found_key[k].length - name_role.length
                                obj[found_key[k].slice(0,x)] = all[found_key[k]][d]
                            } 
                            console.log("object", obj)
                            if (fs.existsSync('example_1.json')) {
                                console.log("inside file")
                                const doc = fs.readFileSync('example_1.json')
                                var tostring = doc.toString()
                                if(tostring.length == 0){
                                    var crt = {
                                        "roles":[
                                            obj
                                        ]
                                    }
                                    const toJson = JSON.stringify(crt,null,2)
                                    fs.writeFileSync('example_1.json', toJson)
                                }
                                else{
                                    var data = JSON.parse(tostring)
                                data.roles.push(obj);
                                const toJson = JSON.stringify(data,null,2)
                                fs.writeFileSync('example_1.json', toJson)
                                }
                            }
                            else{
                                    var crt = {
                                    "roles":[
                                         obj
                                     ]
                                     }
                                    const toJson = JSON.stringify(crt,null,2)
                                    fs.writeFileSync('example_1.json', toJson)
                                
                            }
                        }
                    }
                    else{
                        var obj = {}
                        obj["rolename"] = rolenames[i]
                        for(var k = 0; k < found_key.length; k ++){
                            x = found_key[k].length - name_role.length
                            obj[found_key[k].slice(0,x)] = all[found_key[k]]
                        }
                        if (fs.existsSync('example_1.json')) {
                            const doc = fs.readFileSync('example_1.json')
                            var tostring = doc.toString()
                            if(tostring.length == 0){
                                var crt = {
                                    "roles":[
                                        obj
                                    ]
                                }
                                const toJson = JSON.stringify(crt,null,2)
                                fs.writeFileSync('example_1.json', toJson)
                            }
                            else{
                                var data = JSON.parse(tostring)
                            data.roles.push(obj);
                            const toJson = JSON.stringify(data,null,2)
                            fs.writeFileSync('example_1.json', toJson)
                            }
                        }
                        else{
                                var crt = {
                                "roles":[
                                     obj
                                 ]
                                 }
                                const toJson = JSON.stringify(crt,null,2)
                                fs.writeFileSync('example_1.json', toJson)
                            
                        } 
                    }
                }
                
            }
        }  
    })
    res.redirect('/dashboard')
}
)
app.post('/login_check', async (req, res) => {
    let user = await Users.find({ username: req.body.username, password:req.body.password });
    if (!user) {
        res.render('login',{
            msg: "The username or password is incorrect."
        })
    }
    Users.find({username: req.body.username, password: req.body.password}, (err, all) => {
        if (err){
            res.render('login',{
                msg: "The username or password is incorrect."
            })
        }
        req.session.username = req.body.username
        req.session.password = req.body.password
        res.redirect('/dashboard')
    })

});

app.listen(3000, () => {
    
    mongoose.connect('mongodb://localhost:27017/json')
    .then (() =>{
        console.log('Now connected to MongoDB!')
        console.log('Server is running on port 3000...');
    } )
    .catch(err => console.error('Something went wrong', err));
});


module.exports = app;