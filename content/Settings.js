Components.utils.import("resource://rtadd/common.jsm");
Components.utils.import("resource://rtadd/JSON.jsm");

XULRuTorrentAddon.Settings =
{
	initPrefWindow: function()
	{
		var prefservice = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService);
		this.prefs = prefservice.getBranch("");

		document.getElementById("rt_url").value=decodeURIComponent(escape(this.prefs.getCharPref("extensions.rtadd.rt_url")));
		document.getElementById("rt_dir").value=decodeURIComponent(escape(this.prefs.getCharPref("extensions.rtadd.rt_dir")));
		document.getElementById("rt_user").value=decodeURIComponent(escape(this.prefs.getCharPref("extensions.rtadd.rt_user")));
		document.getElementById("rt_passwd").value=decodeURIComponent(escape(this.prefs.getCharPref("extensions.rtadd.rt_passwd")));

		document.getElementById("rt_show_dir_list").checked=this.prefs.getBoolPref("extensions.rtadd.rt_show_dir_list");
		document.getElementById("rt_show_icon").checked=this.prefs.getBoolPref("extensions.rtadd.rt_show_icon");
		document.getElementById("rt_open_webiu").checked=this.prefs.getBoolPref("extensions.rtadd.rt_open_webiu");
		document.getElementById("rt_dblclick_navigation").checked=this.prefs.getBoolPref("extensions.rtadd.rt_dblclick_navigation");
		document.getElementById("rt_json_for_dir").checked=this.prefs.getBoolPref("extensions.rtadd.rt_json_for_dir");

		if (this.prefs.getBoolPref("extensions.rtadd.rt_multi_profile"))
			document.getElementById("profile_type").selectedIndex=1;
		else
			document.getElementById("profile_type").selectedIndex=0;

		this.changeProfileType(document.getElementById('profile_type').selectedIndex);

		this.populateServers();

		document.documentElement.getButton("accept").onclick = XULRuTorrentAddon.Settings.saveSettings;

		document.getElementById("upButton").onclick = function(event) { XULRuTorrentAddon.Settings.move('up');};
		document.getElementById("downButton").onclick = function(event) { XULRuTorrentAddon.Settings.move('down');};
		document.getElementById("newButton").onclick = function(event) { XULRuTorrentAddon.Settings.AddNewServerLine('Name','http://192.168.0.1/rutorrent/','/');};
		document.getElementById("deleteButton").onclick = function(event) { XULRuTorrentAddon.Settings.deleteServer();};

		document.getElementById("profile_type").onclick = function(event) { XULRuTorrentAddon.Settings.changeProfileType(document.getElementById('profile_type').selectedIndex);};

	},

	saveSettings: function()
	{
		var prefs = XULRuTorrentAddon.Settings.prefs;

		prefs.setCharPref("extensions.rtadd.rt_url", unescape(encodeURIComponent(document.getElementById("rt_url").value)));
		prefs.setCharPref("extensions.rtadd.rt_dir", unescape(encodeURIComponent(document.getElementById("rt_dir").value)));

		prefs.setCharPref("extensions.rtadd.rt_user", unescape(encodeURIComponent(document.getElementById("rt_user").value)));
		prefs.setCharPref("extensions.rtadd.rt_passwd", unescape(encodeURIComponent(document.getElementById("rt_passwd").value)));

		prefs.setBoolPref("extensions.rtadd.rt_show_dir_list", document.getElementById("rt_show_dir_list").checked);
		prefs.setBoolPref("extensions.rtadd.rt_show_icon", document.getElementById("rt_show_icon").checked);
		prefs.setBoolPref("extensions.rtadd.rt_open_webiu", document.getElementById("rt_open_webiu").checked);
		prefs.setBoolPref("extensions.rtadd.rt_dblclick_navigation", document.getElementById("rt_dblclick_navigation").checked);
		prefs.setBoolPref("extensions.rtadd.rt_json_for_dir", document.getElementById("rt_json_for_dir").checked);

		prefs.setBoolPref("extensions.rtadd.rt_multi_profile", document.getElementById("profile_type").selectedIndex==1);

		prefs.setCharPref("extensions.rtadd.rt_servers", unescape(encodeURIComponent(XULRuTorrentAddon.Settings.saveServers())));

		return true;
	},

	changeProfileType: function(id)
	{
		if (id == 0)
		{
			document.getElementById('single_profile').hidden = false;
			document.getElementById('multi_profile').hidden = true;
		}
		else
		{
			document.getElementById('multi_profile').hidden = false;
			document.getElementById('single_profile').hidden = true;
		}
	},


	AddNewServerLine: function(name, url, dir, user, passw)
	{
		var ServersList = document.getElementById("ServersList");

		var newItem = document.createElement("treeitem");
		var newRow = document.createElement("treerow");
		newItem.appendChild(newRow);

		var name_cell = document.createElement("treecell");
		name_cell.setAttribute("label", name);
		newRow.appendChild(name_cell);

		var url_cell = document.createElement("treecell");
		url_cell.setAttribute("label", url);
		newRow.appendChild(url_cell);

		var dir_cell = document.createElement("treecell");
		dir_cell.setAttribute("label", dir);
		newRow.appendChild(dir_cell);

		var user_cell = document.createElement("treecell");
		if (user!=undefined)
			user_cell.setAttribute("label", user);
		newRow.appendChild(user_cell);

		var passw_cell = document.createElement("treecell");
		if (passw!=undefined)
			passw_cell.setAttribute("label", passw);
		newRow.appendChild(passw_cell);

		ServersList.appendChild(newItem);
	},

	populateServers: function()
	{
		var prefString = decodeURIComponent(escape(this.prefs.getCharPref("extensions.rtadd.rt_servers")));
		if(prefString == "")
			return;

		if(prefString.indexOf('.ITEM.')>=0)
			prefString = XULRuTorrentAddon.convertSettingsString(prefString);

		var servers = JSON.parse(prefString);

		for (var i=0; i < servers.length; i++)
		{
			this.AddNewServerLine( servers[i].name, servers[i].url, servers[i].dir, servers[i].user, servers[i].password);
		}
	},

	saveServers: function() {
		var ServersList = document.getElementById("ServersList").childNodes;

		var servers = [];

		for (var i=0, slen = ServersList.length; i < slen; i++)
		{
			var columns = ServersList[i].childNodes[0].childNodes;

			servers.push({	name:      columns[0].getAttribute("label"),
							url:       columns[1].getAttribute("label"),
							dir:       columns[2].getAttribute("label"),
							user:      columns[3].getAttribute("label"),
							password:  columns[4].getAttribute("label")
			});
		}

		return JSON.stringify(servers);
	},

	/*
	 * Deletes the currently selected schedule
	 */
	deleteServer: function() {
		var ServersTree = document.getElementById("ServersTree");
		var index = ServersTree.currentIndex;

		if(index != -1) {
			var ServersList = document.getElementById("ServersList");
			var toRemove = ServersList.childNodes.item(index);
			ServersList.removeChild(toRemove);
		}
	},

	/*
	 * Moves the selected item up/down one place
	 */
	move: function(dir) {
		var ServersTree = document.getElementById("ServersTree");
		var index = ServersTree.currentIndex;

	  if(index != -1) {
		var ServersList = document.getElementById("ServersList");
		if(dir == "up" && index > 0) {
			var nextIndex = index - 1;
			var top = ServersList.childNodes[nextIndex];
			var bottom = ServersList.childNodes[index];
		} else if(dir == "down" && index < ServersList.childNodes.length - 1) {
			var nextIndex = index + 1;
			var top = ServersList.childNodes[index];
			var bottom = ServersList.childNodes[nextIndex];
		} else {
			return;
		}

		var oA = top.childNodes[0].childNodes[0].getAttribute("label");
		var oB = top.childNodes[0].childNodes[1].getAttribute("label");
		var oC = top.childNodes[0].childNodes[2].getAttribute("label");
		var oD = top.childNodes[0].childNodes[3].getAttribute("label");
		var oE = top.childNodes[0].childNodes[4].getAttribute("label");

		var iA = bottom.childNodes[0].childNodes[0].getAttribute("label");
		var iB = bottom.childNodes[0].childNodes[1].getAttribute("label");
		var iC = bottom.childNodes[0].childNodes[2].getAttribute("label");
		var iD = bottom.childNodes[0].childNodes[3].getAttribute("label");
		var iE = bottom.childNodes[0].childNodes[4].getAttribute("label");

		top.childNodes[0].childNodes[0].setAttribute("label", iA);
		top.childNodes[0].childNodes[1].setAttribute("label", iB);
		top.childNodes[0].childNodes[2].setAttribute("label", iC);
		top.childNodes[0].childNodes[3].setAttribute("label", iD);
		top.childNodes[0].childNodes[4].setAttribute("label", iE);

		bottom.childNodes[0].childNodes[0].setAttribute("label", oA);
		bottom.childNodes[0].childNodes[1].setAttribute("label", oB);
		bottom.childNodes[0].childNodes[2].setAttribute("label", oC);
		bottom.childNodes[0].childNodes[3].setAttribute("label", oD);
		bottom.childNodes[0].childNodes[4].setAttribute("label", oE);

		ServersTree.currentIndex = nextIndex;
		ServersTree.focus();
	  }
	}
}
