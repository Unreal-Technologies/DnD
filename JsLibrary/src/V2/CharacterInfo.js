var CharacterInfo =
{
    preloadCharactersEvents: [],
    attributeUpdateEvents: [],
    characters: [],
    data: [],
    
    Ready: function()
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
    
    Data: function(characterId)
    {
        return this.data[characterId];
    },
    
    Characters: function()
    {
        return this.characters;
    },
    
    AddCharacter: function(char)
    {
        this._PreloadCharacters(char);
    },
    
    RegisterOnAtributeUpdate: function(callback)
    {
        this.attributeUpdateEvents[this.attributeUpdateEvents.length] = callback;
    },
    
    RegisterOnPreloadCharacters: function(callback)
    {
        this.preloadCharactersEvents[this.preloadCharactersEvents.length] = callback;
    },
    
    _CharacterChecker: function()
    {
        var self = this;
        _.each(this.characters, function(charId)
        {
            if(self.data.hasOwnProperty(charId))
            {
                var data = self.data[charId];
                var char = data['char'];
                
                var attributeInfo = self._LoadCharacterAttributes(char);
                var newAttributes = attributeInfo['attributes'];
                var oldAttributes = data['attributes'];

                var changed = [];
                var hasChanges = false;
                for(const k in oldAttributes)
                {
                    if(!newAttributes.hasOwnProperty(k))
                    {
                        log('CALL 1');
                        _.each(self.attributeUpdateEvents, function(event)
                        {
                            event(charId, oldAttributes[k], null);
                        });
                        changed[changed.length] = k;
                        hasChanges = true;
                    }
                    else if(oldAttributes[k].get('current') !== newAttributes[k].get('current') || oldAttributes[k].get('max') !== newAttributes[k].get('max'))
                    {
                        log('CALL 2');
                        _.each(self.attributeUpdateEvents, function(event)
                        {
                            event(charId, oldAttributes[k], newAttributes[k]);
                        });
                        changed[changed.length] = k;
                        hasChanges = true;
                    }
                }
                for(const k in newAttributes)
                {
                    var idx = changed.indexOf(k);
                    if(idx !== -1)
                    {
                        continue;
                    }
                    else if(!oldAttributes.hasOwnProperty(k))
                    {
                        _.each(self.attributeUpdateEvents, function(event)
                        {
                            event(charId, null, newAttributes[k]);
                        });
                        hasChanges = true;
                    }
                    else if(oldAttributes[k].get('current') !== newAttributes[k].get('current') || oldAttributes[k].get('max') !== newAttributes[k].get('max'))
                    {
                        _.each(self.attributeUpdateEvents, function(event)
                        {
                            event(charId, oldAttributes[k], newAttributes[k]);
                        });
                        hasChanges = true;
                    }
                }
                
                if(hasChanges)
                {
                    log(hasChanges);
                }
            }
        });

        setTimeout(function()
        {
            self._CharacterChecker();
        }, 500);
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
            else
            {
                attributes[name] = attribute;
            }
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

        this.data[id] = {
            'char': char,
            'token': tokenObject,
            'attributes': attributeInfo['attributes'],
            'equipment': this._LoadCharacterEquipment(attributeInfo['equipment'])
        };
        
        var self = this;
        char.get('defaulttoken', function(token)
        {
            self.data[id]['token'] = JSON.parse(token);
            if(self.data[id]['token'] !== null)
            {
                self.data[id]['token'] = findObjs(
                {
                    _type: 'graphic',
                    represents: char.id
                })[0];
            }
        });
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
        }, 100);
    }
};

EventHandler.RegisterOnReady(function(){ CharacterInfo.Ready(); });
EventHandler.RegisterOnAddCharacter(function(char){ CharacterInfo.AddCharacter(char); });