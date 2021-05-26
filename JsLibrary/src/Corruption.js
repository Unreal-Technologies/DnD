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

    levelSpecificPassives = function(level)
    {
        if(level >= 20)
        {
            return {
                'tier': 5,
                'turns': null,
                'dice': null
            };
        }
        else if(level >= 16)
        {
            return {
                'tier': 4,
                'turns': 20,
                'dice': '1d4'
            };
        }
        else if(level >= 13)
        {
            return {
                'tier': 3,
                'turns': 15,
                'dice': '1d6'
            };
        }
        else if(level >= 10)
        {
            return {
                'tier': 2,
                'turns': 10,
                'dice': '1d8'
            };
        }
        else if(level >= 7)
        {
            return {
                'tier': 1,
                'turns': 5,
                'dice': '1d10'
            };
        }
        return {
            'tier': 0,
            'turns': null,
            'dice': null
        };
    },

    weaponInfo = function(charId)
    {
        var weapons = [];
        var objects = findObjs({
            _type: 'attribute',
            _characterid: charId
        });
        _.each(objects, function(attribute)
        {
            if((new RegExp('^repeating_inventory_.+_itemattackid$')).test(attribute.get('name')))
            {
                var weapData = {
                    'id': attribute.get('current'),
                    'name': null,
                    'range': null,
                    'corruption': null,
                };
                _.each(objects, function(subAttr)
                {
                    var attrName = subAttr.get('name');
                    if((new RegExp('^repeating_attack_'+weapData['id']+'_.*$')).test(attrName))
                    {
                        if((new RegExp('.*_atkname$')).test(attrName))
                        {
                            weapData['name'] = subAttr.get('current');
                        }
                        else if((new RegExp('.*_atkrange$')).test(attrName))
                        {
                            weapData['range'] = parseInt(subAttr.get('current'));
                        }
                        else if((new RegExp('.*_corruption$')).test(attrName))
                        {
                            weapData['corruption'] = subAttr.get('current').toString().toLocaleLowerCase() === 'true';
                        }
                    }
                });

                if(weapData['corruption'] === null)
                {
                    var key = 'repeating_attack_'+weapData['id']+'_corruption';
                    log("Attribute " + key + " not found for character ID " + charId + " Creating.");
                    createObj("attribute", {
                        name: key,
                        current: false,
                        characterid: charId
                    });
                    weapData['corruption'] = false;
                }
                weapons[weapons.length] = weapData;
            }
        });
           
        return weapons;
    },

    attributesChanged = function(charId, attributes, previous)
    {
        var hpDirection = attributeDirection(attributes, previous, 'hp', 'current');
        var corruptionDirection = attributeDirection(attributes, previous, 'corruption', 'current');
        
        var level = attributes['level'];
        var hp = attributes['hp']['current'];
        var corruption = attributes['corruption']['current'];
        
        var passives = levelSpecificPassives(level);
        var weapons = weaponInfo(charId);
        log(weapons);
        
        if(passives['tier'] !== 0 && corruptionDirection === 'U')
        {
           log(passives);
        }
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
        
        on('click:macro', function(m)
        {
            log(m);
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