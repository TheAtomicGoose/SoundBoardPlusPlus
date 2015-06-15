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
        })

        var realRoot = cordova.file.externalRootDirectory;

        // Passes the root of the external storage (e.g. the SD card), as a DirectoryEntry
        window.resolveLocalFileSystemURL(realRoot, gotRootDirectory, fail);

        // Creates the directory "/storage/emulated/0/SoundBoardPlusPlus"
        function gotRootDirectory(directoryEntry) {
            directoryEntry.getDirectory("SoundBoardPlusPlus", {create: true, exclusive: false}, gotAppDirectory, fail);
        }

        // Creates the directory "/storage/emulated/0/SoundBoardPlusPlus/sounds"
        // Also creates the file "/storage/emulated/0/SoundBoardPlusPlus/buttons.json". This is the file that will be read
        // from each time the app loads index.html to create the buttons
        function gotAppDirectory(parent) {
            parent.getDirectory("sounds", {create: true, exclusive: false}, gotSoundsDirectory, fail);
            parent.getFile("buttons.json", {create: true, exclusive: false}, gotButtonsFile, fail);
        }

        function gotSoundsDirectory(parent) {
            console.log("sounds directory success");
        }

        function gotButtonsFile(file) {
            console.log("buttons file success");

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
                    console.log("template written");
                }

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
                });
                
                var media;

                // When a button with class "button" is clicked
                $(".button").on("click", function() {
                    console.log("test");
                    // // Find the span with the index number
                    // indexSpan = $(document.activeElement).find("span").not(".name");
                    // // Create a new Media object
                    // media = new Media(jsonData[indexSpan.data("index")].soundAddress);
                    // media.play();  // Play said Media object
                });

                // If the Stop All Sounds button is clicked, stop playback
                $("#stop").on("click", function() {
                    media.stop();
                });

                // When the New Sound button is clicked:
                $("#createNew").on("click", function() {
                    // Get the name and path of the new sound
                    var soundName = document.getElementById("soundName").value;
                    console.log(selectedFile);

                    window.resolveLocalFileSystemURL(selectedFile, gotMediaFile, fail);

                    var copyFile;

                    function gotMediaFile(file) {
                        copyFile = file;
                        fileEntry.getParent(gotParent, fail);
                    }

                    function gotParent(parent) {
                        parent.getDirectory("sounds", {create: false, exclusive: false}, gotSoundsDir, fail);
                        console.log(parent);
                    }

                    function gotSoundsDir(soundsDir) {
                        copyFile.copyTo(soundsDir, soundName, gotCopyFile, fail);
                    }

                    function gotCopyFile(entry) {
                        fileEntry.createWriter(gotNewWriter, fail);
                    }

                    function gotNewWriter(writer) {
                        if (soundName.length < 1 || selectedFile == null) {
                            alert("Please make sure all fields are filled in.");
                        } else {
                            writer.seek(writer.length - 6);
                            writer.write(",\n\n\t\t{\n\t\t\t\"index\": " + jsonData.length + ",\n\"name\": \"" + soundName + "\",\n\"soundAddress\": \"" + "SoundBoardPlusPlus/sounds/" + soundName + "\"\n}\n]\n}")
                            console.log("entry");
                        }
                    }

                    location.href = "./index.html";
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

$(document).bind("touchend", function(e) {
    $(e.target).trigger("click");
});