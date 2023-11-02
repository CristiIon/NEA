// code
function makeBody(highlighted, x = 0, y = 0, xVel = 0, yVel = 0, planetMass = 2710, planetRadius = 0.62, planetName = "New Planet", planetColour = "green"){
	//creates an object with the specified attributes and returns it.
	//intended for adding planets onto the Objects array.
	//default values makes a stationary 2.71 ton asteroid with 1m volume at 0,0
	//the reason for the specific mass and radius is for it to have an average asteroid density and 1m volume
	const temp = {
		posX:x,
		posY:y,// xy coordinates in m from centre
		velocityX:xVel,
		velocityY:yVel,// m/s
		accelerationX:0,
		accelerationY:0,// m/s²
		//acceleration does not need to be specified as acceleration is instantaneous, so it only needs to be stored fot the duration of one frame to 
		//1) show on the infoTab as part of that planet's stats
		//2) carry that value from accelerationCalc() to velocityUpdate()
		//on the next frame acceleration is reset as its new value is completly independent of its previous one
		mass:planetMass, // kg
		radius:planetRadius, // m
		name:planetName,
		colour:planetColour,
		isHighlighted:highlighted
	};
	return temp;
}
function makeBodyListCopy(Objects){
	//needed because if you set a list to equal a list of bodies, it does not become a copy of that list
	//but instead changes in the new variables are made in the original and vice versa
	//so to make a copy you need to make a new list
	let temp = [];
	for(let i = 0; i < Objects.length; i++){
		temp[i] = makeBody(Objects[i].isHighlighted, Objects[i].posX, Objects[i].posY, Objects[i].velocityX, Objects[i].velocityY, Objects[i].mass, Objects[i].radius, Objects[i].name, Objects[i].colour);
	}
	return temp;
}
function removePlanet(Objects, id){
	let temp = document.getElementById(id.toString());
	temp.parentNode.removeChild(temp);
	
	for(let i = id+1; i < Objects.length; i++){
		document.getElementById(i.toString()).id = (i-1).toString();
	}
	Objects.splice(id, 1);
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
	gravitationalPull = gravitationalPull*gravConstant;
	//gravitational pull = gravitational constant * (mass1*mass2) / distance^2
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
	//used for setting up the view distanceScale
	//distanceScale being the farthest distance at which an object will still be rendered,
	//starting such that all bodies will be in view, which is why the largest distance needs to be considered
	return largestDistance;
}
function accelerationCalc(Objects){
	let distance;
	let gravPull;
	let unitVector = [];
	
	for(let i = 0; i < Objects.length; i++){
		Objects[i].accelerationX = 0;
		Objects[i].accelerationY = 0;
		//resets acceleration, as this function calculates the acceleration within this frame
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
function velocityUpdate(Objects, selectedPlanetID, movingImage, timePerTick){
	for(let i = 0; i < Objects.length; i++){
		if(!(i == selectedPlanetID && movingImage)){
			//if checks if the user is trying to move this planet in which case it doesn't update the velocity
			Objects[i].velocityX += Objects[i].accelerationX*timePerTick;
			Objects[i].velocityY += Objects[i].accelerationY*timePerTick;
		}
		//updates the velocities based on accelerations and how much time is simulated per tickPosition
		//e.g. accelerating at 5m/s for 2 seconds updates velocity to 10 m/s
	}
}
function positionUpdate(Objects, selectedPlanetID, movingImage, timePerTick){
	for(let i = 0; i < Objects.length; i++){
		if(!(i == selectedPlanetID && movingImage)){
			//if checks if the user is trying to move this planet in which case it doesn't update the position
			Objects[i].posX += Objects[i].velocityX*timePerTick;
			Objects[i].posY += Objects[i].velocityY*timePerTick;
		}
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
	let newIsHighlighted = false;
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
	
	const resultantObject = makeBody(newIsHighlighted, newX, newY, newvelocityX, newvelocityY, newMass, newRadius, newName, newColour);
	removePlanet(Objects, removedID);
	Objects[newID] = resultantObject;
	console.log(Objects);
	
}
function collisionChecker(Objects, distanceScale, trailsQueue, trailLength){
	const line1 = [];
	const line2 = [];
	const pointPlaceHolder = [0,0];
	line1.push(pointPlaceHolder);
	line1.push(pointPlaceHolder);
	line2.push(pointPlaceHolder);
	line2.push(pointPlaceHolder);
	
	let collisionOccured = false;
	let distance;
	
	for(let planet1 = 0; planet1 < Objects.length-1; planet1++){
		for(let planet2 = planet1+1; planet2 < Objects.length; planet2++){
			distance = distanceCalc(Objects[planet1].posX, Objects[planet1].posY, Objects[planet2].posX, Objects[planet2].posY);
			
			if(Objects[planet1].radius + Objects[planet2].radius > distance){
				collisionOccured = true;
			}
			else{
				line1[0][0] = Objects[planet1].posX;
                line1[0][1] = Objects[planet1].posY;
                line1[1][0] = Objects[planet1].posX - Objects[planet1].velocityX;
                line1[1][1] = Objects[planet1].posY - Objects[planet1].velocityY;
				
				line2[0][0] = Objects[planet2].posX;
                line2[0][1] = Objects[planet2].posY;
                line2[1][0] = Objects[planet2].posX - Objects[planet2].velocityX;
                line2[1][1] = Objects[planet2].posY - Objects[planet2].velocityY;
				
                if (lineOverlapCheck(line1, line2))
                {
                    collisionOccured = true;
                }
			}
			if(collisionOccured){
				collision(Objects, planet1, planet2);
				setOnScreenRadius(Objects, distanceScale);
                //trailsQueue = trailQueueAdd(trailsQueue, trailLength, Objects);
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
				if (days % 7 == 0){
					weeks = days / 7;
					if (weeks > 1){
						return weeks + " weeks";
					}
					else{
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
			else if (hours > 1){
				return hours + " hours"; ;
			}
			else{
				return hours + " hour";
			}
		}
		else if (minutes > 1){
			return minutes + " minutes";
		}
		else{
			return minutes + " minute";
		}
    }
    if (seconds > 1){
        return seconds + " seconds";
    }
    else{
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
        if (time.timePerTick == timeScales[tickPosition])
        {
			
            break;
        }
    }
	//for loops used to find where in the timeScales array the current timeScale and timePerTick variables are
	if (increase == true && scalePosition < timeScales.length - 1)
    {
		//if its speeding up and not at maximum speed
		
        time.timeScale = timeScales[scalePosition + 1];
		//timeScale is increased
        if (tickPosition <= scalePosition - 5 && timeScales[tickPosition + 1] <= 60 * 60)
        {
			//if the time per tick is 5 positions behind scale position and
			//increasing timePerTick wouldn't increase it past 1 hour simulated pe tick,
			//timePerTick is increased
            time.timePerTick = timeScales[tickPosition + 1];
        }
    }
	else if (increase == false && scalePosition > 0)
    {
		//if slowing down and not at one second per frame
        time.timeScale = timeScales[scalePosition - 1];
		//timeScale is decreased
        if (tickPosition => scalePosition - 5 && tickPosition > 0)
        {
			//if the decrease in timeScale would make it less than 5 positions ahead timePerTick
			//and decreasing TimePerTick wouldn't make it go below one second per tick
			//timePerTick is decreased
            time.timePerTick = timeScales[tickPosition - 1];
        }
    }
	document.getElementById("speed").innerHTML = secondsSimplifier(time.timeScale*30) + " Every Second";
	if(time.timePerTick == 1) document.getElementById("accuracy").innerHTML = "Second for Second";
	else document.getElementById("accuracy").innerHTML = "Every " + secondsSimplifier(time.timePerTick);
}
function simulate(Objects, selectedPlanetID, movingImage, distanceScale, trailsQueue, trailLength, timePerTick){
	//calls all the functions needed to simulate one tick
	collisionChecker(Objects, distanceScale, trailsQueue, trailLength);
	accelerationCalc(Objects);
	velocityUpdate(Objects, selectedPlanetID, movingImage, timePerTick);
	positionUpdate(Objects, selectedPlanetID, movingImage, timePerTick);
}
function XYposToDisplay(Objects, distanceScale, viewHeight, viewWidth){
	//converts XY position in the simulation to onscreen XY positions from the centre of the screen in pixels
	const xyPos = [];
	let point;
	for(let i = 0; i < Objects.length; i++){
		point = new Array(2);
		point[0] =  (Objects[i].posX / distanceScale) * viewWidth / 2;
		point[1] =  (Objects[i].posY / distanceScale) * viewWidth / 2;
		//posX / distanceScale gives how much along the screen the planet is, e.g. 
		//if posX / distanceScale gives 0.5 (50%) then the planet should be half way from the centre to the right edge of the screen
		//if it gives -0.5 (-50%) then hlaf way to the left side of the screen
		//if we then multiply this percentage by how many pixels are from the centre to the edge of the screen you get the coordinate in pixels
		//which is why we divide viewWidth by 2, to get the distance from the centre to the edge
		
		//border does not need to be accounted for as it was already accounted when setting up viewWidth
		//viewWidth is used in both cases because otherwise the image would be streched as view Width and Height have different values
		//e.g lets say the distanceScale is 1 km, and the view is 2 pixel tall and 4 pixels wide
		//using width for the X position and height for the Y position would mean that vertically each pixel represents 1 km
		//but horizontally each pixel would only be 0.5km
		xyPos.push(point);
	}
	return xyPos;
}
function setOnScreenRadius(Objects, distanceScale){
	//sets the size of the planet images onscreen based on the distanceScale and their actual radius
	let diameterOnDisplay;
	for(let i = 0; i < Objects.length; i++){
		
		diameterOnDisplay = (Objects[i].radius)/distanceScale*viewWidth*2
		if (diameterOnDisplay < 4){
			diameterOnDisplay = 4;
		}
		document.getElementById(i).width = diameterOnDisplay;
		document.getElementById(i).height = diameterOnDisplay;
	}
}
function movePlanetsOnScreen(xyPos, selectedPlanetID, centred){
	if(centred){
		screenMove.centredX = xyPos[selectedPlanetID][0];
		screenMove.centredY = xyPos[selectedPlanetID][1];
		//as xyPos stores the positions of the images from the centre of the screen, to centre on a planet all we have to do is
		//do every planets' XY positions minus the centred planets' XY positions
		//this will move the centred planet to the centre as its XY positions will be 0,0
		//and as the same transformation is applied to the rest of the planets, those will be moved along the same direction, keeping their relative positions
	}
	for(let i = 0; i < xyPos.length; i++){
		document.getElementById(i).style.left = (viewWidth/2 + (xyPos[i][0]-screenMove.centredX))-document.getElementById(i).width/2 + screenMove.x + "px";
		document.getElementById(i).style.top = (viewHeight/2 - (xyPos[i][1]-screenMove.centredY))-document.getElementById(i).height/2 + screenMove.y + "px";
		//viewWidth and viewHeight are divided 2 and then added to move the planets such that 0,0 is in the centre of the screen, instead of the top right corner
		//(in css the left and top attributes measure from the top left corner of the div to the top left corncer of the element)
		//xyPos - screenMove.centredX or Y centres the screen. If screen is not centred then screenMove.centredX/Y will be 0 and this will have no effect
		//-document.getElementById(i).width/2 this gets the image with the same id as the index of the planet it represents, and divides its width by 2
		//this corrects the positions so that the image centre is on the position and not the top left corner
		//then screenMove is added which is used to move the whole screen for when the user clicks and drags on the screen
		
		//for .style.top it is viewHeight/2 - unlike .style.left which has viewWidth/2 +
		//this is due to .style.top measuring distance from the top of the screen, so a smaller value moves the image close to the top of the screen
	}
}
function displayPlanets(Objects, selectedPlanetID, centred, distanceScale, viewHeight, viewWidth){
	//calls the fuctions needed to display a frame of the current state of the simulation
	const xyPos = XYposToDisplay(Objects, distanceScale, viewHeight, viewWidth);
	movePlanetsOnScreen(xyPos, selectedPlanetID, centred);
}
async function cycle(Objects, selectedPlanetID, movingImage, centred, simulating, changingInfo, time, trailsQueue, trailLength, distanceScale, viewHeight, viewWidth){
	//cycle both simulates and displays continuously
	
	if(simulating){
		//if simulating checks if the simulation is paused
		for(; time.timeSimulated < time.timeLastImage + time.timeScale; time.timeSimulated+=time.timePerTick){
			//simulates until timeSimulated is greater than timeLastImage+timeScale
			//this effectively checks if timeScale nubmer of seconds has been simulated
			simulate(Objects, selectedPlanetID, movingImage, distanceScale, trailsQueue, trailLength, time.timePerTick);
		}
		time.timeLastImage = time.timeSimulated;
		//updates timeLastImage as the program will now dispaly and image
	}
	
	
	if(Date.now() >= time.UTCTimeLastImage + 30){
		//if more than 30 ms (irl) have passed since the last image was displayed then it displays an image right away
		displayPlanets(Objects, selectedPlanetID, centred, distanceScale, viewHeight, viewWidth);
		displaySelectedPlanetXYInfo(Objects[selectedPlanetID], changingInfo);
	}
	
	else{
		//if less than 30 ms have passed since the last image was displayed then the program waits for a timer that lasts until 30 ms have passed to display an image
		await new Promise ( (resolve) => {
			setTimeout( () => {
				displayPlanets(Objects, selectedPlanetID, centred, distanceScale, viewHeight, viewWidth);
				displaySelectedPlanetXYInfo(Objects[selectedPlanetID], changingInfo);
			}, 30-(Date.now()-time.UTCTimeLastImage))
		});
	}
	time.UTCTimeLastImage = Date.now();
	//update the time that the last image was printed
}
function displaySelectedPlanetXYInfo(planet, changingInfo){
	//used to display the XY position, velocity and acceleration
	//as these are constantly changing, these need to be updated every frame
	let number = 5;
	if(changingInfo != null){
		//changingInfo represents the propery that the user has clicked on and is editing
		//if changingInfo isn't null that means one of the variables is selected and needs to be stopped from updating
		//otherwise it would update constantly while the user is trying to change it
		if(changingInfo != "posX"){
			document.getElementById("infoX").value = planet.posX.toPrecision(4) + "m";
		}
		if(changingInfo != "posY"){
			document.getElementById("infoY").value = planet.posY.toPrecision(4) + "m";
		}
		if(changingInfo != "velocityX"){
			document.getElementById("infoXVel").value = planet.velocityX.toPrecision(4) + "m/s";
		}
		if(changingInfo != "velocityY"){
			document.getElementById("infoYVel").value = planet.velocityY.toPrecision(4) + "m/s";
		}
		document.getElementById("infoXAccel").value = planet.accelerationX.toPrecision(4) + "m/s²";
		document.getElementById("infoYAccel").value = planet.accelerationY.toPrecision(4) + "m/s²";
		//acceleration cannot be edited, so it does not need a check
	}
	else{
		//if no info is being changed then all variables can be updated without concern
		document.getElementById("infoX").value = planet.posX.toPrecision(4) + "m";
		document.getElementById("infoY").value = planet.posY.toPrecision(4) + "m";
		document.getElementById("infoXVel").value = planet.velocityX.toPrecision(4) + "m/s";
		document.getElementById("infoYVel").value = planet.velocityY.toPrecision(4) + "m/s";
		document.getElementById("infoXAccel").value = planet.accelerationX.toPrecision(4) + "m/s²";
		document.getElementById("infoYAccel").value = planet.accelerationY.toPrecision(4) + "m/s²";
	}
	
	
	
}
function displaySelectedPlanetStaticInfo(planet){
	//displays the properties of the planets that do not need to be updated every frame
	//these only need to be updated if the user changeds them directly or selects a different planet
	document.getElementById("infoName").value = planet.name;
	document.getElementById("infoMass").value = planet.mass + "kg";
	document.getElementById("infoRadius").value = planet.radius + "m";
	document.getElementById("infoColour").value = planet.colour;
}
function planetsInstance(Objects = [], addingPlanet = false){

	let xMouseOnPlanet = 0;
	let yMouseOnPlanet = 0;
	//used to store the initial position of the cursor when clicking on a planet, without these the planets' centre would snap to the cursor
	
	let trailLength = 12;
	let trailsQueue = [];
	//trails not yet implemented
	
	let simulating = true;
	//used for pausing
	
	let selectedPlanetID = 0;
	let centred = false;
	
	let movingImage = false;
	//used when the user clicks and drags to check if moving a planet or the view
	
	let changingInfo = null;
	//used when a user clicks is editing a property of one of the planets
	
	let distanceScale = largestDistanceFromCenter(Objects)*1.1;
	//the distance represented from the centre of the screen to the left/right edge
	
	const SAVEPOINT = {
		initialPlanets:makeBodyListCopy(Objects),//loads back to when the system was loaded
		addingPlanet:[],//loads back to when the user started adding a planet
		preAddingPlanet:[]//loads back to just before the user started adding a planet, used for canceling addding a planet
	}
	
	let updateSAVEPOINT = false;
	
	document.getElementById("cancel").disabled = true;
	//needs to set disabled to true as if the button was not disabled when refresing
	//the screen then after refreshing it will not be disabled at the start as it should be even if specified in HTML
	function updateObjects(whatIsChanged, whatChangeTo){
		switch (whatIsChanged){
			case "name":
				Objects[selectedPlanetID].name = whatChangeTo;
				displaySelectedPlanetStaticInfo(Objects[selectedPlanetID]);
				break;
			case "mass":
				Objects[selectedPlanetID].mass = Number(whatChangeTo.slice(0, -2));
				displaySelectedPlanetStaticInfo(Objects[selectedPlanetID]);
				break;
			case "radius":
				Objects[selectedPlanetID].radius = Number(whatChangeTo.slice(0, -1));
				displaySelectedPlanetStaticInfo(Objects[selectedPlanetID]);
				setOnScreenRadius(Objects, distanceScale);
				break;
			case "colour":
				Objects[selectedPlanetID].colour = whatChangeTo;
				let temp = document.getElementById(selectedPlanetID.toString());
				temp.parentNode.removeChild(temp);
				makeImage(selectedPlanetID);
				setOnScreenRadius(Objects, distanceScale);
				//when updating the colour the program deletes the image and replaces it with a new one with the correct colour
				break;
			case "posX":
				Objects[selectedPlanetID].posX = Number(whatChangeTo.slice(0, -1));
				break;
			case "posY":
				Objects[selectedPlanetID].posY = Number(whatChangeTo.slice(0, -1));
				break;
			case "velocityX":
				Objects[selectedPlanetID].velocityX = Number(whatChangeTo.slice(0, -3));
				break;
			case "velocityY":
				Objects[selectedPlanetID].velocityY = Number(whatChangeTo.slice(0, -3));
				break;
		}
	}
	function setUpScreen(){
		viewWidth = window.innerWidth-304;
		//-300 to leave space on the right for instructions and other info
		viewHeight = window.innerHeight-54;
		//-50 to leave space at the bottom for buttons
		//both have -4 to account for the 2 px wide border
		
		if(viewWidth < 800) viewWidth = 800;
		if(viewHeight < 450) viewHeight = 450;
		//minimum view Height 800 pixles, minimum view Width 450 pixels
		
		document.getElementById("planetView").style.width = viewWidth + "px";
		document.getElementById("planetView").style.height = viewHeight + "px";
		
		document.getElementById("infoTab").style.left = viewWidth + 4 + "px";
		document.getElementById("infoTab").style.height = viewHeight + 54 + "px";

		document.getElementById("buttonSpace").style.width = viewWidth + "px";
		document.getElementById("buttonSpace").style.top = viewHeight + "px";
		//
		
		distanceScale = largestDistanceFromCenter(Objects)*1.1;
		setOnScreenRadius(Objects, distanceScale);
		
		document.getElementById("loadingTab").style.width = viewWidth/2 + "px";
		document.getElementById("loadingTab").style.height = viewHeight/2 + "px";
		//sets loading tab to be half the width and height of the planet view
		
		document.getElementById("loadingTab").style.left = viewWidth/4 + "px";
		document.getElementById("loadingTab").style.top = viewHeight/4 + "px";
		//centres the loading tab within the planet view
	}
	function resetView() {
		//moves the view to have 0,0 at its centre and resets disanceScale
		screenMove.x = 0;
		screenMove.y = 0;
		distanceScale = largestDistanceFromCenter(Objects)*1.1;
		setOnScreenRadius(Objects, distanceScale);
	}
	function makeImage(id){
		let img;
		
		img = document.createElement("img");
		img.userSelect = "none"
		img.id = id.toString();
		img.style.position = "absolute";
		if(Objects[id].isHighlighted){
			img.zIndex = "2"; 
			img.src = "images/whiteCircle.png";
			//if the image is highlighted then it shows above the rest of the images
			//the white colour cannot be selected by the user to set to a planet, to make it stand out more, as it would be the only white one
		}
		else{
			img.zIndex = "1"; 
			img.src = "images/"+ Objects[id].colour +"Circle.png";
		}
		img.onmousedown = function(event) {
			//when an image is clicked on, it is set as the slected planet and prepares to move it
			
			movingImage = true;
			//movingImage set true so the program doesn't try to move the screen at the set time
			const IMAGEID = this.id;
			if(!centred) selectedPlanetID = parseInt(IMAGEID);
			this.zIndex = "2";
			//sets its zIndex to 2 to show the clicked planet over others in the case that the simulation is paused as otherwise overlapping planets would collide
		
			xMouseOnPlanet = event.clientX - this.getBoundingClientRect().left - this.offsetWidth/2 + 2;
			YMouseOnPlanet = event.clientY - this.getBoundingClientRect().top - this.offsetHeight/2 + 2;
			//xMouseOnPlanet and the y counterpart are used to keep track of where the mouse was initially when the planet was clicked.
			//we dont want the planet that was clicked on to snap to the cursor if it was not clicked directly in the centre
		
			move(event.pageX, event.pageY);
			
			function move(mouseX, mouseY){
				//equasion derived from: point[0] = viewWidth/2 + (Objects[i].posX / distanceScale) * (viewWidth - 2) / 2 (from XYposToDisplay() function)
				//which finds the on-screen position of planets, point[0] using the position in the simulation, Objects[i].posX
				//derived by trying to find Objects[i].posX(actual position in simulation) in terms of the other variables,
				Objects[IMAGEID].posX = distanceScale*((2*(mouseX-xMouseOnPlanet-screenMove.x)-viewWidth)/(viewWidth-2));
				Objects[IMAGEID].posY = distanceScale*((2*(mouseY-YMouseOnPlanet-screenMove.y)-viewHeight)/(2-viewWidth));
			}
		
			function mouseMove(event){
				move(event.pageX, event.pageY);
				//calls the move function with the cursor positions as the input
			}
		
			document.addEventListener("mousemove", mouseMove);
			//add listner for when the cursor moves that calls the function mouseMove
		
			this.onmouseup = function(){
				//when letting go of click
				movingImage = false;
				this.zIndex = "1";
				document.removeEventListener("mousemove", mouseMove);
				this.onmouseup = null;
			}
			displaySelectedPlanetStaticInfo(Objects[parseInt(IMAGEID)]);
			//needs to display the static info as the selected planet has been updated
		}
		this.ondragstart = function() {return false;};
		//turns off the default click and drag function of the browser for this image
		
		document.getElementById("planetView").appendChild(img);
		//adds the new image to the document
	}
	document.getElementById("planetView").addEventListener("wheel", function(event){
		//when using the scroll wheel the view zooms in and out
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
		setOnScreenRadius(Objects, distanceScale);
	});
	document.getElementById("planetView").onmousedown = async function(event){
		if(movingImage) throw "already moving planet, cannot move whole image";
		//checks if the user is trying to move a planet instead
		
		//otherwise moves the view along with the mouse
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
	const stats = document.getElementsByClassName("stats");
	//stats is an array of the elements that have the class name of "stats"
	for(let i = 0; i < stats.length-2; i++){
		//gives all but the last two elemnts of the array listeners to check if the user has clicked on them to edit them
		//the last two are not given listeners as they are the acceleration along the x and y axis which cannot be edited.
		stats[i].style.pointerEvents = "auto";
		stats[i].addEventListener("blur", (event) => {
			updateObjects(changingInfo, stats[i].value);
			changingInfo = null;
		});
		stats[i].onclick = function() {
			changingInfo = stats[i].name;
		}
		stats[i].onfocus = function() {
			stats[i].style.border = "2px solid white"
		}
		stats[i].onblur = function () {
			stats[i].style.border = "none"
		}
	}
	document.getElementById("centre").onclick = function() {
		if(centred){
			screenMove.centredX = 0;
			screenMove.centredY = 0;
			resetView();
		}
		centred = !centred;
	}
	document.getElementById("pause").onclick = function() {
		if(simulating){
			document.getElementById("pause").innerHTML = "Unpause";
			document.getElementById("pauseStatus").innerHTML = "Paused";
			//shows Paused in planetView and makes the button say unpause
		}
		else{
			if(addingPlanet && updateSAVEPOINT){
				//if the program is adding a planet and updateSAVEPOINT is true, then SAVEPOINT.addingPlanet is updated
				//updateSAVEPOINT is set to true by the rewind buttons' function
				SAVEPOINT.addingPlanet = makeBodyListCopy(Objects);
				updateSAVEPOINT = false;
			}
			document.getElementById("pause").innerHTML = "Pause";
			document.getElementById("pauseStatus").innerHTML = "";
			//makes the button say pause and removes the Pause from the planetView
		}
		simulating = !simulating;
	}
	document.getElementById("reset").onclick = function() {resetView()};
	document.getElementById("slower").onclick = function () {timeChanger(time, false);}
	document.getElementById("faster").onclick = function () {timeChanger(time, true);}
	document.getElementById("remove").onclick = function() {
		removePlanet(Objects, selectedPlanetID);
		selectedPlanetID = 0;
	}
	document.getElementById("addPlanet").onclick = function() {
		if(!addingPlanet){
			addingPlanet = true;
			simulating = false;
			//pauses the simulation
			updateSAVEPOINT = true;
			SAVEPOINT.preAddingPlanet = makeBodyListCopy(Objects);
			SAVEPOINT.addingPlanet = makeBodyListCopy(Objects);
			//adding Planet needs to be set here in case the user uses the rewind button before unpausing first
			document.getElementById("cancel").disabled = false;
			//enables the cancel button to allow the user to cancel adding a planet
			document.getElementById("pause").innerHTML = "Unpause";
			document.getElementById("pauseStatus").innerHTML = "Paused";
			this.innerHTML = "Confirm";
			//changes the add planet button to confirm
			document.getElementById("load").disabled = true;
			document.getElementById("export").disabled = true;
			document.getElementById("import").disabled = true;
			//disables loading, importing and exporting of the scene
			Objects.push(makeBody(true));
			//adds a planet onto Objects with the default paramaters and highlited
			makeImage(Objects.length-1, true);
			//creates an image for the new planet
			setOnScreenRadius(Objects, distanceScale);
			//sizes the new image appropriately
		}
		else{
			addingPlanet = false;
			if(!simulating){
				//unpauses if paused
				simulating = true;
				document.getElementById("pauseStatus").innerHTML = "";
				document.getElementById("pause").innerHTML = "Pause";
			}
			Objects[selectedPlanetID].isHighlighted = false;
			//sets the selected planet to not be highlited
			document.getElementById(selectedPlanetID.toString()).zIndex = "1";
			//sets zIndex back to default
			document.getElementById("cancel").disabled = true;
			document.getElementById("load").disabled = false;
			document.getElementById("export").disabled = false;
			document.getElementById("import").disabled = false;
			
			this.innerHTML = "Add Planet";
		}
	}
	document.getElementById("cancel").onclick = function() {
		if(!simulating){
			simulating = true;
			document.getElementById("pauseStatus").innerHTML = "";
		}
		removePlanet(Objects, Objects.length-1);
		selectedPlanetID = 0;
		displaySelectedPlanetStaticInfo(Objects[selectedPlanetID]);
		Objects = makeBodyListCopy(SAVEPOINT.preAddingPlanet);
		//set Objects to what it was before clicking the add planet button
		addingPlanet = false;
		document.getElementById("cancel").disabled = true;
		document.getElementById("load").disabled = false;
		document.getElementById("export").disabled = false;
		document.getElementById("import").disabled = false;
		document.getElementById("addPlanet").innerHTML = "Add Planet";
		if(!simulating){
			simulating = true;
			document.getElementById("pauseStatus").innerHTML = "";
		}
	}
	document.getElementById("rewind").onclick = function () {
		for(let i = 0; i < Objects.length;){
			removePlanet(Objects, i);
		}
		
		if(!addingPlanet) Objects = makeBodyListCopy(SAVEPOINT.initialPlanets);
		else{
			updateSAVEPOINT = true;
			Objects = makeBodyListCopy(SAVEPOINT.addingPlanet);
		}
		console.log(Objects);
		for(let i = 0; i < Objects.length; i++){
			makeImage(i);
		}
		
		time.timeScale = 1;
		time.timePerTick = 1;
		distanceScale = largestDistanceFromCenter(Objects)*1.1;
		setOnScreenRadius(Objects, distanceScale);
		simulating = false;
		document.getElementById("pause").innerHTML = "Unpause";
		document.getElementById("pauseStatus").innerHTML = "Paused";
	}
	document.getElementById("load").onclick = function () {
		document.getElementById("loadingStatus").innerHTML = "Select Scene";
		document.getElementById("loadingTab").zIndex = "2";
	}
	window.addEventListener("resize", setUpScreen);
	
	trailsQueue = resetTrailQueue(trailsQueue, 12, Objects);
	for(let i = 0; i < Objects.length; i++){
		makeImage(i);
	}
	setOnScreenRadius(Objects, distanceScale);
	setUpScreen();
	displaySelectedPlanetStaticInfo(Objects[0]);
	displaySelectedPlanetXYInfo(Objects[0]);
	
	if(addingPlanet){
		simulating = false;
		document.getElementById("pause").innerHTML = "Unpause"
		document.getElementById("pauseStatus").innerHTML = "Paused";
	}
	
	let simulation = setInterval( () => {cycle(Objects, selectedPlanetID, movingImage, centred, simulating, changingInfo, time, trailsQueue, trailLength, distanceScale, viewHeight, viewWidth)}, 0);
	
}

let viewWidth;
let viewHeight;
let infoTabX;
let buttonSpaceY;

const screenMove = {
	x:0,
	y:0,
	centredX:0,
	centredY:0
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

solarSystem.push(makeBody(false, 0, 0, 0, -0.18899, 1.989e30, 696340000, "Sun", "darkYellow"));
solarSystem.push(makeBody(false, 7.0311e10, 0, 0, 38.8e3, 3.285e23, 2439700, "Mercury", "gray"));
solarSystem.push(makeBody(false, 1.082e11, 0, 0, 35.02e3, 4.867e24, 6051800, "Venus", "darkOrange"));
solarSystem.push(makeBody(false, 1.496e11, 0, 0, 29.78e3, 5.972e24, 6371000, "Earth", "green"));
solarSystem.push(makeBody(false, 2.279e11, 0, 0, 24.07e3, 6.39e23, 3396200, "Mars", "red"));

solarSystem.push(makeBody(false, 7.785e11, 0, 0, 13e3, 1.898e27, 69911000, "Jupiter", "darkYellow"));
solarSystem.push(makeBody(false, 1.434e12, 0, 0, 9.68e3, 5.683e26, 58232000, "Saturn", "darkYellow"));
solarSystem.push(makeBody(false, 2.871e12, 0, 0, 6.80e3, 8.681e25, 25362000, "Uranus", "darkCyan"));
solarSystem.push(makeBody(false, 4.495e12, 0, 0, 5.43e3, 1.024e26, 24622000, "Neptune", "blue"));

extraObjects.push(makeBody(false, -2e9, 0, 0, 9.108e4, 9.945e29, 74085000, "1Sun", "yellow"));
extraObjects.push(makeBody(false, 2e9, 0, 0, -9.108e4, 9.945e29, 74085000, "2Sun", "yellow"));

planetsInstance(solarSystem.slice(0, 5));