var Corruption = Corruption || (function () {
    'use strict';

    var attributeHash = {
        "corruption": {
            "current": 0,
            "max": 100
        }
    },

    addAttributes = function(characterID, attributeHash) {
        for (var key in attributeHash) {
            if (attributeHash.hasOwnProperty(key)) {
                var foundAttribute = findObjs({
                    _characterid: characterID,
                    name: key
                })[0];

                if (!foundAttribute) {
                    log("Attribute " + key + " not found for character ID " + characterID + " Creating.");
                    createObj("attribute", {
                        name: key,
                        current: attributeHash[key]["current"],
                        max: attributeHash[key]['max'],
                        characterid: characterID
                    });
                }
            }
        }
    },

    initCharacterAttributes = function(char){
        addAttributes(char.id, attributeHash);
    },

    handleInput = function(msg) {
        if(msg.type === "api" && msg.content === "!initcorruption") {
            log("Initializing attributes for all existing characters.");
            var allCharacters = findObjs({
                _type: "character"
            });
            _.each(allCharacters, function(char) {
                initCharacterAttributes(char);
            });
        }
    },

    registerEventHandlers = function() {    
        on("add:character", initCharacterAttributes);
        on("chat:message", handleInput);
    };
    
    return 
    {
        RegisterEventHandlers: registerEventHandlers;
    };    
    
})();

on("ready", function() 
{
    'use strict';
    Corruption.RegisterEventHandlers();    
});