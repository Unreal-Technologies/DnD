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
        },
        'hp': {
            'current': 1,
            'max': 1
        }
    },
    
    characters = [],
    prevAttributes = [],

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
        var hpAttribute = findObjs({
            _characterid: charId,
            name: 'hp'
        })[0];
        
        var corruptionValue = parseInt(corruptionAttribute.get('current'));
        var corruptionMax = parseInt(corruptionAttribute.get('max'));
        var levelValue = parseInt(levelAttribute.get('current'));
        var corruptionEnabledValue = corruptionEnabledAttribute.get('current');
        var hpValue = parseInt(hpAttribute.get('current'));
        var hpMax = parseInt(hpAttribute.get('max'));
        return {
            'enabled': typeof corruptionEnabledValue === "boolean" ? corruptionEnabledValue : (corruptionEnabledValue+"").toString().toLocaleLowerCase() === 'true',
            'level': levelValue,
            'corruption': {
                'current': corruptionValue,
                'max': corruptionMax
            },
            'hp': {
                'current': hpValue,
                'max': hpMax
            }
        };
    },

    attributeDirection = function(current, previous, k1, k2)
    {
        return previous === null ? 'N' : (previous[k1][k2] === current[k1][k2] ? 'N' : (previous[k1][k2] < current[k1][k2] ? 'U' : 'D'));
    },

    attributesChanged = function(charId, attributes, previous)
    {
        var hpDirection = attributeDirection(attributes, previous, 'hp', 'current');
        var corruptionDirection = attributeDirection(attributes, previous, 'corruption', 'current');
        
        log('ATTR CHANGED!');
        log(charId);
        log(attributes);  
        log(previous);
        log(hpDirection);
        log(corruptionDirection);
    },

    progressionLoop = function()
    {
        _.each(characters, function(charId)
        {
            var attributes = loadAttributeValues(charId);
            var hash = JSON.stringify(attributes);
            var previous = prevAttributes[charId];
            
            if(attributes['enabled'] && (previous === undefined || previous === null || prevAttributes[charId] !== hash))
            {
                var previousParsed = previous === undefined || previous === null ? null : JSON.parse(previous);
                
                attributesChanged(charId, attributes, previousParsed);
                prevAttributes[charId] = hash;
            }
        });
        
        setTimeout(function()
        {
            progressionLoop();
        }, 10);
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
        
        progressionLoop();
    };
    
    return {
        RegisterEventHandlers: registerEventHandlers
    };    
    
})();

on("ready", function() {
    'use strict';
    
    Corruption.RegisterEventHandlers();    
});