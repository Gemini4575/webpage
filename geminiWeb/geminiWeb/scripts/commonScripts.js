	/* events */
const apiKey = 'AIzaSyAdJloQFAe5v7hbXDEksP-yQgRC2vb5uco';
const spreadsheetId = '1kiE7-MPhtu3zZuEsYsSeZurAsVj4KGVi7YucBUtrwBc';
const sheetName = 'Sheet1';

fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}?key=${apiKey}`)
	.then(response => response.json())
	.then(data => showData(data.values, teamName))
	.catch(error => console.error('Error:', error));

function showData(theData, currentTeam) {
	var futureList = [];
	var tmpDate = new Date();
	var currentDate = new Date(tmpDate.getFullYear(), tmpDate.getMonth(), tmpDate.getDate()).getTime();

	const allTeams = 'all';
	for (var ii = 0; ii < theData.length; ii++) {
			// if we don't have a good date skip the row
		if (theData[ii].length < 3 || theData[ii][1].length !== 10) {continue;}
		var eMonth = theData[ii][1].split('/')[0] - 1,
			eDay = theData[ii][1].split('/')[1],
			eYear = theData[ii][1].split('/')[2];
		var eDate = new Date(eYear, eMonth, eDay).getTime();
		var eTeam = theData[ii][0];
				// localCompare will do case insensitive compare
		if ((currentTeam.localeCompare(eTeam, undefined, { sensitivity: 'accent' }) == 0 || allTeams.localeCompare(eTeam, undefined, { sensitivity: 'accent' }) == 0)
				&& (eDate >= currentDate)) {
			futureList.push(theData[ii]);
		}
	}
	futureList.sort(function(xIn, yIn) {
			var x = new Date(xIn[1]).getTime();
			var y = new Date(yIn[1]).getTime();
			if (x < y) {
				return -1;
			}
			if (x > y) {
				return 1;
			}
			return 0;
		});

	if (futureList.length == 0) {
		$("#events").hide();
	}
	for (var ii = 0; ii < Math.min(3, futureList.length); ii++) {
		var eDate = futureList[ii][1],
			eDescription = futureList[ii][2],
			eDetails = (futureList[ii].length > 3 ? futureList[ii][3] : "");
		var $newdiv1 = $( "<div id='event" + ii + "' title='" + eDetails + "'>" + eDate + "&nbsp;&nbsp;&nbsp;" + eDescription + "</div>" );
		$("#events").append($newdiv1);
	}
}
	/* end events */

	/* for sponsor slideshow */
$(document).ready(function() {
	$('#sponsors').load('sponsors.html', function() {
		// Set Basic variables
		var slides = $('.sponsor');
		var slideIndex = 0;
		// Show the first slide
		$(slides[slideIndex]).show();

		// Set interval to change slides
		setInterval(function() {
			// Hide the current slide
			$(slides[slideIndex]).fadeOut();

			// Increment index or reset to 0
			slideIndex = (slideIndex + 1) % slides.length;
			// Show the next slide
			$(slides[slideIndex]).fadeIn();
		}, 2000); 
	});
});

