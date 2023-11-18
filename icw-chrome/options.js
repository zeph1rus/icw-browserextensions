function saveOptions(e) {
    e.preventDefault();
    chrome.storage.sync.set({
        address: document.querySelector("#icwaddress").value,
        secure: document.querySelector("#icwsecure").checked,
        port: document.querySelector("#icwport").value
    });
    document.querySelector("#icwmessage").innerHTML = "<label>Settings Saved..</label>";
}

function restoreOptions() {
    function setCurrentChoice(result) {
        console.log(document.querySelector("#icwsecure").checked)
        document.querySelector("#icwaddress").value = result.address || "127.0.0.1";
        document.querySelector("#icwsecure").checked = result.secure;
        document.querySelector("#icwport").value = result.port || 5000;
    }

    function onError(error) {
        console.log(`Error: ${error}`);
    }

    let getting = chrome.storage.sync.get(["address","secure", "port"]);
    getting.then(setCurrentChoice, onError);
}

document.addEventListener("DOMContentLoaded", restoreOptions);
document.querySelector("form").addEventListener("submit", saveOptions);