/**
 Tori Becks' Redd Hott Bott
 Current version: 1.7920beta
 Cut.Copied.Pasted.Plagiarised.Altered.Expanded.Improved by (RedLight.r!0t)
    - Forked from base code designed by scottp13 (ScottBot/Hades) a derivative of Ultrabot
**/

// User settings
cb.settings_choices = [
    {name:'sNotice1', label:'Periodic notice 1 (or blank)',
        type: 'str', defaultValue: '',
        required: false},
    {name:'sNotice2', label:'Periodic notice 2 (or blank)',
        type: 'str', defaultValue: '',
        required: false},
    {name:'sNotice3', label:'Periodic notice 3 (or blank)',
        type: 'str', defaultValue: '',
        required: false},
    {name:'sNotice4', label:'Periodic notice 4 (or blank)',
        type: 'str', defaultValue: '',
        required: false},
    {name:'sNotice5', label:'Periodic notice 5 (or blank)',
        type: 'str', defaultValue: '',
        required: false},

    {name: 'sVipLogo', label: 'Display graphic for Fan Club / VIP messages?',
        type: 'choice', choice1: 'Yes', choice2: 'No', defaultValue: 'No'},
    {name: 'sVipUsers', label: 'VIP users (exact names separated by spaces)',
        type: 'str', defaultValue: '',
        required: false},
    {name: 'nVipTip', label: 'Tip amount to become a VIP (0 to disable)',
        type: 'int', minValue: 0, maxValue: 10000, defaultValue: 0},


    {name: 'sTipTitles', label: 'Display users\' tip totals and crown?',
        type: 'choice', choice1: 'Yes', choice2: 'No', defaultValue: 'Yes'},
    {name: 'nKingMin', label: 'Minimum tip total for a user to become King',
        type: 'int', minValue: 1, maxValue: 1000, defaultValue: 50},
    {name: 'sLeaderboard', label: 'Use the Leaderboard feature?',
        type: 'choice', choice1: 'Yes', choice2: 'No', defaultValue: 'Yes'},

    {name: 'sEntryMessage', label: 'Message to user entering room (blank to disable)',
        type: 'str', minLength: 1, maxLength: 1000,
        defaultValue: 'Welcome to my room!',
        required: false},
    {name: 'sTipMessage', label: 'Message to thank tipper (blank to disable)',
        type: 'str', minLength: 1, maxLength: 1000,
        defaultValue: 'Thank you!',
        required: false},
    {name: 'nTipMessageMin', label: 'Minimum tip to trigger thanks message',
        type: 'int', minValue: 1, maxValue: 10000, defaultValue: 25},
    {name: 'sWhisperOn', label: 'Allow Mods to send you whisper messages?',
        type: 'choice', choice1: 'Yes', choice2: 'No', defaultValue: 'Yes'},
    {name: 'sCrazyOn', label: 'Allow Mods to send notices? (Pick \'No\' if using CrazyNote)',
        type: 'choice', choice1: 'Yes', choice2: 'No', defaultValue: 'No'},
    {name: 'enableWordList', label: 'Block certain words from being used in your chat? (default: Yes', 
        type: 'choice', choice1: 'Yes', choice2: 'No', defaultValue: 'Yes'},
    {name: 'wordBlockList', label: 'Enter the words that you want Blocked separated by commas with no spaces. (example: fuck,cunt,shit)', 
        type: 'str', minLength: 1, maxLength: 1000, defaultValue: 'slut,whore,pussy,cock,dick,anal,ass,boobs,bimbo,ho,cunt,bitch,fuck,camwhore,cumslut,cum,jizz,jackoff,cumwhore,camslut', required: false}
        ];


// Variables
// Boolean variables for enable/disable of room functions
var bTipTitles = false;     // Tip titles & king feature enable/disable
var bLeaderboard = false;   // Leader board feature enable/disable
var bWhisper = false;       // Enable/disable whisper messages to model
var bFilter = false;        // Enable/disable advanced filtering features
var bCrazyMode = false;     // Enable/disable CrazyNote command mode
var bVipLogo = false;       // Enable/disable logo on Fan Club Member messages

// Arrays
var wordListArray = [];

// Utilities object
// Shouldn't depend on any other objects
var sbUtil = {
    pad: function(num, length) {
        // Pad a number with leading zeros to length
        var s = '0000' + num;
        return s.substr(s.length - length);
    },
    duration: function(start) {
        // Return a formatted string with the duration since a start time.
        // While this is a time function, it is in utils because it doesn't
        // depend on object variables or other objects.
        var float_min = (Date.now() - start) / 60000;
        var hours = this.pad(Math.floor(float_min / 60), 2);
        var mins = this.pad(Math.floor(float_min % 60), 2);
        return hours + 'h ' + mins + 'm';
    },
    indexOf: function(s, a, b) {
        // Search for first element which exactly matches string 's' in string
        // array 'a', or object array 'a' with property string 'b'.
        // Returns the array index of a match or -1.
        var i; // Loop index
        if (typeof b === 'undefined') {
            b = '';
        }
        for (i = 0; i < a.length; i += 1) {
            if ((b ? a[i][b] : a[i]) === s) {
                return i;
            }
        }
        return -1;
    },
    search: function(s, a, b) {
        // Search for elements which start with string 's' in string array 'a',
        // or object array 'a' with property string 'b'.
        // Returns the array index of a match or -1.
        // Matching rules:
        //   If an exact match is found, search stops & index is returned
        //   If a single partial match is found, index is returned
        //   If multiple partial matches are found, -1 is returned
        //   If no matches are found, -1 is returned
        // Therefore all elements must be checked if there are no matches or
        // one partial match.
        var i;      // Loop index
        var m = -1; // Match index
        var e;      // Element of array
        if (typeof b === 'undefined') {
            b = '';
        }
        for (i = 0; i < a.length; i += 1) {
            e = b ? a[i][b] : a[i];
            if (e.indexOf(s) === 0) {
                // At least a partial match
                if (e.length === s.length) {
                    // Exact match always wins
                    return i;
                }
                if (m < 0) {
                    m = i;
                } else {
                    // Multiple matches, so give up
                    return -1;
                }
            }
        }
        return m;
    },
};


// Admin object
// We can't use notice functions here without a circular dependency,
// which doesn't really bother javascript, but makes the code analysis tools
// complain.
var sbAdmin = {

    isAdmin: function(user) {
        // Does user have admin rights for this bot?
            return (user === cb.room_slug);
    },
};

/**
 * Output object
 * DEPENDS ON sbAdmin (in some configurations)
 **/
var sbOut = {
    sendUb: function(msg, user) {
        // Send an UltraBot style notice to user (can be '' for all)
        cb.sendNotice(msg, user, '#e4abed', '#000000');
    },
    sendBold: function(msg, user) {
        // Send a bold notice to user (can be '' for all)
        cb.sendNotice(msg, user, '', '', 'bold');
    },
    sendModelMod: function(msg) {
        // Send a plain notice to the Model and all Mods
        msg = '(To Mods & Model) ' + msg;
        cb.sendNotice(msg, '', '', '', '', 'red');
        cb.sendNotice(msg, cb.room_slug);
    },
    sendPmm: function(msg, sender) {
        // Send a whisper message to the model through chat (if enabled)
        if (bWhisper) {
            if (msg) {
                cb.sendNotice('(Private from ' + sender + ') ' + msg, cb.room_slug,
                    '#fbfcb6', '#dc0000', 'bold');
                this.sendBold('Your message was sent to ' + cb.room_slug, sender);
            }
        } else {
            this.sendBold('The Model has disabled this feature', sender);
        }
    },
    sendPublic: function(text, sender, command) {
        // Send a notification to chat and let the Model know who sent it.
        // The sending command is parsed here to determine the style... less
        // flexible but more efficient.
        if (text) {
            switch (command) {
                case '/cnh':
                    cb.sendNotice('\u2600 ' + text, '', '#eafcfc',
                        '#ab0722', 'bold');
                    break;
                case '/cnd':
                    cb.sendNotice('\u2606 ' + text, '', '', '#dc0000', 'bold');
                    break;
                case '/cndh':
                    cb.sendNotice('\u2764 ' + text, '', '', '#dc0000', 'bold');
                    break;
                default:
                    cb.sendNotice('\u2724 ' + text, '', '', '#4a96d0', 'bold');
                    break;
            }
            this.sendBold('Public notice was sent by ' + sender, cb.room_slug);
        }
    },
    sendModChat: function(msg, sender, inc_model) {
        // Send a notification to Mods as a group, optionally including the Model
        // The caller should do any sender validation or message filtering
        var out;
        if (msg) {
            out = '(To Mods ' + (inc_model ? '& Model ' : '') + 'from ' + sender +
                ') ' + msg;
            cb.sendNotice(out, '', '#fbfcb6', '#dc0000', 'bold', 'red');
            if (inc_model) {
                cb.sendNotice(out, cb.room_slug, '#fbfcb6', '#dc0000', 'bold');
            } else if (sender === cb.room_slug) {
                // Model sending to mods but not herself, tell her it was sent
                this.sendBold('Your message was sent to all Mods', sender);
            }
        }
    },
    sendSplash: function(user, inc_extra) {
        // Send bot splash message to user (can be '' for all)
        // If inc_extra is true, extra info will be included for Mods
        var out =
            'ScottBot 2018.02.08 by scottp13' +
            '\nScottBot is a room control bot that uses UltraBot commands. ' +
            'For more information, type /ubhelp';
        if (inc_extra) {
            if (bCrazyMode) {
                out += '\nReddHotBot notices are enabled. CrazyNote commands ' +
                    'may be used to send notices.';
            } else if (bWhisper) {
                out +=
                    '\nReddHotBot /pmm lets Mods send whisper messages to the model. ' +
                    'For more info, type /ubhelp pmm';
            }
        }
        this.sendBold(out, user);
    },
};

// Tip object
// DEPENDS ON sbOut
var sbTip = {
    // Tippers are added to an array of objects
    //  sUser  = user who has tipped
    //  nTotal = total amount user has tipped
    oList: [],
    bSorted: true,  // Is the list currently sorted?
    sKing: '',      // Name of the user who is currently high tipper
    nKing: 0,       // Value of the current high tip total
    nKingMin: 50,   // Minimum tip total to become king
    nMsgMin: 25,    // Minimum tip to receive thanks message

    // These can be tracked without using oList, even when tip titles and
    // leaderboard are disabled
    nTotal: 0,      // Total tip value recorded since bot start
    nCount: 0,      // Total number of tips recorded since bot start
    sLarge: '',     // Name of the user with the largest individual tip
    nLarge: 0,      // Value of the largest individual tip

    // Most of these functions should only be called if tip titles or
    // leaderboard is enabled. The exception is addTip.
    addTip: function(user, amount) {
        // Add the amount to some tip statistics which do not require tracking
        // individual tip totals
        this.nTotal += amount; // Total tip value
        this.nCount += 1;      // Number of tips
        if (amount > this.nLarge) {
            // Largest individual tip, not to be confused with largest tip total
            this.sLarge = user;
            this.nLarge = amount;
        }
    },
    userTotal: function(user) {
        // Return the amount the user has tipped
        var i = sbUtil.indexOf(user, this.oList, 'sUser');
        if (i > -1) {
            return this.oList[i].nTotal;
        }
        return 0;
    },
    addUser: function(user, amount) {
        // Add tip to the tipper list, returning the user's updated total.
        // Using this feature is optional, so nTotal must be updated separately.
        var i;

        // Adding a tip means the list is no longer sorted
        this.bSorted = false;

        // See if this user already has an entry
        i = sbUtil.indexOf(user, this.oList, 'sUser');
        if (i < 0) {
            // User is not in list so add them
            this.oList.push({sUser: user, nTotal: amount});
            return amount;
        } else {
            // Update the user's tip total
            this.oList[i].nTotal += amount;
            return this.oList[i].nTotal;
        }
    },
    sortList: function() {
        // Sort the tipper list if necessary
        if (!this.bSorted) {
            this.oList.sort(function(a, b) {
                // Reverse sort on tip totals
                return b.nTotal - a.nTotal;
            });
            this.bSorted = true;
        }
    },
    showDebug: function(mod) {
        // Previously displayed complete tipper list to the specified mod, but
        // that is no longer needed with the full leaderboard, so this is just
        // a debug leftover
        sbOut.sendBold('length=' + this.oList.length + ' nTotal=' + this.nTotal +
            ' nCount=' + this.nCount + ' nLarge=' + this.nLarge, mod);
    },
    showLeaders: function(places, user) {
        // Display the leaderboard (call only if leaderboard is enabled)
        // places = number of places to display
        // user   = destination for notice, can be '' for all
        var i;
        var out = '';
        if (!this.oList.length) {
            sbOut.sendUb('No tips yet', user);
            return;
        }
        this.sortList(); // Sort if necessary
        for (i = 0; i < places && i < this.oList.length; i += 1) {
            out +=  (i ? '\n ' : ' ') + (i + 1) + '. ' + this.oList[i].sUser + ': ' +
                this.oList[i].nTotal;
        }
        sbOut.sendUb('Leaderboard. To see the top 10, type /leaderboard', user);
        cb.sendNotice(out, user);
    },
    getStats: function() {
        // Return a formated string with tip statistics
        var out = 'Stats (shown only to you): ';
        if (this.oList.length) {
            out += this.oList.length + ' tippers \u25cf ';
        }
        out += this.nCount + ' individual tips \u25cf ' + this.nTotal +
            ' total tokens ($' + (this.nTotal * 0.05).toFixed(2) + ')\n';
        if (this.sKing && this.nTotal) {
            out += 'High tipper: ' + this.sKing + ' = ' + this.nKing +
                ' tokens (' + (this.nKing / this.nTotal).toFixed(2) * 100 +
                '% of total) \u25cf ';
        }
        if (this.sLarge && this.nLarge) {
            out += 'Largest tip: ' + this.sLarge + ' = ' + this.nLarge + ' tokens\n';
        }
        return out;
    }
};
// VIP object
// Normally we prefer object literals, but some versions of this bot support
// multiple VIP lists, so we'll use a constructor/prototype object here.
// DEPENDS ON sbOut
function SbVip(name) {
    // Constructor
    this.sName = name;   // Name of this VIP list / fan club
    this.sUser = [];     // Users who are VIPs
    this.nInitCount = 0; // Initial VIP count (to keep track of additions)
    this.nTip = 0;       // Single tip amount to join this VIP list
}
SbVip.prototype.isVip = function(user) {
    // Is the user on the VIP list?
    return (this.sUser.indexOf(user) > -1);
};
SbVip.prototype.showList = function(mod) {
    // Show the VIP list to a Mod in a CrazyTicket compatible format
    var i;
    var output;
    if (this.sUser.length) {
        output = 'This list can be used with CrazyTicket /add if desired:\n';
        for (i = 0; i < this.sUser.length; i += 1) {
            output += this.sUser[i] + ' ';
        }
    } else {
        output = 'There are no VIPs yet';
    }
    sbOut.sendBold(output, mod);
};
SbVip.prototype.addUser = function(user) {
    // Add a name to the VIP list, preventing duplicates, and providing
    // notification to the room about the new VIP. This is a very basic
    // implementation. It should be overriden in the object instance for
    // anything nicer.
    if (!this.isVip(user)) {
        this.sUser.push(user); // Add to list
        // For base bot, we only show a message if a new user is joining,
        // not if the are already on the list
        cb.sendNotice('We have a new VIP!\nWelcome ' + user + '!',
            '', '', '#00a000', 'bold');
    }
};
SbVip.prototype.getNew = function() {
    // Return a formatted string with any new VIPs (assumes VIPs can't be
    // removed during show)
    var out = '';
    var i;
    if (this.sUser.length > this.nInitCount) {
        out += 'Please add these new ' + this.sName + ' to your list:\n';
        for (i = this.nInitCount; i < this.sUser.length; i += 1) {
            out += this.sUser[i] + ' ';
        }
    }
    return out;
};
SbVip.prototype.parseInit = function(list) {
    // Parse the initial VIP list as provided by the setup screen. The list
    // is officially separated by spaces, but we will also accept separated
    // by commas.
    var vip_split = [];
    var vip_tmp;
    var i;
    if (list) {
        vip_split = list.split(/[ ,]+/);
        for (i = 0; i < vip_split.length; i += 1) {
            vip_tmp = vip_split[i].trim().toLowerCase();
            if (vip_tmp) {
                this.sUser.push(vip_tmp);
            }
        }
        this.nInitCount = this.sUser.length; // Helps detect new members later
    }
};
SbVip.prototype.checkTip = function(user, tip_val) {
    // Check a user's tip value and addUser them if necessary
    // If nTip is 0, tip-to-join is disabled. Since tip shouldn't be zero, we
    // shouldn't have to check that explicitly... but we do anyway.
    if (this.nTip && tip_val === this.nTip) {
        this.addUser(user);
    }
};
SbVip.prototype.setTip = function(tip_val) {
    // Set the tip-to-join value for this VIP list
    this.nTip = tip_val;
};

// Create the single VIP instance that is supported by all bot variations
var sbVip = new SbVip('VIP users');



// Time object
// DEPENDS ON sbUtil, sbOut, sbTip
var sbTime = {
    tBotStart: 0,   // Timestamp which bot was started
    nMinute: 0,     // Minute counter for interval timer
    nRotInv: 2,     // Rotation interval in minutes
    nCountdown: 0,  // Countdown timer intervals remaining
    bCancel: false, // True when a countdown timer cancel is pending
    sDay: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    sNotice: [],    // Array of rotating notices
    nNotice: 0,     // Index into rotating notices

    duration: function(start) {
        // Return a formatted string with the duration since a start time
        var float_min = (Date.now() - start) / 60000;
        var hours = sbUtil.pad(Math.floor(float_min / 60), 2);
        var mins = sbUtil.pad(Math.floor(float_min % 60), 2);
        return hours + 'h ' + mins + 'm';
    },
    botDuration: function() {
        // Return a formatted string with the duration the bot has been running
        return sbUtil.duration(this.tBotStart);
    },
    getUTCTod: function(date_obj) {
        // Return a formatted string containing a labeled 24 hour based UTC
        // time of day from a given local time date object or from 'now'
        if (typeof date_obj === 'undefined') {
            // If no date was provided, use now
            date_obj = new Date();
        }
        return sbUtil.pad(date_obj.getUTCHours(), 2) + ':' +
            sbUtil.pad(date_obj.getUTCMinutes(), 2) + ' UTC';
    },
    getTod: function(date_obj) {
        // Return a formatted string containing the time of day (only) from
        // a given Date object or from 'now'
        var hour; // Calculated hour
        var ind;  // Calculated AM/PM indicator (Americans seem to like this)
        if (typeof date_obj === 'undefined') {
            // If no date was provided, use now
            date_obj = new Date();
        }
        hour = date_obj.getHours();
        ind = (hour > 11 ? ' PM' : ' AM');
        if (hour > 12) {
            hour -= 12;
        } else if (hour === 0) {
            hour = 12;
        }
        return hour + ':' + sbUtil.pad(date_obj.getMinutes(), 2) + ind;
    },
    getWorldTime: function() {
        // Return a formatted string containing the current day and time of
        // day for multiple timezones. Assumes that the CB server is returning
        // US west coast time. We could check the timezone offset, but this
        // should vary during different times of year... strangely, it seems
        // like CB stays on daylight saving time; see hack below.
        var out;
        var cb_date = new Date(); // CB server date and time
        out = '\u2217 ' + this.getUTCTod(cb_date);
        //cb_date.setTime(cb_date.getTime() - 3600000); // FIXME Hack for CB time
        out += ' \u2217 US West = ' + this.sDay[cb_date.getDay()] +
            ' ' + this.getTod(cb_date) + ' \u2217 US East = ';
        cb_date.setTime(cb_date.getTime() + 10800000); // Advance by 3 hours
        out += this.sDay[cb_date.getDay()] + ' ' + this.getTod(cb_date);
        return out;
    },
    doIntervalCB: function() {
        // Called every minute to check on things and do updates
        this.nMinute += 1;

        // Leaderboard every 5 minutes
        if ((this.nMinute % 5) === 0 && bLeaderboard && sbTip.oList.length) {
            sbTip.showLeaders(3, ''); // Show 3 places to entire room
        }

        // Rotating notifier every few minutes. This is dynamic based on the
        // number of notices, and with a slight offset to try and miss the
        // leaderboard messages.
        if ((this.nMinute % this.nRotInv) === 1 && this.sNotice.length) {
            // Since we pushed, there should be no gaps, even if there were some
            // in the GUI. But check that it's valid, just in case.
            if (this.sNotice[this.nNotice]) {
                cb.sendNotice(this.sNotice[this.nNotice], '', '', '#154ada', 'bold');
            }
            this.nNotice += 1;
            if (this.nNotice >= this.sNotice.length) {
                this.nNotice = 0;
            }
        }

        cb.setTimeout(this.doIntervalCB.bind(this), 60000);
    },
    doCountdownCB: function() {
        // Call every minute during the countdown timer
        // Obviously, there is a potential for cumulative error here, but this
        // is a CB bot, not a missle defence system. There is also some chance
        // for a race condition due to the async events and setting and clearing
        // of timers.
        if (this.bCancel) {
            // The timer was cleared externally. That can't prevent the pending
            // event, so we try to end up here. We shouldn't let anybody start
            // a new timer until this has happened, or we could end up with
            // multiple CB timers being created.
            sbOut.sendUb('Countdown timer has stopped', '');
            this.nCountdown = 0;
            this.bCancel = false;
            return;
        }
        this.nCountdown -= 1;
        if (this.nCountdown < 1) {
            // The timer has expired
            sbOut.sendUb('****************************************\nTime is up! Countdown has finished!',
                '');
            this.nCountdown = 0;  // it should already be 0, of course
            return;
        }
        if (this.nCountdown === 30 || this.nCountdown === 10 || this.nCountdown === 5 || this.nCountdown === 2) {
            sbOut.sendUb('Countdown has ' + sbTime.nCountdown + ' minutes left', '');
        } else if (this.nCountdown === 1) {
            sbOut.sendUb('Countdown has 1 minute left', '');
        }
        cb.setTimeout(this.doCountdownCB.bind(this), 60000);
    },
    setCountdown: function(param, mod, add) {
        // Set or add to the countdown timer, starting it if needed
        // param = command parameter containing minutes
        // mod   = Mod running the command
        // add   = if true, time may be added to already running timer
        // Returns true if the timer callback should be set
        var minutes; // minutes to set or add
        var out;     // for formatted output
        if (this.nCountdown && !add) {
            sbOut.sendBold('Countdown timer is already running', mod);
            return;
        }
        if (this.bCancel) {
            sbOut.sendBold('Wait until the timer has stopped (up to 1 minute)', mod);
            return;
        }
        minutes = parseInt(param);
        if (isNaN(minutes) || minutes < 1 || minutes > 180) {
            sbOut.sendBold('Not a valid number of minutes', mod);
            return;
        }
        this.nCountdown += minutes;
        out = minutes + ' minute' + (minutes > 1 ? 's' : '');
        if (this.nCountdown > minutes) {
            // Time was added to already running timer
            out = mod + ' has added ' + out + ' to the countdown';
        } else {
            // Start the timer
            out = mod + ' has set a countdown timer for ' + out;
            cb.setTimeout(this.doCountdownCB.bind(this), 60000);
        }
        sbOut.sendUb(out, '');
    },
    clearCountdown: function(mod) {
        // Clear the countdown timer
        if (this.nCountdown < 1) {
            sbOut.sendBold('Countdown timer is not running', mod);
        } else {
            this.bCancel = true;
            this.nCountdown = 0;
            sbOut.sendUb(mod + ' has asked the countdown timer to stop', '');
        }
    },
    showCountdown: function(user, all) {
        // Display approximate time remaining on the countdown timer to a user
        // or to all users
        if (this.nCountdown < 1) {
            sbOut.sendBold('Countdown timer is not running', user);
        } else {
            sbOut.sendUb('Countdown has less than ' +
                this.nCountdown + ' minute' + (this.nCountdown > 1 ? 's' : '') +
                ' left', (all ? '' : user));
        }
    },
    parseInit: function() {
        // Parse setup screen for rotating notices
        if (cb.settings.sNotice1) {
            this.sNotice.push(cb.settings.sNotice1);
        }
        if (cb.settings.sNotice2) {
            this.sNotice.push(cb.settings.sNotice2);
        }
        if (cb.settings.sNotice3) {
            this.sNotice.push(cb.settings.sNotice3);
        }
        if (cb.settings.sNotice4) {
            this.sNotice.push(cb.settings.sNotice4);
        }
        if (cb.settings.sNotice5) {
            this.sNotice.push(cb.settings.sNotice5);
        }
        // Set rotation interval so that any particular message appears about
        // once every 10 minutes
        if (this.sNotice.length) {
            this.nRotInv = Math.round(10 / this.sNotice.length);
        }
    }
};
// Silence object
// DEPENDS ON sbOut and sbUtil
var sbSilence = {
    // Silenced users are added to an array of objects
    //  sUser   = user who is silenced
    //  sMod    = Mod who did the silencing
    //  bGrOnly = is this a graphics only block?
    //  bNinja  = is this a ninja silence?
    //  nTime   = if nonzero, time that silence should be cleared
    oList: [],
    nSilenceLevel: 0, // Minimum user level that can chat
    nGraphicLevel: 1, // Minimum user level that can use graphics
    // Recent chat usernames are stored in a sort of circular array
    sRecent: [],    // username
    nRecent: 0,     // index into array, wrapped after some number of elements

    setLevel: function(sil, s, mod, user_level) {
        // sil = true to set silencelevel, false for graphiclevel
        // s   = level to set as string; if empty, display level to the user
        // mod = user doing the setting
        // user_level = level of the mod doing the setting
        // Mods can only set the level to 0 or 1. Admins can use the full range.
        var i;
        var max = (user_level >= 4 ? 4 : 1);
        if (!s.length) {
            // No parameter, so display current level to user only
            if (sil) {
                sbOut.sendUb('The silence level is currently ' + this.nSilenceLevel +
                    ': Greys ' + (this.nSilenceLevel ? 'OFF' : 'ON'), mod);
            } else {
                sbOut.sendUb('The graphic level is currently ' + this.nGraphicLevel +
                    ': Greys ' + (this.nGraphicLevel ? 'OFF' : 'ON'), mod);
            }
            return;
        }
        i = parseInt(s);
        if ((sil ? this.nSilenceLevel : this.nGraphicLevel) <= max && i >= 0 && i <= max) {
            // Update the level and share it with the room
            if (sil) {
                this.nSilenceLevel = i;
            } else {
                this.nGraphicLevel = i;
            }
            sbOut.sendUb('The ' + (sil ? 'silence' : 'graphic') + ' level has been set to ' +
                s + ': Greys ' + (i ? 'OFF' : 'ON'), '');
        } else {
            sbOut.sendUb('You are not allowed to set that level', mod);
        }
    },
    isSilenced: function(user) {
        // Returns true if the user is fully silenced. This includes ninja
        // silencing, but not graphics only silencing or timeouts.
        var i;
        i = sbUtil.indexOf(user, this.oList, 'sUser');
        if (i > -1 && !this.oList[i].bGrOnly && !this.oList[i].nTime) {
            return true;
        }
        return false;
    },
    checkList: function(user) {
        // Check match against username & return object with silence and
        // graphic settings. Also sends user notification if needed.
        var i; // index into list
        i = sbUtil.indexOf(user, this.oList, 'sUser');
        if (i > -1) {
            if (this.oList[i].nTime && Date.now() > this.oList[i].nTime) {
                // User was in a timeout, but it has expired
                this.oList.splice(i, 1); // remove user from list
                return {sil: 0, gr: 0}; // let them chat
            }
            if (this.oList[i].bGrOnly) {
                // Graphics only silencing
                return {sil: 0,
                        gr: (this.oList[i].bNinja ? 3 : 2)};
            } else {
                // Chat silencing
                if (!this.oList[i].bNinja) {
                    sbOut.sendUb('Your message wasn\'t sent because you are ' +
                        (this.oList[i].nTime ? 'temporarily silenced' : 'silenced'),
                        user);
                }
                return {sil: (this.oList[i].bNinja ? 3 : 2),
                        gr: 0};
            }
        }
        return {sil: 0, gr: 0};
    },
    showList: function(mod) {
        // Display the silence list to a Mod
        var i;
        var output = '';
        if (this.oList.length) {
            sbOut.sendUb('Silence List:', mod);
            for (i = 0; i < this.oList.length; i += 1) {
                output += (i ? '\n' : '') +
                    this.oList[i].sUser +
                    (this.oList[i].bGrOnly ? ' (Graphics Only)' : '') +
                    (this.oList[i].bNinja ? ' (Ninja)' : '') +
                    (this.oList[i].nTime ? ' (Timeout)' : '') +
                    ' by ' + this.oList[i].sMod;
            }
            cb.sendNotice(output, mod);
        } else {
            sbOut.sendUb('Silence List is empty', mod);
        }
    },
    unUser: function(user, mod) {
        // Unsilence user and send notifications. Accepts partial usernames,
        // which will attempt to match against the silence list.
        var i;
        if (!user) {
            return; // Empty user means nothing to do
        }
        i = sbUtil.search(user, this.oList, 'sUser');
        if (i > -1) {
            // Since this could be a partial match, user might not contain the
            // complete username. Have to use this.oList[i].sUser for that.
            if (!this.oList[i].bNinja) {
                sbOut.sendUb('You have been unsilenced. Please be nice.',
                    this.oList[i].sUser);
            }
            sbOut.sendModelMod(this.oList[i].sUser + ' has been unsilenced by ' + mod);
            this.oList.splice(i, 1); // Remove from list

            // This command won't show up in chat, so would normally not be
            // logged as a recent user. But it is a potential reason to warn
            // a mod, so log it:
            this.addRecent(mod);
        } else {
            cb.sendNotice(user + ' does not need to be unsilenced', mod);
        }
    },
    silUser: function(obj) {
        // Silence a user in any number of ways and send notifications.
        // Parameter is an object to add to oList.
        // Since there's not an easy way to figure out who the user is here,
        // any user can be added to the silence list except the Model, even users
        // that do not exist. We'll figure out whether they should really be
        // silenced when the time comes.
        // The user field can be blank to display the current silence list.
        // The user field can contain a partial username, which will try to
        // match against users who have chatted recently.
        var i;   // index
        var out = ''; // part of output string
        if (!obj.sUser) {
            // If the command was sent with an empty user field, show the Mod
            // the list of currently silenced users
            this.showList(obj.sMod);
            return;
        }
        if (obj.sUser === cb.room_slug) {
            sbOut.sendUb('You can\'t do that', obj.sMod);
            return;
        }

        // Figure out who the user is and if they are currently silenced
        obj.sUser = this.matchRecent(obj.sUser); // Attempt match to recent chat
        i = sbUtil.indexOf(obj.sUser, this.oList, 'sUser'); // Check silence list
        if (i > -1 && !this.oList[i].nTimeout && !this.oList[i].bGrOnly) {
            // User is already on the list and fully silenced
            cb.sendNotice(obj.sUser + ' is already silenced', obj.sMod);
            return;
        }

        // Take action
        if (typeof obj.bGrOnly === 'undefined') {
            obj.bGrOnly = false;
        }
        if (typeof obj.bNinja === 'undefined') {
            obj.bNinja = false;
        }
        if (typeof obj.nTime === 'undefined') {
            obj.nTime = 0;
        }
        if (i > -1) {
            // Update a partially silenced user to be (probably) more silenced
            this.oList[i].bGrOnly = obj.bGrOnly;
            this.oList[i].bNinja = obj.bNinja;
            this.oList[i].nTime = obj.nTime;
        } else {
            // Add new user to list
            this.oList.push(obj);
        }

        // Notify user (UltraBot doesn't do this)
        if (!obj.bNinja) {
            if (obj.nTime) {
                sbOut.sendUb('You have been given a timeout. You will not be able to ' +
                    (obj.bGrOnly ? 'use graphics' : 'chat') + ' for a few minutes.',
                    obj.sUser);
            } else {
                sbOut.sendUb('You have been ' +
                    (obj.bGrOnly ? 'blocked from using graphics' : 'silenced'),
                    obj.sUser);
            }
        }

        // Notify Mods and Model
        if (obj.bGrOnly) {
            out += 'graphic ';
        }
        if (obj.bNinja) {
            out += 'ninja ';
        }
        if (obj.nTime) {
            out += 'timeout ';
        } else {
            out += 'bot ';
        }
        sbOut.sendModelMod(obj.sUser + ' has been ' + out + 'silenced by ' + obj.sMod);

        // This command won't show up in chat, so would normally not be
        // logged as a recent user. But it is a potential reason to warn
        // a mod, so log it:
        this.addRecent(obj.sMod);
    },
    warnUser: function(param, mod, quote) {
        // Send a warning about following the rules to a user, and notify
        // the other Mods and Model that this was done.
        // param: username which can be followed by an optional reason
        // mod:   mod doing the warning
        // quote: if true, the reason is presented by itself, a "quote warning"
        //        if false, the reason is added to the general warning message
        var user;        // User to warn
        var reason;      // Reason to warn
        var split_index; // For parsing
        var out;         // Build output message

        // Split
        if (!param) {
            return; // No param means nothing to do
        }
        split_index = param.indexOf(' '); // Find first space character
        if (split_index > -1) {
            // There is a reason
            user = param.substr(0, split_index);  // substr (start index, length)
            reason = param.substring(split_index + 1);
            if (reason.search(/(?:^|\s):\w/) > -1) {
                cb.sendNotice('Graphics aren\'t allowed in warnings', mod);
                return;
            }
        } else {
            // There is only a user
            user = param;
            reason = '';
        }

        // Take action
        user = this.matchRecent(user); // Attempt partial match
        /* Originally we did not allow warnings if already silenced, but it
         * has been requested due to partial silences.
        if (this.isSilenced(user)) {
            cb.sendNotice(user + ' is already silenced', mod);
            return;
        }
        */
        out = '\u2622 ' + user + ', ';
        if (quote) {
            if (!reason) {
                cb.sendNotice('Quote warnings need a reason', mod);
                return;
            }
        } else {
            if (reason) {
                reason = ' for ' + reason;
            }
            out += 'please show respect & follow the rules or you will be silenced';
        }
        out += reason;
        cb.sendNotice(out, user, '', '#dc0000', 'bold');
        sbOut.sendModelMod(user + ' has been warned by ' + mod +
            (quote ? ': ' : '') + reason);

        // This command won't show up in chat, so would normally not be
        // logged as a recent user. But it is a potential reason to warn
        // a mod, so log it:
        this.addRecent(mod);
    },
    addRecent: function(user) {
        // Adds a user to the list of recent chat users, avoiding duplicates
        if (this.sRecent.indexOf(user) < 0) {
            this.sRecent[this.nRecent] = user;
            this.nRecent += 1;
            // Stores the last 10 users
            if (this.nRecent > 9) {
                this.nRecent = 0;
            }
        }
    },
    matchRecent: function(user) {
        // Attempts to match a partial username against the list of recent
        // chat users. If a match is found, the full username is returned.
        // If no match is found, the partial username is returned: perhaps it
        // was meant as a full username for a user who hasn't chatted recently.
        // If multiple matches are found, the full username is returned.
        var i = sbUtil.search(user, this.sRecent);
        return i > -1 ? this.sRecent[i] : user;
    },
};
/**
 * Help object
 **/
var sbHelp = {
    helpMsg: function(param, user_level) {
        // Returns a help message based on the parameter & user level
        var out = ''; // Build message to make one sendNotice instead of several

        // If called without a command, show the list of commands
        if (!param) {
            param = 'commands';
        }

        // user_level >= 3 is Mods & higher, 4 is Admins only
        // Any user can see help for any topic, but the list of topics shown is
        // limited to commands that they can run.
        switch (param) {
        case 'commands':
            out = '/ubhelp - Display this help' +
                '\n/leaderboard - Display the leaderboard' +
                '\n/time - Display elapsed time and current server time';
            if (user_level >= 3) {
                out += '\n/greysoff - Disable chat from grey users' +
                    '\n/greyson - Enable chat from grey users' +
                    '\n/silencelevel - Turn grey chat on/off. Type "/ubhelp silencelevel" for more info' +
                    '\n/graphiclevel - Turn grey graphics on/off. Type "/ubhelp graphiclevel" for more info' +
                    '\n/pmm - Private message to model. Type "/ubhelp pmm" for more info' +
                    '\n/ubhelp silence - Display info about silence & unsilence of users' +
                    '\n/ubhelp timer - Display info about countdown timer commands' +
                    '\n/ubhelp banner - Display info about banner commands' +
                    '\n/ubhelp vip - Display info about VIP commands';
                if (bCrazyMode) {
                    out += '\n/ubhelp notice - Display info about notice commands';
                }
                if (user_level >= 4) {
                    out += '\n/ubhelp admin - Display info about Admin commands' +
                        '\n/ubhelp wordlist - Display info about the Blocked Word List';
                }
            }
            break;

        case 'silencelevel':
        case 'greysoff':
        case 'greyson':
            out =
                '"/silencelevel 1" or "/greysoff" will silence Greys.\n' +
                '"/silencelevel 0" or "/greyson" will allow Greys to chat.\n' +
                'Model, Mods, Fan Club Members, and VIPs are not affected by silencelevel.';
            break;

        case 'graphiclevel':
            out =
                '"/graphiclevel 1" will prevent Greys from using graphics (default).\n' +
                '"/graphiclevel 0" will allow Greys to use graphics.\n' +
                'Model, Mods, Fan Club Members, and VIPs are not affected by graphiclevel.';
            break;

        case 'silence':
            out =
                'Commands for silencing & unsilencing users for the current session' +
                '\nAll commands send notification to the Model and all Mods' +
                '\nMods can NOT be silenced (names are added to the list, but it has no effect)' +
                '\n/warn user - Sends a warning to the user, but does not silence them' +
                '\n/silence user - User is notified and silenced' +
                '\n/ninja user - User is silenced but given no notice (silenced silently)' +
                '\n/timeout user - User is notified and silenced for a few minutes' +
                '\n/unsilence user - Undoes any of the silencing methods';
            break;

        case 'pmm':
        case 'bc':
            out =
                '(Private Message to Model) Send a "whisper message" to the Model through chat.\n' +
                'The message will appear as a notice from you visible ONLY to the Model.\n' +
                'The Model can disable this feature in the bot settings.';
            break;

        case 'banner':
        case 'banners':
            if (!out) {
                out = 'There are no banner commands enabled';
            }
            break;

        case 'notice':
        case 'notices':
        case 'cn':
            if (bCrazyMode) {
                out = '/bc - Send private notice to the Model' +
                    '\n/cn - Send general notice to the public' +
                    '\n/tm - Send private notice to all Mods as a group' +
                    '\n/tbm - Send private notice to all Mods and the Model';
            } else {
                out = 'The Model has not enabled this feature';
            }
            break;

        case 'timer':
            out =
                '/starttimer n - Starts the countdown timer for n minutes' +
                '\n/addtime n - Adds n minutes to the countdown timer, starting it if needed' +
                '\n/timeleft - Displays approximate time remaining on the countdown' +
                '\n/stoptimer - Stops and resets the countdown timer (takes up to 1 minute)' +
                '\n Stop is only needed if you want to restart for a different duration';
            break;

        case 'vip':
            out =
                '/viplist - Display list of VIP users in a useful format';
            out +=
                '\nCommands for Model and Admins only:' +
                '\n/vipadd user - Add user to the VIP users';
            break;

        case 'wordlist':
            out = 
                '/wordlist - Displays the complete list of words currently blocked in the chat.';
            out +=
                '\n Commands for Model and Admins only:' +
                '\n/addword n - Add word to blocklist and trigger message stating the obvious.' +
                '\n/rmvword n - Remove a word from the blocklist.';
            break;

        case 'admin':
            if (user_level >= 4) {
                out = '/bye - Display end of show stats' +
                    '\n//version - Display version number' +
                    '\n//crazy n - Turn CrazyMode on or off' +
                    '\n//filter n - Turn advanced filtering on or off';
            }
            break;

        default:
            break;
        }

        // Return
        if (out) {hat
            return out;
        }
        return 'Not a valid option. Type /ubhelp for help.';
    }
};


// This depends on sbOut, sbTime, and sbTip, so has to be after those but
// before the parsing functions that call it
function showEnd() {
    // Send information at end of show
    // (Try to encourage this to be ran at least once at the end of each show)
    var out;

    // Thanks to audience, with show duration
    sbOut.sendBold('Show duration: ' + sbTime.botDuration() +
        '\nThank you for watching!', '');

    // Show stats to Model include tip information and any new VIPs
    out = sbTip.getStats() + sbVip.getNew();
    sbOut.sendBold(out, cb.room_slug); // To model only (important!)
}

function parseCommand(msg, cmd_user, user_level) {
    // Command parser
    // 'cmd_user' is the user sending the command. Calling it just 'user' would be
    //      confusing because the paramer often contains a username.
    // 'user_level' is the level of the user sending the command.
    //      >= 3 is mods & higher, 4 is admins only.
    // Return true if the command was parsed; it will be silenced from output
    // Return false to pass the command through to chat
    var valid_cmd;  // Control parsing flow
    var command;    // Slash + first word is the command
    var param;      // Anything after the first word is the parameter
    var split_index; // Postion of the first space character

    // Why should greys be allowed to send commands?
    if (user_level === 0) {
        // We could return false and allow everyone to see the command attempt
        // but with greys, when in doubt, silence:
        return true;
    }

    // Split
    split_index = msg.indexOf(' '); // Find first space character
    if (split_index > -1) {
        // Message might have a parameter (could just be padding)
        command = msg.substr(0, split_index);  // substr (start index, length)
        param = msg.substring(split_index + 1).trim(); // Could be empty
    } else {
        // Message is a command only
        command = msg;
        param = '';
    }

    // Commands for all (non-grey) users
    valid_cmd = true;
    switch (command) {
        case '/ubhelp':
            cb.sendNotice(sbHelp.helpMsg(param, user_level), cmd_user);
            break;
        case '/leaderboard':
            if (bLeaderboard) {
                sbTip.showLeaders(10, cmd_user);
            } else {
                sbOut.sendUb('The leaderboard is disabled', cmd_user);
            }
            break;
        case '/time':
            // Display current time and elapsed time since bot start.
            // When done by a Mod or above, displays to all users.
            sbOut.sendBold(
                'Show Duration = ' + sbTime.botDuration() + ' ' +
                sbTime.getWorldTime(),
                (user_level >= 3 ? '' : cmd_user));
            break;
        case '/timeleft':
            // 'timeleft' is the same as UltraBot & conflicts with CrazyTicket
            // Displays approximate time left on the countdown timer.
            // When done by a Mod or above, displays to all users.
            sbTime.showCountdown(cmd_user, (user_level >= 3));
            break;
        case '/whisper':
        case '/pm':
        case '/w':
        case '/tell':
        case '/t':
            // There so many UltraBot commands for this. /w and /t would be useful
            // for something else, but some users already know them and expect
            // they are going to whisper.
            // Normally we want commands to fail silently, but in this case
            // someone might think their whisper was sent.
            sbOut.sendUb('Chat is for chatting. Please use PMs for private messages.', cmd_user);
            break;
        case '/ignore':
        case '/reply':
        case '/ignorelevel':
            // These are UltraBot commands that are not supported here, but they
            // are considered valid and supressed from passthru for compatibility
            // reasons
            break;
        default:
            valid_cmd = false;
            break;
    }

    // Commands for Mods
    if (!valid_cmd && user_level >= 3) {
        valid_cmd = true;
        switch (command) {
            case '/greysoff':
            case '/greyoff':
                sbSilence.setLevel(true, '1', cmd_user, user_level);
                break;
            case '/greyson':
            case '/greyon':
                sbSilence.setLevel(true, '0', cmd_user, user_level);
                break;
            case '/silencelevel':
                sbSilence.setLevel(true, param, cmd_user, user_level);
                break;
            case '/graphiclevel':
            case '/graphicslevel':
                sbSilence.setLevel(false, param, cmd_user, user_level);
                break;
            case '/warn':
                sbSilence.warnUser(param, cmd_user, false);
                break;
            case '/silence':
                sbSilence.silUser({sUser: param, sMod: cmd_user});
                break;
            case '/ninja':
                sbSilence.silUser({sUser: param, sMod: cmd_user, bNinja: true});
                break;
            case '/timeout':
                sbSilence.silUser({sUser: param, sMod: cmd_user,
                    nTime: Date.now() + 150000}); // 2.5 minutes
                break;
            case '/unsilence':
                sbSilence.unUser(param, cmd_user);
                break;
            case '/pmm':
                sbOut.sendPmm(param, cmd_user);
                break;
            case '/bc':
                // Just like pmm, but only if in crazymode
                if (bCrazyMode) {
                    sbOut.sendPmm(param, cmd_user);
                } else {
                    valid_cmd = false; // passthru to CrazyNote
                }
                break;
            case '/cn':
            case '/cnh':
            case '/cnd':
            case '/cndh':
                // Public notice, but only if in crazymode
                if (bCrazyMode) {
                    sbOut.sendPublic(param, cmd_user, command);
                } else {
                    valid_cmd = false; // passthru to CrazyNote
                }
                break;
            case '/tm':
                // Notice to Mods, but only if in crazymode
                if (bCrazyMode) {
                    sbOut.sendModChat(param, cmd_user, false);
                } else {
                    valid_cmd = false; // passthru to CrazyNote
                }
                break;
            case '/tbm':
                // Notice to Mods + Model, but only if in crazymode
                if (bCrazyMode) {
                    sbOut.sendModChat(param, cmd_user, true);
                } else {
                    valid_cmd = false; // passthru to CrazyNote
                }
                break;
            case '/starttimer':
            case '/settimer':
                // 'starttimer' is the same as UltraBot & conflicts with CrazyTicket
                sbTime.setCountdown(param, cmd_user, false);
                break;
            case '/addtime':
                // 'addtime' is the same as UltraBot & conflicts with CrazyTicket
                sbTime.setCountdown(param, cmd_user, true);
                break;
            case '/stoptimer':
            case '/endtimer':
            case '/cleartimer':
                // This functionality is not available in UltraBot
                sbTime.clearCountdown(cmd_user);
                break;
            case '/viplist':
                // Show the list of VIP users in a useful format
                sbVip.showList(cmd_user);
                break;
            case '/vipadd':
                // Add user can only be done by the Model, but we can let a Mod
                // demonstrate it to her
                if (user_level >= 4) {
                    sbVip.addUser(param);
                } else {
                    cb.sendNotice('Only ' + cb.room_slug + ' is allowed to do that',
                        cmd_user);
                    valid_cmd = false; // passthru so model can see it
                }
                break;


            default:
                valid_cmd = false;
                break;
        }
    }

    // Commands for Admins
    if (!valid_cmd && user_level >= 4) {
        valid_cmd = true;
        switch (command) {
            case '//filter':
                // Enable/disable advanced filtering
                bFilter = (parseInt(param));
                sbOut.sendBold('Advanced filtering ' + (bFilter ? 'ON' : 'OFF'),
                    cmd_user);
                break;
            case '//crazy':
                // Enable/disable crazymode
                bCrazyMode = (parseInt(param));
                sbOut.sendBold('CrazyMode ' + (bCrazyMode ? 'ON' : 'OFF'),
                    cmd_user);
                break;
            case '//version':
                sbOut.sendSplash(cmd_user);
                break;
            case '/bye':
                showEnd();
                break;
            default:
                // One exception to passthru: all commands starting with double
                // slash made by an admin are reserved
                if (command.charAt(1) !== '/') {
                    valid_cmd = false;
                }
                break;
        }
    }
    return valid_cmd;
}


// cb.onMessage
/** Per CB documentation, msg object contains:
 * c: message color
 * m: the message text
 * user: username of message sender
 * f: message font
 * in_fanclub: is the user in the broadcasters fan club
 * has_tokens: does the user have at least 1 token
 * is_mod: is the user a moderator
 * tipped_recently: is the user a "dark blue"?
 * tipped_alot_recently: is the user a "purple"?
 * tipped_tons_recently: is the user a "dark purple"?
 * gender: "m" (male), "f" (female), "s" (shemale), or "c" (couple)
 **/
cb.onMessage(function(msg) {
    var silenced = false;   // true if algorithm has already decided to silence
    var ninjad = false;     // true if algorithm has decided to ninja silence
    var vip;            // true if user is fan club or on a VIP list
    var user_level = 0;     // level of this user, see algorithm below
    var total;          // tip total for user
    var prefix = '';    // message building
    var sil;            // silence return object
    var blockgr = 0; // non-zero indicates graphics should be blocked & reason

    // Determine User Level
    vip = msg.in_fanclub || sbVip.isVip(msg.user);
    if (sbAdmin.isAdmin(msg.user)) {
        user_level = 4;
    } else if (msg.is_mod) {
        user_level = 3;
    } else if (vip) {
        user_level = 2;
    } else if (msg.has_tokens) {
        user_level = 1;
    }

    // Check graphics level. The actual blocking will happen later and may be
    // triggered by additional conditions.
    if (user_level < sbSilence.nGraphicLevel) {
        blockgr = 1; // Blocked due to level
    }

    // Check to see if user has been silenced / should be silenced BEFORE
    // doing any command processing. Note: CB silencing doesn't set X-Spam...
    // in fact, there seems to be no way to detect if a user has been silenced!
    if (msg['X-Spam'] && user_level < 4) {
        // Non-Admin user has been silenced via CB or another bot. Respect that.
        silenced = true;
    }

    // Check silence level
    if (!silenced && user_level < sbSilence.nSilenceLevel) {
        silenced = true;
        sbOut.sendUb('Your user level is not currently allowed to chat', msg.user);
    }


    // Check silence list. Mods and up are exempt.
    if (!silenced && user_level < 3) {
        sil = sbSilence.checkList(msg.user); // sil is an object
        // Update silence status
        if (sil.sil === 2) {
            silenced = true;
        } else if (sil.sil === 3) {
            // For ninja, we don't set 'silenced' so that we don't bypass other
            // processing. That means that commands will still work, tip titles
            // will still be added, etc. lessening the chances that the ninja'd
            // user notices.
            ninjad = true;
        }
        // If graphics aren't already blocked, update blocking status
        if (!blockgr) {
            blockgr = sil.gr;
        }
    }

    // Block graphics if necessary BEFORE any command processing. That way
    // the block can't be bypassed by things like notice commands.
    // Note: Since those commands may do their own filtering, this could result
    // in some messages being checked twice.
    if (!silenced && blockgr) {
        // Regexp to find words starting with colons. Doing this with a
        // letter is easy, but a colon is more complicated since it counts
        // as a word boundary.
        if (msg.m.search(/(?:^|\s):\w/) > -1) {
            silenced = true;
            if (blockgr === 1) {
                // If blocked due to level, the user gets a notice (UB tradition)
                sbOut.sendUb('Your user level is not currently allowed to use graphics',
                    msg.user);
            } else if (blockgr !== 3) {
                // If blocked by silence w/o ninja, the user gets a notice
                sbOut.sendUb('You are not currently allowed to use graphics',
                    msg.user);
            }
            // Otherwise, the user doesn't get a notice
        }
    }

    // Parse command
    if (!silenced) {
        if (msg.m.charAt(0) === '/') {
            // Standard commands
            silenced = parseCommand(msg.m, msg.user, user_level);
        }
    }

    // Do silencing (could be a silenced user or just a processed command)
    if (silenced) {
        msg['X-Spam'] = true;
        return msg; // Get out now
    }

    // If we reach this point, we know that something will show up in chat...
    // unless the user has been ninja'd.
    if (!ninjad) {
        sbSilence.addRecent(msg.user); // Log as a recent chat user for name matching
    }

    // Add prefixes if enabled and not a passthru command
    if (msg.m.charAt(0) !== '/' && msg.m.charAt(0) !== '!') {
        // Lots of potential combinations for this prefix. It starts out empty
        // so we don't always have to set it. We can't base VIP status on
        // user_level, because Mods could also be Fan Club. If the tip title
        // feature is disabled, sKingUser will not be set & therefore can't
        // match, so that saves a check of bTipTitles.
        if (bVipLogo && vip) {
            // User is VIP
            prefix = (msg.user === sbTip.sKing ? ':crownheart ' : ':heart2 ');


        } else {
            // User is not VIP
            prefix = (msg.user === sbTip.sKing ? ':smallCrown ' : '');
        }

        // Add the tip title if enabled
        if (bTipTitles) {
            total = sbTip.userTotal(msg.user); // storing it saves a search
            if (total > 0) {
                prefix = prefix + '|' + total + '| ';
            }
        }

        // Concatenate
        msg.m = prefix + msg.m;

    }

    // Now it is time to check if the user has been ninja'd. By waiting this
    // long, we've done all the modifications to the message which they will
    // be able to see... even if no one else does.
    if (ninjad) {
        msg['X-Spam'] = true;
    }
    return msg;
});

// cb.onTip
/** Per CB documentation, tip object contains:
 * amount: amount of tip
 * message: message in tip
 * to_user: user who received tip
 * from_user: user who sent tip
 * from_user_in_fanclub: is the user in the broadcasters fan club
 * from_user_has_tokens: does the user have at least 1 token
 * from_user_is_mod: is the user a moderator
 * from_user_tipped_recently: is the user a “dark blue”?
 * from_user_tipped_alot_recently: is the user a “purple”?
 * from_user_tipped_tons_recently: is the user a “dark purple”?
 * from_user_gender: “m” (male), “f” (female), “s” (shemale), or “c” (couple)
 **/
cb.onTip(function(tip) {
    var tip_val = parseInt(tip.amount); // current tip value
    var user_total; // user's total tip

    // Keep running tip total & other stats that don't need full tipper list
    sbTip.addTip(tip.from_user, tip_val);

    // Check tip values for special stuff plus display thanks when necessary
    sbVip.checkTip(tip.from_user, tip_val); // Check if tipping to join VIPs
    if (tip_val >= 3000) {
        sbOut.sendUb(':fireworks3k\nThank you, ' + tip.from_user + '!', '');
    } else if (tip_val >= 1000) {
        sbOut.sendUb(':fireworks1k\nThank you, ' + tip.from_user + '!', '');
    }
    if (cb.settings.sTipMessage && tip_val >= sbTip.nMsgMin) {
        sbOut.sendUb(cb.settings.sTipMessage, ''); // Notice to entire room
    }

    // If neither tip titles or leaderboard is enabled, there is no reason
    // to spend anymore time here.
    if (!bTipTitles && !bLeaderboard) {
        return;
    }

    // Add tip to the tipper list, returning the user's updated total
    user_total = sbTip.addUser(tip.from_user, tip_val);

    // Tip titles feature
    if (bTipTitles) {
        if (tip.from_user === sbTip.sKing) {
            sbTip.nKing = user_total; // current king, new total
        } else if (user_total > sbTip.nKing && user_total >= sbTip.nKingMin) {
            // New king
            sbTip.sKing = tip.from_user;
            sbTip.nKing = user_total;
            sbOut.sendBold(':smallCrown We have a new ' +
                (tip.from_user_gender === 'f' ? 'Queen' : 'King') +
                '! All hail ' + tip.from_user + '! :smallCrown', '');
        }
    }
});

// cb.onEnter
/** Per CB documentation, the user object contains:
 * user: user who entered the room
 * in_fanclub: is the user in the broadcaster's fan club
 * has_tokens: does the user have at least 1 token
 * is_mod: is the user a moderator
 * tipped_recently: is the user a "dark blue"?
 * tipped_alot_recently: is the user a "purple"?
 * tipped_tons_recently: is the user a "dark purple"?
 * gender: "m" (male), "f" (female), "s" (shemale), or "c" (couple)
 **/
cb.onEnter(function(user) {
    if (cb.settings.sEntryMessage) {
        // Privately welcome the user to the room
        sbOut.sendUb(cb.settings.sEntryMessage, user.user);
    }
    if (user.is_mod || sbAdmin.isAdmin(user.user)) {
        // If user is a mod or admin, tell them about the bot
        sbOut.sendSplash(user.user, true);
    }
});


// Initialization
function init() {
    // Parse bot settings
    bTipTitles = (cb.settings.sTipTitles === 'Yes');
    bLeaderboard = (cb.settings.sLeaderboard === 'Yes');
    bWhisper = (cb.settings.sWhisperOn === 'Yes');
    bCrazyMode = (cb.settings.sCrazyOn === 'Yes');
    sbTime.parseInit(); // Rotating notices
    sbTip.nKingMin = cb.settings.nKingMin;
    sbTip.nMsgMin = cb.settings.nTipMessageMin;
    bVipLogo = (cb.settings.sVipLogo === 'Yes');
    sbVip.setTip(cb.settings.nVipTip);
    sbVip.parseInit(cb.settings.sVipUsers); // Get VIPs from control

    // Start the interval timer & timestamp the start of show
    cb.setTimeout(sbTime.doIntervalCB.bind(sbTime), 60000);
    sbTime.tBotStart = Date.now();

    // Initialization message
    sbOut.sendSplash('', false);
    cb.sendNotice('Grey users can\'t use graphics by default. To allow, type /graphiclevel 0',
        cb.room_slug);
}

init();
