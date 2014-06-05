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
        }
        
        $( "#sendMsgButton" ).click(function() {
            $('#chatLog').scrollTop($('#chatLog')[0].scrollHeight);
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
            var found = $.inArray($scope.new.room.name, $scope.rooms) > -1;
            if (found == false) {
                socket.emit("add new room", $scope.new.room.name);
                console.log("Tworze nowy pokoj o nazwie " + $scope.new.room.name);
            }
        };
        
        var addLangRooms = function(allRooms) {
            console.log('ROOMS3: ' + allRooms);
            var foundEnglish = $.inArray('English', $scope.rooms) > -1;
            
            console.log('foundEnglish3: ' + foundEnglish);
            if ($.inArray( ('English', allRooms) > -1) == false) {socket.emit("add new room", 'English');}
            if ($.inArray( ('Spanish', allRooms) > -1) == false) {socket.emit("add new room", 'Spanish');}
        }       
        
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
                //repaceQM();
                $scope.msg.text = '';
            }
        };
        
        $scope.chooseRoom = function(room){
            $scope.msgs = [];
            socket.emit('change room', room );
            //alert("Przełączyłeś się na pokój " + room);
            //$('#chatLog').html('');
            document.getElementById('chatLog').innerHTML = '';
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
            console.log("REC MSG");
            console.log(wiadomosc);

            var msgHtml = '<div class="chatSingleMessage"><img src="/img/' + data.avatar + '.jpg" class="msg_avatar" title="' + data.login + '" alt="' + data.login + '"/>' + data.msg;
            if (data.avatar != undefined) {
                $( "#chatLog" ).append( msgHtml );
            }

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