Components.utils.import("resource://rtadd/common.jsm");

XULRuTorrentAddon.AddingTorrentDialog =
{
	timer: false,

	initAddWindow: function()
	{
		XULRuTorrentAddon.rtURL = XULRuTorrentAddon.getBaseServerUrl(window.arguments[0].inn.rt_url);

		if ("undefined" != typeof(window.arguments[0].inn.rtAuthObserver))
		{
			window.onunload = function(event) {window.arguments[0].inn.rtAuthObserver.unregister();};
		}

		var serverLabel = document.getElementById("server_name");

		if (XULRuTorrentAddon.settings.rtMultiProfile)
		{
			var stringsBundle = document.getElementById("string-bundle");
			serverLabel.value=stringsBundle.getString("rtadd.server")+" "+window.arguments[0].inn.rt_name+"("+XULRuTorrentAddon.rtURL+")";
		}
		else
		{
			serverLabel.hidden = true;
		}

		this.clearWaitState();

		var dirTextBox = document.getElementById('dir');
		dirTextBox.value = window.arguments[0].inn.rt_dir;

		if (XULRuTorrentAddon.settings.rtShowDirList)
		{
			document.getElementById("dir_button").hidden = true;
			XULRuTorrentAddon.DirBrowser.showDirectory(dirTextBox.value);
			dirTextBox.onchange= function (event){
				XULRuTorrentAddon.DirBrowser.showDirectory(event.target.value);
			};
			dirTextBox.onkeydown=function (event) {
				if(event.keyCode==event.DOM_VK_ENTER || event.keyCode==event.DOM_VK_RETURN)
				{
					XULRuTorrentAddon.DirBrowser.showDirectory(event.target.value);
					return false;
				};
				return true;
			}
			XULRuTorrentAddon.DirBrowser.setDirNavigationType();
		}
		else
		{
			document.getElementById("dir_button").onclick = this.showDirectoryDialogWindow;
			document.getElementById("dir_stack").hidden = true;
		}

		document.getElementById("turl").value = window.arguments[0].inn.torrentURL;
		document.documentElement.getButton("accept").onclick = XULRuTorrentAddon.AddingTorrentDialog.addTorrent;
	},

	showDirectoryDialogWindow: function(event)
	{
		var dirTextBox = document.getElementById('dir');
		var params = {dir:dirTextBox.value, rt_url:XULRuTorrentAddon.rtURL, out:null};

		window.openDialog("chrome://rtadd/content/ListDir.xul", null, "chrome, dialog, modal, resizable, centerscreen=yes", params);

		if (params.out)
			dirTextBox.value = params.dir;
	},

	setWaitMessage: function(messagetype)
	{
		var stringsBundle = document.getElementById("string-bundle");

		document.getElementById("dirbox").hidden = true;
		document.getElementById("waitbox").hidden = false;
		document.getElementById("waitmessage").value=stringsBundle.getString(messagetype);
	},

	clearWaitState: function()
	{
		document.getElementById("dirbox").hidden = false;
		document.getElementById("waitbox").hidden = true;
	},

	alertUser: function(messagetype, addtext)
	{
		var stringsBundle = document.getElementById("string-bundle");
		var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"].getService(Components.interfaces.nsIPromptService);

		prompts.alert(null, "ruTorrent add", stringsBundle.getString(messagetype)+addtext);
		this.clearWaitState();
	},

	addTorrent: function(event)
	{
		var timeout = 15000;

		document.documentElement.getButton("accept").disabled = true;
		var atd = XULRuTorrentAddon.AddingTorrentDialog;

		atd.torrentUrl = document.getElementById("turl").value;

		atd.toMessageType="rtadd.ErrorWhenGettingTorrentFromServer";

		atd.addHttpRequest = new XMLHttpRequest();
		atd.addHttpRequest.open('GET', atd.torrentUrl, true);
		atd.addHttpRequest.overrideMimeType('text/plain; charset=x-user-defined');

		atd.addHttpRequest.onreadystatechange = atd.onGetTorrent;

		var event = {
			notify: function(timer)
				{
						atd.addHttpRequest.abort();
						atd.alertUser(atd.toMessageType,"\n" +atd.torrentUrl+"\n" +"Timeout was reached");
						document.documentElement.getButton("accept").disabled = false;
				}
		}

		atd.timer = Components.classes["@mozilla.org/timer;1"].createInstance(Components.interfaces.nsITimer);
		atd.timer.initWithCallback(event, timeout, Components.interfaces.nsITimer.TYPE_ONE_SHOT);

		atd.addHttpRequest.send(null);
		atd.setWaitMessage("rtadd.GettingTorrentFromServer");

		return false;
	},

	onGetTorrent: function()
	{
		if(XULRuTorrentAddon.AddingTorrentDialog.addHttpRequest.readyState == 4)
		{
			var atd = XULRuTorrentAddon.AddingTorrentDialog;
			if (atd.addHttpRequest.status == 200)
			{
				var torrent = atd.addHttpRequest.responseText;

				var contenttype = atd.addHttpRequest.getResponseHeader("Content-Type");
				var filename="";

				if (contenttype!="")
				{
					var re = /(name=)(".*?")/gi;
					var names;
					if ((names = re.exec(contenttype)) != null)
					{
						filename = names[2];
					}
				}
				if (filename=="")
					filename = "\"tmp.torrent\"";

				atd.addTorrentUrl = XULRuTorrentAddon.rtURL+"/php/addtorrent.php?";

				if (document.getElementById('not_add_path').checked)
					atd.addTorrentUrl = atd.addTorrentUrl + '&not_add_path=1';
				if (document.getElementById('torrents_start_stopped').checked)
					atd.addTorrentUrl = atd.addTorrentUrl + '&torrents_start_stopped=1';
				if (document.getElementById('fast_resume').checked)
					atd.addTorrentUrl = atd.addTorrentUrl + '&fast_resume=1';
				if (document.getElementById('tadd_label').value.length>0)
					atd.addTorrentUrl = atd.addTorrentUrl + '&label='+encodeURIComponent(document.getElementById('tadd_label').value);

				var boundaryString  = "---------------------------";
					boundaryString += Math.floor(Math.random()*32768);
					boundaryString += Math.floor(Math.random()*32768);
					boundaryString += Math.floor(Math.random()*32768);
					boundaryString += Math.floor(Math.random()*32768);

				var boundary = "--"+boundaryString;

				var stringStream = Components.classes["@mozilla.org/io/string-input-stream;1"].createInstance(Components.interfaces.nsIStringInputStream);
				var postContent = "\r\n"+boundary+"\r\n"+
									"Content-Disposition: form-data; name=\"dir_edit\"\r\n"+
									"\r\n"+
									document.getElementById('dir').value+"\r\n"+
									boundary+"\r\n"+
									"Content-Disposition: form-data; name=\"label\"\r\n"+
									"\r\n"+
									document.getElementById('tadd_label').value+"\r\n"+
									boundary+"\r\n"+
									"Content-Disposition: form-data; name=\"torrent_file\"; filename="+filename+"\r\n"+
									"Content-Type: application/x-bittorrent\r\n"+
									"\r\n"+
									torrent+"\r\n"+
									boundary+"\r\n";

				stringStream.setData(postContent, postContent.length);

				atd.addHttpRequest = new XMLHttpRequest();

				atd.addHttpRequest.open('POST', atd.addTorrentUrl, true);

				atd.addHttpRequest.setRequestHeader("Content-Type", "multipart/form-data; boundary=" + boundaryString);

				atd.addHttpRequest.onreadystatechange = atd.onTorrentSent;

				atd.toMessageType = "rtadd.ErrorWhileSendingTorrent";
				atd.addHttpRequest.send(stringStream);
				atd.setWaitMessage("rtadd.SendingTorrentToRuTorrent");
			}
			else
			{
				atd.alertUser("rtadd.ErrorWhenGettingTorrentFromServer","\n" + atd.torrentUrl+"\n" + atd.addHttpRequest.statusText);
				document.documentElement.getButton("accept").disabled = false;
			}
		}
	},

	onTorrentSent: function()
	{
		if(XULRuTorrentAddon.AddingTorrentDialog.addHttpRequest.readyState == 4 && XULRuTorrentAddon.AddingTorrentDialog.addHttpRequest.status!=0)
		{
			var atd = XULRuTorrentAddon.AddingTorrentDialog;
			atd.timer.cancel();
			if (atd.addHttpRequest.status == 200)
			{
				var response = null;
				var re = /addTorrent(.*?)(?=\,)/gi;
				if ((response = re.exec(atd.addHttpRequest.responseText)) != null)
				{
					if (response[1]=="Success")
					{
						atd.alertUser("rtadd.TorrentSuccessfullyAdded","");
						window.close();
					}
					else
					{
						atd.alertUser("rtadd.ErrorWhileAddingTorrent", "");
					}
				}
				else
				{
					atd.alertUser("rtadd.ErrorWhileAddingTorrent","");
				}
			} else
			{
				atd.alertUser("rtadd.ErrorWhileSendingTorrent","\n" +
				atd.addTorrentUrl+"\n" +
				atd.addHttpRequest.statusText);
			}
			document.documentElement.getButton("accept").disabled = false;
		}
	}

};
