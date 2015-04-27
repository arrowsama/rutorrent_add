Components.utils.import("resource://rtadd/common.jsm");
Components.utils.import("resource://rtadd/JSON.jsm");

XULRuTorrentAddon.DirBrowser =
{
	setDirNavigationType: function()
	{
		var dirlist = document.getElementById('dir_list');
		if(XULRuTorrentAddon.settings.rtDblClickNav)
		{
			dirlist.ondblclick=function(event){XULRuTorrentAddon.DirBrowser.selectDirectory(event.target);}
			dirlist.onselect=function(event){ document.getElementById('dir').value = XULRuTorrentAddon.DirBrowser.getDirectoryFromListElement(event.target.value);}
		}
		else
		{
			dirlist.onclick=function(event){XULRuTorrentAddon.DirBrowser.selectDirectory(event.target);}
		}

		dirlist.onkeydown=function(event){
			if(event.keyCode==event.DOM_VK_ENTER || event.keyCode==event.DOM_VK_RETURN)
			{
				XULRuTorrentAddon.DirBrowser.selectDirectory(event.target); return false;
			}
		}
	},

	clearDirectoryLines: function()
	{
		var dirlist = document.getElementById( "dir_list" );

		var count = dirlist.itemCount;
		while (dirlist.itemCount)
			dirlist.removeItemAt(0);
	},

	showDirectory: function(directory)
	{
		var dirBrowser = XULRuTorrentAddon.DirBrowser;

		dirBrowser.dirHttpRequest = new XMLHttpRequest();

		if (XULRuTorrentAddon.settings.rtJSONForDir)
		{
			dirBrowser.rtDirUrl = XULRuTorrentAddon.rtURL+"/plugins/_getdir/info.php?mode=dirlist;&basedir="+encodeURIComponent(directory);
		}
		else
			dirBrowser.rtDirUrl = XULRuTorrentAddon.rtURL+"/plugins/_getdir/getdirs.php?dir="+encodeURIComponent(directory);



		dirBrowser.dirHttpRequest.open('POST', dirBrowser.rtDirUrl, true);
		dirBrowser.dirHttpRequest.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
		dirBrowser.dirHttpRequest.onreadystatechange = dirBrowser.processDirectoryData;

		document.getElementById("imagebox").hidden = false;

		dirBrowser.clearDirectoryLines();

		dirBrowser.dirHttpRequest.send(null);

		return true;
	},

	processDirectoryData: function()
	{

		if(XULRuTorrentAddon.DirBrowser.dirHttpRequest.readyState == 4)
		{
			// for "OK" state
			var dirBrowser = XULRuTorrentAddon.DirBrowser;
			if (dirBrowser.dirHttpRequest.status == 200) {

				var http_request = dirBrowser.dirHttpRequest;
				var dirlist = document.getElementById( "dir_list" );
				// processing answer

				if (XULRuTorrentAddon.settings.rtJSONForDir)
				{
					try
					{
						var dirsAnswer = XULRuTorrentAddon.JSON.parse(http_request.responseText);

						document.getElementById('dir').value = dirsAnswer.basedir;

						for (var i=0, dlen = dirsAnswer.dirlist.length; i < dlen; i++)
						{
							if (dirsAnswer.dirlist[i]!='.')
							{
								var el = dirlist.appendItem(dirsAnswer.dirlist[i],  dirsAnswer.basedir+dirsAnswer.dirlist[i]);
								el.allowevents = true;
							}
						}
					} catch (e)
					{
						return;
					}
				}
				else
				{
					var re = /(code='.*?').*?(>&nbsp;&nbsp;)(.*?)(?=<\/td>)/gi;
					var res
					while ( (res = re.exec(http_request.responseText)) != null)
					{
						if (res[3]!=".")
						{
							var el = dirlist.appendItem(res[3], decodeURIComponent(res[1]));
							el.allowevents = true;
						}
						else
						{
							document.getElementById('dir').value = dirBrowser.getDirectoryFromListElement(decodeURIComponent(res[1]));
						}
					}
				}
			}
			else
			{
				dirBrowser.alertUser("rtadd.ErrorWhenGettingData","\n" +
				dirBrowser.rtDirUrl+"\n" +
					http_request.statusText);
			}

			document.getElementById("imagebox").hidden = true;
		}
	},

	getDirectoryFromListElement: function(code)
	{
		var path = "";
		path = code;
		var begin = path.indexOf('\'');
		if (begin>=0)
		{
			var end = path.indexOf('\'', begin+1);
			if (end>=0)
				path = path.substring(begin+1, end);
		}
		return path;
	},

	selectDirectory: function(el)
	{
		var dir = document.getElementById('dir');
		dir.value = this.getDirectoryFromListElement(el.value);
		this.showDirectory(dir.value);
	}
};
