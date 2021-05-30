var CharacterInfo =
{
    preloadCharactersEvents: [],
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
    
    RegisterOnPreloadCharacters: function(callback)
    {
        this.preloadCharactersEvents[this.preloadCharactersEvents.length] = callback;
    },
    
    _LoadCharacterData: function(char)
    {
        var id = char.id;
        var tokenObject = null;

        this.data[id] = {
            'char': char,
            'token': tokenObject
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