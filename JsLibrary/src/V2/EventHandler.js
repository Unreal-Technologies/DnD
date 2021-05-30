var EventHandler =
{
    readyEvents: [],
    addCharacterEvents: [],
    
    RegisterAddCharacter: function(callback)
    {
        this.addCharacterEvents[this.addCharacterEvents.length] = callback;
    },
    
    RegisterOnReady: function(callback)
    {
        this.readyEvents[this.readyEvents.length] = callback;
    },
    
    OnReady: function()
    {
        _.each(this.readyEvents, function(event)
        {
            event();
        });
        
        var acE = this.addCharacterEvents;
        on("add:character", function(char)
        {
            _.each(acE, function(event)
            {
                event(char);
            });
        });
    }
};

var EventHandlerInitiator = EventHandlerInitiator || (function () {
    registerEventHandlers = function() { 
        EventHandler.OnReady();
    };
    
    return {
        RegisterEventHandlers: registerEventHandlers
    }; 
})();

on("ready", function() {
    'use strict';
    
    EventHandlerInitiator.RegisterEventHandlers();    
});