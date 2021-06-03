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
            self._PreloadCharacters(char);
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
        return this.objectdata[charId]['attribute'][name];
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
        setTimeout(function()
        {
            _.each(self.preloadCharactersEvents, function(event)
            {
                event(char.id);
            });
        }, 500);
    }
};

EventHandler.Register_OnReady(function(){ CharacterInfo._Ready(); });
EventHandler.Register_OnAddCharacter(function(char){ CharacterInfo._AddCharacter(char); });