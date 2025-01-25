// just basics to get the buttons working

window.addEventListener("DOMContentLoaded", () => {
    
    document.getElementById("connect-button").addEventListener("click", function() {

        // get values from input fields
        let username = document.getElementById("username-input").value;
        let server = document.getElementById("server-input").value;

        console.log(server);
        console.log(username);

        // hide #connection-panel and show #connecting
        document.getElementById("connection-panel").style.display = "none";
        document.getElementById("connecting").style.display = "flex";


    });

    document.getElementById("main-menu-button").addEventListener("click", function() {

        // hide #death-container and show #main-menu-container
        document.getElementById("death-container").style.display = "none";
        document.getElementById("main-menu-container").style.display = "flex";

    });
});


function healthUpdater(hitpoints) {
    // target the HP div and update the contents
    document.getElementById("hitpoints").innerHTML = hitpoints;
}


// to do:
// once connected, display:none on #main-menu-container and display:flex on #app
// on death, set #app to display:none and set #death-container to display:flex