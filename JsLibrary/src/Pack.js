var EventHandler =
{
    readyEvents: [],
    addCharacterEvents: [],
    chatMessageEvents: [],
    
    Timer: function(ms, callback)
    {
        if(callback())
        {
            var self = this;
            setTimeout(function()
            {
                self.Timer(ms, callback);
            }, ms);
        }
    },
    
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

var CharacterInfo =
{
    preloadCharactersEvents: [],
    attributeUpdateEvents: [],
    characters: [],
    attributes: [],
    objectdata: [],
    
    _Ready: function()
    {
        var self = this;
        _.each(findObjs(
        {
            _type: "character"
        }), function(char) 
        {
            var idx = self.characters.indexOf(char.id);
            if(idx === -1)
            {
                self._PreloadCharacters(char);
            }
        });
        
        this._CharacterChecker();
    },
    
    Get_CharacterByName: function(name)
    {
        var char = null;
        _.each(CharacterInfo.Characters(), function(charId)
        {
            var cur = CharacterInfo.Get_Character(charId);
            if(cur.get('name') === name)
            {
                char = cur;
            }
        });  
        return char;
    },
    
    Get_Character: function(charId)
    {
        return this.objectdata[charId]['char'];
    },
    
    Get_Token: function(charId)
    {
        return this.objectdata[charId]['token'];
    },
    
    Get_Attributes: function(charId)
    {
        return this.objectdata[charId]['attributes'];
    },
    
    Get_Attribute: function(charId, name)
    {
        try
        {
            return this.objectdata[charId]['attributes'][name];
        }
        catch(ex)
        {
            return null;
        }
    },
    
    Get_Equipment: function(charId)
    {
        return this.objectdata[charId]['equipment'];
    },
    
    Characters: function()
    {
        return this.characters;
    },
    
    _AddCharacter: function(char)
    {
        this._PreloadCharacters(char);
    },
    
    _GetAttributes(charId)
    {
        if(!this.objectdata.hasOwnProperty(charId))
        {
            return null;
        }
        var attributes = this.objectdata[charId]['attributes'];
        var buffer = {};
        for(const k in attributes)
        {
            buffer[k] = {
                'current': attributes[k].get('current'),
                'max': attributes[k].get('max')
            };
        }
        
        return buffer;
    },
    
    Register_OnAtributeUpdate: function(callback)
    {
        this.attributeUpdateEvents[this.attributeUpdateEvents.length] = callback;
    },
    
    Register_OnPreloadCharacters: function(callback)
    {
        this.preloadCharactersEvents[this.preloadCharactersEvents.length] = callback;
    },
    
    _CharacterChecker: function()
    {
        var self = this;
        _.each(this.characters, function(charId)
        {
            if(self.attributes.hasOwnProperty(charId))
            {
                var old_attributes = self.attributes[charId];
                var new_attributes = self._GetAttributes(charId);

                var isEqual = JSON.stringify(old_attributes) === JSON.stringify(new_attributes);
                if(!isEqual)
                {
                    self.attributes[charId] = new_attributes;
                    for(const k in old_attributes)
                    {
                        if(!new_attributes.hasOwnProperty(k)) //REMOVED
                        {
                            _.each(self.attributeUpdateEvents, function(event)
                            {
                                event(charId, k, old_attributes[k], null);
                            });
                        }
                        if(JSON.stringify(old_attributes[k]) !== JSON.stringify(new_attributes[k]))
                        {
                            _.each(self.attributeUpdateEvents, function(event)
                            {
                                event(charId, k, old_attributes[k], new_attributes[k]);
                            });
                        }
                    }
                    for(const k in new_attributes)
                    {
                        if(!old_attributes.hasOwnProperty(k)) //Added
                        {
                            _.each(self.attributeUpdateEvents, function(event)
                            {
                                event(charId, k, null, new_attributes[k]);
                            });
                        }
                    }
                }
            }
        });

        setTimeout(function()
        {
            self._CharacterChecker();
        }, 500);
    },
    
    Create_Attribute: function(charId, name, current, max)
    {
        createObj("attribute", {
            'name': name,
            'current': current,
            'max': max,
            'characterid': charId
        });
    },
    
    _LoadCharacterAttributes: function(char)
    {
        var equipment = {};
        var attributes = {};
        _.each(findObjs({
            _type: 'attribute',
            _characterid: char.id
        }), function(attribute)
        {
            var name = attribute.get('name');
            if((new RegExp('^repeating_inventory_').test(name)) || (new RegExp('^repeating_attack_')).test(name))
            {
                equipment[name] = attribute;
            }
            
            attributes[name] = attribute;
        });
        
        return {
            'equipment': equipment,
            'attributes': attributes
        };
    },
    
    _LoadCharacterEquipment: function(equipmentData)
    {
        var weapons = [];
        _.each(equipmentData, function(attribute)
        {
            if((new RegExp('^repeating_inventory_.+_itemattackid$')).test(attribute.get('name')))
            {
                var weapData = {
                    'id': attribute.get('current'),
                    'name': null,
                    'range': null
                };
                _.each(equipmentData, function(subAttr)
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
                    }
                });
                weapons[weapons.length] = weapData;
            } 
        });
        
        return weapons;
    },
    
    _LoadCharacterData: function(char)
    {
        var id = char.id;
        var tokenObject = null;
        var attributeInfo = this._LoadCharacterAttributes(char);

        this.objectdata[id] = {
            'char': char,
            'token': tokenObject,
            'attributes': attributeInfo['attributes'],
            'equipment': this._LoadCharacterEquipment(attributeInfo['equipment'])
        };

        var self = this;
        char.get('defaulttoken', function(token)
        {
            self.objectdata[id]['token'] = JSON.parse(token);
            if(self.objectdata[id]['token'] !== null)
            {
                self.objectdata[id]['token'] = findObjs(
                {
                    _type: 'graphic',
                    represents: char.id
                })[0];
            }
        });
        
        this.attributes[id] = this._GetAttributes(id);
    },
    
    _PreloadCharacters: function(char)
    {
        var idx = this.characters.indexOf(char.id);
        if(idx === -1)
        {
            this.characters[this.characters.length] = char.id;
            this._LoadCharacterData(char);
        }
        
        var self = this;
        _.each(this.preloadCharactersEvents, function(event)
        {
            event(char.id);
        });
    }
};

var Chat = 
{
    apiCommandEvents: [],
    rollresultEvents: [],
    
    Send_Whisper_Character(fromId, toId, text)
    {
        this.Send_Whisper("character|"+fromId, toId, text);
    },
    
    Send_Whisper(as, toId, text)
    {
        var char = CharacterInfo.Get_Character(toId);
        sendChat(as, "/w \""+char.get('name')+"\" "+text, null, {noarchive:true} );
    },
    
    Send_GM_Character: function(charId, text)
    {
        this.Send_GM("character|"+charId, text);
    },
    
    Send_GM: function(as, text)
    {
        sendChat(as, "/w GM "+text, null, {noarchive:true} );
    },

    Send_Global_Character: function(charId, text)
    {
        this.Send_Global("character|"+charId, text);
    },

    Send_Global: function(as, text)
    {
        sendChat(as, text, null, {noarchive:true} );
    },
    
    _Parse_RollResult: function(message)
    {
        var content = null;
        var isAttack = false;
        try
        {
            content = JSON.parse(message['content']);
        }
        catch(ex)
        {
            content = message['inlinerolls'][0]['results'];
            isAttack = true;
        }
        var buffer = [];
        _.each(content['rolls'], function(roll)
        {
            switch(roll['type'])
            {
                case 'M':
                    var isPositive = roll['expr'].toString().substr(0, 1) === '+';
                    var result = parseInt(roll['expr'].substr(1, roll['expr'].length - 1));
                    buffer[buffer.length] = {
                        'description': roll['expr'],
                        'results': [isPositive ? result : -result]
                    };
                    break;
                case 'R':
                    var v = [];
                    _.each(roll['results'], function(res)
                    {
                        v[v.length] = parseInt(res['v']);
                    });
                    buffer[buffer.length] = {
                        'description': roll['dice']+'d'+roll['sides'],
                        'results': v
                    };
                    break;
                case 'L': break;
                default:
                    log('_Parse_RollResult');
                    log(roll);
                    break;
                
            }
        });
        var characterId = null;
        var weaponId = null;
        if(isAttack)
        {
            content = message['content'].toString();
            
            var reg1 = new RegExp('\{\{rname=.+\}\}');
            var reg2 = new RegExp('charname=.+$');
            
            if(reg1.test(content) && reg2.test(content))
            {
                var rawWeaponName = reg1.exec(content)[0].toString();
                var rawCharacterName = reg2.exec(content)[0].toString();
                
                var weaponName = rawWeaponName.split('}}')[0].substr(8);
                var characterName = rawCharacterName.substr(9);
                
                _.each(CharacterInfo.Characters(), function(charId)
                {
                    var cur = CharacterInfo.Get_Character(charId);
                    if(cur.get('name') === characterName)
                    {
                        characterId = cur.id;
                    }
                });
                if(characterId !== null)
                {
                    _.each(CharacterInfo.Get_Equipment(characterId), function(equipment)
                    {
                        if(equipment['name'] === weaponName)
                        {
                            weaponId = equipment['id'];
                        }
                    });
                }
            }
        }
        
        var playerId = message['playerid'];
        _.each(this.rollresultEvents, function(callback)
        {
            callback(playerId, buffer, characterId, weaponId);
        });
    },
    
    _Parse_General: function(message)
    {
        var playerId = message['playerid'];
        if(playerId === 'API')
        {
            this._Parse_Api(message);
            return;
        }
        if(message.hasOwnProperty('rolltemplate') && message['rolltemplate'] === 'atkdmg')
        {
            this._Parse_RollResult(message);
            return;
        }
        
        log('_Parse_General');
        log(message);
    },
    
    _Parse_Api: function(message)
    {
        var content = message['content'];
        var hasMatch = false;
        _.each(this.apiCommandEvents, function(info)
        {
            var regex = new RegExp(info['expression']);
            if(regex.test(content))
            {
                var key = regex.exec(content)[0].toString();
                var command = content.substr(key.length, content.length - key.length).trim();
                info['callback'](command);
                hasMatch = true;
            }
        });
        if(!hasMatch)
        {
            log('_Parse_Api');
            log(message);
        }
    },
    
    Register_Api_Rollresult(callback)
    {
        this.rollresultEvents[this.rollresultEvents.length] = callback;
    },
    
    Register_Api_Command(expression, callback)
    {
        this.apiCommandEvents[this.apiCommandEvents.length] = {
            'expression': expression,
            'callback': callback
        };
    },
    
    _Parse: function(message)
    {
        var type = message['type'];
        if(type === 'error')
        {
            return;
        }
        
        switch(type)
        {
            case 'api':
                this._Parse_Api(message);
                break;
            case 'general':
                this._Parse_General(message);
                break;
            case 'rollresult':
                this._Parse_RollResult(message);
                break;
            default:
                break;
        }
    }
};

var Corruption = 
{
    charactersWithCorruption: [],
    corruptionRollFor: null,
    damageRollFor: null,
    auraIndex: {},
    tokenResize: {},
    isAdminCommand: false,

    _PreloadCharacter: function(charId)
    {
        var corruption = CharacterInfo.Get_Attribute(charId, 'corruption');
        if(corruption === undefined)
        {
            CharacterInfo.Create_Attribute(charId, 'corruption', 0, 0);
        }
        else if(parseInt(corruption.get('max')) !== 0 && this.charactersWithCorruption.indexOf(charId) === -1)
        {
            this.charactersWithCorruption[this.charactersWithCorruption.length] = charId;
        }
        
        if(CharacterInfo.Get_Attribute(charId, 'corruption-state') === undefined)
        {
            CharacterInfo.Create_Attribute(charId, 'corruption-state', false, 0);
        }
        
        _.each(CharacterInfo.Get_Equipment(charId), function(equipment)
        {
            var key = 'repeating_attack_'+equipment['id']+'_corruption';
            if(CharacterInfo.Get_Attribute(charId, key) === null)
            {
                CharacterInfo.Create_Attribute(charId, key, 'false', '');
            }
        });
    },
    
    _AttributesChanged_Corruption_Event: function(x, of, charId)
    {
        if(x === of)
        {
            var state = CharacterInfo.Get_Attribute(charId, 'corruption-state');
            state.set('current', 'true');
            state.set('max', -1);
            
            var hp = CharacterInfo.Get_Attribute(charId, 'hp');
            hp.set('current', hp.get('max'));
            return;
        }
        
        var passive = this._LevelSpecificPassives(charId);
        if(passive['downside'] !== null)
        {
            var downside = passive['downside'];
            switch(downside['type'])
            {
                case 'plain-damage':
                    this.damageRollFor = charId;
                    Chat.Send_Global('Corruption', '/roll '+downside['roll']);
                    break;
                default:
                    log('_AttributesChanged_Corruption_Event');
                    log(charId);
                    log(x);
                    log(of);
                    log(downside);
                    break;
            }
            
        }
    },
    
    _AttributesChanged_Corruption_Up: function(charId, old_, new_)
    {
        if(this.isAdminCommand)
        {
            this.isAdminCommand = false;
            return;
        }
        
        var max = parseInt(CharacterInfo.Get_Attribute(charId, 'corruption').get('max'));
        var divider = 4;
        var parts = [];
        for(var i=0; i<divider; i++)
        {
            var part = Math.round((max/divider)*(i+1));
            parts[parts.length] = part;
        }
        
        for(var i=divider-1; i>=0; i--)
        {
            if(old_ < parts[i] && new_ >= parts[i])
            {
                this._AttributesChanged_Corruption_Event(i+1, divider, charId);
            }
        }
    },
    
    _AttributesChanged_Corruption_State_Aura: function(charId)
    {
        var token = CharacterInfo.Get_Token(charId);
        token.set('aura1_color', '#ff9999');
        token.set('aura1_square', false);
        token.set('showplayers_aura1', true);
        token.set('playersedit_aura1', false);

        if(!this.auraIndex.hasOwnProperty(charId))
        {
            this.auraIndex[charId] = 'up';
            token.set('aura1_radius', 0);
        }
        
        var value = token.get('aura1_radius');
        if(this.auraIndex[charId] === 'up')
        {
            value++;
            token.set('aura1_radius', value);
            if(value > 5)
            {
                this.auraIndex[charId] = 'down';
                token.set('aura1_radius', 5);
            }
        }
        else
        {
            value--;
            token.set('aura1_radius', value);
            if(value < 0)
            {
                this.auraIndex[charId] = 'up';
                token.set('aura1_radius', 0);
            }
        }
        
        var state = CharacterInfo.Get_Attribute(charId, 'corruption-state');
        if(state.get('current').toString().toLowerCase() === 'true')
        {
            return true;
        }
        
        token.set('aura1_radius', '');
        delete this.auraIndex[charId];
        return false;
    },
    
    _AttributesChanged_Corruption_State_Flash: function(charId)
    {
        var token = CharacterInfo.Get_Token(charId);
        var color = token.get('tint_color') === 'transparent' ? '#ff0000' : 'transparent';
        
        token.set('tint_color', color);
        
        var state = CharacterInfo.Get_Attribute(charId, 'corruption-state');

        if(state.get('current').toString().toLowerCase() === 'true')
        {
            return true;
        }
        token.set('tint_color', 'transparent');
        
        return false;
    },
    
    _AttributesChanged_Corruption_State_True_Resize: function(charId)
    {
        var token = CharacterInfo.Get_Token(charId);
        if(!this.tokenResize.hasOwnProperty(charId))
        {
            this.tokenResize[charId] = {
                'width': parseInt(token.get('width')) * 2,
                'height': parseInt(token.get('height')) * 2
            };
        }
        
        var width =  parseInt(token.get('width'));
        var height = parseInt(token.get('height'));
        
        var state = CharacterInfo.Get_Attribute(charId, 'corruption-state');
        if(state.get('current').toString().toLowerCase() === 'true' && (width < this.tokenResize[charId]['width'] || height < this.tokenResize[charId]['height']))
        {
            token.set('width', Math.min(width + 1, this.tokenResize[charId]['width']));
            token.set('height', Math.min(height + 1, this.tokenResize[charId]['height']));
            
            return true;
        }
        delete this.tokenResize[charId];
        
        return false;
    },
    
    _AttributesChanged_Corruption_State_False_Resize: function(charId)
    {
        var token = CharacterInfo.Get_Token(charId);
        if(!this.tokenResize.hasOwnProperty(charId))
        {
            this.tokenResize[charId] = {
                'width': parseInt(token.get('width')) / 2,
                'height': parseInt(token.get('height')) / 2
            };
        }
        
        var width =  parseInt(token.get('width'));
        var height = parseInt(token.get('height'));
        
        var state = CharacterInfo.Get_Attribute(charId, 'corruption-state');
        if(state.get('current').toString().toLowerCase() === 'false' && (width > this.tokenResize[charId]['width'] || height > this.tokenResize[charId]['height']))
        {
            token.set('width', Math.min(width - 1, this.tokenResize[charId]['width']));
            token.set('height', Math.min(height - 1, this.tokenResize[charId]['height']));
            
            return true;
        }
        delete this.tokenResize[charId];
        
        return false;
    },
    
    _AttributesChanged_Corruption_State_True: function(charId)
    {
        var self = this;
        EventHandler.Timer(250, function()
        {
            return self._AttributesChanged_Corruption_State_Flash(charId);
        });
        EventHandler.Timer(100, function()
        {
            return self._AttributesChanged_Corruption_State_Aura(charId);
        });
        EventHandler.Timer(50, function()
        {
            return self._AttributesChanged_Corruption_State_True_Resize(charId);
        });
    },
    
    _AttributesChanged_HP_Down(charId, old_, new_)
    {
        var hp = CharacterInfo.Get_Attribute(charId, 'hp');
        var max = parseInt(hp.get('max'));
        var removeCorruption = Math.round(max * 0.2); //20%
        
        if(old_ > removeCorruption && new_ <= removeCorruption)
        {
            CharacterInfo.Get_Attribute(charId, 'corruption-state').set('current', false);
            CharacterInfo.Get_Attribute(charId, 'corruption').set('current', 0);
        }
    },
    
    _AttributesChanged: function(charId, name, old_, new_)
    {
        if(old_ === null || new_ === null || old_ === undefined || new_ === undefined)
        {
            return;
        }
        
        if(this.charactersWithCorruption.indexOf(charId) !== -1)
        {
            switch(name)
            {
                case 'corruption-state':
                    if(new_['current'].toString().toLowerCase() === 'true')
                    {
                        this._AttributesChanged_Corruption_State_True(charId);
                    }
                    else
                    {
                        var self = this;
                        EventHandler.Timer(10, function()
                        {
                            return self._AttributesChanged_Corruption_State_False_Resize(charId);
                        });
                    }
                    break
                case 'corruption':
                    if(this._GetDirection('current', old_, new_) === 'U')
                    {
                        this._AttributesChanged_Corruption_Up(charId, old_['current'], new_['current']);
                    }
                    break;
                case 'hp':
                    if(this._GetDirection('current', old_, new_) === 'D' && CharacterInfo.Get_Attribute(charId, 'corruption-state').get('current').toString().toLowerCase() === 'true')
                    {
                        this._AttributesChanged_HP_Down(charId, old_['current'], new_['current']);
                    }
                    break;
                default:
                    log('_AttributesChanged');
                    log(name);
                    log(old_);
                    log(new_);
                    break;
            }
            
            
        }
    },
    
    _GetDirection: function(key, old_, new_)
    {
        var o = old_[key];
        var n = new_[key];
        
        if(isNaN(o) || isNaN(n) || o === n)
        {
            return 'N';
        }
        if(parseInt(o) < parseInt(n))
        {
            return 'U';
        }
        return 'D';
    },
    
    _RollResult: function(playerId, results, charId, weaponId)
    {
        this._RollResult_Attack(playerId, results, charId, weaponId);
        this._RollResult_Corruption(playerId, results, charId, weaponId);
        this._RollResult_Damage(playerId, results, charId, weaponId)
    },
    
    _RollResult_Damage: function(playerId, results, charId, weaponId)
    {
        if(charId !== null || weaponId !== null) //Defined Roll Result
        {
            return;
        }
        if(this.damageRollFor === null || playerId !== 'API') //Target correct player/character
        {
            return;
        }
        
        charId = this.damageRollFor;
        this.damageRollFor = null;
        
        var hpAttribute = CharacterInfo.Get_Attribute(charId, 'hp');
        var downside = this._LevelSpecificPassives(charId)['downside'];
        var sum = 0;
        _.each(results[0]['results'], function(value)
        {
            sum += value;
        });
        
        hpAttribute.set('current', parseInt(hpAttribute.get('current')) - sum);
        Chat.Send_Whisper('Corruption', charId, downside['text'].replace('{D}', sum));
    },
    
    _RollResult_Corruption: function(playerId, results, charId, weaponId)
    {
        if(charId !== null || weaponId !== null) //Defined Roll Result
        {
            return;
        }
        if(this.corruptionRollFor === null || playerId !== 'API') //Target correct player/character
        {
            return;
        }
        charId = this.corruptionRollFor[1];
        this.corruptionRollFor = null;
        
        var result = results[0]['results'][0];
        var char = CharacterInfo.Get_Character(charId);

        Chat.Send_Whisper('Corruption', charId, 'You gained <span style="color: red"><b>'+result+'</b></span> corruption.');
        Chat.Send_GM('Corruption', char.get('name') + ' gained <span style="color: red"><b>'+result+'</b></span> corruption points.');
        
        var corruptionAttribute = CharacterInfo.Get_Attribute(charId, 'corruption');
        var corruption = parseInt(corruptionAttribute.get('current'));
        
        corruptionAttribute.set('current', corruption + result);
    },
    
    _LevelSpecificPassives: function(charId)
    {
        var levelAttribute = CharacterInfo.Get_Attribute(charId, 'level');
        var level = parseInt(levelAttribute.get('current'));
        
        if(level >= 20)
        {
            return {
                'tier': 5,
                'turns': null,
                'dice': null,
                'downside': null
            };
        }
        else if(level >= 16)
        {
            return {
                'tier': 4,
                'turns': 20,
                'dice': '1d4',
                'downside': {
                    'type': 'summon'
                }
            };
        }
        else if(level >= 13)
        {
            return {
                'tier': 3,
                'turns': 15,
                'dice': '1d6',
                'downside': {
                    'type': 'corruption',
                    'roll': '1d20',
                    'mod': 'wisdom_mod',
                    'comp': 15,
                    'roll-fail': '2d8',
                    'text-fail': 'You are corrupted for <span style="color: red"><b>{D}</b></span> turns.'
                }
            };
        }
        else if(level >= 10)
        {
            return {
                'tier': 2,
                'turns': 10,
                'dice': '1d8',
                'downside': {
                    'type': 'disarm',
                    'roll': '1d20',
                    'comp': 12,
                    'roll-fail': '1d8',
                    'text-fail': 'You lost your weapons for <span style="color: red"><b>{D}</b></span> turns.'
                }
            };
        }
        else if(level >= 7)
        {
            return {
                'tier': 1,
                'turns': 5,
                'dice': '1d10',
                'downside': {
                    'type': 'plain-damage',
                    'roll': '2d8',
                    'text': 'You feel your body burning up. taking <span style="color: red"><b>{D}</b></span> fire damage from the inside out.'
                }
            };
        }
        return {
            'tier': 0,
            'turns': null,
            'dice': null,
            'downside': null
        };
    },
    
    _RollResult_Attack: function(playerId, results, charId, weaponId)
    {
        if(charId === null || weaponId === null) //Undefined Roll Result
        {
            return;
        }
        if(playerId === 'API')
        {
            return;
        }
        if(this.charactersWithCorruption.indexOf(charId) === -1) //Has corruption enabled
        {
            return;
        }
        var key = 'repeating_attack_'+weaponId+'_corruption';
        var weaponCorruptionAttribute = CharacterInfo.Get_Attribute(charId, key);
        
        if(weaponCorruptionAttribute === undefined)
        {
            return;
        }
        
        var state = weaponCorruptionAttribute.get('current').toString().toLowerCase() === 'true';
        if(!state)
        {
            return;
        }
        
        var passive = this._LevelSpecificPassives(charId);

        if(passive['dice'] !== null)
        {
            this.corruptionRollFor = [playerId, charId];
            Chat.Send_Global('Corruption', '/roll '+passive['dice']);
        }
    },
    
    _EnableDisable_Weapon_Corruption: function(command)
    {
        var components = command.split('|');
        var char_name = components[0];
        var weapon_name = components[1];
        var state = components[2].toString().toLowerCase() === 'true';
        var char = CharacterInfo.Get_CharacterByName(char_name);
        if(char === null)
        {
            Chat.Send_GM('Corruption', 'Enable/Disable weapon corruption: Can\'t find character "'+char_name+'".');
            return;
        }
        var weapon = null;
        _.each(CharacterInfo.Get_Equipment(char.id), function(equipment)
        {
            if(equipment['name'] === weapon_name)
            {
                weapon = equipment;
            }
        });
        if(weapon === null)
        {
            Chat.Send_GM('Corruption', 'Enable/Disable weapon corruption: Can\'t find weapon "'+weapon_name+'" on character "'+char_name+'".');
            return;
        }
        var key = 'repeating_attack_'+weapon['id']+'_corruption';
        var attribute = CharacterInfo.Get_Attribute(char.id, key);
        if(attribute !== null && attribute !== undefined)
        {
            attribute.set('current', state ? 'true' : 'false');
        }
        else
        {
            CharacterInfo.Create_Attribute(char.id, key, state ? 'true' : 'false', '');
        }
        
        Chat.Send_GM('Corruption', 'Enable/Disable weapon corruption: '+(state ? 'Enabled' : 'Disabled')+' corruption on weapon "'+weapon_name+'" of character "'+char_name+'".');
    },
    
    _EnableDisable_Corruption: function(command)
    {
        var components = command.split('|');
        var name = components[0];
        var state = components[1].toString().toLowerCase() === 'true';
        var char = CharacterInfo.Get_CharacterByName(name);
        if(char === null)
        {
            Chat.Send_GM('Corruption', 'Enable/Disable corruption: Can\'t find character "'+name+'"');
            return;
        }
        
        var charId = char.get('id');
        var token = CharacterInfo.Get_Token(charId);
        if(token === null)
        {
            Chat.Send_GM('Corruption', 'Enable/Disable corruption: Can\'t Enable/Disable corruption for character "'+name+'", no token found!');
        }
        
        var attribute = CharacterInfo.Get_Attribute(charId, 'corruption');
        attribute.set('max', state ? 100 :  '');
        attribute.set('current', state ? 0 : '');
        
        if(state)
        {
            this.charactersWithCorruption[this.charactersWithCorruption.length] = charId;
        }
        else
        {
            var buffer = [];
            _.each(this.playersWithCorruption, function(id)
            {
                if(id !== charId)
                {
                    buffer[buffer.length] = id;
                }
            });
            this.charactersWithCorruption = buffer;
        }

        token.set('bar2_max', state ? attribute.get('max') : '');
        token.set('bar2_value', state ? attribute.get('current') : '');
        token.set('bar2_link', state ? attribute.get('id') : '');
        token.set('showplayers_bar2', state ? 'true' : 'false');
        token.set('playersedit_bar2', state ? 'false' : 'true');

        Chat.Send_GM('Corruption', 'Enable/Disable corruption: '+(state ? 'Enabled' : 'Disabled')+' corruption on "'+name+'"');
    },
    
    _Set_Corruption: function(command)
    {
        var components = command.split('|');
        var name = components[0];
        var state = components[1].toString().toLowerCase() === 'true';
        var char = CharacterInfo.Get_CharacterByName(name);
        if(char === null)
        {
            Chat.Send_GM('Corruption', 'Set corruption: Can\'t find character "'+name+'"');
            return;
        }
        
        var charId = char.get('id');
        var attributeState = CharacterInfo.Get_Attribute(charId, 'corruption-state');
        attributeState.set('current', state);
        attributeState.set('max', -1);
        
        var attributeHp = CharacterInfo.Get_Attribute(charId, 'hp');
        var attributeCorruption = CharacterInfo.Get_Attribute(charId, 'corruption');
        if(state)
        {
            attributeHp.set('current', attributeHp.get('max'));
            attributeCorruption.set('current', parseInt(attributeCorruption.get('max')) * 2);
        }
        else
        {
            attributeCorruption.set('current', 0);
        }

        Chat.Send_GM('Corruption', 'Set corruption: '+(state ? 'Enabled' : 'Disabled')+' corruption on "'+name+'"');
        Chat.Send_Whisper('Corruption', charId, 'GM manually changed your corruption state.');
        this.isAdminCommand = true;
    }
};

CharacterInfo.Register_OnPreloadCharacters(function(charId){ Corruption._PreloadCharacter(charId); });
CharacterInfo.Register_OnAtributeUpdate(function(charId, name, old_, new_) { Corruption._AttributesChanged(charId, name, old_, new_); });
Chat.Register_Api_Command('^\!enable-corruption', function(command) { Corruption._EnableDisable_Corruption(command); });
Chat.Register_Api_Command('^\!enable-weapon-corruption', function(command) { Corruption._EnableDisable_Weapon_Corruption(command); });
Chat.Register_Api_Command('^\!set-corruption', function(command) { Corruption._Set_Corruption(command); });
Chat.Register_Api_Rollresult(function(playerId, results, charId, weaponId) { Corruption._RollResult(playerId, results, charId, weaponId); });
EventHandler.Register_OnCharMessage(function(message) { Chat._Parse(message); });
EventHandler.Register_OnReady(function(){ CharacterInfo._Ready(); });
EventHandler.Register_OnAddCharacter(function(char){ CharacterInfo._AddCharacter(char); });

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