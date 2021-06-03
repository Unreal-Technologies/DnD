var EventHandler =
{
    readyEvents: [],
    addCharacterEvents: [],
    chatMessageEvents: [],
    
    Register_OnCharMessage: function(callback)
    {
        this.chatMessageEvents[this.chatMessageEvents.length] = callback;
    },
    
    Register_OnAddCharacter: function(callback)
    {
        this.addCharacterEvents[this.addCharacterEvents.length] = callback;
    },
    
    Register_OnReady: function(callback)
    {
        this.readyEvents[this.readyEvents.length] = callback;
    },
    
    _OnReady: function()
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
        
        var cmE = this.chatMessageEvents;
        on("chat:message", function(msg)
        {
            _.each(cmE, function(event)
            {
               event(msg); 
            });
        });
    }
};

var EventHandlerInitiator = EventHandlerInitiator || (function () {
    registerEventHandlers = function() { 
        EventHandler._OnReady();
    };
    
    return {
        Register_EventHandlers: registerEventHandlers
    }; 
})();

on("ready", function() {
    'use strict';
    
    EventHandlerInitiator.Register_EventHandlers();    
});