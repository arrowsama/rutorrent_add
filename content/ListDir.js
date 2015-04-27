Components.utils.import("resource://rtadd/common.jsm");

XULRuTorrentAddon.ListDir =
{
	initDirWindow: function()
	{
		if("arguments" in window && window.arguments.length > 0)
		{
			XULRuTorrentAddon.rtURL = window.arguments[0].rt_url;

			var dirTextBox = document.getElementById('dir');
			dirTextBox.value = window.arguments[0].dir;

			dirTextBox.onchange=function(event) {
				XULRuTorrentAddon.DirBrowser.showDirectory(document.getElementById('dir').value);
			}

			dirTextBox.onkeydown=function(event) {
				if(event.keyCode==event.DOM_VK_ENTER || event.keyCode==event.DOM_VK_RETURN)
				{
					XULRuTorrentAddon.DirBrowser.showDirectory(document.getElementById('dir').value);
					return false;
				}
			}

			XULRuTorrentAddon.DirBrowser.showDirectory(window.arguments[0].dir);
			XULRuTorrentAddon.DirBrowser.setDirNavigationType();

			document.documentElement.getButton("accept").onclick = this.setDirectory;
		}
	},
	setDirectory: function()
	{
		window.arguments[0].dir=document.getElementById('dir').value;
		window.arguments[0].out=true;
	}
}
