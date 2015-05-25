/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
var data;
document.addEventListener("deviceready", function() {

    document.addEventListener("touchstart", function(){}, true);

    
    var request = new XMLHttpRequest();
    request.open('GET', './js/buttons.json', true);

    request.onload = function() {
        if (request.status >= 200 && request.status < 400) {
            data = JSON.parse(request.response).buttonList;
            var directives;

            directives = {
                name: {
                    name: function(params) {
                        return data.name;
                    }
                },

                soundAddress: {
                    dataset.href: function(params) {
                        return data.soundAddress;
                    }
                }
            };
            $('.buttons').render(data, directives);
        } else {
            // We reached our target server, but it returned an error

        }
    };

    request.onerror = function() {
    // There was a connection error of some sort
    };

    request.send();

    console.log(data);
    

    $(".button").on("click", function() {
        var media = new Media("");
        media.play();
    });

});