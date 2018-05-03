/*
 * This file is provided for custom JavaScript logic that your HTML files might need.
 * GUI Composer includes this JavaScript file by default within HTML pages authored in GUI Composer.
 */
var splashScreenProgressBar = splashScreenProgressBar || {};
splashScreenProgressBar.starttm = Date.now();
splashScreenProgressBar.message = "Loading";
splashScreenProgressBar.percentage = 0;
splashScreenProgressBar.setProgress = function(percentage)
{
	splashScreenProgressBar.percentage = percentage;
	splashScreenProgressBar.updateUI();
}

splashScreenProgressBar.setMessage = function(message)
{
	splashScreenProgressBar.message = message;
	splashScreenProgressBar.updateUI();
}

splashScreenProgressBar.updateUI = function()
{
	var displayPercent = splashScreenProgressBar.percentage;
	var maximumPercent = Math.round((Date.now() - splashScreenProgressBar.starttm)/40);
	if (displayPercent > maximumPercent)
	{
		displayPercent = maximumPercent;
		setTimeout(splashScreenProgressBar.updateUI, 200); 
	}
	var text = splashScreenProgressBar.message + ' ... ' + displayPercent + '%';
	var widget = document.getElementById('splashScreenProgressBar');
	if (widget != null)
	{
		widget.innerHTML = text;
	}

	if (displayPercent >= 100)
	{
		setTimeout(function() 
		{
			var widget = document.getElementById('splashScreen');
			if (widget != null)
			{
				widget.style.opacity = 0;
				widget.style['z-index'] = -9999;
			}
		}, 200); 
	}
}

	
