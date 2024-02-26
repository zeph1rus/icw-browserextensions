function onError (error) {
  console.log(error)
}

// created at top level because this refuses to re-run from event page
// even though it should be fine when run from runtime.OnInstalled
browser.menus.create({
  id: 'icw-put',
  title: 'Push to ICW',
  contexts: ['image']
})
browser.menus.create({
  id: 'icw-remote',
  title: 'Push to ICW Remote Queue',
  contexts: ['image']
})

async function getIcwSettings () {
  const getting = browser.storage.sync.get(['address', 'secure', 'port', 'remoteurl', 'remotekey'])
  console.log('Retrieving settings')

  const res = await getting
  console.log(`Settings: ${res}`)
  return Promise.resolve({
    address: res.address || '127.0.0.1',
    secure: res.secure || false,
    port: res.port || 5000,
    remoteurl: res.remoteurl || 'https://localhost',
    remotekey: res.remotekey || ''
  })
}

async function getIcwAddress () {
  const set = await getIcwSettings()
  if (set.secure) {
    return Promise.resolve(`https://${set.address}:${set.port}/ext_submit`)
  } else {
    return Promise.resolve(`http://${set.address}:${set.port}/ext_submit`)
  }
}

browser.menus.onClicked.addListener(async (info, tab) => {
  const url = await getIcwAddress()
  console.log(`onClicked Triggered I: ${info}, T: ${tab}`)
  const icon_url = chrome.runtime.getURL('icons/icw_logo_48.png')

  const settings = await getIcwSettings()
  console.log(`Got Settings: ${settings}`)
  const imgLocationData = {
    src: info.srcUrl
  }

  const menuId = info.menuItemId
  let response = null
  console.log(`Menu Id Selected : ${menuId}`)
  switch (menuId) {
    case 'icw-put': {
      console.log('Pushing to ICW Local')
      response = await fetch(url, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(imgLocationData)
      }).catch(async (error) => {
        await chrome.notifications.create(null, {
          message: 'Could not contact ImgCat',
          title: 'ImgCat Push',
          type: 'basic',
          iconUrl: icon_url
        })
      })
      break
    }
    case 'icw-remote': {
      console.log('Pushing to ICW Remote Queue')
      const params = new URLSearchParams(
        {
          url: info.srcUrl,
          code: await settings.remotekey
        }
      )
      const remoteUrl = settings.remoteurl
      const fullUrl = `${remoteUrl}` + '?' + params
      console.log(`Full Push URL ${fullUrl}`)
      response = await fetch(fullUrl).catch(async (error) => {
        await chrome.notifications.create(null, {
          message: 'Could not queue image with remote queue',
          title: 'ImgCat Remote',
          type: 'basic',
          iconUrl: icon_url
        })
      })
      break
    }
  }
  let icw_error = null
  console.log(`Response from remote: ${response}`)
  try {
    switch (menuId) {
      case 'icw-put': {
        console.log('parsing response from icw-put')

        const content = await response.json()
        if (content.status === 'success') {
          await chrome.notifications.create(null, {
            message: 'ImgCat Import Successful',
            title: 'ImgCat Push',
            type: 'basic',
            iconUrl: icon_url
          })
        } else {
          icw_error = content.error
          await chrome.notifications.create(null, {
            message: `ImgCat Push Failed: ${icw_error}`,
            title: 'ImgCat Push',
            type: 'basic',
            iconUrl: icon_url
          })
        }

        break
      }
      case 'icw-remote': {
        console.log('parsing response from icw-remote')
        const success = (response.status === 200)
        if (success) {
          await chrome.notifications.create(null, {
            message: 'ImgCat Remote Queued',
            title: 'ImgCat Remote',
            type: 'basic',
            iconUrl: icon_url
          })
        } else {
          await chrome.notifications.create(null, {
            message: 'ImgCat Remote Queue Failed',
            title: 'ImgCat Remote',
            type: 'basic',
            iconUrl: icon_url
          })
        }
        break
      }
      default: {
        await chrome.notifications.create(null, {
          message: `ImgCat Push Failed: ${icw_error}`,
          title: 'ImgCat Push',
          type: 'basic',
          iconUrl: icon_url
        })
      }
    }
  } catch (error) {
    console.log(error)
    await chrome.notifications.create(null, {
      message: 'ImgCat Response Invalid',
      title: 'ImgCat Push',
      type: 'basic',
      iconUrl: icon_url
    }
    )
  }
})
