// @copyright 2012+ Daniel Nakov / Silverline CRM
// http://silverlinecrm.com
// @copyright 2019+ Danny Summerlin
var sfnav = (()=>{
	var orgId = null
	var sessionHash = null
	var sessionId = null
	var serverInstance = null
	var apiUrl = ""
	var userId = ""
	var customObjects = {}
	var commands = {}
	var searchBox
	var listPosition = -1
	var mouseClickLoginAsUserId
	const newTabKeys = [ "ctrl+enter", "command+enter", "shift+enter" ]

	var getServerInstance = ()=>{
		if(serverInstance == null) {
			let url = location.origin + ""
			if(url.indexOf("lightning.force") != -1)
				serverInstance = url.substring(0, url.indexOf("lightning.force")) + "lightning.force.com"
			else if(url.indexOf("salesforce") != -1)
				serverInstance = url.substring(0, url.indexOf("salesforce")) + "salesforce.com"
			else if(url.indexOf("cloudforce") != -1)
				serverInstance = url.substring(0, url.indexOf("cloudforce")) + "cloudforce.com"
			else if(url.indexOf("visual.force") != -1) {
				let urlParseArray = url.split(".")
				serverInstance = 'https://' + urlParseArray[1] + ''
			}
		}
		return serverInstance
	}
	var getSessionHash = ()=>{
		if(sessionHash != null) return sessionHash
		else {	
			let sId = document.cookie.match(regMatchSid)[1]
			sessionHash = sId.split('!')[0] + '!' + sId.substring(sId.length - 10, sId.length)
			return sessionHash
		}
	}
	var getUserId = ()=> userId

	function invokeCommand(cmd, newTab, event) {
		if(cmd == "") { return false }
		let checkCmd = cmd.toLowerCase()
		let targetUrl = ""
		switch(checkCmd) {
			case "refresh metadata":
				showLoadingIndicator()
				chrome.runtime.sendMessage({ action: "refreshSessionData", key: getSessionHash(), url: getServerInstance()}, (response)=>{
					setupSession(response)
					document.getElementById("sfnav_quickSearch").value = ""
				})
				return true
				break
			case "toggle lightning":
				let mode
				if(window.location.href.includes("lightning.force")) mode = "classic"
				else mode = "lex-campaign"
				targetUrl = "/ltng/switcher?destination=" + mode
				break
			case "setup":
				if(getServerInstance().includes("lightning.force"))
					targetUrl = "/lightning/setup/SetupOneHome/home"
				else
					targetUrl = "/ui/setup/Setup"
				break
			case "home":
				targetUrl = "/"
				break
		}
		if(checkCmd.substring(0,9) == 'login as ') { loginAs(cmd, newTab); return true }
		else if(checkCmd.substring(0,1) == "!") { createTask(cmd.substring(1).trim()) }
		else if(checkCmd.substring(0,1) == "?") { targetUrl = searchTerms(cmd.substring(1).trim()) }
		else if(event != 'click' && typeof commands[cmd] != 'undefined' && commands[cmd].url) { targetUrl = commands[cmd].url }
		else if(debug && !checkCmd.includes("create a task: !") && !checkCmd.includes("global search usage")) {
			console.log(cmd + " not found in command list or incompatible")
			return false
		}
		if(targetUrl != "") {
			hideSearchBox()
			if(newTab)
				goToUrl(targetUrl, newTab)
			else
				goToUrl(targetUrl)
			return true
		} else { return false }
	}
	var goToUrl = function(url, newTab) { chrome.runtime.sendMessage({ action: 'goToUrl', url: getServerInstance() + url, newTab: newTab } , (response)=>{}) }
	var searchTerms =function (terms) {
		var targetUrl = "" //getServerInstance()
		if(getServerInstance().includes('.force.com'))
			targetUrl += "/one/one.app#" + btoa(JSON.stringify({"componentDef":"forceSearch:search","attributes":{"term": terms,"scopeMap":{"type":"TOP_RESULTS"},"context":{"disableSpellCorrection":false,"SEARCH_ACTIVITY":{"term": terms}}}}))
		else
			targetUrl += "/_ui/search/ui/UnifiedSearchResults?sen=ka&sen=500&str=" + encodeURI(terms) + "#!/str=" + encodeURI(terms) + "&searchAll=true&initialViewMode=summary"
		return targetUrl
	}
	var createTask = function(subject) {
		showLoadingIndicator()
		if(subject != "" && getUserId()) {
			getHTTP("https://" + apiUrl + "/services/data/" + SFAPI_VERSION + "/sobjects/Task", "json", {"Authorization": "Bearer " + sessionId, "Content-Type": "application/json" }, {"Subject": subject, "OwnerId": getUserId()}, "POST")
			.then(function (reply) {
				if(reply.errors.length == 0) {
					clearOutput()
					commands["Go To Created Task"] = {url: "/"+ reply.id }
					document.getElementById("sfnav_quickSearch").value = ""
					addElements('Go To Created Task')
					addWord('(press escape to exit or enter a new command)')
				} else {
					console.log(response)
				}
				hideLoadingIndicator()					
			})
		}
	}
	function loginAs(cmd, newTab) {
		let cmdSplit = cmd.split(' ')
		let searchValue = cmdSplit[2]
		if(cmdSplit[3] !== undefined)
			searchValue += '+' + cmdSplit[3]
		showLoadingIndicator()
		getHTTP("https://" + apiUrl + "/services/data/" + SFAPI_VERSION + "/tooling/query/?q=SELECT+Id,+Name,+Username+FROM+User+WHERE+Name+LIKE+'%25" + searchValue + "%25'+OR+Username+LIKE+'%25" + searchValue + "%25'", "json", {"Authorization": "Bearer " + sessionId, "Content-Type": "application/json" })
		.then(function(success) {
			hideLoadingIndicator()
			let numberOfUserRecords = success.records.length
			if(numberOfUserRecords < 1) { addError([{"message":"No user for your search exists."}]) }
			else if(numberOfUserRecords > 1) { loginAsShowOptions(success.records) }
			else {
				var userId = success.records[0].Id
				loginAsPerform(userId, newTab)
			}
		}).catch(function(error) {
			hideLoadingIndicator()
			console.log(error)
			addError(error)
		})
	}
	function loginAsShowOptions(records) {
		for(let i = 0; i < records.length; ++i) {
			let cmd = 'Login As ' + records[i].Name
			commands[cmd] = {key: cmd, id: records[i].Id}
			addElements(cmd)
		}
	}
	function loginAsPerform(userId, newTab) {
		let targetUrl = "https://"+apiUrl+"/servlet/servlet.su?oid="+orgId+"&suorgadminid="+userId+"&targetUrl=/home/home.jsp"
		hideSearchBox()
		if(newTab) goToUrl(targetUrl, true)
		else goToUrl(targetUrl)
		return true
	}

// interaction
	Mousetrap = (function(Mousetrap) {
		var _global_callbacks = {},
			_original_stop_callback = Mousetrap.stopCallback
		Mousetrap.stopCallback = function(e, element, combo) {
			if (_global_callbacks[combo]) { return false }
			return _original_stop_callback(e, element, combo)
		}
		Mousetrap.bindGlobal = function(keys, callback, action) {
			Mousetrap.bind(keys, callback, action)
			if (keys instanceof Array) {
				for (var i = 0; i < keys.length; i++) { _global_callbacks[keys[i]] = true }
				return
			}
			_global_callbacks[keys] = true
		}
		return Mousetrap
	})(Mousetrap)
	var mouseHandler = function() {
		this.classList.add('sfnav_selected')
		mouseClickLoginAsUserId = this.getAttribute("id")
		return true
	}
	var mouseClick = function() {
		document.getElementById("sfnav_quickSearch").value = this.firstChild.nodeValue
		listPosition = -1
		setVisibleSearch("hidden")
		invokeCommand(this.firstChild.nodeValue,false,'click')
		return true
	}
	var mouseHandlerOut = function() { this.classList.remove('sfnav_selected'); return true }
	var mouseClickLoginAs = function() { loginAsPerform(mouseClickLoginAsUserId); return true }
	function bindShortcuts() {
		let searchBar = document.getElementById('sfnav_quickSearch')
		Mousetrap.bindGlobal('esc', function(e) { hideSearchBox() })
		Mousetrap.wrap(searchBar).bind('enter', kbdCommand)
		for (var i = 0; i < newTabKeys.length; i++) {
			Mousetrap.wrap(searchBar).bind(newTabKeys[i], kbdCommand)
		}
		Mousetrap.wrap(searchBar).bind('down', selectMove.bind(this, 'down'))
		Mousetrap.wrap(searchBar).bind('up', selectMove.bind(this, 'up'))
		Mousetrap.wrap(document.getElementById('sfnav_quickSearch')).bind('backspace', function(e) { listPosition = -1 })
		document.getElementById('sfnav_quickSearch').oninput = function(e) {
			lookAt()
			return true
		}
	}

// interface
	function showLoadingIndicator() { document.getElementById('sfnav_loader').style.visibility = 'visible' }
	function hideLoadingIndicator() { document.getElementById('sfnav_loader').style.visibility = 'hidden' }
	var hideSearchBox = function() {
		let searchBar = document.getElementById('sfnav_quickSearch')
		searchBar.blur()
		clearOutput()
		searchBar.value = ''
		setVisibleSearch("hidden")
	}
	function setVisibleSearch(visibility) {
		let searchBox = document.getElementById("sfnav_searchBox")
		if(visibility == "hidden") {
			searchBox.style.opacity = 0
			searchBox.style.visibility = "hidden"
		}
		else {
			searchBox.style.opacity = 0.98
			searchBox.style.visibility = "visible"
			document.getElementById("sfnav_quickSearch").focus()
		}
	}
	function lookAt() {
		let newSearchVal = document.getElementById('sfnav_quickSearch').value
		if(newSearchVal !== '') addElements(newSearchVal)
		else {
			document.querySelector('#sfnav_output').innerHTML = ''
			listPosition = -1
		}
	}
	function addElements(input) {
		clearOutput()
		if(input.substring(0,1) == "?") addWord('Global Search Usage: ? <Search term(s)>')
		else if(input.substring(0,1) == "!") addWord('Create a Task: ! <Subject line>')
		else if(input.substring(0,8) == 'login as') addWord('Usage: login as <FirstName> <LastName> OR <Username>')
		else {
			let words = getWord(input, commands)
			if(words.length > 0)
				for (var i=0;i < words.length; ++i)
					addWord(words[i])
			else
				listPosition = -1
		}
		let firstEl = document.querySelector('#sfnav_output :first-child')
		if(listPosition == -1 && firstEl != null) firstEl.className = "sfnav_child sfnav_selected"
	}
	var getWord = function(input, dict) {
		if(typeof input === 'undefined' || input == '') return []
		let dictItems = []
		let foundInDict = []
		let inputRegex = ""
		eval("inputRegex = /(?=.*" + input.toLowerCase().replace(/\s+/g, ")[^^](?=.*") + ")/")
		let commandKeys = Object.keys(dict)
		// let commandKeys = Object.keys(dict).sort() // might do sorting
		for (let i in commandKeys) {
			let key = commandKeys[i]
			if(foundInDict.length > 10) break // stop at 10 since we can't see longer than that anyways - should make this a setting
			if(key.toLowerCase().indexOf(input.toLowerCase()) != -1)
				foundInDict.push({num: 10, key: key})
			else if(key.toLowerCase().match(inputRegex) != null)
				foundInDict.push({num: 5, key: key})
		}
		foundInDict.sort(function(a,b) { return b.num - a.num })
		for(let i = 0;i < foundInDict.length; i++)
			dictItems.push(foundInDict[i].key)
		return dictItems
	}
	function addWord(word) {
		var d = document.createElement("div")
		var sp
		if(commands[word] != null && commands[word].url != null && commands[word].url != "") {
			sp = document.createElement("a")
			sp.setAttribute("href", commands[word].url)
		} else { sp = d }
		if(commands[word] != null && commands[word].id != null && commands[word].id != "") { sp.id = commands[word].id }
		sp.classList.add('sfnav_child')
		sp.appendChild(document.createTextNode(word))
		sp.onmouseover = mouseHandler
		sp.onmouseout = mouseHandlerOut
		sp.onclick = mouseClick
		if(sp.id && sp.length > 0) { sp.onclick = mouseClickLoginAs }
		searchBox.appendChild(sp)
	}
	function addError(text) {
		clearOutput()
		let err = document.createElement("div")
		err.className = "sfnav_child sfnav-error-wrapper"
		err.appendChild(document.createTextNode('Error! '))
		err.appendChild(document.createElement('br'))
		if(text != null)
			for(var i = 0;i<text.length;i++) {
				err.appendChild(document.createTextNode(text[i].message))
				err.appendChild(document.createElement('br'))
			}
		searchBox.appendChild(err)
	}
	function clearOutput() { if(typeof searchBox != 'undefined') searchBox.innerHTML = "" }
	function kbdCommand(e, key) {
		let position = listPosition
		let origText = '', newText = ''
		if(position < 0) position = 0
			origText = document.getElementById("sfnav_quickSearch").value
		if(typeof searchBox.childNodes[position] != 'undefined')
			newText = searchBox.childNodes[position].firstChild.nodeValue
		let newTab = newTabKeys.indexOf(key) >= 0 ? true : false
		if(!newTab)
			clearOutput()
		if(!invokeCommand(newText, newTab))
			invokeCommand(origText, newTab)
	}
	function selectMove(direction) {
		let searchBar = document.getElementById('sfnav_quickSearch')
		let firstChild
		let words = []
		for (var i = 0; i < searchBox.childNodes.length; i++)
			words.push(searchBox.childNodes[i].textContent)
		if(searchBox.childNodes[listPosition] != null)
			firstChild = searchBox.childNodes[listPosition].firstChild.nodeValue
		else
			firstChild = null
		let isLastPos = direction == 'down' ? listPosition < words.length-1 : listPosition >= 0
		if (words.length > 0 && isLastPos) {
			if(listPosition < 0) listPosition = 0
				listPosition = listPosition + (direction == 'down' ? 1 : -1)
			if(searchBox.childNodes[listPosition] != null)
				firstChild = searchBox.childNodes[listPosition].firstChild.nodeValue
			else
				firstChild = null
			if (listPosition >=0) {
				searchBox.childNodes[listPosition + (direction == 'down' ? -1 : 1) ].classList.remove('sfnav_selected')
				searchBox.childNodes[listPosition].classList.add('sfnav_selected')
				searchBox.childNodes[listPosition].scrollIntoViewIfNeeded()
				return false
			}
		}
	}

	chrome.runtime.onMessage.addListener((request, sender, sendResponse)=>{
log("request", request)
		let response = {}
		switch(request.action) {
			case "showError": if(getSessionHash() == request.key) log("error", response.data); break
			case "updateSessionApiSettings": if(getSessionHash() == request.key) setupSession(response.data); break
			case "updateSessionCommands":
				if(getSessionHash() == request.key) {
					Object.assign(commands, request.commands)
					hideLoadingIndicator()
				}
				break
		}
		sendResponse(response)
		return true
	})
	var setupSession = (args)=>{ ({sessionId, userId, apiUrl} = args) }

	function init() {
		if(document.body != null && document.cookie.match(regMatchOrgId) != null) {
			orgId = document.cookie.match(regMatchOrgId)[1]
			var searchBoxWraper = document.createElement('div')
			searchBoxWraper.setAttribute('id', 'sfnav_searchBox')
			var loaderURL = chrome.extension.getURL("images/ajax-loader.gif")
			var logoURL = chrome.extension.getURL("images/sf-navigator128.png")
			searchBoxWraper.innerHTML = `
	<div class="sfnav_wrapper">
		<input type="text" id="sfnav_quickSearch" autocomplete="off"/>
		<img id="sfnav_loader" src= "${loaderURL}"/>
		<img id="sfnav_logo" src= "${logoURL}"/>
	</div>
	<div class="sfnav_shadow" id="sfnav_shadow"/>
	<div class="sfnav_output" id="sfnav_output"/>
	`
			document.body.appendChild(searchBoxWraper)
			searchBox = document.getElementById("sfnav_output")
			hideLoadingIndicator()
			bindShortcuts()
			if(sessionId == null)
				chrome.runtime.sendMessage({ action: 'getSessionData', key: getSessionHash(), url: getServerInstance() }, (response)=>{
					setupSession(response.data)
				})
		}
	}
	init()
})()