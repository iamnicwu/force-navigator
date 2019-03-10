var commands = {},
	orgIds = {},
	serverInstances = {},
	apiUrls = {},
	sessionIds = {},
	userIds = {}
var showElement = (element)=>{
log("show element")
	chrome.tabs.query({currentWindow: true, active: true}, (tabs)=>{
		switch(element) {
			case "appMenu":
				chrome.tabs.executeScript(tabs[0].id, {code: 'document.getElementsByClassName("appLauncher")[0].getElementsByTagName("button")[0].click()'})
				break
			case "searchBox":
				chrome.tabs.executeScript(tabs[0].id, {code: `
					document.getElementById("sfnav_searchBox").style.visibility = "visible"
					document.getElementById("sfnav_searchBox").style.opacity = 0.98
					setTimeout(()=>{
						document.getElementById("sfnav_quickSearch").focus()
					}, 30)
				`})
				break
		}
	})
}
var goToUrl = (targetUrl, newTab)=>{
log("go to url", targetUrl)
	chrome.tabs.query({currentWindow: true, active: true}, (tabs)=>{
		if(targetUrl.includes("force.com"))
			targetUrl = tabs[0].url.match(/.*\.com/)[0] + targetUrl.match(/.*\.com(.*)/)[1]
		else
			targetUrl = tabs[0].url.match(/.*\.com/)[0] + targetUrl
		if(newTab) chrome.tabs.create({active: false, url: targetUrl})
		else chrome.tabs.update(tabs[0].id, {url: targetUrl})
	})
}
var sendTabMessage = (message)=> {
log("send tab message")
	chrome.tabs.query({url: "https://*.force.com/*"}, (tabs)=>{
		for(let i = 0; i < tabs.length; i++)
			chrome.tabs.sendMessage(tabs[i].id, message, (response)=>{})
	})
	chrome.tabs.query({url: "https://*.salesforce.com/*"}, (tabs)=>{
		for(let i = 0; i < tabs.length; i++)
			chrome.tabs.sendMessage(tabs[i].id, message, (response)=>{})
	})
}

var getSessionApiSettings = (args)=>{
	let sessionHash, url, sendResponse
	({sessionHash, url, sendResponse} = args)
	if(sessionIds[sessionHash] != null) {
log("sess have")
		getSessionCommands(args)
		sendResponse({
			action: 'updateSessionApiSettings', key: sessionHash,
			data: {sessionId: sessionIds[sessionHash], userId: userIds[sessionHash], apiUrl: apiUrls[sessionHash]}
		})
	}
	else {
log("sess get")
		let orgId = sessionHash.split("!")[0]
		serverInstances[sessionHash] = url
		chrome.cookies.getAll({}, (all)=>{
			all.forEach((c)=>{
				if(c.domain.includes("salesforce.com") && c.value.includes(orgId)) {
					if(c.name == 'sid') {
						sessionIds[sessionHash] = c.value
						apiUrls[sessionHash] = c.domain
					}
					else if(c.name == 'disco') userIds[sessionHash] = c.value.match(/005[\w\d]+/)[0]
				}
			})
			if([sessionIds[sessionHash], apiUrls[sessionHash], userIds[sessionHash]].includes(null))
				sendTabMessage({action: 'showError', data: {error: "No session data found for " + request.key} })
			else {
				getSessionCommands(args)
				sendResponse({
					action: 'updateSessionApiSettings', key: sessionHash,
					data: {sessionId: sessionIds[sessionHash], userId: userIds[sessionHash], apiUrl: apiUrls[sessionHash]}
				})
			}
		})
	}
}

var getSessionCommands = (args)=>{
log("get commands")
	let sessionHash, url
	({sessionHash, url} = args)
	if(commands[sessionHash] != null) {
		sendTabMessage({action: 'updateSessionCommands', key: sessionHash, commands: commands[sessionHash] })
	}
	else {
		commands[sessionHash] = { "Refresh Metadata": {}, "Toggle Lightning": {}, "Setup": {}, "?": {}, "Home": {} }
		getHTTP(apiUrls[sessionHash] + "/ui/setup/Setup", "document").then(response => parseSetupTree(sessionHash, response))
		getHTTP(apiUrls[sessionHash] + "/p/setup/custent/CustomObjectsPage", "document").then(response => parseCustomObjects(sessionHash, response))
		getHTTP(apiUrls[sessionHash] + '/services/data/' + SFAPI_VERSION + '/sobjects/', "json",
			{"Authorization": "Bearer " + sessionIds[sessionHash], "Accept": "application/json"})
			.then(response => parseMetadata(sessionHash, response))
	}
	return args
}
function parseSetupTree(sessionHash, response) {
log("parse setup")
	let strNameMain, strName = {}
	;[].map.call(response.querySelectorAll('.setupLeaf > a[id*="_font"]'), function(item) {
		let hasTopParent = false, hasParent = false
		let parent, topParent, parentEl, topParentEl
		if (![item.parentElement, item.parentElement.parentElement, item.parentElement.parentElement.parentElement].includes(null) && item.parentElement.parentElement.parentElement.className.indexOf('parent') !== -1) {
			hasParent = true
			parentEl = item.parentElement.parentElement.parentElement
			parent = parentEl.querySelector('.setupFolder').innerText
		}
		if(hasParent && ![parentEl.parentElement, parentEl.parentElement.parentElement].includes(null) && parentEl.parentElement.parentElement.className.indexOf('parent') !== -1) {
			hasTopParent = true
			topParentEl = parentEl.parentElement.parentElement
			topParent = topParentEl.querySelector('.setupFolder').innerText
		}
		strNameMain = 'Setup > ' + (hasTopParent ? (topParent + ' > ') : '')
		strNameMain += (hasParent ? (parent + ' > ') : '')
		strName = strNameMain + item.innerText
		let targetUrl = item.href
		if(serverInstances[sessionHash].includes("lightning.force") && Object.keys(setupLabelsToLightningMap).includes(item.innerText))
			targetUrl = setupLabelsToLightningMap[item.innerText]
		if(serverInstances[sessionHash].includes("lightning.force") && strNameMain.includes("Customize") && Object.keys(classicToLightingMap).includes(item.innerText)) {
			if(commands[sessionHash]['List ' + parent ] == null) { commands[sessionHash]['List ' + parent ] = {url: "/lightning/o/" + pluralize(parent, 1).replace(/\s/g,"") + "/list", key: "List " + parent} }
			if(commands[sessionHash]['New ' + pluralize(parent, 1) ] == null) { commands[sessionHash]['New ' + pluralize(parent, 1) ] = {url: "/lightning/o/" + pluralize(parent, 1).replace(/\s/g,"") + "/new", key: "New " + pluralize(parent, 1)} }
			targetUrl = "/lightning/setup/ObjectManager/" + pluralize(parent, 1).replace(/\s/g, "")
			targetUrl += classicToLightingMap[item.innerText]
		}
		if(commands[sessionHash][strName] == null) commands[sessionHash][strName] = {url: targetUrl, key: strName}
	})
	sendTabMessage({action: 'updateSessionCommands', key: sessionHash, commands: commands[sessionHash] })
}
function parseMetadata(sessionHash, response) {
log("parse meta")
	if(response.length == 0 || typeof response.sobjects == "undefined") return false
	let labelPlural, label, name, keyPrefix
	response.sobjects.map(obj => {
		if(obj.keyPrefix != null) {
			({labelPlural, label, name, keyPrefix} = obj)
			commands[sessionHash]["List " + labelPlural] = { key: name, keyPrefix: keyPrefix, url: "/" + keyPrefix }
			commands[sessionHash]["New " + label] = { key: name, keyPrefix: keyPrefix, url: "/" + keyPrefix + "/e" }
		}
	})
	sendTabMessage({action: 'updateSessionCommands', key: sessionHash, commands: commands[sessionHash] })
}
function parseCustomObjects(sessionHash, response) {
log("parse custom")
	let mapKeys = Object.keys(classicToLightingMap)
	;[].map.call(response.querySelectorAll('th a'), function(el) {
		if(serverInstances[sessionHash].includes("lightning.force")) {
			let objectId = el.href.match(/\/(\w+)\?/)[1]
			let targetUrl = "/lightning/setup/ObjectManager/" + objectId
			commands[sessionHash]['Setup > Custom Object > ' + el.text + ' > Details'] = {url: targetUrl + "/Details/view", key: el.text + " > Fields"}
			for (var i = 0; i < mapKeys.length; i++) {
				let key = mapKeys[i]
				let urlElement = classicToLightingMap[ key ]
				commands[sessionHash]['Setup > Custom Object > ' + el.text + ' > ' + key] = {url: targetUrl + urlElement, key: el.text + " > " + key}
			}
		} else {
			commands[sessionHash]['Setup > Custom Object > ' + el.text] = {url: el.href.replace(/.*:\/\/\w*/, ""), key: el.text}
		}
	})
	sendTabMessage({action: 'updateSessionCommands', key: sessionHash, commands: commands[sessionHash] })
}

chrome.commands.onCommand.addListener((command)=>{
	switch(command) {
		case 'showSearchBox': showElement("searchBox"); break
		case 'showAppMenu': showElement("appMenu"); break
		case 'goToTasks': goToUrl(".com/00T"); break
		case 'goToReports': goToUrl(".com/00O"); break
	}
})
chrome.runtime.onMessage.addListener((request, sender, sendResponse)=>{
	switch(request.action) {
		case 'goToUrl': goToUrl(request.url, request.newTab); break
		case 'getSessionData':
			getSessionApiSettings({sessionHash: request.key, url: request.url, sendResponse: sendResponse}); break
		case 'refreshSessionData':
			if(commands[request.key]) delete commands[request.key]
			if(orgIds[request.key]) delete orgIds[request.key]
			if(serverInstances[request.key]) delete serverInstances[request.key]
			if(apiUrls[request.key]) delete apiUrls[request.key]
			if(sessionIds[request.key]) delete sessionIds[request.key]
			if(userIds[request.key]) delete userIds[request.key]
			getSessionApiSettings({sessionHash: request.key, url: request.url, sendResponse: sendResponse})
			break
	}
	return true
})