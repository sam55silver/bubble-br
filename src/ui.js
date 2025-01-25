// just basics to get the buttons working

window.addEventListener("DOMContentLoaded", () => {
    
    document.getElementById("connect-button").addEventListener("click", function() {

        document.getElementById("connection-panel").style.display = "none";
        document.getElementById("connecting").style.display = "flex";

    });

    document.getElementById("main-menu-button").addEventListener("click", function() {

        document.getElementById("death-container").style.display = "none";
        document.getElementById("main-menu-container").style.display = "flex";

    });
});


// once connected, display:none on #connection-container and display:flex on #app
// on death, set #app to display:none and set #death-container to display:flex