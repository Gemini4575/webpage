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

	// Helper: stop a running rail loop
	function stopRailLoop(inner) {
		if (!inner) return;
		if (inner._rafId) cancelAnimationFrame(inner._rafId);
		if (inner._state) {
			inner._state.stopped = true;
			inner._state.paused = true;
			inner._state.offset = 0;
		}
		// disconnect resize observer if present
		if (inner._ro) { try { inner._ro.disconnect(); } catch (e) {} inner._ro = null; }
		// restore CSS animation behavior if any and clear transforms
		inner.style.animation = '';
		inner.style.transform = 'none';
		inner.style.willChange = '';
		// remove hover listeners if attached
		if (inner._mouseenter) { inner.removeEventListener('mouseenter', inner._mouseenter); inner._mouseenter = null; }
		if (inner._mouseleave) { inner.removeEventListener('mouseleave', inner._mouseleave); inner._mouseleave = null; }
	}

	// Helper: start a JS-driven continuous rail loop (seamless when content is duplicated)
	function startRailLoop(inner, single, speed, axis, direction) {
		// Stop existing loop and clear any CSS animation
		stopRailLoop(inner);
		inner._state = { offset: 0, paused: false, stopped: false, single: single };
		inner._speed = speed; // px/sec
			inner._direction = direction || -1; // -1 for left/up, +1 for right/down
			// ping-pong mode (back-and-forth) for horizontal bottom rails
			inner._state.pingpong = (axis === 'x' && !!inner.closest('.sponsor-rail-bottom'));
			// defensive styles
			inner.style.animation = 'none';
			inner.style.transition = 'none';
			inner.style.willChange = 'transform';
			inner.style.transform = 'translate3d(0, 0, 0)';

			let last = performance.now();
			let frameCount = 0;

			function step(now) {
				if (!inner._state || inner._state.stopped) return;
				if (!inner._state.paused) {
					const dt = (now - last) / 1000;
					last = now;
					// accumulate precisely
					let newOffset;
					if (inner._state.pingpong) {
						// ping-pong: reflect at bounds [0, single]
						newOffset = inner._state.offset + dt * inner._speed * inner._direction;
						// reflect overflow/underflow many times if dt is large
						while (newOffset > inner._state.single || newOffset < 0) {
							if (newOffset > inner._state.single) newOffset = inner._state.single - (newOffset - inner._state.single);
							if (newOffset < 0) newOffset = -newOffset;
							inner._direction = -inner._direction; // flip direction on each reflection
						}
					} else {
						// continuous wrap behavior
						newOffset = inner._state.offset + dt * inner._speed;
						// wrap while >= single (in case dt is large)
						if (newOffset >= inner._state.single) {
							newOffset = newOffset % inner._state.single;
							console.debug('[WRAP]', { offset: inner._state.offset, newOffset, single: inner._state.single, speed: inner._speed, direction: inner._direction, axis });
						}
					}
					// limit to reasonable precision to avoid floating point drift
					const rounded = Math.round(newOffset * 1000) / 1000;
					inner._state.offset = rounded;
					const val = inner._direction * inner._state.offset;
					if (axis === 'x') {
						inner.style.transform = `translate3d(${val}px, 0, 0)`;
					} else {
						inner.style.transform = `translate3d(0, ${val}px, 0)`;
					}
				}
				// hover pause
				inner._mouseenter = () => { if (inner._state) inner._state.paused = true; };
				inner._mouseleave = () => { if (inner._state) inner._state.paused = false; };
				inner.addEventListener('mouseenter', inner._mouseenter);
				inner.addEventListener('mouseleave', inner._mouseleave);
			}

			// Start the loop
			inner._rafId = requestAnimationFrame(step);

			// DO NOT recalculate single based on original—keep the measured cycle height steady
			if (typeof ResizeObserver !== 'undefined') {
				inner._ro = new ResizeObserver(() => {
					// only log resize, don't change single height (it was carefully measured to fill viewport + buffer)
					if (inner._debug) console.debug('[RESIZE]', { single: inner._state.single, scrollHeight: inner.scrollHeight });
				});
				inner._ro.observe(inner);
			}
	}

	// Sponsor rails: make them span full document height and compute smooth scroll
	function setupSponsorRails() {
		// Only animate side rails — ignore bottom/footer sponsor sections (static footer)
		const railInners = Array.from(document.querySelectorAll('.sponsor-rail .rail-inner'));
		// Stop any existing loops on these inners before re-initializing
		railInners.forEach(inner => stopRailLoop(inner));

		function preloadImagesFromHTML(html) {
			const div = document.createElement('div');
			div.innerHTML = html;
			const srcs = Array.from(div.querySelectorAll('img')).map(i => i.getAttribute('src'));
			const unique = Array.from(new Set(srcs));
			return Promise.all(unique.map(src => new Promise(res => {
				const img = new Image();
				img.onload = res; img.onerror = res; img.src = src;
			})));
		}

		// Prepare each inner: preload, duplicate, then measure
		railInners.forEach(inner => {
			inner.style.visibility = 'hidden';
			if (!inner.dataset.original) inner.dataset.original = inner.innerHTML;
			let original = inner.dataset.original;
			// allow enabling per-rail debug by adding data-debug="true" on the .rail-inner element
			inner._debug = inner.dataset && (inner.dataset.debug === '1' || inner.dataset.debug === 'true');
			// Robustly detect the minimal repeating unit (smallest k where sequence repeats)
			try {
				const tmp = document.createElement('div');
				tmp.innerHTML = original;
				const childs = Array.from(tmp.children).map(n => n.outerHTML);
				let baseHTML = original;
				if (childs.length > 1) {
					for (let k = 1; k <= Math.floor(childs.length / 2); k++) {
						if (childs.length % k !== 0) continue;
						let ok = true;
						for (let i = 0; i < childs.length; i++) {
							if (childs[i] !== childs[i % k]) { ok = false; break; }
						}
						if (ok) { baseHTML = childs.slice(0, k).join(''); break; }
					}
					if (baseHTML !== original) {
						original = baseHTML; // collapse to minimal repeating unit
						inner.dataset.original = original;
							if (inner._debug) console.debug('normalized original unit');
					}
				}
			} catch (e) { /* ignore */ }
			preloadImagesFromHTML(original).then(() => {
// Measure original content size offscreen (single copy)
			const measurer = document.createElement('div');
			measurer.style.position = 'absolute';
			measurer.style.left = '-99999px';
			measurer.style.top = '0px';
			measurer.style.visibility = 'hidden';
			measurer.innerHTML = original;
			document.body.appendChild(measurer);
			const isBottom = !!inner.closest('.sponsor-rail-bottom');
			let originalSize = isBottom ? measurer.scrollWidth : measurer.scrollHeight;
			document.body.removeChild(measurer);

			const rail = isBottom ? inner.closest('.sponsor-rail-bottom') : inner.closest('.sponsor-rail');
			const railVisibleHeight = isBottom ? (rail ? rail.clientWidth : window.innerWidth) : (rail ? rail.clientHeight : window.innerHeight);

					// For bottom rails: inject a heading if not present so it reads as a footer
					if (isBottom && rail && !rail.querySelector('.sponsor-thanks')) {
						const thanks = document.createElement('div');
						thanks.className = 'sponsor-thanks';
						thanks.innerHTML = '<div class="sponsor-thanks-inner"><strong>Thanks to our sponsors</strong></div>';
						rail.insertBefore(thanks, inner);
					}

				// Measure the single copy (height for vertical rails, width for bottom rail)
				const single = isBottom ? (inner.scrollWidth / 2) : (inner.scrollHeight / 2 || originalSize);
				inner.style.setProperty('--scroll-distance', single + 'px');
				const speed = 40; // px per second

				// Equalize paired item sizes to avoid seam gaps (width for bottom, height for sides)
				requestAnimationFrame(() => {
					const children = Array.from(inner.children);
					const half = Math.floor(children.length / 2);
					if (half >= 1) {
						for (let i = 0; i < half; i++) {
							const a = children[i];
							const b = children[i + half];
							if (!a || !b) continue;
							if (isBottom) {
								const wa = a.getBoundingClientRect().width;
								const wb = b.getBoundingClientRect().width;
								const w = Math.max(wa, wb);
								if (w > 0) { a.style.minWidth = w + 'px'; b.style.minWidth = w + 'px'; }
							} else {
								const ha = a.getBoundingClientRect().height;
								const hb = b.getBoundingClientRect().height;
								const h = Math.max(ha, hb);
								if (h > 0) { a.style.minHeight = h + 'px'; b.style.minHeight = h + 'px'; }
							}
						}
					}
					// Start the loop (axis-aware)
					if (isBottom) {
						startRailLoop(inner, single, speed, 'x', -1);
					} else {
						startRailLoop(inner, single, speed, 'y', inner.closest('.sponsor-rail').classList.contains('sponsor-rail-right') ? 1 : -1);
					}
					inner.style.visibility = 'visible';
				});
			});
		});

// Use wrapper + sticky approach to pin side rails until the page bottom without affecting layout
			function ensureWrappers() {
				// Cap wrapper height to viewport + small buffer (not full document height to avoid inflating page)
				const wrapperHeight = window.innerHeight + 200;
				const rails = Array.from(document.querySelectorAll('.sponsor-rail, .sponsor-rail-bottom'));
				rails.forEach(r => {
					// For bottom rails we do not want wrappers — they are fixed and span full width
					if (r.classList.contains('sponsor-rail-bottom')) {
						// If this rail is accidentally wrapped, unwrap it so it remains fixed at bottom
						const parent = r.parentElement;
						if (parent && parent.classList && parent.classList.contains('sponsor-wrapper')) {
							parent.parentNode.insertBefore(r, parent);
							parent.parentNode.removeChild(parent);
						}
						// ensure fixed positioning is applied (CSS handles this, but enforce just in case)
						r.style.position = 'fixed';
						r.style.left = r.style.left || '0';
						r.style.right = r.style.right || '0';
						r.style.bottom = r.style.bottom || '0';
						r.style.width = '100%';
						return;
					}

					// Side rails: ensure they are inside a sized wrapper so they behave like sticky elements
				let wrapper = r.parentElement;
				if (!wrapper || !wrapper.classList || !wrapper.classList.contains('sponsor-wrapper')) {
					wrapper = document.createElement('div');
					wrapper.className = 'sponsor-wrapper';
					wrapper.style.position = 'absolute';
					wrapper.style.top = '0';
					wrapper.style.width = r.offsetWidth + 'px';
					wrapper.style.height = wrapperHeight + 'px';
					wrapper.style.pointerEvents = 'none';
					// insert wrapper before rail and move rail inside
					r.parentNode.insertBefore(wrapper, r);
					wrapper.appendChild(r);
					// style the rail to be sticky inside the wrapper
					r.style.position = 'sticky';
					r.style.top = '18px';
					r.style.pointerEvents = 'auto';
					if (r.classList.contains('sponsor-rail-left')) {
						wrapper.style.left = '8px';
						wrapper.style.right = 'auto';
					} else {
						wrapper.style.right = '8px';
						wrapper.style.left = 'auto';
					}
				} else {
					// update existing wrapper size
					wrapper.style.height = wrapperHeight + 'px';
					wrapper.style.width = r.offsetWidth + 'px';
				}
			});
		}

		ensureWrappers();
			// Convert any legacy `.sponsor-rail-bottom` element into a static footer at the end of the document
			Array.from(document.querySelectorAll('.sponsor-rail-bottom')).forEach(r => {
				const footer = document.createElement('footer');
				footer.className = 'sponsor-footer';
				const thanks = document.createElement('div');
				thanks.className = 'sponsor-thanks-inner';
				thanks.innerHTML = '<strong>Thanks to our sponsors</strong>';
				const logos = document.createElement('div');
				logos.className = 'sponsor-logos';
				Array.from(r.querySelectorAll('img')).forEach(img => {
					const im = img.cloneNode(true);
					im.style.maxHeight = '';
					logos.appendChild(im);
				});
				footer.appendChild(thanks);
				footer.appendChild(logos);
				document.body.appendChild(footer);
				// remove legacy rail
				if (r.parentNode) r.parentNode.removeChild(r);
				});
				// No manual scroll handler required now
			}
	// Run initially and on resize/content change
	function refreshSponsorRails() {
		setupSponsorRails();
	}

	window.addEventListener('load', refreshSponsorRails);
	window.addEventListener('resize', refreshSponsorRails);

});

