var app = angular.module('czatApka', []);

app.factory('socket', function () {
    var socket = io.connect('http://' + location.host);
    return socket;
});

app.controller('appCtrlr', ['$scope', 'socket',
    function ($scope, socket) {
        

        $scope.connected = false;
        $scope.username = "";
        $scope.userExist = false;
        $scope.passwordMatch = true;
        $scope.buttonDisabled = true;


        $scope.changePass = function () {
            $scope.passwordMatch = true;
            $scope.buttonDisabled = isDisabled();

            if($scope.user.password !== $scope.user.repeatPassword) {
                $scope.passwordMatch = false;
                $scope.buttonDisabled = isDisabled();
                $scope.$disgest();
            }
        }
        var isDisabled = function () {
            if($scope.passwordMatch == true && $scope.userExist == false && $scope.user.password.length > 1) {
                return false;
            }
            else 
                return true;
            }

        $scope.change = function () {
            $scope.userExist = false;
            $scope.buttonDisabled = isDisabled();
            

            console.log($scope.user.username);
            var myUrl="/checkIfUserExists/"+$scope.user.username;
            $.ajax({
            url: myUrl,
            type: 'GET',
            success: function(myJson) {
                $.each(myJson, function() {
                    console.log(myJson.exist);
                    if(myJson.exist) {
                        $scope.userExist = true;
                        $scope.buttonDisabled = isDisabled();
                        $scope.$digest();
                    }
                }); 
            }});
                
        }

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
                            $scope.loggedIn = true;
                            $scope.$digest();
                        }
                    }); 
                } 
            });
        }
        checkIfLoggedIn();
        
        function getRandomInt(min, max) {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        }
  




        socket.on('connect', function () {
            $scope.connected = true;
            $scope.$digest();
        });    
    
    }



]);

