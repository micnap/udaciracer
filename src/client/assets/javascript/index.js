// PROVIDED CODE BELOW (LINES 1 - 80) DO NOT REMOVE

// The store will hold all information needed globally
var store = {
	track_id: undefined,
	player_id: undefined,
	race_id: undefined,
}

// We need our javascript to wait until the DOM is loaded
document.addEventListener("DOMContentLoaded", function() {
	onPageLoad()
	setupClickHandlers()
})

async function onPageLoad() {
	try {
		getTracks()
			.then(tracks => {
				const html = renderTrackCards(tracks)
				renderAt('#tracks', html)
			})

		getRacers()
			.then((racers) => {
				const html = renderRacerCars(racers)
				renderAt('#racers', html)
			})
	} catch(error) {
		console.log("Problem getting tracks and racers ::", error.message)
		console.error(error)
	}
}

function setupClickHandlers() {
	document.addEventListener('click', function(event) {

		const { target } = event;
		const parent = event.target.parentElement;

		// Race track form field
		if (parent.matches('.card.track')) {
			handleSelectTrack(parent)
		}

		// Podracer form field
		if (parent.matches('.card.podracer')) {
			handleSelectPodRacer(parent)
		}

		// Submit create race form
		if (target.matches('#submit-create-race')) {
			event.preventDefault()
	
			// start race
			handleCreateRace()
		}

		// Handle acceleration click
		if (target.matches('#gas-peddle')) {
			handleAccelerate()
		}

	}, false)
}

async function delay(ms) {
	try {
		return await new Promise(resolve => setTimeout(resolve, ms));
	} catch(error) {
		console.log("an error shouldn't be possible here")
		console.log(error)
	}
}
// ^ PROVIDED CODE ^ DO NOT REMOVE

// This async function controls the flow of the race, add the logic and error handling
async function handleCreateRace() {

	// TODO - Get player_id and track_id from the store
	const player_id = store.player_id
	const track_id = store.track_id

	if (player_id === undefined || track_id === undefined) {
		let messages = []
		if (player_id === undefined) {
			messages.push('racer')
		}
		if (track_id === undefined) {
			messages.push('track')
		}
		if (messages.length > 1) {
			alert('Choose a '+ messages[0] + ' and ' + messages[1])
		} else {
			alert('Choose a '+ messages[0])
		}
		return
	}
	
	// invoke the API call to create the race, then save the result
	const race = await createRace(player_id, track_id)
	console.log(race, 'race')

	// TODO - update the store with the race id
	store.race_id = race.ID - 1

	// render starting UI
	renderAt('#race', renderRaceStartView(race.Track, race.Cars))

	// The race has been created, now start the countdown
	// call the async function runCountdown
	await runCountdown()

	// call the async function startRace
	await startRace(store.race_id)

	// call the async function runRace
	await runRace(store.race_id)
}

function runRace(raceID) {

	return new Promise(resolve => {

		// use Javascript's built in setInterval method to get race info every 500ms
		const raceInterval = setInterval(() => {

			getRace(raceID).then(
				raceInfo => {
					if (raceInfo.status === "in-progress") {
						renderAt('#leaderBoard', raceProgress(raceInfo.positions))
					} else if (raceInfo.status === "finished") {
						clearInterval(raceInterval) // to stop the interval from repeating
						renderAt('#race', resultsView(raceInfo.positions)) // to render the results view
						resolve(raceInfo) // resolve the promise
					}
				}
			)
		}, 500, raceID)
	})
		.catch(err => console.log("Problem running race::", err))
}

async function runCountdown() {
	try {
		// wait for the DOM to load
		await delay(1000)
		let timer = 3
		return new Promise(resolve => {
			const countdown = setInterval(function() {
				document.getElementById('big-numbers').innerHTML = --timer
				if (timer === 0) {
					console.log("Timer at zero");
					clearInterval(countdown);
					resolve()
					return
				}
			}, 1000)
		})
	} catch(error) {
		console.log("Problem with countdown::", error);
	}
}

function handleSelectPodRacer(target) {

	console.log("selected a pod", target.id)

	// remove class selected from all racer options
	const selected = document.querySelector('#racers .selected')
	if (selected) {
		selected.classList.remove('selected')
	}

	// add class selected to current target
	target.classList.add('selected')

	// save the selected racer to the store
	store.player_id = target.id - 1
}

function handleSelectTrack(target) {
	console.log("selected a track", target.id)

	// remove class selected from all track options
	const selected = document.querySelector('#tracks .selected')
	if (selected) {
		selected.classList.remove('selected')
	}

	// add class selected to current target
	target.classList.add('selected')

	// save the selected track id to the store
	store.track_id = target.id - 1
	
}

async function handleAccelerate() {
	try {
		console.log("accelerate button clicked")
		await accelerate(store.race_id)
	} catch(error) {
		console.log("Problem with accelerate request::", error)
	}
}

// HTML VIEWS ------------------------------------------------
// Provided code - do not remove

function renderRacerCars(racers) {
	if (!racers.length) {
		return `
			<h4>Loading Racers...</4>
		`
	}

	const results = racers.map(renderRacerCard).join('')

	return `
		<ul id="racers">
			${results}
		</ul>
	`
}

function renderRacerCard(racer) {
	const { id, driver_name, top_speed, acceleration, handling } = racer

	return `
		<li class="card podracer" id="${id}">
			<h3>${driver_name}</h3>
			<p>Top speed: ${top_speed}</p>
			<p>Acceleration: ${acceleration}</p>
			<p>Handling: ${handling}</p>
		</li>
	`
}

function renderTrackCards(tracks) {
	if (!tracks.length) {
		return `
			<h4>Loading Tracks...</4>
		`
	}

	const results = tracks.map(renderTrackCard).join('')

	return `
		<ul id="tracks">
			${results}
		</ul>
	`
}

function renderTrackCard(track) {
	const { id, name } = track

	return `
		<li id="${id}" class="card track">
			<h3>${name}</h3>
		</li>
	`
}

function renderCountdown(count) {
	return `
		<h2>Race Starts In...</h2>
		<p id="big-numbers">${count}</p>
	`
}

function renderRaceStartView(track, racers) {
	return `
		<header>
			<h1>Race: ${track.name}</h1>
		</header>
		<main id="two-columns">
			<section id="leaderBoard">
				${renderCountdown(3)}
			</section>

			<section id="accelerate">
				<h2>Directions</h2>
				<p>Click the button as fast as you can to make your racer go faster!</p>
				<button id="gas-peddle">Click Me To Win!</button>
			</section>
		</main>
		<footer></footer>
	`
}

function resultsView(positions) {
	positions.sort((a, b) => (a.final_position > b.final_position) ? 1 : -1)

	return `
		<header>
			<h1>Race Results</h1>
		</header>
		<main>
			<section>
				${raceProgress(positions)}
				<a class="button" href="/race">Start a new race</a>
			</section>
		</main>
	`
}

function raceProgress(positions) {
	let userPlayer = positions.find(e => e.id === store.player_id)
	userPlayer.driver_name += " (you)"

	positions = positions.sort((a, b) => (a.segment > b.segment) ? -1 : 1)
	let count = 1

	const results = positions.map(p => {
		return `
			<tr>
				<td>
					<h3>${count++} - ${p.driver_name}</h3>
				</td>
			</tr>
		`
	})

	return `
		<main>
			<h3>Leaderboard</h3>
			<section id="leaderBoard">
				${results}
			</section>
		</main>
	`
}

function renderAt(element, html) {
	const node = document.querySelector(element)

	node.innerHTML = html
}

// ^ Provided code ^ do not remove


// API CALLS ------------------------------------------------

const SERVER = 'http://localhost:8000'

function defaultFetchOpts() {
	return {
		mode: 'cors',
		headers: {
			'Content-Type': 'application/json',
			'Access-Control-Allow-Origin' : SERVER,
		},
	}
}

// TODO - Make a fetch call (with error handling!) to each of the following API endpoints 

function getTracks() {

	return fetch(`${SERVER}/api/tracks`, {
		method: 'GET',
		...defaultFetchOpts(),
		dataType: 'jsonp',
	})
		.then(res => res.json())
		.catch(err => console.log("Problem with getTracks request::", err))
}

function getRacers() {

	return fetch(`${SERVER}/api/cars`, {
		method: 'GET',
		...defaultFetchOpts(),
		dataType: 'jsonp',
	})
		.then(res => res.json())
		.catch(err => console.log("Problem with getRacers request::", err))
}

function createRace(player_id, track_id) {

	player_id = parseInt(player_id)
	track_id = parseInt(track_id)
	const body = { player_id, track_id }
	
	return fetch(`${SERVER}/api/races`, {
		method: 'POST',
		...defaultFetchOpts(),
		dataType: 'jsonp',
		body: JSON.stringify(body)
	})
	.then(res => res.json())
	.catch(err => console.log("Problem with createRace request::", err))
}

function getRace(id) {

	return fetch(`${SERVER}/api/races/${id}`, {
		method: 'GET',
		...defaultFetchOpts(),
		dataType: 'jsonp',
	})
	.then(res => res.json())
	.catch(err => console.log("Problem with getRace request::", err))

}

function startRace(id) {

	return fetch(`${SERVER}/api/races/${id}/start`, {
		method: 'POST',
		...defaultFetchOpts(),
	})
	.then(res => {
		console.log("Race started")
	})
	.catch(err => console.log("Problem with startRace request::", err))
}

function accelerate(id) {

	fetch(`${SERVER}/api/races/${id}/accelerate`, {
		method: 'POST',
		...defaultFetchOpts(),
	})
	.then(res => {
		console.log("Speed increased")
	})
	.catch(err => console.log("Problem with acceleration request::", err))
}
