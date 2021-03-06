var express = require("express");
var app = express();
var Q = require('q');

var httpServer = require("http").createServer(app);

var socketio = require("socket.io");
var io = socketio.listen(httpServer);

//Redis create client
var redis = require("redis"),
	client = redis.createClient();

// Passport connect
var connect = require('connect');
var sessionSecret = 'wielkiSekret44';
var sessionKey = 'connect.sid';

var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var passportSocketIo = require('passport.socketio');
var sessionStore = new connect.session.MemoryStore();

// Konfiguracja passport.js
passport.serializeUser(function(user, done) {
	done(null, user);
});

passport.deserializeUser(function(obj, done) {
	done(null, obj);
});

passport.use(new LocalStrategy(
	function(username, password, done) {
		console.log("Wysyłam: " + username + " " + password);

		redisGetPass(username, password).then(function(result) {
			console.log("THEN");
			console.log(result);

			if (result) {
				console.log("Udane logowanie...");
				return done(null, {
					username: username,
					password: password
				});
			} else {
				console.log("Nieudane logowanie...");
				return done(null, false);
			}
		});
	}
));

app.use(express.cookieParser());
app.use(express.urlencoded());
app.use(express.session({
	store: sessionStore,
	key: sessionKey,
	secret: sessionSecret
}));
app.use(passport.initialize());
app.use(passport.session());

var loggedIn = false;

app.use(express.static("public"));
app.use(express.static("bower_components"));

function getRandomInt(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

// user page
app.get('/my-profile', function(req, res) {
	var loginPage = "public/my-profile.html";
	res.sendfile(loginPage, {
		root: __dirname
	})
});

// log in page
app.get('/login', function(req, res) {
	var loginPage = "public/login.html";
	res.sendfile(loginPage, {
		root: __dirname
	})
});

// sign up page
app.get('/signup', function(req, res) {
	var signupPage = "public/signup.html";
	res.sendfile(signupPage, {
		root: __dirname
	})
});

// Check if usel logged
app.get('/loggedIn', function(req, res) {
	var sessionJSON = JSON.parse(sessionStore.sessions[req.sessionID]);	
	res.json({username: sessionJSON.passport.user.username})
})

// Log in post
app.post('/login',
	passport.authenticate('local', {
		failureRedirect: '/login'
	}),
	function(req, res) {
		loggedIn = true;
		res.redirect('/');
	}
);

// log out get
app.get('/logout', function(req, res) {
	console.log('Wylogowanie...')
	req.logout();
	loggedIn = false;
	res.redirect('/');
});

// sign up post
app.post('/signup', function(req, res) {
	var passwd = req.body.password[0];
	console.log(passwd);
	redisSetUser(req.body.username, req.body.password[0], getRandomInt(1,8));
	res.redirect('/');
});

// check if user in db
app.get('/checkIfUserExists/:username', function(req, res) {
 	var username = req.params.username;
	redisGet(username).then(function(result) {
		console.log("RESULT: ");
		console.log(result);
		res.json({exist: result});
	})
});

// get avatar
app.get('/getAvatarByUser/:username', function(req, res) {
 	var current_username_avatar = req.params.username + '_avatar';
	console.log('CURRENT_USERNAME_AVATAR: ' + current_username_avatar);
	redisGet(current_username_avatar).then(function(result) {
		res.json({avatar: result});
	})
});

// insert user to db
var redisSetUser = function(username, password, avatar) {
	var list = [password, avatar];
	client.rpush(username, list, function(err, reply) {
			console.log("REPLY SET: " + reply.toString());
	});

		console.log("Dodaje do bazy uzytkownika: " + username + " " + password + " " + avatar);
		client.set(username, password, function(err, reply) {
			console.log("REPLY SET: " + reply.toString());
		});
		client.set(username + '_avatar', avatar, function(err, reply) {
			console.log("REPLY AVATAR SET: " + username + '_avatar : ' + avatar + reply.toString());
		});
	}	
	
// get value from db without pass
var redisGet = function(data) {
	
	console.log("DATA redisGet: " + data);
	var deferred = Q.defer();
	
	client.get(data, function(err, reply) {
		if (reply) {
			console.log("REPLY GET IF redisGet: " + reply.toString());
			deferred.resolve(reply);
		}
		else {
			console.log('redisGet no reply');
			deferred.resolve(false);
		}
	});
	return deferred.promise;
};

// get value from db with password
var redisGetPass = function(username, password) {
	var deferred = Q.defer();
	
	client.get(username, function(err, reply) {
		if (reply) {
			if (reply.toString() === password)
				deferred.resolve(true);
			else 
				deferred.resolve(false);
		}
		else {
			console.log('no reply');
			deferred.resolve(false);
		}
	});
	return deferred.promise;
};

// get value from redi
var redisGetPlaces = function(data) {
	var deferred = Q.defer();
	
	client.lrange(data, 0, 111, function(err, reply) {
		if (reply) {
			console.log("REPLY GET: " + reply.toString());
			deferred.resolve(reply);
		}
		else {
			console.log('no reply');
			deferred.resolve(false);
		}
	});
	return deferred.promise;
};


var redisGetEvents = function(data) {
	var deferred = Q.defer();
	
	client.lrange(data, 0, 111, function(err, reply) {
		if (reply) {
			console.log("REPLY GET: " + reply.toString());
			deferred.resolve(reply);
		}
		else {
			console.log('no reply');
			deferred.resolve(false);
		}
	});
	return deferred.promise;
};

// get value from db by index
var redisGetPlacesByIndex = function(data, index) {
	
	var deferred = Q.defer();
	client.lrange(data, index, index, function(err, reply) {
		if (reply) {
			console.log("REPLY GET: " + reply.toString());
			deferred.resolve(reply);
		}
		else {
			deferred.resolve(false);
		}
	});
	return deferred.promise;
};	

var history = [];
var rooms = ["Główny", "English", "Spanish", "Portuguese", "Russian", "Japanese", "German", "French", "Turkish", "Italian"];
app.use(express.static("public"));
app.use(express.static("bower_components"));

io.sockets.on('connection', function (socket) {
    var roomName = "Główny";
    console.log(roomName);
    history[roomName] = [];
    socket.room = 'Główny';
    socket.join("Główny");
    socket.emit('rec msg',"Welcome in Talk2Learn!");	
	
		socket.on('change room', function(room){
        
				console.log(socket.room);
				console.log(room);
				var socketTest = socket;
				
				socket.leave("Główny");
        console.log(socket);
				
				socket.room = room;
        socket.join(room);
        roomName = socket.room;
			
				socket.emit('history', history[room]);
        console.log("przełączyłem na pokój o nazwie:  " + socket.room );
        console.log(history);
        socket.emit('rec msg', "Jesteś na kanale " + room);
    });	

		socket.on('start', function(){
        socket.room = 'Główny';
        socket.join('Główny');
        console.log("Rozpoczynam nadawanie na kanale: " + socket.room);
    });	
	
		socket.on('send msg', function (data) {
			history.unshift(data);
			io.sockets.in(socket.room).emit('rec msg', data);
		});
		
		socket.on("add new room", function(newRoom){
        history[newRoom] = [];
        //socket.room = newRoom;
        rooms.push(newRoom);
        socket.emit("show rooms", rooms);
        socket.broadcast.emit("show rooms", rooms);
    });
    socket.emit("show rooms", rooms);
	
	socket.emit('history', history);
	
	
});

httpServer.listen(4000, function () {
    console.log('Serwer HTTP działa na pocie 4000');
});
