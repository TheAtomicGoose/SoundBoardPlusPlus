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

var jsonData;  // Global for testing purposes
var selectedFile;

$(document).ready(function() {

    // Makes sure everything happens after the device is ready
    // Otherwise it may not work due to asynchronization
    document.addEventListener("deviceready", function() {

        // Aliases "click" and "touch" actions so that something written using "click"
        // will work with "touch" and vice versa
        document.addEventListener("touchstart", function(){}, true);

        // Copies the template json 
        var template;
        $.ajax("./js/template.json", {
            dataType: "text",
            success: function(data) {
                template = data;
           }
        });

        var realRoot = cordova.file.externalRootDirectory;

        // Passes the root of the external storage (e.g. the SD card), as a DirectoryEntry
        window.resolveLocalFileSystemURL(realRoot, gotRootDirectory, fail);

        // Creates the directory "file:///storage/emulated/0/SoundBoardPlusPlus"
        function gotRootDirectory(directoryEntry) {
            directoryEntry.getDirectory("SoundBoardPlusPlus", {create: true, exclusive: false}, gotAppDirectory, fail);
        }

        // Creates the directory "file:///storage/emulated/0/SoundBoardPlusPlus/sounds"
        // Also creates the file "file:///storage/emulated/0/SoundBoardPlusPlus/buttons.json". This is the file that will be read
        // from each time the app loads index.html to create the buttons
        function gotAppDirectory(parent) {
            parent.getDirectory("sounds", {create: true, exclusive: false}, gotSoundsDirectory, fail);
            parent.getFile("buttons.json", {create: true, exclusive: false}, gotButtonsFile, fail);
        }

        function gotSoundsDirectory(parent) { }

        function gotButtonsFile(file) {
            // Get the JSON file
            window.resolveLocalFileSystemURL(realRoot + "SoundBoardPlusPlus/buttons.json", gotJSONSuccess, fail);
        }

        // Failure function
        function fail(evt) {
            console.log(evt.code);
        }

        // If the JSON file is successfully retrieved, do all this:
        function gotJSONSuccess(fileEntry) {

            // Creates a FileWriter object for buttons.json
            fileEntry.createWriter(gotButtonsWriter, fail);

            // If there's nothing in buttons.json, copy the template to it
            function gotButtonsWriter(writer) {
                if (writer.length < 1) {
                    writer.write(template);
                }

                // This is defined here so that the stop button function doesn't have to
                // also be inside of the getJSON call
                var media; 

                // If the JSON file is successfully retrieved, set jsonData to the buttonList array in
                // the JSON file
                $.getJSON(fileEntry.nativeURL, function(data) {
                    jsonData = data.buttonList;

                    // Directives for transparency.js
                    // See https://github.com/leonidas/transparency#directives for more details
                    var directives = {
                        index: {  // For tags with class index
                            html: function(params) {  // Fill the inner HTML with:
                                // Add a span with data-index="index" to the button
                                return "<span data-index=\"" + this.index + "\"></span>";
                            }
                        }
                    };

                    // Fills in the HTML using transparency.js
                    $(".buttons").render(jsonData, directives);


                    // When a button with class "button" is clicked
                    $(".button").on("touchend", function() {

                        // Find the span with the index number
                        indexSpan = $(this).find("a span").not(".name");

                        // Turn the soundAddress attribute into an actual filesystem URL
                        window.resolveLocalFileSystemURL(jsonData[indexSpan.data("index")].soundAddress, gotSoundAddress, fail);

                        // Creates and plays sound on success
                        function gotSoundAddress(file) {
                            console.log(file.fullPath);
                            media = new Media(file.fullPath);
                            media.play();
                        }

                    });
                });
                
                // If the Stop All Sounds button is touched, stop playback
                $("#stop").on("touchend", function() {
                    media.stop();
                });

                // When the New Sound button is clicked:
                $("#createNew").on("touchend", function() {

                    // Get the name and path of the new sound
                    var soundName = document.getElementById("soundName").value;

                    window.resolveLocalFileSystemURL(selectedFile, gotMediaFile, fail);

                    var copyFile;

                    function gotMediaFile(file) {
                        copyFile = file;
                        fileEntry.getParent(gotParent, fail);
                    }

                    function gotParent(parent) {
                        parent.getDirectory("sounds", {create: false, exclusive: false}, gotSoundsDir, fail);
                    }

                    function gotSoundsDir(soundsDir) {
                        copyFile.copyTo(soundsDir, soundName, gotCopyFile, fail);
                    }

                    function gotCopyFile(entry) {
                        fileEntry.createWriter(gotNewWriter, fail);
                    }

                    function gotNewWriter(writer) {
                        if (soundName.length < 1 || selectedFile === null) {
                            alert("Please make sure all fields are filled in.");
                        } else {
                            writer.seek(writer.length - 2);
                            writer.write(",{\"index\":" + jsonData.length + ",\"name\":\"" + soundName + "\",\"soundAddress\":\"" + realRoot + "SoundBoardPlusPlus/sounds/" + soundName + "\"}]}");
                        }
                    }

                    // location.href = "./index.html";
                });
            }
            
        }
    });
});

$("#location").on("click", function fileSelector() {
    fileChooser.open(function(uri) {
        selectedFile = uri;
    });
});