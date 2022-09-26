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

// Wait for the deviceready event before using any of Cordova's device APIs.
// See https://cordova.apache.org/docs/en/latest/cordova/events/events.html#deviceready
document.addEventListener('deviceready', onDeviceReady, false);

function onDeviceReady() {
    // Cordova is now initialized. Have fun!

    console.log('Running cordova-' + cordova.platformId + '@' + cordova.version);

    controller = new WidgetOrder(); 
}

// JavaScript "class" with all methods within
function WidgetOrder() {
    console.log("Creating controller/model");

    // PRIVATE VARIABLES AND FUNCTIONS - available only to code inside the controller/model

    // The URL which will provide the base to interact with the REST API
    var BASE_GET_URL = "http://137.108.92.9/openstack/api/";

    var BASE_URL = BASE_GET_URL;

    /* These variables declared here disrupted the map displaying, had to leave commented out
    var OUCU_USERNAME;
    var OUCU_PASSWORD;
    */

    // Initialize the platform object:
    var platform = new H.service.Platform({
        apikey: "8SKBPEJwuTUSuAJ4kw7J-X60eYlgsHgvaOH-NL8xUUc",
    });

    // Obtain the default map types from the platform object:
    var defaultLayers = platform.createDefaultLayers();

    // Instantiate (and display) a map object:
    var map = new H.Map(
        document.getElementById("mapContainer"),
        defaultLayers.vector.normal.map,
        {
            zoom: 15,
            center: { lat: 52.5, lng: 13.4 },
        }
    );

    // Create the default UI:
    var ui = H.ui.UI.createDefault(map, defaultLayers);
    var mapSettings = ui.getControl("mapsettings");
    var zoom = ui.getControl("zoom");
    var scalebar = ui.getControl("scalebar");
    mapSettings.setAlignment("top-left");
    zoom.setAlignment("top-left");
    scalebar.setAlignment("top-left");
    // Enable the event system on the map instance:
    var mapEvents = new H.mapevents.MapEvents(map);
    // Instantiate the default behavior, providing the mapEvents object:
    new H.mapevents.Behavior(mapEvents);

    var marker;
    var markers = [];

    // Add marker to the map
    function addMarkerToMap(point) {

        marker = new H.map.Marker(point);
        console.log(marker);
        map.addObject(marker);
        markers.push(marker);
        console.log("marker added to map");
    };


    // Clear any markers added to the map (if added to the markers array)
    function clearMarkersFromMap() {
        markers.forEach(function (marker) {
            if (marker) {
                map.removeObject(marker);
            }
        });
        markers = [];
        console.log("cleared markers from map");
    };


    // FR2.1 Obtain the device location and centre the map
    function centreMap() {

        function onSuccess(position) {
            console.log("Obtained position", position);
            var point = {
                lng: position.coords.longitude,
                lat: position.coords.latitude,
            };
            map.setCenter(point);
        }

        function onError(error) {
            console.error("Error calling getCurrentPosition", error);

            // Inform the user that an error occurred
            alert("Error obtaining location, please try again.");
        }

        // Note: This can take some time to callback or may never callback,
        //       if permissions are not set correctly on the phone/emulator/browser
        navigator.geolocation.getCurrentPosition(onSuccess, onError, {
            enableHighAccuracy: true,
        });
    };

    // Variable to keep track of widget item displayed
    var current_widget = 1;
    var total_widgets;
    var widget_data;

    // FR1.2 Set the new widget into the display
    function setWidget() {

        // Place widget image into html
        var img_url = widget_data[(current_widget - 1)].url;
        console.log("image: " + img_url);
        var image = document.getElementById("widget_image");
        image.src = img_url;

        // Place widget description into html
        var widget_description = widget_data[(current_widget - 1)].description;
        console.log("description: " + widget_description);
        document.getElementById("widget_description").innerHTML = widget_description;

        // Place asking price into html
        var widget_price = widget_data[(current_widget -1)].pence_price;
        console.log("pence price: " + widget_price);
        document.getElementById("widget_asking_price").innerHTML = "Asking price in pence: " + widget_price;
    }
    
    // FR1.2 Get widget data and change html display to include the widgets.
    function widgetDisplay(oucu_id, password) {

        function onListSuccess(obj) {
            
            console.log("List: received widget object", obj);

            if (obj.status == "success") {
                // Widgets put into a variable widget_data
                widget_data = obj.data;
                console.log(widget_data);

                // Inform user the widget data has been received
                console.log("widget data received")
                console.log("widget data length: " + widget_data.length);
                total_widgets = widget_data.length;

                
                setWidget();

            } else if (obj.message) {
                alert(obj.message);
            } else {
                alert(obj.status + " " + obj.data[0].reason);
            }
        }

        // Sending GET request for widget info
        var widgetUrl = BASE_URL + "widgets/" + "?OUCU=" + oucu_id + "&password=" + password;
        console.log("widget info: Sending GET to " + widgetUrl);
        $.ajax(widgetUrl, { type: "GET", data: {}, success: onListSuccess });
    }

    // Store the order id which is generated when "Begin Order button is pressed"
    var order_id;

    // Actions when the "Begin Order is pressed"
    function beginOrder(id, password, client_id) {
        
        // Display the hidden widget and order info division
        document.getElementById("order_info").style.display = "inline-block";
        document.getElementById("widget_display").style.display = "inline-block";
        console.log("Begin Order button press registered");

        //Function to validate the OUCU
        function validateOucu(id) {

            // FR1.1 Check if the first character is a letter and the final character is a number
            var first_char = id[0];
            var last_char = id[id.length -1];

            function isCharacter(char) {
                return char.toLowerCase() != char.toUpperCase();
            }

            function isNumber(char) {
                return !isNaN(char);
            }

            if (isCharacter(first_char) &&  isNumber(last_char)) {
                console.log("The OUCU id has been validated")
                return true;

            } else {
                alert("The OUCU id is not in the correct format")
                return false;
            }
        };

        if (validateOucu(id)) {
            console.log(" Carrying on with the function")
        } else {
            return;
        };


        // Convert address to longitude and latitude
        function convertAddress(address) {

            // Get the address of client and find longitude and latitude
                function onAddressSuccess (obj) {
                    console.log("received client address in longitude and latitude");
                    var result = obj[0];
                    console.log(result);

                    var lon = result.lon;
                    var lat = result.lat;
                    console.log("longitude is :" + lon + " latitude is: " + lat);

                    client_lonlat = [lon, lat];
                }
                
                var addressUrl = "http://nominatim.openstreetmap.org/search/" + address + "?format=json&countrycodes=gb";
                console.log("OpenStreetMap address: Sending GET to " + addressUrl);
                $.ajax(addressUrl, 
                    { type: "GET", 
                    async: false,
                    crossDomain:true, 
                    'dataType': "jsonp", 
                    headers: {  "accept": "application/json", "Access-Control-Allow-Headers": "*"},
                    async: false, 
                    data: {}, 
                    success: function(data) {
                        onAddressSuccess(data);
                    } });

                
                /* alternative nominatim request method, does not work
                var xhr = new XMLHttpRequest();
                xhr.open("GET", addressUrl, true);

                var result;
                xhr.onload = function () {
                    result= JSON.parse(xhr.responseText);
                    console.log("the latitude is " + result[0].lat + "the longitude is " + result[0].lon);
                };
                xhr.send();
                console.log(result);

                client_lonlat = [result[0].lat, result[0].lon];
                console.log(client_lonlat);
                */
        }
        
        //place to store client lon and lat data to enter in POST request to place order, if it actually worked
        var client_lonlat;
        // Place to store order and client data
        var order_datetime;
        var client_name;
        var client_address;

        // Get client information
        function onClientSuccess(obj) {

            console.log("Client data object received", obj);

            if (obj.status == "success") {
                // Client data put into a variables
                client_data = obj.data[0];
                console.log(client_data);
                client_address = client_data.address;
                client_name = client_data.name;

                // Inform user the client data has been received
                console.log("client data received");

                console.log("client address is: " + client_address);

                // Get address as lon and lat if it would work
                convertAddress(client_address);

            } else if (obj.message) {
                alert(obj.message);
            } else {
                alert(obj.status + " " + obj.data[0].reason);
            }
        }

        // Send request for client data to the REST API
        var oucu_id = document.getElementById("oucu_id").value//.defaultValue = "jh34773";
        var password = document.getElementById("password").value//.defaultValue = "mAhSZ7A9";
        var client_id = document.getElementById("client_id").value

        var clientUrl = BASE_URL + "clients/" + client_id + "?OUCU=" + oucu_id + "&password=" + password;
        console.log("client info: Sending GET to " + clientUrl);
        $.ajax(clientUrl, { type: "GET", data: {}, success: onClientSuccess });
        
        // Display widget info
        widgetDisplay(id, password);

        // Create the order to then add items to
        function onOrderSuccess (obj) {
            if (obj.status == "success") {
                order_id = obj.data[0].id;
                console.log("order begun, id: " + order_id);

                order_datetime = obj.data[0].date;

                updateDisplay();
            } else if (obj.message) {
                alert(obj.message)
            } else {
                alert(obj.status + " " + obj.data[0].reason);
            }
        }
        
        //Send POST request to make new order. Lon and lat null as nominatim does not work
        var orderUrl = BASE_URL + "orders";
        console.log("sending new order to " + orderUrl);
        $.ajax(orderUrl, { type: "POST", data: {
            OUCU: oucu_id,
            password: password,
            client_id: client_id,
            latitude: null,
            longitude: null,
        }, success: onOrderSuccess });

        // FR2.1 Centre the map around the user when beginning an order
        centreMap();

        function updateDisplay() {
            // Set the html elements with the order and client data
            // Set client name in the html
            document.getElementById("client_name").innerHTML = client_name;
            // Set client address in the html
            document.getElementById("client_address").innerHTML = client_address;
            // Set the datetime of the order
            document.getElementById("order_datetime").innerHTML = ("Ordered " + order_datetime.substring(0, 10) + " at " + order_datetime.substring(11, order_datetime.length));
            console.log("inital client and order info updated");
        };


        // FR2.2 Add the markers from the orders to the map - Nominatim not worked so hardcoded a few orders into my oucu and password (markers showing in Milton Keynes) which can be found at this.addToOrder commented out
        function addAllOrdersToMap() { 
            
            function onSuccess (obj) {
                if (obj.status == "success") {
                    var orders = obj.data;
    
                    //loop through each order and get the lat and lon, then add to map
                    for (let step = 0; step < orders.length; step++) {
                        var lat = parseFloat(orders[step].latitude);
                        var lon = parseFloat(orders[step].longitude);

                        //Add markers if not null
                        if (lat != 0 && lon != 0) {
                            var point = {lat: lat, lng: lon};
                        addMarkerToMap(point);
                        } else {
                            console.log("skipping over order with no longitude or latitude");
                        }
                    }
                } else if (obj.message) {
                    alert(obj.message)
                } else {
                    alert(obj.status + " " + obj.data[0].reason);
                }
            }
    
            // Initally clear all markers
            clearMarkersFromMap();

            // Send GET request for all orders
            orderUrl = BASE_URL + "orders?OUCU=jh34773&password=mAhSZ7A9";
            console.log("sending orders GET request to " + orderUrl);
            $.ajax(orderUrl, { type: "GET", data: {}, success: onSuccess });
        }

        addAllOrdersToMap();

    }

    // FR1.2 Cycle through and display the previous widget in the widget data
    function prevWidget() {

        // If it goes below zero, set widget to the last widget of the list
        current_widget = current_widget - 1;
        if (current_widget < 1) {
            current_widget = total_widgets;
        }

        // Display the new widget and info
        setWidget();
    }

    // FR1.2 Cycle through and display the next widget in the widget data
    function nextWidget() {

        // If it goes above max, set widget to the first widget of the list
        current_widget = current_widget + 1;
        if (current_widget > total_widgets) {
            current_widget = 1;
        }

        // FR1.2 Display the new widget and info
        setWidget();
    }

    // List of the widget descriptions to display as items are added to the order
    widget_item_list = [];

    // FR1.3 Add to order and display the sum of ordered items including VAT
    function addToOrder(oucu_id, password, order_id, widget_id, number, pence_price) {

        // FR1.4 Displaying sum of the ordered items including VAT
        function updatePricing() {

            function onSuccess(obj) {
                if (obj.status == "success") {
                    data = obj.data;
                    var total = 0;
                    // Iterate through and calculate total
                    for (let step = 0; step < data.length; step++) {
                        total = total + (parseInt(data[step].number) * parseInt(data[step].pence_price));
                    }
                    // Update item list
                    widget_item_list.push(widget_data[current_widget - 1].description + " (" + number + ") at " + pence_price/100 + " each");
                    // Update the html display with the order items list
                    var order_items_string = "";
                    for (var i = 0; i < widget_item_list.length; i++) {
                        order_items_string = order_items_string + "- " + widget_item_list[i] + "<br>";
                    }
                    document.getElementById("items_ordered").innerHTML = order_items_string;

                    // Turn total from pence into pounds
                    subtotal = total/100;
                    subtotal_rounded = subtotal.toFixed(2);
                    vat_total = subtotal*0.2
                    vat_rounded_total = (Math.round(vat_total * 100)/ 100).toFixed(2);
                    final_total = subtotal + vat_total;
                    final_rounded = (Math.round(final_total * 100)/ 100).toFixed(2);
                    // FR1.4Update subtotal html
                    document.getElementById("subtotal").innerHTML = "SUBTOTAL:&nbsp;&nbsp;&nbsp;&nbsp;" + subtotal_rounded + "GBP";
                    // Update VAT html
                    document.getElementById("vat").innerHTML = "VAT:&nbsp;&nbsp;&nbsp;&nbsp;" + vat_rounded_total + "GBP";
                    // Update final total
                    document.getElementById("total").innerHTML = "TOTAL:&nbsp;&nbsp;&nbsp;&nbsp;" + final_rounded + "GBP";


                } else if (obj.message) {
                    alert(obj.message);
                } else {
                    alert(obj.status + " " + obj.data[0].reason);
                }
            }


            // Get total amount of items from order_items for this order
            orderItemsUrl = BASE_URL + "order_items?OUCU=" + oucu_id + "&password=" + password + "&order_id=" + order_id;
            console.log("sending order_items GET request to " + orderItemsUrl);
            $.ajax(orderItemsUrl, { type: "GET", data: {}, success: onSuccess });

        }
        
        // FR1.5 Order is saved to the web service and function to update page is called
        function onOrderItemSuccess (obj) {
            if (obj.status == "success") {
                console.log("order item added " + number + " lots of " + widget_data[(current_widget - 1)].description + " at " + pence_price + "pence each" );
                updatePricing();
            } else if (obj.message) {
                alert(obj.message)
            } else {
                alert(obj.status + " " + obj.data[0].reason);
            }
        }
        
        // FR1.5 Send POST request to order items table with
        var orderItemsUrl = BASE_URL + "order_items"
        console.log("sending new order items info to " + orderItemsUrl);
        $.ajax(orderItemsUrl, { type: "POST", data: {
            OUCU: oucu_id,
            password: password,
            order_id: order_id,
            widget_id: widget_id,
            number: number,
            pence_price: pence_price
        }, success: onOrderItemSuccess });
    }

    this.beginOrder = function() {
        // Get the input values from the user information fields
        var oucu_id = document.getElementById("oucu_id").value//.defaultValue = "jh34773";
        var password = document.getElementById("password").value//.defaultValue = "mAhSZ7A9";
        var client_id = document.getElementById("client_id").value;
        console.log("client id is: ", client_id);

        beginOrder(oucu_id, password, client_id);
    }

    /* This method returned 'nextWidget() is not a function at onClick, other method provided below
    this.nextWidget = function() {
        nextWidget();
    }
    */

    // FR1.2 Alternative method to get the next widget function to be called
    document.getElementById("next_widget").addEventListener('click', nextWidget, true);
    
    // FR1.2 onClick caller to the prevWidget function
    this.prevWidget = function() {
        prevWidget();
    }

    this.addToOrder = function() {
        //Collect the form information
        var oucu_id = document.getElementById("oucu_id").value//.defaultValue = "jh34773";
        var password = document.getElementById("password").value//.defaultValue = "mAhSZ7A9";
        var number = document.getElementById("item_number").value;
        var agreed_price = document.getElementById("agreed_price").value;

        addToOrder(oucu_id, password, order_id, current_widget, number, agreed_price);
    }


    function endOrder() {
        // Hide the display 
        document.getElementById("order_info").style.display = "none";
        document.getElementById("widget_display").style.display = "none";

        // Clear the html values back to empty
        document.getElementById("widget_image").src = "";
        document.getElementById("items_ordered").innerHTML = "";

        document.getElementById("client_name").innerHTML = client_name;
        document.getElementById("client_address").innerHTML = client_address;
        document.getElementById("order_datetime").innerHTML =

        document.getElementById("subtotal").innerHTML = "SUBTOTAL:&nbsp;&nbsp;&nbsp;&nbsp;0.00GBP";
        document.getElementById("vat").innerHTML = "VAT:&nbsp;&nbsp;&nbsp;&nbsp;0.00GBP";
        document.getElementById("total").innerHTML = "TOTAL:&nbsp;&nbsp;&nbsp;&nbsp;0.00GBP";

        // Clear markers from the map
        clearMarkersFromMap();

    }

    this.endOrder = function() {
        endOrder();
    }





    /*
    var user_lon;
    var user_lat;
        // ALTERNATIVE TO GETTING ADRESS TO LON/LAT: AUTOPOPULATE ORDERS
        function onSuccess(position) {
            console.log("Obtained position", position);
            point = {
                lng: position.coords.longitude,
                lat: position.coords.latitude,
            };
            map.setCenter(point);

            user_lon = position.coords.longitude;
            console.log(user_lon);
            user_lat = position.coords.latitude;
            console.log(user_lat);
        }

        function onError(error) {
            console.error("Error calling getCurrentPosition", error);

            // Inform the user that an error occurred
            alert("Error obtaining location, please try again.");
        }
        
    
    navigator.geolocation.getCurrentPosition(onSuccess, onError, {
        enableHighAccuracy: true,
    });
    */
    
    
    
    
    
    
    
    // Get all orders and delete them all FOR CLEANING TESTING
    function deleteAllOrders() {

        // Iterate through and delete the orders
        function deleteOne(id) {
            
            function onDo(obj) {
                if (obj.status == "success") {
                    console.log("you did the delete okay");
                } else if (obj.message) {
                    alert(obj.message)
                } else {
                    alert(obj.status + " " + obj.data[0].reason);
        }
        }   
            deleteUrl = BASE_URL + "orders/" + id + "?OUCU=jh34773&password=mAhSZ7A9";
            console.log("sending delete request to " + deleteUrl);
            $.ajax(deleteUrl, 
            { type: "DELETE", 
            data: {},
            complete: onDo });
        }

        //Get the list of all orders

        function onSuccess (obj) {
            if (obj.status == "success") {
                var orders = obj.data;

                //loop through each order and delete
                for (let step = 0; step < orders.length; step++) {
                    var order_id = orders[step].id;
                    deleteOne(order_id);
                }
            } else if (obj.message) {
                alert(obj.message)
            } else {
                alert(obj.status + " " + obj.data[0].reason);
            }
        }

        // Send GET request for all orders
        orderUrl = BASE_URL + "orders?OUCU=jh34773&password=mAhSZ7A9";
        console.log("sending orders GET request to " + orderUrl);
        $.ajax(orderUrl, { type: "GET", data: {}, success: onSuccess });


        
    }


    //Activate the deleteAllOrders() function through "End Order" button for testing only
    this.deleteAllOrders = function() {
        deleteAllOrders();
    }
    
    

    /* Make a couple orders for markers to be added later, as address to long/lat isn't currently working

    for (let step = 0; step < 3; step++) {
        
        function onDummySuccess(obj) {

            if (obj.status == "success") {
                console.log("user geocode values are of the type: " + typeof(user_lon));
                console.log("order successfully posted")
            } else if (obj.message) {
                alert(obj.message);
            } else {
                alert(obj.status + " " + obj.data[0].reason);
            }
        }
        
        var orderUrl = BASE_URL + "orders";
        console.log("sending new order to " + orderUrl);
        $.ajax(orderUrl, { type: "POST", data: {
            OUCU: "jh34773",
            password: "mAhSZ7A9",
            client_id: "1",
            latitude: (user_lat + (step/1000)),
            longitude: (user_lon + (step/1000))
        }, success: onDummySuccess });
    }

    //"DELETE" URL plus eg order_id
    http://137.108.92.9/openstack/api/orders/541265768

    */

};
