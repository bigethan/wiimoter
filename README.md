Class: Wiimoter
=======================

A Class that enables use of the Wiiremote data to interact 
with webpage elements when viewed through the wii browser.
Can be used to directly query data from the wiimote, or 
attach 'watching' events to a page element so that when 
the pointer is in the element the wiiremote will be
polled, and events on the page can be triggered.

The trending functions are quite rough around the edges.
I've found that the opera browser is a bit too slow
to run the update at a fast interval, so they didn't get much
love.  Eg: the returning of Strings is questionable.



### Implements

* [Options][]

### Syntax

	new Wiimoter([wiimoted [,options]);

### Arguments

1. wiimoted - (*array*) an array of mootools elements, eg: $$('.wiimoted').  Optional, if you are going to use the class as a container for the data functions
2. options - (*object*) a key/value set of options

### Options

* closeOnMouseleave - (*boolean*) Default: true. The wiimote functions for that element should not be fired if the pointer leaves the element. Assumes that you'll close it yourself later.  This is handy for situations where it's best to have the whole screen available

* replaceCurrent - (*boolean*) Default: false. When a new watching process begins, kill off other watching processes

* distanceBuffer - (*integer*) Default .03.  the distance in meters that the wiimote must travel before a 'distance' event is fired

* rotationBuffer - (*integer*) Default 5. Degrees the wiimote must twist before a rotation event is fired

* lateralBuffer - (*integer*) Default 50. Pixels the wiimote pointer must cover horizontally before a lateral event is fired

* verticalBuffer - (*integer*) Default 25. Pixels the wiimote pointer must cover vertically before a vertical event is fired

* watchRepeat - (*integer*) Default 100.  Miliseconds between polling calls to the wiimote.  The buffer values must be reached within this time limit in order to fire.

* rotationAdjust - (*integer*) Default 50.  Percent that the rotation values should be adjusted for ease of twisting. Lower values require more turning.


### Events Fired

* onShow - (*function*) callback to execute when the waiting layer is shown; passed the target element to which the [Wiimoter][] was attached
* onHide - (*function*) callback to execute when the waiting layer is hidden; passed the target element to which the [Wiimoter][] was attached


### Example 1: Basic button trapping

	<div id="myElement">...</div>
	
	new Wiimoter('myElement');
	$('myElement').addEvent('wiiDpadUp', function(){...});

### Example 2: Interactions

	<div id="myElement">...</div>
	
	new Wiimoter('myElement',{rotationAdjust : 100});
	$('myElement').addEvent('wiiLateralShake', function(){...})
	               .addEvent('wiiCounterClockWise', function(){...});
	               
### Example 3: Getting the Wiiremote data directly

    var remoteData = new Wiimoter();
    var distanceFromScreen = remoteData.getUpdate.dpdDistance;
    

Wiimoter Method: onWii
--------------------------------------

checks to see if the user is browsing on a Wii by checking for some wii browser only javascript methods.

### Syntax

	myWiimoter.onWii

### Arguments

None

### Returns

* (*boolean*) false if they're ot on a Wii

Wiimoter Methods: button|dpad 
------------------------------------

returns the key code for the various buttons & dpad options on the wiimote

### Syntax

	myWiimoter.buttonA

### Arguments

None

### Returns

* (*integer*) The key code number of the wii button.

Wiimoter Method: addWatchers 
----------------------------------

Attaches watchers to elements that will start to run when the wii mouse hand enters the element.

### Syntax

	myWiimoter.addWatchers(wiimoted);
	
### Arguments

* wiimoted - Element or Array of Elements

### Returns

* No return value

Wiimoter Method:   startWatching 
------------------------------------
starts tracking the wiimote, and fires events on the element when they are triggered. called by addWatchers.

### Syntax

	myWiimoter.startWatching(event, ele);

###Arguments

* event - the event to watch for
* ele - the element in question

### Returns

* No return value

Wiimoter Method: buttonIntercept 
-------------------------------------
Fires the button events on the element in question, returns false in order
to prevent the default action of a keydown

### Syntax

    Called internally byt the class in the startWatching method:
    //capture keypresses
    $(document).addEvent('keydown', this.buttonIntercept.bind(this));

###Arguments

* event - the event to watch for

### Returns

* (*boolean*) false

Wiimoter Method: getUpdate 
-------------------------------------
Returns the raw data from the wiimote in charge. This is
the data parsed by updateWiimote, and used to update the trends.


## Syntax

    Wiimoter.getUpdate();

### Returns

* (*mixed*) false if no wiimote is found, or the remote object

Wiimoter Method: getWiiTilt 
-------------------------------------
returns the radian tilt of the wiimote. Can be called directly
and is also called by updateWiimote(). Easier to work with than the 
raw rotation data returned by the wii.

### Syntax

    Wiimoter.getWiiTilt()
    
### Returns

* (*float*)  
    
Wiimoter Method: distanceTrend 
-------------------------------------
Once updateWiimote has been called more than once, returns
whether the wiimote is closer or further than it was at the last
check.  Returns strings "Further", "Closer", "SameDistance" to make 
code easier to read.  This method also uses the Wiimoter.distanceBufer
variable to smooth out the data a bit.

### Syntax

    if (Wiimoter.distanceTrend() === 'Further') { ... }
    
### Returns

* (*string*)
    
Wiimoter Method: rotationTrend 
--------------------------------------
Once updateWiimote has been run twice, it'll return the way that the wiimote
is rotating since the last measurement.  Returns strings "Clockwise",
"CounterClockwise" and "NoRotation". This method also uses the Wiimoter.rotationBufer
variable to smooth out the data a bit.

### Syntax

    if (Wiimoter.rotationTrend() === "NoRotation") { ... }

### Returns

* (*string*)

Wiimoter Method: lateralTrend 
---------------------------------------
Once updateWiimote has been run twice, this method will return
which direction on the screen the wiimote pointer has moved since 
the last update. Returns strings "Right", "Left, and "NoLateral"
Uses the lateralBuffer to make the data a bit more reliable

## Syntax

    if (Wiimoter.lateralTrend() === "Right") { ... }
    
### Returns

* (*string*)
    
Wiimoter Method: verticalTrend 
---------------------------------------
Once updateWiimote has been run twice, this method will return
which direction on the screen the wiimote pointer has moved since 
the last update. Returns strings "Up", "Down, and "NoVertical"
Uses the verticalBuffer to make the data a bit more reliable

## Syntax

    if (Wiimoter.verticalTrend() === "Down") { ... }
     
### Returns

* (*string*)

Wiimoter Method: remove 
-----------------------------------------
Remove the running Wiimoter from an element

### Syntax

    $(ele).addEvent('mouseleave', Wiimoter.remove);
    
### Returns

* No return value
    
Wiimoter Method: reset 
----------------------------------
reset the shake tracking and the trend watchers

### Syntax

    Wiimoter.reset();
    
### Returns

* No return value
