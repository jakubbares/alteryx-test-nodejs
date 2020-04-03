const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const exjwt = require('express-jwt');
const cors = require('cors');
const {getUsers, saveUsersToFile} = require("./db");


const app = express();

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.setHeader('Access-Control-Allow-Headers', 'Content-type,Authorization');
    next();
});


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));


const secret = 'Alteryx rules 123';
const jwtMW = exjwt({
    secret
});

const getHashedPassword = (password) => {
    const sha256 = crypto.createHash('sha256');
    const hash = sha256.update(password).digest('base64');
    return hash;
};

let accessTokens = [];

app.get('/users/:id', jwtMW , (req, res) => {
    const users = getUsers();
    const userId = req.params.id;
    const result = users.find(u => u.id == userId);
    if (result) {
        res.json({
            success: true,
            err: null,
            user: result
        });
    } else {
        res.status(401).json({
            success: false,
            token: null,
            userId,
            err: 'User not found'
        });
    }
});

app.get('/users', jwtMW , (req, res) => {
    const users = getUsers();
    res.json({
        success: true,
        err: null,
        users
    });
});


app.get('/users/:id/delete', jwtMW , (req, res) => {
    const userId = req.params.id;
    let users = getUsers();
    const result =  users.find(u => u.id == userId);
    if (result) {
        users = users.filter(u => u.id != userId);
        saveUsersToFile(users);
        res.json({
            success: true,
            err: null,
            message: `User ${result.id} deleted`
        });
    } else {
        res.status(401).json({
            success: false,
            token: null,
            err: 'User not found'
        });
    }
});


app.post('/users/:id/update', jwtMW , (req, res) => {
    const userId = req.params.id;
    let users = getUsers();
    const user = req.body;
    const result =  users.find(u => u.id == userId);
    if (result) {
        users = users.map(u => {
            if (u.id === userId) {
                u = user;
                u.id = userId;
                console.log(user)
            }
            return u;
        });
        saveUsersToFile(users);
        res.json({
            success: true,
            err: null,
            message: `User ${result.id} updated`
        });
    } else {
        res.status(401).json({
            success: false,
            token: null,
            err: 'User not found'
        });
    }
});


app.post('/login', (req, res) => {
    const users = getUsers();
    const { email, password } = req.body;
    
    const result = users.find(user => email === user.email && password === user.password);

    if (result) {
        let token = jwt.sign({ id: result.id, email: result.email }, secret, { expiresIn: 129600 }); // Sigining the token
        accessTokens.push(token);
        return res.json({
            success: true,
            err: null,
            token
        });
    } else {
        return res.status(401).json({
            success: false,
            token: null,
            err: 'Username or password is incorrect'
        });
    }
});




app.post('/register', (req, res) => {
    let users = getUsers();
    const { email, password } = req.body;
    if (users.find(user => user.email === email)) {
        return res.status(401).json({
            success: false,
            token: null,
            err: 'Username with given email already exists'
        });
    }
    const newUser = {
        email,
        password,
        id: Math.round(Math.random() * 10000)
    };
    users.push(newUser);
    saveUsersToFile(users);
    return res.json({
        success: true,
        err: null,
        message: `User ${newUser.id} created`
    });

});

app.post('/logout', jwtMW, (req, res) => {
    const { token } = req.body;
    accessTokens = accessTokens.filter(token => t !== token);
    res.send("Logout successful");
});

app.get('/verify', jwtMW , (req, res) => {
    res.send('You are authenticated');
});


app.use(function (err, req, res, next) {
    if (err.name === 'UnauthorizedError') {
        res.status(401).send(err);
    }
    else {
        next(err);
    }
});


const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Magic happens on port ${PORT}`);
});
