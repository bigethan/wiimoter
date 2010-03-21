/*jslint white: true, browser: true, onevar: true, undef: true, nomen: true, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, newcap: true, immed: true */

/*global $:false, Class:false, Options:false, window:false, opera:false */

/**
 *  A Class that enables use of the Wiiremote data to interact with webpage elements.
 *  Can be used to directly query data from the wiimote, or attach 'watching' events
 *  to a page element so that when the pointer is in the element the wiiremote will be
 *  polled, and events on the page can be triggered.
 *
 *  License:
 *  http://www.opensource.org/licenses/mit-license.php
 *  
 *  Author:
 *  http://www.github.com/bigethan
 *  e@bigethan.com
 **/

var Wiimoter = new Class({

    Implements : [Options],

    /* the buffers are used to determine whether an action has happeend
     * eg: a 45 pixel horizontal shift  won't fire the
     * 'has moved left' event, but a 51 pixel move will.
     * also take into effect the repeat timing.  How fast do you have
     * to move the wiimote to reach the buffer distance in the
     * time between wiimote polls.
     */
    options : {
        closeOnMouseleave:   true, //stop the wiimoter when the mouse leaves
        replaceCurrent: false, //replace a running wiimoter with a new wiimoter
        distanceBuffer : 0.03, //meters
        rotationBuffer : 5, //degrees
        lateralBuffer : 50, //pixels
        verticalBuffer : 25, //pixels
        watchRepeat: 100, //ms interval for wimote polling while active
        rotationAdjust: 50 //
    },

    /* wiimoted is an array of mootools elements
     * that when the pointer goes over, will fire
     * their wiimote events (if the conditions are met)
     */
    initialize: function (wiimoted, options) {
        if (options) {
            this.setOptions(options);
        }
        if (wiimoted) {
            this.addWatchers(wiimoted);
        }
    },

    onWii: window.opera && opera.wiiremote ? true : false,

    /* buttons work in Wii and in non Wii
     * for no wii, just use the keyboard equivalents / arrow keys
     */
    buttonA: this.onWii ? 13 : 65,
    buttonB: this.onWii ? 171 : 66,
    buttonC: this.onWii ? 201 : 67,
    buttonZ: this.onWii ? 200 : 90,
    button1: this.onWii ? 172 : 49,
    button2: this.onWii ? 173 : 50,
    buttonMinus: this.onWii ? 170 : 109,
    buttonPlus: this.onWii ? 174 : 107,
    dpadUp: this.onWii ? 175 : 38,
    dpadDown: this.onWii ? 176 : 40,
    dpadRight: this.onWii ? 177 : 39,
    dpadLeft: this.onWii ? 178 :37,

    /* store the "shake data" in these
     */
    lateralHistory: {},
    verticalHistory: {},

    /* adds the watching event
     */
    addWatchers: function (wiimoted) {
        wiimoted.each(function (ele) {
            ele.addEvent('mouseenter', this.startWatching.bindWithEvent(this, ele));
        }, this);
    },

    /* starts tracking the wiimote, and fires events
     * on the element when they are triggered
     */
    startWatching: function (event, ele) {

        //replace the running wiimoter, or dissalow the new one
        //can't do two at a time.
        if (this.options.replaceCurrent && this.watchTimer && ele.target !== this.ele) {
            this.remove();
        } else if (this.watchTimer) {
            return;
        }
        //the current element being wiimoted
        this.ele = ele;
        //only the wiimote stuff is exclusive to the wii
        //the other stuffis just buttonpresses
        if (this.onWii) {
            //start watching wiimote action
            this.watchTimer = setInterval(function () {
                this.updateWiimote.bind(this);
            }, this.options.watchRepeat);
        }
        //capture keypresses
        $(document).addEvent('keydown', this.buttonIntercept.bind(this));

        //remove the events if requested
        if (this.options.closeOnMouseleave === true) {
            this.ele.addEvent('mouseleave', this.remove.bind(this));
        }

    },

    /* polls the wiimote, and then fires wiimote related events on the element
    */
    updateWiimote: function () {
        var distanceTrend, rotationTrend, lateralTrend, verticalTrend;
        if (this.remote) {
            this.remotePrev = this.remote;
        }

        this.remote = this.getUpdate();
        this.remote.wiiTanRotation = Math.round((Math.atan2(this.remote.dpdRollY,
            this.remote.dpdRollX) * this.options.rotationAdjust) / Math.PI);
        if (this.remotePrev && this.ele) {

            //distance -- the .05 seems to give the best sensitivity
            distanceTrend = this.distanceTrend(this.remotePrev, this.remote);
            this.ele.fireEvent('wii' + distanceTrend, this.remote.dpdDistance);

            //rotating
            rotationTrend = this.rotationTrend(this.remotePrev, this.remote);
            this.ele.fireEvent('wii' + rotationTrend, this.remote.wiiTanRotation);

            //lateral movement
            lateralTrend = this.lateralTrend(this.remotePrev, this.remote);
            this.ele.fireEvent('wii' + lateralTrend, this.remote.dpdScreenX);

            //horizontal shake
            if (this.lateralHistory.Right >= 2 && this.lateralHistory.Left >= 2) {
                this.ele.fireEvent('wiiLateralShake', this.lateralHistory);
                this.lateralHistory = {};
            }

            //vertical movement
            verticalTrend = this.verticalTrend(this.remotePrev, this.remote);
            this.ele.fireEvent('wii' + verticalTrend, this.remote.dpdScreenY);

            //vertical shake
            if (this.verticalHistory.Up >= 2 && this.verticalHistory.Down >= 2) {
                this.ele.fireEvent('wiiVerticalShake', this.verticalHistory);
                this.verticalHistory = {};
            }

            //fire the raw data
            this.ele.fireEvent('wiiAllData', {prev: this.remotePrev, live: this.remote});

        }

        //give the raw data so that this.watch can be called manually
        return {prev: this.remotePrev, live: this.remote};
    },

    /* fires the button events on the element in question
     */
    buttonIntercept: function (event) {

        switch (event.code) {
        case(this.buttonA) : 
            this.ele.fireEvent('wiiButtonA');
            break;
        case(this.buttonB) : 
            this.ele.fireEvent('wiiButtonB');
            break;
        case(this.buttonC) : 
            this.ele.fireEvent('wiiButtonC');
            break;
        case(this.buttonZ) : 
            this.ele.fireEvent('wiiButtonZ');
            break;
        case(this.button1) : 
            this.ele.fireEvent('wiiButton1');
            break;
        case(this.button2) : 
            this.ele.fireEvent('wiiButton2');
            break;
        case(this.buttonMinus) : 
            this.ele.fireEvent('wiiButtonMinus');
            break;
        case(this.buttonPlus) : 
            this.ele.fireEvent('wiiButtonPlus');
            break;
        case(this.dpadUp) : 
            this.ele.fireEvent('wiiDpadUp');
            break;
        case(this.dpadDown) : 
            this.ele.fireEvent('wiiDpadDown');
            break;
        case(this.dpadRight) : 
            this.ele.fireEvent('wiiDpadRight');
            break;
        case(this.dpadLeft) : 
            this.ele.fireEvent('wiiDpadLeft');
            break;
        }
        return false;

    },

    /* get the data from the wiimote in charge
     */
    getUpdate : function () {
        var i, remote;
        for (i = 0; i < 4; i + 1) {
            remote = opera.wiiremote.update(i);
            if (remote.isBrowsing) {
                return remote;
            }
        }
        return false;
    },


    /* calculate the radian tilt of the wiimote
     */
    getWiiTilt : function () {
        var wiiData, radianRotation;
        wiiData = this.getUpdate();
        radianRotation = Math.atan2(wiiData.dpdRollY, wiiData.dpdRollX);
        return radianRotation;
    },

    /* called by the updateWiimote funtion
     * returns the distnace trend of the wiimote (how far from the screen)
     */
    distanceTrend: function (prev, current) {
        var trend = '';
        if (prev.dpdDistance + this.distanceBuffer < current.dpdDistance) {
            trend = 'Further';
        } else if (prev.dpdDistance - this.distanceBuffer > current.dpdDistance) {
            trend = 'Closer';
        } else {
            trend = 'SameDistance';
        }
        return trend;
    },

    /* called by the updateWiimote function
     * is the wiimote rotation in a direction?
     */
    rotationTrend: function (prev, current) {
        var trend = '';
        if (prev.wiiTanRotation + this.rotationBuffer < current.wiiTanRotation) {
            trend = 'Clockwise';
        } else if (prev.wiiTanRotation - this.rotationBuffer > current.wiiTanRotation) {
            trend = 'CounterClockwise';
        } else {
            trend = 'NoRotation';
        }
        return trend;
    },

    /* called by the updateWiimote function
     * is the wiimote moving in a horizontal direction
     * this is also used to fire the horizontal shake event
     */
    lateralTrend: function (prev, current) {
        var trend = '';
        if (prev.dpdScreenX + this.lateralBuffer < current.dpdScreenX) {
            trend = 'Right';
        } else if (prev.dpdScreenX - this.lateralBuffer > current.dpdScreenX) {
            trend = 'Left';
        } else {
            trend = 'NoLateral';
            this.lateralHistory.Left = 0;
            this.lateralHistory.Right = 0;
        }
        this.lateralHistory[trend] = this.lateralHistory[trend] > 0 ? this.lateralHistory[trend] + 1 : 1;
        return trend;
    },

    /* called by the updateWiimote function
     * is the wiimote moving in a vertical direction
     * used to fire the vertical shake event
     */
    verticalTrend: function (prev, current) {
        var trend = '';
        if (prev.dpdScreenY + this.verticalBuffer < current.dpdScreenY) {
            trend = 'Down';
        } else if (prev.dpdScreenY - this.verticalBuffer > current.dpdScreenY) {
            trend = 'Up';
        } else {
            trend = 'NoVertical';
            this.verticalHistory.Down = 0;
            this.verticalHistory.Up = 0;
        }
        this.verticalHistory[trend] = this.verticalHistory[trend] > 0 ? this.verticalHistory[trend] + 1 : 1;
        return trend;
    },

    /* remove the running Wiimoter from an element
     */
    remove: function () {
        clearInterval(this.watchTimer);
        //can't individually clear the functions, as they are called and
        //bound differently.  Could cause trouble.
        $(document).removeEvents('keydown');
        this.ele.removeEvents('mouseleave');
        this.watchTimer = false;
    },

    /* reset the shake tracking and the trend watchers
     */
    reset : function () {
        this.verticalHistory = {};
        this.lateralHistory = {};
        this.remotePrev = false;
    }
});