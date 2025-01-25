window.addEventListener("DOMContentLoaded", () => {
    let target = document.getElementById("connect-button");
    
    target.addEventListener("click", function() {

        document.getElementById("connection-panel").style.display = "none";
        document.getElementById("connecting").style.display = "flex";

    });
});

// just basics to get the button working