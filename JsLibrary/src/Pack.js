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
    
    Get_Character: function(charId)
    {
        return this.objectdata[charId]['char'];
    },
    
    Get_Token: function(charId)
    {
        return this.objectdata[charId]['token'];
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
    
    _Parse_Api: function(message)
    {
        var content = message['content'];
        _.each(this.apiCommandEvents, function(info)
        {
            var regex = new RegExp(info['expression']);
            if(regex.test(content))
            {
                var key = regex.exec(content)[0].toString();
                var command = content.substr(key.length, content.length - key.length).trim();
                info['callback'](command);
            }
        });
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
            default:
                log(type);
        }
    }
};

var Corruption = 
{
    playersWithCorruption: [],
    
    _PreloadCharacter: function(charId)
    {
        var corruption = CharacterInfo.Get_Attribute(charId, 'corruption');
        if(corruption === undefined)
        {
            CharacterInfo.Create_Attribute(charId, 'corruption', 0, 0);
        }
        else if(parseInt(corruption['max']) !== 0 && this.playersWithCorruption.indexOf(charId) === -1)
        {
            this.playersWithCorruption[this.playersWithCorruption.length] = charId;
        }
    },
    
    _AttributesChanged: function(charId, name, old_, new_)
    {
        if(old_ === null || new_ === null || old_ === undefined || new_ === undefined)
        {
            return;
        }
        
        log(name);
        log(old_);
        log(new_);
    },
    
    _EnableDisable_Corruption: function(command)
    {
        var components = command.split('|');
        var name = components[0];
        var state = components[1].toString().toLowerCase() === 'true';
        var char = null;
        _.each(CharacterInfo.Characters(), function(charId)
        {
            var cur = CharacterInfo.Get_Character(charId);
            if(cur.get('name') === name)
            {
                char = cur;
            }
        });
        if(char === null)
        {
            Chat.Send_GM('Corruption', 'Enable/Disable corruption: Can\'t find character "'+name+'"');
            return;
        }
        
        var charId = char.get('id');
        var attribute = CharacterInfo.Get_Attribute(charId, 'corruption');
        attribute.set('max', state ? 100 : 0);
        if(state)
        {
            this.playersWithCorruption[this.playersWithCorruption.length] = charId;
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
            this.playersWithCorruption = buffer;
        }

        Chat.Send_GM('Corruption', 'Enable/Disable corruption: '+(state ? 'Enabled' : 'Disabled')+' corruption on "'+name+'"');
    }
};

CharacterInfo.Register_OnPreloadCharacters(function(charId){ Corruption._PreloadCharacter(charId); });
CharacterInfo.Register_OnAtributeUpdate(function(charId, name, old_, new_) { Corruption._AttributesChanged(charId, name, old_, new_); });
Chat.Register_Api_Command('^\!enable-corruption', function(command) { Corruption._EnableDisable_Corruption(command); });
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