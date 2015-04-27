Components.utils.import("resource://rtadd/common.jsm");
Components.utils.import("resource://rtadd/JSON.jsm");

if ("undefined" == typeof(XULRuTorrentAddonChrome)) {
	var XULRuTorrentAddonChrome = {};
};

XULRuTorrentAddonChrome.BrowserOverlay = {

	init : function(aEvent)
	{
		XULRuTorrentAddon.loadSettings();

		this.consoleService = Cc["@mozilla.org/consoleservice;1"].getService(Ci.nsIConsoleService);

		var menu = document.getElementById("contentAreaContextMenu");

		if (menu) {
			menu.addEventListener("popupshowing", this.onContextMenuShowing, false);
		}

		// DEfine the pref observer.
		XULRuTorrentAddonChrome.PrefObserver =
		{
			register: function()
			{
				var prefService = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefService);
				this._branch = prefService.getBranch("extensions.rtadd.");
				this._branch.QueryInterface(Ci.nsIPrefBranch2);
				this._branch.addObserver("", this, false);

				this.setIconState();
				this.changeProfileType();
				this.initFastSettings();
			},

			unregister: function()
			{
				if(!this._branch) return;
				this._branch.removeObserver("", this);
			},

			observe: function(aSubject, aTopic, aData)
			{
				if(aTopic != "nsPref:changed") return;

				XULRuTorrentAddon.loadSettings();

				switch (aData) {
					case "rt_show_icon":
						this.setIconState();
					case "rt_multi_profile":
						this.changeProfileType();
					case "rt_servers":
						this.changeProfileType();
					case "rt_open_webiu":
						this.initFastSettings();
					case "rt_show_dir_list":
						this.initFastSettings();
					break;
				}
			},

			initFastSettings: function()
			{
				let prefservice = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefService);
				let prefs = prefservice.getBranch("");

				let miwebui   = window.document.getElementById("rt_sb_open_webiu");
				miwebui.setAttribute("checked", String(prefs.getBoolPref("extensions.rtadd.rt_open_webiu")));

				let mishowdir = window.document.getElementById("rt_sb_show_dir_list");
				mishowdir.setAttribute("checked", String(prefs.getBoolPref("extensions.rtadd.rt_show_dir_list")));
			},

			setIconState: function()
			{
				let prefservice = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefService);
				let prefs = prefservice.getBranch("");

				let showIcon = prefs.getBoolPref("extensions.rtadd.rt_show_icon");

				let tfIcon = window.document.getElementById("rtaddstatus-icon");

				if(showIcon == true)
				{
					tfIcon.setAttribute("collapsed", "false");
				}
				else
				{
					tfIcon.setAttribute("collapsed", "true");
				}
			},

			changeProfileType: function()
			{
				let prefservice = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefService);
				let prefs = prefservice.getBranch("");
				let multiProfile = prefs.getBoolPref("extensions.rtadd.rt_multi_profile");

				let statusIcon = window.document.getElementById("rtaddstatus-icon");

				if(multiProfile == false)
				{
					statusIcon.onclick = function(evnt) { if(evnt.button==0) XULRuTorrentAddonChrome.BrowserOverlay.openRuTorrentPage(XULRuTorrentAddon.settings.rtUrl, XULRuTorrentAddon.settings.rtUser,  XULRuTorrentAddon.settings.rtPass); };
					statusIcon.removeAttribute("popup");
				}
				else
				{
					statusIcon.onclick = null;

					let rt_servers = decodeURIComponent(escape(prefs.getCharPref("extensions.rtadd.rt_servers")));

					if(rt_servers=='')
						return;

					if(rt_servers.indexOf('.ITEM.')>=0)
					{
						let newServersSettings = XULRuTorrentAddon.convertSettingsString(rt_servers);

						let prefs = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefService).getBranch("");

						prefs.setCharPref("extensions.rtadd.rt_servers", unescape(encodeURIComponent(newServersSettings)));
						return;
					}

					let statusIcon_popup = window.document.getElementById("rtaddstatus_popup");
					while (statusIcon_popup.firstChild)
					{
						statusIcon_popup.removeChild(statusIcon_popup.firstChild);
					}

					let parentMenuItem = window.document.getElementById("add_to_rtorrent_multi");
					while (parentMenuItem.firstChild)
					{
						parentMenuItem.removeChild(parentMenuItem.firstChild);
					}

					let servers = JSON.parse(rt_servers);

					for (let i=0, slen = servers.length; i < slen; i++)
					{
						const XUL_NS = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";

						let mio = window.document.createElementNS(XUL_NS, "menuitem");
						mio.setAttribute("label", servers[i].name);
						mio.rt_url=servers[i].url;
						mio.rt_user=servers[i].user;
						mio.rt_pass=servers[i].password;
						mio.setAttribute("oncommand", "XULRuTorrentAddonChrome.BrowserOverlay.openRuTorrentPage(event.target.rt_url, event.target.rt_user, event.target.rt_pass);");
						statusIcon_popup.appendChild(mio);

						let mia = window.document.createElementNS(XUL_NS, "menuitem");
						mia.setAttribute("label", servers[i].name);
						mia.rt_url=servers[i].url;
						mia.rt_dir=servers[i].dir;
						mia.rt_user=servers[i].user;
						mia.rt_pass=servers[i].password;

						mia.setAttribute("oncommand", "XULRuTorrentAddonChrome.BrowserOverlay.addTorrentDialog(event.target.label, gContextMenu.getLinkURL() ,event.target.rt_url, event.target.rt_dir, event.target.rt_user, event.target.rt_pass);");
						parentMenuItem.appendChild(mia);
					}

					statusIcon.setAttribute("popup", "rtaddstatus_popup");
				}
			}
		}

		XULRuTorrentAddonChrome.PrefObserver.register();
	},

	// Called when the right click context menu is created
	onContextMenuShowing: function (aEvent)
	{
		if (gContextMenu)
		{
			let menuitema = document.getElementById("add_to_rtorrent");
			let menuitemb = document.getElementById("add_to_rtorrent_multi_menu");
			let sepitem = document.getElementById("rtaddsep");

			if (menuitema && sepitem)
			{
				// If the menu isn't a link menu diSable the item
				if (XULRuTorrentAddon.settings.rtMultiProfile==false)
				{
					menuitema.hidden = (!gContextMenu.onLink);
					menuitemb.hidden = true;
				}
				else
				{
					menuitema.hidden = true;
					menuitemb.hidden = (!gContextMenu.onLink);
				}
			}
		}
	},

	setFastPref: function(param, value)
	{
		let prefservice = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefService);
		let prefs = prefservice.getBranch("");

		prefs.setBoolPref(param, Boolean(value));
	},

	openRuTorrentPage: function(RTMainUrl, rtUser, rtPasswd)
	{
		let index = 0;

		let rtUrl=XULRuTorrentAddon.getBaseServerUrl(RTMainUrl);

		if (rtUser!=null && rtUser!="")
		{
			XULRuTorrentAddonChrome.AuthObserver.register(RTMainUrl, rtUser, rtPasswd);
		}

		let wm = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator);
		let recentWindow = wm.getMostRecentWindow("navigator:browser");

		recentWindow.delayedOpenTab();

		let lastBrowserNum = gBrowser.browsers.length-1;

		gBrowser.browsers[lastBrowserNum].loadURI(RTMainUrl);

		return(lastBrowserNum);
	},

	addTorrentDialog: function(Name, TorrentUrl, MainUrl, DefaultDir, User, Password)
	{
		let addTorrentDialogParams;
		if (User!=null && User!="")
		{
			XULRuTorrentAddonChrome.AuthObserver.register(MainUrl, User, Password);
			addTorrentDialogParams = {inn:{rt_name:Name, rt_url:MainUrl, rt_dir:DefaultDir, torrentURL:TorrentUrl, rtAuthObserver:XULRuTorrentAddonChrome.AuthObserver}, out:null};
		}
		else
		{
			addTorrentDialogParams = {inn:{rt_name:Name, rt_url:MainUrl, rt_dir:DefaultDir, torrentURL:TorrentUrl}, out:null};
		}

		if(XULRuTorrentAddon.settings.rtOpenWebUI)
			this.openRuTorrentPage(MainUrl);

		window.openDialog("chrome://rtadd/content/AddTorrent.xul", null, "chrome, dialog, modal, resizable, centerscreen=yes", addTorrentDialogParams);
	}

};

XULRuTorrentAddonChrome.AuthObserver =
{
	registered:false,
	rt_uri:null, rt_user:null, rt_pass:null,
	observe: function (subject, topic, data)
	{
		if (topic=='http-on-examine-response')
		{
			let httpChannel = subject.QueryInterface(Ci.nsIHttpChannel);

			if(subject.URI.prePath==this.rt_uri.prePath && subject.URI.path.indexOf(this.rt_uri.path)>=0)
			{
				if(httpChannel.responseStatus == 401)
				{
					let challenges = httpChannel.getResponseHeader("WWW-Authenticate").split("\n");

					let challenge = challenges[0];
					let authType = (challenge.split(/\s/))[0].toLowerCase();

					let realm = '';
					let bpos = challenge.indexOf('realm="');
					if (bpos>=0) {realm = (challenge.substring(bpos+7, challenge.indexOf('"', bpos+7)));}

					switch (authType)
					{
						case "basic":
							this.SetAuthentificationData('Basic', realm);
							break;
						case "digest":
							this.SetAuthentificationData('Digest', realm);
							break;
					}
					this.unregister();
				}
			}
		}
	},

	register: function(rt_url, rt_user, rt_pass)
	{
		this.rt_uri = Cc["@mozilla.org/network/standard-url;1"].createInstance(Ci.nsIURI)
		this.rt_uri.spec = XULRuTorrentAddon.getBaseServerUrl(rt_url);
		this.rt_user = rt_user;
		this.rt_pass = rt_pass;
		this.consoleService = Cc["@mozilla.org/consoleservice;1"].getService(Ci.nsIConsoleService);

		let authentication = Cc["@mozilla.org/network/http-auth-manager;1"].getService(Ci.nsIHttpAuthManager);
		authentication.clearAll();

		if (!this.registered)
		{
			this.consoleService.logStringMessage("rtAuthObserver registered");
			let observerService = Cc["@mozilla.org/observer-service;1"].getService(Ci.nsIObserverService);
			observerService.addObserver(this, "http-on-examine-response", false);
			this.registered=true;
		}
	},

	unregister: function()
	{
		if (this.registered)
		{
			try
			{
				this.consoleService.logStringMessage("rtAuthObserver unregistered");
				let observerService = Cc["@mozilla.org/observer-service;1"].getService(Ci.nsIObserverService);
				observerService.removeObserver(this, "http-on-examine-response");
			} catch (e) {}
			this.registered=false;
		}
	},

	SetAuthentificationData: function(authtype, realm)
	{
		this.consoleService.logStringMessage("rtServer authentication: realm="+realm+", user="+this.rt_user+', url: '+this.rt_uri.spec);

		let authentication = Cc["@mozilla.org/network/http-auth-manager;1"].getService(Ci.nsIHttpAuthManager);

		let url_port = this.rt_uri.port;

		if(url_port == -1) {
			if(this.rt_uri.scheme == 'http') {
				url_port = 80;
			}
			else if(this.rt_uri.scheme == 'https')
			{
				url_port = 443;
			}
		}

		authentication.setAuthIdentity(this.rt_uri.scheme, this.rt_uri.host, url_port, authtype, realm, this.rt_uri.path, '', this.rt_user, this.rt_pass);
	}
};

window.addEventListener("load", function() { XULRuTorrentAddonChrome.BrowserOverlay.init(); }, false);
