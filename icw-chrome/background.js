function onError(error) {
    console.log(error)
}

chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "icw-put",
        title: "Push to ICW",
        contexts: ['image']
    })
})

async function getIcwSettings() {

    function onError(error) {
        console.log(`Error Retreiving Settings: ${error}`);
    }

    let getting = chrome.storage.sync.get(["address","secure"]);
    console.log(getting)

    let res = await getting
    console.log(res)
    return Promise.resolve({
            address: res.address || "127.0.0.1",
            secure:  res.secure || false,
            port: res.port || 5000
    });
}

async function getIcwAddress() {
    let set = await getIcwSettings()
    console.log(set)
    if (set.secure) {
        return Promise.resolve(`https://${set.address}:${set.port}/ext_submit`);
    } else {
        return Promise.resolve(`http://${set.address}:${set.port}/ext_submit`);
    }

}


chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    const url = await getIcwAddress();
    console.log(info, tab)
    const icon_url = chrome.runtime.getURL("icons/icw_logo_48.png")
    const tick_url = chrome.runtime.getURL("icons/tick.png")
    const cross_url = chrome.runtime.getURL("icons/cross.png")
    console.log(icon_url)

    const imgLocationData = {
        src: info.srcUrl
    }
    response = await fetch(url, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(imgLocationData)
    }).catch(async (error) => {
        await chrome.notifications.create(null, {
            message: "Could not contact ImgCat",
            title: "ImgCat Push",
            type: "basic",
            iconUrl: icon_url
        })
        
    })
    try {
        const content = await response.json()
        if (content.status === 'success') {
            await chrome.notifications.create(null, {
                message: "ImgCat Import Successful",
                title: "ImgCat Push",
                type: "basic",
                iconUrl: icon_url
            })
        } else {
            await chrome.notifications.create(null, {
                message: `ImgCat Push Failed ${content.error}`,
                title: "ImgCat Push",
                type: "basic",
                iconUrl: icon_url
            })
        }
    } catch (error) {
        console.log(error)
        await chrome.notifications.create(null, {
            message: "ImgCat Response Invalid",
            title: "ImgCat Push",
            type: "basic",
            iconUrl: icon_url
        }
    )
    }
})

