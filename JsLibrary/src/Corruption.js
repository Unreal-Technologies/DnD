var Corruption = Corruption || (function () {
    'use strict';

    var attributes = {
        "corruption": {
            "current": 0,
            "max": 100
        },
        "corruption-enabled": 
        {
            "current": false,
            'max': null
        },
        'level': {
            "current": 1,
            "max": null
        }
    },
    
    characters = [],

    addAttributes = function(characterID, attributes) {
        for (var key in attributes) {
            if (attributes.hasOwnProperty(key)) {
                var foundAttribute = findObjs({
                    _characterid: characterID,
                    name: key
                })[0];

                if (!foundAttribute) {
                    log("Attribute " + key + " not found for character ID " + characterID + " Creating.");
                    createObj("attribute", {
                        name: key,
                        current: attributes[key]["current"],
                        max: attributes[key]['max'],
                        characterid: characterID
                    });
                }
            }
        }
    },

    loadAttributeValues = function(charId)
    {
        var corruptionAttribute = findObjs({
            _characterid: charId,
            name: 'corruption'
        })[0];
        var corruptionEnabledAttribute = findObjs({
            _characterid: charId,
            name: 'corruption-enabled'
        })[0];
        var levelAttribute = findObjs({
            _characterid: charId,
            name: 'level'
        })[0];
        
        var corruptionValue = parseInt(corruptionAttribute.get('current'));
        var corruptionMax = parseInt(corruptionAttribute.get('max'));
        var levelValue = parseInt(levelAttribute.get('current'));
        var corruptionEnabledValue = corruptionEnabledAttribute.get('current');
        
        return {
            'enabled': corruptionEnabledValue,
            'level': levelValue,
            'corruption': {
                'current': corruptionValue,
                'max': corruptionMax
            }
        };
    },

    timeout = function()
    {
        _.each(characters, function(charId)
        {
            var attributes = loadAttributeValues(charId);
            log(attributes);
        })
        
//        setTimeout(function()
//        {
//            timeout();
//        }, 1000);
    },

    registerEventHandlers = function() {    
        var allCharacters = findObjs(
        {
            _type: "character"
        });
        
        _.each(allCharacters, function(char) 
        {
            addAttributes(char.id, attributes);
            
            var idx = characters.indexOf(char.id);
            if(idx === -1)
            {
                characters[characters.length] = char.id;
            }
        });
        
        on("add:character", function(char)
        {
            var idx = characters.indexOf(char.id);
            if(idx === -1)
            {
                characters[characters.length] = char.id;
            }
        });
        
        timeout();
    };
    
    return {
        RegisterEventHandlers: registerEventHandlers
    };    
    
})();

on("ready", function() {
    'use strict';
    
    Corruption.RegisterEventHandlers();    
});