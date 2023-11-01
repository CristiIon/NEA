// code
function makeBody(x, y, xVel, yVel, planetMass, planetRadius, planetName, planetColour){
	//creates an object with the specified attributes and returns it.
	//intended for adding planets onto the Objects array.
	const temp = {
		posX:x,
		posY:y,
		velocityX:xVel,
		velocityY:yVel,
		accelerationX:0,
		accelerationY:0,
		//acceleration only holds its value for one frame, as acceleration is instantaneous to 
		//1) show on the infoTab as part of that planet's stats
		//2) carry that value to velocityUpdate
		//on the next fram acceleration is reset as its new value is completly independent of its previous one
		mass:planetMass,
		radius:planetRadius,
		name:planetName,
		colour:planetColour
	};
	return temp;
}
function distanceCalc(x1, y1, x2, y2){
	let distance = ((x1-x2)**2)+((y1-y2)**2);
	//console.log("distance: " + distance);
	distance = Math.sqrt(distance);
	//console.log("sqrt distance: " + distance);
	return distance;
}
function vectorCalc(x1, y1, x2, y2){
	const vector = [];
	vector[0] = x2-x1;
	vector[1] = y2-y1;
	//returns a vector between two points
	return vector;
}
function gravPullForce(mass1, mass2, distance){
	const gravConstant = 6.6743e-11;
	
	let gravitationalPull = (mass1*mass2)/(distance*distance);
	//console.log("pre: " + gravitationalPull);
	gravitationalPull = gravitationalPull*gravConstant;
	//gravitational pull = gravitational constant * (mass1*mass2) / distance^2
	//console.log("post: " + gravitationalPull);
	return gravitationalPull;
}
function largestDistanceFromCenter(Objects){
	let largestDistance = 0;
	for (let i = 0 ; i < Objects.length; i++){
		if(Math.sqrt(Objects[i].posX * Objects[i].posX + Objects[i].posY * Objects[i].posY) + Objects[i].radius > largestDistance){
			largestDistance = Math.sqrt(Objects[i].posX * Objects[i].posX + Objects[i].posY * Objects[i].posY);
            largestDistance += Objects[i].radius;
		}
	}
	//check for the farther object from 0,0
	//used for setting up the view distanceScale which is 
	//the farthest distance at which an object will still be rendered, starting such that
	//all bodies will be in view
	return largestDistance;
}
function accelerationCalc(Objects){
	let distance;
	let gravPull;
	let unitVector = [];
	
	for(let i = 0; i < Objects.length; i++){
		Objects[i].accelerationX = 0;
		Objects[i].accelerationY = 0;
		//sets acceleration to 0 as this
	}
	
	for(let body1 = 0; body1 < Objects.length-1; body1++){
		for(let body2 = body1+1; body2 < Objects.length; body2++){
			distance = distanceCalc(Objects[body1].posX, Objects[body1].posY, Objects[body2].posX, Objects[body2].posY);
			// calculates distance between the two bodies
			
			unitVector = vectorCalc(Objects[body1].posX, Objects[body1].posY, Objects[body2].posX, Objects[body2].posY);
			// calculates the vector from the centre of the two bodies
			
			unitVector[0] = unitVector[0] / distance;
			unitVector[1] = unitVector[1] / distance;
			// divides the vector by the distance to get a unit vector
			// a unit vector has length of one, e.g.
			// [0, 1] a straight line up, [1, 0] a straight line to the right
			// [0.705, 0.705] aproximatly a straight line at 45 degrees to the right
			// this is usefull because if a force of 1 Newton acted at 45 degrees
			// you could break up the force as 0.705 Newtons UP and 0.705 Newtons right
			// which is what we do below
			
			gravPull = gravPullForce(Objects[body1].mass, Objects[body2].mass, distance);
			//calculates the force acting between the two bodies
			
			Objects[body1].accelerationX += (unitVector[0] * gravPull) / Objects[body1].mass;
			Objects[body2].accelerationX -= (unitVector[0] * gravPull) / Objects[body2].mass;
			// x axis of the unit vector * force (to get the force acting along the x axis)
			// force along x axis is then divided by mass to get acceleration
			// accelerations are all added together to, to get the resultant acceleration
			// e.g. if a planet was beeing accelerated to the left at 2 m/s (which we would store as -2)
			// and to the right to 3 m/s (stored as 3)
			// the resultant acceleration is 1 m/s to the right(stored as 1)
			// one uses += and the other -= because the two planets pull each other in opposite directions and
			// an acceleration being positive or negative only conveys whether it is accelerating left or right
			
			Objects[body1].accelerationY += (unitVector[1] * gravPull) / Objects[body1].mass;
			Objects[body2].accelerationY -= (unitVector[1] * gravPull) / Objects[body2].mass;
			//calculates the accelerations along the y axis
			
		}
	}
	//console.log(Objects[1]);
}
function velocityUpdate(Objects, timePerTick){
	for(let i = 0; i < Objects.length; i++){
		Objects[i].velocityX += Objects[i].accelerationX*timePerTick;
		Objects[i].velocityY += Objects[i].accelerationY*timePerTick;
		//updates the velocities based on accelerations and how much time is simulated per tickPosition
		//e.g. accelerating at 5m/s for 2 seconds updates velocity to 10 m/s
	}
}
function positionUpdate(Objects, timePerTick){
	for(let i = 0; i < Objects.length; i++){
		Objects[i].posX += Objects[i].velocityX*timePerTick;
		Objects[i].posY += Objects[i].velocityY*timePerTick;
		//updates the position based on velocity and timePerTick
		
		//velocityUpdate is not actually needed as you can just multiply acceleration by timePerTick^2
		//and get the same change in position with less calculations
		//but I'd like the program to display the velocities of the planets in the infoTab
		//so the velocity is updated even if not necessary
		//should change in the future to not use velocityUpdate when the infoTab is not being used
	}
}
function resetTrailQueue(trailsQueue = [], trailLength, Objects){
	let trailsQueueReplacement = [];
	//an array that acts like a circular queue for storing the last (by default) 12 positions of the planets
	//this functions can be used both for setting up and empty queue and for copying the values from one queue onto another,
	//should there be a planet removed and the queue can be shorter, or a planet added and the queue needs to be longer
	//queue structure explained at the end of the function
	
	//first the function creates an empty queue
	
	const trailQueuePiece = new Array(trailLength);
	//each planet needs its last few positions stored, with the number of positions being determined by trail length
	//so the program sets up an array that can contain those last few positions
	
	for(let i = 0; i < trailLength; i++){
		trailQueuePiece[i] = new Array(4);
	}
	//the program then places an array of length 4 in each position of trailQueuePiece,
	//these smaller arrays are used to store information about the last few positions: 
	//the name of the planet, the x position, the y position and the number of times that it has been drawn (this is to keep track of when to delete it)
	
	for(let i = 0; i < Objects.length; i++){
		trailsQueueReplacement.push(trailQueuePiece);
		for(let j = 0; j < trailLength; j++){
			trailsQueueReplacement[i][j][0] = Objects[i].name;
		}//the trailQueuePieces are placed into the trail queue, with the names of the planets
	}
	//The queue is set up and empty
	
	//if there was an original trailQueue given to the function it will now copy its contents onto the empty queue
	for(let i = 0; i < trailsQueue.length; i++){
		//if checks if the planet at "i" is already was in the queue
		if(trailsQueueReplacement[i][0][0] == trailsQueue[i][0][0]){
			for(let j = 0; j < trailLength; j++){
				trailsQueueReplacement[i][j][1] = trailsQueue[i][j][1];
                trailsQueueReplacement[i][j][2] = trailsQueue[i][j][2];
			}
			//if the trail is for the same planet, then it is copied
		}
	}
	
	//so the queue works like this
	//it is an array that for each planet
	//has an array contaning the last (by default) 12 position which are stored as
	//an array of length 4, holding the planet name, x position, y position and number of times that it has been displayed
	
	//if not understanding, think of it like a 2d array,
	//where there is a column for each planet
	//and (by default) 12 rows for each planet, where the last 12 positions of that planet are stored
	//the positions are stored as an array of length for holding the name, x position, y positions and number of times displayed.
	
	//the number of times that position is displayed is important as when that piece of trail is displayed the (by default) 12th time,
	//that piece is the end of the trail; meaning that it needs to be replaced on the next frame, as if it where not removed, then the trail would increase in length
	//the way that the piece is removed is by replacing its x and y positions with the new current position of the planet and resetting the number of times displayed
	//so, when a trail piece has been displayed as many times as the trail is long, that piece is replaced by the current position of the planet
	
	return trailsQueueReplacement;
}
function cleanTrails(trails, trailLength, planetCount){
	//goes through the queue for every position of every planet
	//and sets the amount of times that is has been displayed to "null"
	//null is used to signify that that piece of trail should not be displayed and can be written over
	for(let i = 0; i < planetCount; i++){
		for(let j = 0; j < trailLength; j++){
			trails[i][j][3] = null;
		}
	}
	return trails;
}
function collision(Objects, object1, object2){
	
	const newMass = Objects[object1].mass + Objects[object2].mass;
	
	const newX = (Objects[object1].posX + Objects[object2].posX) / 2;
	const newY = (Objects[object1].posY + Objects[object2].posY) / 2;
	
	const newvelocityX = (Objects[object1].velocityX * Objects[object1].mass + Objects[object2].velocityX * Objects[object2].mass)/newMass;
	const newvelocityY = (Objects[object1].velocityY * Objects[object1].mass + Objects[object2].velocityY * Objects[object2].mass)/newMass;
	
	const newRadius = Math.sqrt((Objects[object1].radius * Objects[object1].radius * 3.141 + Objects[object2].radius * Objects[object2].radius * 3.141)/3.141);
	
	let newName;
    let newColour;
    let newID;
    let removedID;
	if(Objects[object1].mass > Objects[object2].mass){
		newName = Objects[object1].name;
        newColour = Objects[object1].colour;
        newID = object1;
        removedID = object2;
	}
	else{
		newName = Objects[object2].name;
        newColour = Objects[object2].colour;
        newID = object2;
        removedID = object1;
	}
	
	const resultantObject = makeBody(newX, newY, newvelocityX, newvelocityY, newMass, newRadius, newName, newColour);
	
	Objects[newID] = resultantObject;
	Objects.splice(removedID, 1);
}
function collisionChecker(Objects, trailsQueue, trailLength){
	const line1 = [];
	const line2 = [];
	const pointPlaceHolder = [0,0];
	line1.push(pointPlaceHolder);
	line1.push(pointPlaceHolder);
	line2.push(pointPlaceHolder);
	line2.push(pointPlaceHolder);
	
	let collisionOccured = false;
	let distance;
	
	for(let i = 0; i < Objects.length-1; i++){
		for(let j = i+1; j< Objects.length; j++){
			distance = distanceCalc(Objects[i].posX, Objects[i].posY, Objects[j].posX, Objects[j].posY);
			
			if(Objects[i].radius + Objects[j].radius > distance){
				collisionOccured = true;
			}
			else{
				line1[0][0] = Objects[i].posX;
                line1[0][1] = Objects[i].posY;
                line1[1][0] = Objects[i].posX - Objects[i].velocityX;
                line1[1][1] = Objects[i].posY - Objects[i].velocityY;
				
				line2[0][0] = Objects[j].posX;
                line2[0][1] = Objects[j].posY;
                line2[1][0] = Objects[j].posX - Objects[j].velocityX;
                line2[1][1] = Objects[j].posY - Objects[j].velocityY;
				
                if (lineOverlapCheck(line1, line2))
                {
                    collisionOccured = true;
                }
			}
			if(collisionOccured){
				Objects = collision(Objects, i, j);
                trailsQueue = trailQueueAdd(trailsQueue, trailLength, Objects);
                collisionOccured = false;
			}
		}
	}
}
function lineOverlapCheck(line1, line2){
	let overlap = false;
	if(arePointsAntiClockwise(line1[0], line2[0], line2[1]) != arePointsAntiClockwise(line1[1], line2[0], line2[1]) && arePointsAntiClockwise(line1[0], line1[1], line2[0]) != arePointsAntiClockwise(line1[0], line1[1], line2[1])){
		overlap = true;
	}
	return overlap;
}
function arePointsAntiClockwise(point1, point2, point3){
	let isAntiClockwise = false;
	if((point3[1] - point1[1]) * (point2[0] - point1[0]) > (point2[1] - point1[1]) * (point3[0] - point1[0])){
		isAntiClockwise = true;
	}
	return isAntiClockwise;
}
function secondsSimplifier(seconds){
	let minutes;
	let hours;
	let days;
	let weeks;
	if (seconds % 60 == 0){
        minutes = seconds / 60;
        if (minutes % 60 == 0){
            hours = minutes / 60;
            if (hours % 24 == 0){
                days = hours / 24;
                if (Math.round(days / 365.25) > 1){
                    return Math.round(days / 365.25) + " years";
                }
                if (days % 7 == 0)
                {
                    weeks = days / 7;
                    if (weeks > 1)
                    {
                        return weeks + " weeks";
                    }
                    else
                    {
                        return weeks + " week";
                    }
                }
                if (days > 1){
                    return days + " days";
                }
                else{
                    return days + " day";
                }
            }
            if (hours > 1){
                return hours + " hours"; ;
            }
            else{
                return hours + " hour";
                    }
                }
                if (minutes > 1)
                {
                    return minutes + " minutes";
                }
                else
                {
                    return minutes + " minute";
                }
            }
            if (seconds > 1)
            {
                return seconds + " seconds";
            }
            else
            {
                return seconds + " seconds";
            }
}
function timeChanger(time, increase){
	const timeScales = [1, 5, 10, 30, 60, 120, 600, 1800, 3600, 7200, 14400, 43200, 86400, 172800, 345600, 604800, 1209600, 2419200];
	//timeScales: 1s, 5s, 10s, 30s, 1min, 2mins, 10mins, 30mins, 1hour, 2hours, 4hours, 1day, 2days, 4days, 1week, 2weeks, 4weeks
	let scalePosition = 0;
	let tickPosition = 0;
	
	for (; scalePosition < timeScales.length; scalePosition++)
    {
        if (time.timeScale == timeScales[scalePosition])
        {
            break;
        }
    }
	for (; tickPosition < timeScales.length; tickPosition++)
    {
		//console.log(tickPosition);
        if (time.timePerTick == timeScales[tickPosition])
        {
			
            break;
        }
    }
	if (increase == true && scalePosition < timeScales.length - 1)
    {
        time.timeScale = timeScales[scalePosition + 1];
		//console.log(tickPosition < scalePosition - 4 && timeScales[tickPosition + 1] <= 60 * 60)
        if (tickPosition < scalePosition - 4 && timeScales[tickPosition + 1] <= 60 * 60)
        {
			//console.log(tickPosition);
            time.timePerTick = timeScales[tickPosition + 1];
        }
    }
	else if (increase == false && scalePosition > 0)
    {
        time.timeScale = timeScales[scalePosition - 1];

        if (tickPosition > scalePosition - 6 && tickPosition > 0)
        {
            time.timePerTick = timeScales[tickPosition - 1];
        }
    }
	//console.log(time);
}
function simulate(Objects, trailsQueue, trailLength, timePerTick){
	
	collisionChecker(Objects, trailsQueue, trailLength);
	accelerationCalc(Objects);
	velocityUpdate(Objects, timePerTick);
	positionUpdate(Objects, timePerTick);
	//console.log(Objects[1]);
}
function XYposToDisplay(Objects, distanceScale, viewHeight, viewWidth){
	
	const xyPos = [];
	let point;
	
	for(let i = 0; i < Objects.length; i++){
		
		point = new Array(2);
		
		point[0] = viewWidth/2 + (Objects[i].posX / distanceScale) * (viewWidth - 2) / 2;
		//console.log(viewWidth/2 + (Objects[i].posX / distanceScale) * (viewWidth - 1) / 2);
		point[1] = viewHeight/2 - (Objects[i].posY / distanceScale) * (viewWidth - 2) / 2;
		
		xyPos.push(point);
	}
	//console.log(xyPos);
	return xyPos;
}
function setOnScreenRadius(Objects, distanceScale){
	let diameterOnDisplay;
	for(let i = 0; i < Objects.length; i++){
		diameterOnDisplay = (Objects[i].radius)/distanceScale*viewWidth*2;
		if (diameterOnDisplay < 2){
			diameterOnDisplay = 2;
		}
		document.getElementById(i).width = diameterOnDisplay;
		document.getElementById(i).height = diameterOnDisplay;
	}
}
function movePlanetsOnScreen(xyPos){
	for(let i = 0; i < xyPos.length; i++){
		document.getElementById(i).style.left = xyPos[i][0]-document.getElementById(i).width/2 + screenMove.x + "px";
		document.getElementById(i).style.top = xyPos[i][1]-document.getElementById(i).height/2 + screenMove.y + "px";
		//console.log(xyPos[i][0]);
	}
}
function displayPlanets(Objects, distanceScale, viewHeight, viewWidth){
	const xyPos = XYposToDisplay(Objects, distanceScale, viewHeight, viewWidth);
	//console.log(xyPos);
	movePlanetsOnScreen(xyPos);
}
async function cycle(Objects, simulating, time, trailsQueue, trailLength, distanceScale, viewHeight, viewWidth){
	if(simulating){
			for(; time.timeSimulated < time.timeLastImage + time.timeScale; time.timeSimulated+=time.timePerTick){
			simulate(Objects, trailsQueue, trailLength, time.timePerTick);
		}
		time.timeLastImage = time.timeSimulated;
	}

	
	if(Date.now() >= time.UTCTimeLastImage + 30){
		displayPlanets(Objects, distanceScale, viewHeight, viewWidth);
		//console.log("image late by: " + (Date.now() - time.UTCTimeLastImage - 30));
	}
	
	else{
		await new Promise ( (resolve) => {
			setTimeout( () => {
				displayPlanets(Objects, distanceScale, viewHeight, viewWidth);
			}, 30-(Date.now()-time.UTCTimeLastImage))
		});
	}
	time.UTCTimeLastImage = Date.now();
}
function changeCentredPlanet(id){
	centredPlanet = id;
	console.log("a");
}
function setUpScreen(){
	viewWidth = window.innerWidth-304;
	//-300 to leave space on the right for instructions and other info
	viewHeight = window.innerHeight-54;
	//-50 to leave space at the bottom for buttons
	//console.log(viewHeight);
	//both have -4 to account for the 2 px wide border
	if(viewWidth < 800) viewWidth = 800;
	if(viewHeight < 450) viewHeight = 450;
	document.getElementById("planetView").style.width = viewWidth + "px";
	document.getElementById("planetView").style.height = viewHeight + "px";
	//parsing to string and adding px at the end to make it working with .style.width
	
	document.getElementById("infoTab").style.left = viewWidth + 4 + "px";
	document.getElementById("infoTab").style.height = viewHeight + 54 + "px";

	document.getElementById("buttonSpace").style.height = 50 + "px";
	document.getElementById("buttonSpace").style.width = viewWidth + "px";
	document.getElementById("buttonSpace").style.top = viewHeight + "px";

	document.getElementById("status").style.left = viewWidth/2 - 35 + "px";
}
function planetsInstance(){
	function makeImages(){
		let img;
		let diameterOnDisplay;
		for(let i = 0; i < Objects.length; i++){
			img = document.createElement("img");
			img.userSelect = "none"
			img.src = "images/whiteCircle.png";
			img.id = i;
			img.style.position = "absolute";
			img.zIndex = "1";
			img.onmousedown = function(event) {
				movingImage = true;
				const IMAGEID = this.id;
				this.zIndex = "2";
			
				xMouseOnPlanet = event.clientX - this.getBoundingClientRect().left - this.offsetWidth/2;
				YMouseOnPlanet = event.clientY - this.getBoundingClientRect().top - this.offsetHeight/2;
				
				//xMouseOnPlanet and the y counterpart are used to keep track of where the mouse was initially when the planet was clicked.
				//we dont want the planet that was clicked on to snap to the cursor if it was not clicked directly in the centre
			
				move(event.pageX, event.pageY);
				
				function move(mouseX, mouseY){
					//mouseX is the current x position of the mouse as pixels on the screen
					//mouseX-xMouseOnPlanet is the x position on screen where the planet should be after taking into account the initial mouse position on the planet
					//(distanceScale*2)/viewWidth gives the number of meters every pixel represents
					Objects[IMAGEID].posX = distanceScale*((2*(mouseX-xMouseOnPlanet)-viewWidth)/(viewWidth-2));
					Objects[IMAGEID].posY = distanceScale*((2*(mouseY-YMouseOnPlanet)-viewHeight)/(2-viewWidth));
				}
			
				function mouseMove(event){
					move(event.pageX, event.pageY);
					//Objects[IMAGEID].posX += event.movementX * ((distanceScale*2)/viewWidth);
					//Objects[IMAGEID].posY -= event.movementY * ((distanceScale*2)/viewWidth);
				}
			
				document.addEventListener("mousemove", mouseMove);
			
				this.onmouseup = function(){
					movingImage = false;
					this.zIndex = "1";
					document.removeEventListener("mousemove", mouseMove);
					this.onmouseup = null;
				}
			}
			this.ondragstart = function() {return false;};
			document.getElementById("planetView").appendChild(img);
		}
	setOnScreenRadius(Objects, distanceScale)
	}
	document.getElementById("planetView").addEventListener("wheel", function(event){
		let newSize;
		if(event.deltaY < 0){
			distanceScale /= 1.1;
			xMouseOnPlanet *= 1.1;
			xMouseOnPlanet *= 1.1;
			screenMove.x *= 1.1;
			screenMove.y *= 1.1;
		}
		else{
			distanceScale *= 1.1;
			xMouseOnPlanet /= 1.1;
			xMouseOnPlanet /= 1.1;
			screenMove.x /= 1.1;
			screenMove.y /= 1.1;
		}
		setOnScreenRadius(Objects, distanceScale)
		//console.log(screenMove);
	});
	document.getElementById("planetView").onmousedown = async function(event){
		if(movingImage) throw "already moving planet, cannot move whole image";
		
		function mouseMove(event){
			screenMove.x += event.movementX;
			screenMove.y += event.movementY;
		}
		
		document.addEventListener("mousemove", mouseMove);
			
		document.getElementById("planetView").onmouseup = function () {
			document.removeEventListener("mousemove", mouseMove);
			document.getElementById("planetView").onmouseup = null;
		}
	}
	document.getElementById("centre").onclick = function() {
		centred = !centred;
	}
	document.getElementById("pause").onclick = function() {
		if(simulating){
			document.getElementById("status").innerHTML = "Paused";
			document.getElementById("status").style.left = viewWidth/2 - 23 + "px";
			document.getElementById("status").style.userSelect = "none";
		}
		else{
			document.getElementById("status").innerHTML = "";
		}
		simulating = !simulating;
	}
	document.getElementById("reset").onclick = function() {
		screenMove.x = 0;
		screenMove.y = 0;
		distanceScale = largestDistanceFromCenter(Objects)*1.1;
		setOnScreenRadius(Objects, distanceScale);
	}
	document.getElementById("slower").onclick = function () {timeChanger(time, false)}
	document.getElementById("faster").onclick = function () {timeChanger(time, true)}
	
	let xMouseOnPlanet = 0;
	let yMouseOnPlanet = 0;
	let simulating = true;
	let trailLength = 12;
	let trailsQueue = [];
	const Objects = [];
	let imageNeeded = true;
	let imageLate = false;
	let centred = false;
	let movingImage = false;
	
	for(let i = 0; i < 5; i++){
		Objects[i] = (makeBody(solarSystem[i].posX, solarSystem[i].posY, solarSystem[i].velocityX, solarSystem[i].velocityY, solarSystem[i].mass, solarSystem[i].radius, solarSystem[i].name, solarSystem[i].colour));
	}

	let distanceScale = largestDistanceFromCenter(Objects)*1.1;
	trailsQueue = resetTrailQueue(trailsQueue, 12, Objects);
	makeImages();
	
	setInterval( () => {cycle(Objects, simulating, time, trailsQueue, trailLength, distanceScale, viewHeight, viewWidth)}, 0);
	
	console.log("end");
}

let viewWidth;
let viewHeight;
let infoTabX;
let buttonSpaceY;

const screenMove = {
	x:0,
	y:0
}
const time = {
	timeSimulated:0,
	timeScale:1,
	timeLastImage:-100,
	timePerTick:1,
	UTCTimeLastImage:Date.now()
};

const solarSystem = [];
const extraObjects = [];

solarSystem.push(makeBody(0, 0, 0, -0.18899, 1.989e30, 696340000, "Sun", "yellow"));
solarSystem.push(makeBody(7.0311e10, 0, 0, 38.8e3, 3.285e23, 2439700, "Mercury", "gray"));
solarSystem.push(makeBody(1.082e11, 0, 0, 35.02e3, 4.867e24, 6051800, "Venus", "gray"));
solarSystem.push(makeBody(1.496e11, 0, 0, 29.78e3, 5.972e24, 6371000, "Earth", "green"));
solarSystem.push(makeBody(2.279e11, 0, 0, 24.07e3, 6.39e23, 3396200, "Mars", "red"));

solarSystem.push(makeBody(7.785e11, 0, 0, 13e3, 1.898e27, 69911000, "Jupiter", "dark yellow"));
solarSystem.push(makeBody(1.434e12, 0, 0, 9.68e3, 5.683e26, 58232000, "Saturn", "dark yellow"));
solarSystem.push(makeBody(2.871e12, 0, 0, 6.80e3, 8.681e25, 25362000, "Uranus", "dark cyan"));
solarSystem.push(makeBody(4.495e12, 0, 0, 5.43e3, 1.024e26, 24622000, "Neptune", "dark blue"));

extraObjects.push(makeBody(-2e9, 0, 0, 9.108e4, 9.945e29, 74085000, "1Sun", "yellow"));
extraObjects.push(makeBody(2e9, 0, 0, -9.108e4, 9.945e29, 74085000, "2Sun", "yellow"));

window.addEventListener("resize", setUpScreen);
setUpScreen();
planetsInstance();