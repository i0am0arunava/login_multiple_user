var csrf = require("csurf");
const express = require('express');
const app = express();
const { Todo, User } = require('./models');
const bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
const path = require("path");
const passport = require('passport');
const connectEnsureLogin = require('connect-ensure-login')
const session = require('express-session')
const LocalStrategy = require('passport-local')
const bcrypt =require('bcrypt');
const salt =10;
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser("ssh! some secret string"));
app.use(csrf({ cookie: true }))
app.set("view engine", "ejs");
app.use(session({
    secret: "arunava-369",
    cookie: {
        maxAge: 24 * 60 * 60 * 1000
    }
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
}, (username, password, done )=> {
    User.findOne({ where: { email: username } })
        .then(async user => { 
            result=await bcrypt.compare(password, user.password)
            if(result){ return done(null,user)}
       else {
        return done("invalid passsword")
       }
           
        })
}));
passport.serializeUser((user,done)=>{
    done(null,user.id)
})
passport.deserializeUser((id,done)=>{
    User.findByPk(id)
    .then(user =>{
        done(null,user)
    })
});
app.get("/", async (reqest, response) => {

    response.render('index', {

        csrfToken: reqest.csrfToken()

    });
    
});
app.get("/todos",connectEnsureLogin.ensureLoggedIn(),  async (reqest, response) => {

    const overdue = await Todo.overdue(reqest.user.id);
    const dueLater = await Todo.dueLater(reqest.user.id);
    const dueToday = await Todo.dueToday(reqest.user.id);
    const completedItems = await Todo.completedItems(reqest.user.id);
    if (reqest.accepts("html")) {
        response.render('todos', {

            overdue,
            dueLater,
            dueToday,
            completedItems,
            csrfToken: reqest.csrfToken()

        });
    }
    else {
        response.json({
            overdue,
            dueLater,
            dueToday,
            completedItems,
        })
    }
})
app.get("/signup", async (request, response) => {

    response.render("signup", { title: "signup", csrfToken: request.csrfToken() })
});
app.post("/users", async (request, response) => {
    console.log(request.body.firstName)
    const hashpwd = await bcrypt.hash(request.body.password,salt);
    try {
        const user = await User.create({
            firstName: request.body.firstName,
            lastName: request.body.lastName,
            email: request.body.email,
            password: hashpwd,
           
        })
        request.login(user,(err)=>{
            if(err){
                console.log(err)
            }
            response.redirect("/todos")
        })
       
    } catch (error) {
        console.log(error)
    }

})
app.get("/login", async (req,res)=>{
    res.render("login", { title: "signup", csrfToken: req.csrfToken() })
})
app.post("/session", passport.authenticate('local',{failureRedirect:"/login"}), (request,response)=>{
    console.log(request.user)
    response.redirect("/todos")
})
app.get("/signout",(req,res,next)=>{
    req.logOut((err)=>{
        if(err){return next(err)}
        else{
            res.redirect("/login")
        }
    })
})
app.use(express.static(path.join(__dirname, 'public')))
//middileware
app.post("/todos",connectEnsureLogin.ensureLoggedIn(), async (request, response) => {
    try {
        console.log("creating a todo", request.body)
        const todo = await Todo.addTodo({ title: request.body.title, duedate: request.body.duedate, markAsComplete: false , userId:request.user.id});
        return response.redirect("/todos")

    } catch (error) {
        console.log(error);
        return response.status(422).json(error)
    }
});

app.put("/todos/:id", connectEnsureLogin.ensureLoggedIn(), async (request, response) => {

    const todo = await Todo.findByPk(request.params.id);
    console.log(request.params.id)
    try {

        const updatetodo = await todo.setCompletionStatus();
        return response.json(updatetodo)

    } catch (error) {
        console.log(error);
        return response.status(422).json(error)
    }
});
app.get("/todos", async (request, response) => {

    const todo = await Todo.findAll();
    try {

        return response.json(todo)

    } catch (error) {
        console.log(error);
        return response.status(422).json(error)
    }
});

app.delete("/todos/:id",connectEnsureLogin.ensureLoggedIn(),  async (request, response) => {


    try {

        const deleted = await Todo.destroy({
            where: {
                id: request.params.id,
                userId:request.user.id
            },

        });
        response.send(deleted ? true : false);

    } catch (error) {
        response.send(false)
        return response.status(422).json(error)
    }
});



module.exports = app;
