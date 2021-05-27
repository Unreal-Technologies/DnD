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
    charCorruptionRoll = null,

    addAttributes = function(characterID, attributes) {
        for (var key in attributes) {
            if (attributes.hasOwnProperty(key)) {
                var foundAttribute = findObjs({
                    _characterid: characterID,
                    name: key
                })[0];

                if (!foundAttribute) {
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

    sendActiveChat = function(message)
    {
        log(message);
        sendChat('Corruption', message, null, {noarchive:true} );
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

        var passives = levelSpecificPassives(level);

        if(passives['tier'] !== 0 && corruptionDirection === 'U')
        {
           var diffVal = parseInt(attributes['corruption']['max'] / 4);
           var prev = previous['corruption']['current'];
           var cur = attributes['corruption']['current'];

           var val1 = diffVal;
           var val2 = diffVal * 2;
           var val3 = diffVal * 3;
           var val4 = attributes['corruption']['max'];
           
           if(prev < val4 && cur >= val4)
           {
               sendActiveChat('CORRUPTED');
           }
           else if((prev < val1 && cur >= val1) || (prev < val2 && cur >= val2) || (prev < val3 && cur >= val3))
           {
               sendActiveChat('CORRUPTION EVENT');
           }
           
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
    
    getLastAttack = function(charId, attackId)
    {
        var last = null;
        var info = weaponInfo(charId);
        
        _.each(info, function(weap)
        {
            if(weap['id'] === attackId)
            {
                last = weap;
            }
        });
        
        return last;
    },
    
    chatCommandAttackApplyCorruption = function(msg)
    {
        if(msg.rolltemplate === 'atk')
        {
            var left = 'repeating_attack_';
            var right = '_attack_dmg';
            var regex1 = new RegExp(left + '.*' + right);
            var regex2 = new RegExp('~.*|'+left);
            if(regex1.test(msg.content) && regex2.test(msg.content))
            {
                var result1 = regex1.exec(msg.content)[0].toString();
                var attackId = result1.substring(left.length, result1.length - right.length);

                var result2 = regex2.exec(msg.content)[0].toString();
                var charId = result2.substring(1).split('|')[0];

                var attack = getLastAttack(charId, attackId);

                if(attack['corruption'])
                {
                    var levelAttrib = findObjs({
                        _type: "attribute", 
                        name: 'level', 
                        _characterid: charId
                    })[0];
                    var passives = levelSpecificPassives(levelAttrib.get('current'));
                    if(passives['dice'] !== null)
                    {
                        charCorruptionRoll = charId;
                        sendActiveChat('/roll '+passives['dice']);
                    }
                }
            }
        }
    },

    chatCommandCorruptionRoll = function(msg)
    {
        if(charCorruptionRoll !== null && msg.type === 'rollresult' && msg.who === 'Corruption')
        {
            var charId = charCorruptionRoll;
            charCorruptionRoll = null;
            
            var corruptionAttrib = findObjs({
                _type: "attribute", 
                name: 'corruption', 
                _characterid: charId
            })[0];
            var diceRoll = parseInt(JSON.parse(msg.content.toString()).total);
            
            var character = findObjs(
            {
                _type: "character",
                _id: charId
            })[0];
            corruptionAttrib.set('current', parseInt(corruptionAttrib.get('current')) + diceRoll);
            sendActiveChat('Character "'+character.get('name')+'" gains '+diceRoll+' corruption points.');
        }
    },

    chatCommandWeaponEnableCorruption = function(msg)
    {
        var content = msg.content.toString();
        if((new RegExp('!setWeaponCorruption [A-Za-z ]+,[A-za-z ]+,(true|false)')).test(content))
        {
            var values = content.substring(20).trim().split(',');
            var char_name = values[0];
            var weap_name = values[1];
            var state = values[2] === 'true';
            
            var result = findObjs(
            {
                _type: "character",
                name: char_name
            });
            
            if(result.length !== 0)
            {
                var charId = result[0].get('_id');
                var info = weaponInfo(charId);
                var weapon = null;
                _.each(info, function(weap)
                {
                    if(weap['name'] === weap_name)
                    {
                        weapon = weap;
                    }
                });
                if(weapon === null)
                {
                    sendActiveChat('Weapon "'+weap_name+'" on character "'+char_name+'" is not found.');
                }
                else
                {
                    var attrib = findObjs({
                        _type: "attribute", 
                        name: 'repeating_attack_'+weapon['id']+'_corruption', 
                        _characterid: charId
                    })[0];
                    
                    attrib.set('current', state ? 'true' : 'false');
                    sendActiveChat('Weapon "'+weap_name+'" on character "'+char_name+'" has corruption '+(state ? 'enabled' : 'disabled')+'.');
                }
            }
            else
            {
                sendActiveChat('Character "'+char_name+'" is not found.');
            }
        }
    },

    chatCommandEnableCorruption = function(msg)
    {
        var content = msg.content.toString();
        if((new RegExp('!setCorruption [A-Za-z ]+,(true|false)')).test(content))
        {
            var values = content.substring(14).trim().split(',');
            var name = values[0];
            var state = values[1] === 'true';

            var result = findObjs(
            {
                _type: "character",
                name: name
            });

            if(result.length !== 0)
            {
                var character = result[0];

                var attrib = findObjs({
                    _type: "attribute", 
                    name: 'corruption-enabled', 
                    _characterid: character.get('_id')
                })[0];

                attrib.set('current', state ? 'true' : 'false');
                sendActiveChat('Character "'+name+'" has corruption '+(state ? 'enabled' : 'disabled')+'.');
            }
            else
            {
                sendActiveChat('Character "'+name+'" is not found.');
            }
        }
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
        
        on("chat:message", function(msg)
        {
            chatCommandAttackApplyCorruption(msg);
            chatCommandEnableCorruption(msg);
            chatCommandWeaponEnableCorruption(msg);
            chatCommandCorruptionRoll(msg);
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