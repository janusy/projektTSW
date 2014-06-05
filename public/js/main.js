var app = angular.module('czatApka', []);

app.factory('socket', function () {
    var socket = io.connect('http://' + location.host);
    return socket;
});

app.controller('chatCtrlr', ['$scope', 'socket',
    function ($scope, socket) {
        
        
        $scope.connected = false;
        $scope.username = "";
        $scope.avatar = 5;
        $scope.loggedIn = false;

      var checkIfLoggedIn = function() {
            var myUrl = "/loggedIn"
            $.ajax({
                url: myUrl,
                type: 'GET',
                success: function(myJson) {
                    $.each(myJson, function() {
                        $scope.username = myJson.username;
                        console.log("user:",myJson.username);
                        if(myJson.username) {
                            //$scope.avatar = getRandomInt(1,8);
                            $scope.loggedIn = true;
                            $scope.$digest();
                            getUserAvatar();
                        }
                    }); 
                } 
            });
            

            
            //var div = document.getElementById('debug');
            //div.innerHTML = $scope.loggedIn + ' yolo';
          //document.getElementById('login_input').value='textosplayed' ; 
        }
        
        $( "#sendMsgButton" ).click(function() {
            $('#chatLog').scrollTop($('#chatLog')[0].scrollHeight).delay( 4800 );
        });     
        
        
        
        var getUserAvatar = function() {
            console.log("PRZED WYSLANIEM1 MYURL2: " + "/getAvatarByUser/:" + $scope.username);
            var myUrl2 = "/getAvatarByUser/" + $scope.username;
            $.ajax({
                url: myUrl2,
                type: 'GET',
                success: function(myJson) {
                    $.each(myJson, function() {
                        $scope.avatar = myJson.avatar;
                        console.log("avatar:",myJson.avatar);
                        if(myJson.avatar) {
                            //$scope.avatar = getRandomInt(1,8);
                            $scope.avatar = myJson.avatar;
                            $scope.$digest();
                        }
                    }); 
                } 
            });
        }
        
        
        checkIfLoggedIn();
        
        $('.messageTextarea').keydown(function() {
            if (event.keyCode == 13) {                
                document.getElementById("sendMsgButton").click();
                //this.form.submit();
                return false;
             }
        });
        
        var repaceQM = function(){
            $('.chatMessage').each(function(){
              $(this).html($(this).html().replace('"""', ' '));
            });
            //alert('aaa');
        };
        
        
        var tagsToReplace = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;'
        };
        var replaceTag = function (tag) {
            return tagsToReplace[tag] || tag;
        };
        var safe_tags_replace = function (str) {
            return str.replace(/[&<>]/g, replaceTag);
        };
        
        var prepareMessageWithLogin = function(msg, login, avatar){
            var avatarHtml = '<img src="http://localhost:4000/img/' + avatar + '"' + '.jpg" class="msg_avatar" alt="' + login + '"/>';
            
            return safe_tags_replace($scope.msg.text.substring(0, 2000));
        };
        
        $scope.msgs = [];
        $scope.rooms = [];
        $scope.connected = false;
        
        $scope.newRoom = function() {
            socket.emit("add new room", $scope.new.room.name);
            console.log("Tworze nowy pokoj o nazwie " + $scope.new.room.name);
        };
        //socket.emit("add new room", 'English');
        
        
        $scope.joinRoom = function()   {
            socket.emit("start");
        };
        
        
        $scope.sendMsg = function () {
            if ($scope.msg && $scope.msg.text) {
                //socket.emit('send msg', safe_tags_replace($scope.msg.text.substring(0, 20)));
                var data = {
                    login: document.getElementById('login_input').value.toString(),
                    msg: prepareMessageWithLogin($scope.msg.text, document.getElementById('login_input').value.toString(), document.getElementById('avatar_input').value.toString()),
                    avatar: $scope.avatar
                }
                console.log("DATA: " + data);
                socket.emit('send msg', data);
                repaceQM();
                $scope.msg.text = '';
            }
        };
        
        $scope.chooseRoom = function(room){
            $scope.msgs = [];
            socket.emit('change room', room );
            //alert("Przełączyłeś się na pokój " + room);
            document.getElementById('bullet_green').innerHTML = '<img src="img/bullet_green.png" > Room: ' + room;
        };
        
        socket.on('connect', function () {
            $scope.connected = true;
            $scope.$digest();
        });
        socket.on('history', function (data) {
            $scope.msgs = data;
            $scope.$digest();
        });
        
        socket.on('rooms', function (data){
            console.log("utworzone pokoje: "+ data);
            $scope.rooms = data;
            $scope.$digest();
        });
        
        socket.on('rec msg', function (data) {
            var wiadomosc = data.msg;
            
            //var msgHtml = 'login: ' + data.login + '<img src="http://localhost:4000/img/' + data.avatar + '.jpg" class="msg_avatar" alt="login"/>' + data.msg;
            //var msgHtml = 'login: ' + data.login + 'msg: ' + data.msg + 'avatar: ' + data.avatar; 
            var msgHtml = '<div class="chatSingleMessage"><img src="http://localhost:4000/img/' + data.avatar + '.jpg" class="msg_avatar" alt="login"/>' + data.msg;
            
            $scope.msgHtml = 'adffdfd' . wiadomosc;
            
            if (data.avatar != undefined) {
                $( "#chatLog" ).append( msgHtml );
            }
            
            
            
            console.log("rec msg " + data);
            console.log($scope.msgs);

            $scope.msgs.unshift(data);
            //$scope.msgs.push('<img src="http://localhost:4000/img/' + data.avatar + '"' + '.jpg" class="msg_avatar" alt="' + login + '"/>');
            console.log(data);
            $scope.$digest();
        });
        
        socket.on('show rooms', function(data){
            console.log("Wyswietlam pokoje:" + data);
            $scope.rooms = data;
            $scope.$digest();
        });
        
    }
]);



//app.post('/login',
//  passport.authenticate('local', { successRedirect: '/',
//                                   failureRedirect: '/login',
//                                   failureFlash: true })
//);
