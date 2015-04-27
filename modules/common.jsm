var EXPORTED_SYMBOLS = [ "XULRuTorrentAddon" ];

Components.utils.import("resource://rtadd/JSON.jsm");

const Cc = Components.classes;
const Ci = Components.interfaces;

/**
 * XULRuTorrentAddon namespace.
 */
if ("undefined" == typeof(XULRuTorrentAddon)) {

	var XULRuTorrentAddon = {

		/**
			* Initializes this object.
		*/
		init : function() {
			this.obsService = Cc["@mozilla.org/observer-service;1"].getService(Ci.nsIObserverService);
		},

		get settings() {
			return this._settings;
		},

		loadSettings: function() {
			let rt_prefservice = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefService);
			let rt_prefs = rt_prefservice.getBranch("");

			this._settings = {};

			try
			{
				this._settings.rtUrl			= decodeURIComponent(escape(rt_prefs.getCharPref("extensions.rtadd.rt_url")));
				this._settings.rtUser			= decodeURIComponent(escape(rt_prefs.getCharPref("extensions.rtadd.rt_user")));
				this._settings.rtPass			= decodeURIComponent(escape(rt_prefs.getCharPref("extensions.rtadd.rt_passwd")));
				this._settings.rtShowDirList	= rt_prefs.getBoolPref("extensions.rtadd.rt_show_dir_list");
				this._settings.rtMultiProfile	= rt_prefs.getBoolPref("extensions.rtadd.rt_multi_profile");
				this._settings.rtOpenWebUI		= rt_prefs.getBoolPref("extensions.rtadd.rt_open_webiu");
				this._settings.rtDblClickNav	= rt_prefs.getBoolPref("extensions.rtadd.rt_dblclick_navigation");
				this._settings.rtJSONForDir		= rt_prefs.getBoolPref("extensions.rtadd.rt_json_for_dir");

				this._settings.rtDir			= decodeURIComponent(escape(rt_prefs.getCharPref("extensions.rtadd.rt_dir")));

				this._settings.rtMainUrl		= this.getBaseServerUrl(this._settings.rtUrl);
			}
			catch(err)
			{
				let stringsBundle = document.getElementById("string-bundle");
				alert(stringsBundle.getString("rtadd.SetDefaultDownloadDirectory"));
			}
		},

		getBaseServerUrl: function(url)
		{
			let re = /(\/[^/]*\.(htm$|html$|php$))/i;
			return url.replace(re, "/");
		},

		convertSettingsString: function(rt_servers) {
			var servers = [];

			var serversSplit = rt_servers.split(".NEXT.");

			for (var i=0; i < serversSplit.length; i++){
				var pieces = serversSplit[i].split(".ITEM.");
				if (pieces.length>3)
					 servers.push({ name:pieces[0], url:pieces[1], dir:pieces[2], user: pieces[3], password: pieces[4]});
				else
					 servers.push({ name:pieces[0], url:pieces[1], dir:pieces[2], user: '', password: ''});
			}

			return JSON.stringify(servers);
		}
	};

	/**
	 * Constructor.
	 */
	(function() {
		this.init();
	}).apply(XULRuTorrentAddon);
};
