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
    
    RegisterPreloadCharacters: function(callback)
    {
        this.preloadCharactersEvents[this.preloadCharactersEvents.length] = callback;
    },
    
    _LoadCharacterData: function(char)
    {
        var id = char.id;
        this.data[id] = {
            'char': char
        };
    },
    
    _PreloadCharacters: function(char)
    {
        var idx = this.characters.indexOf(char.id);
        if(idx === -1)
        {
            this.characters[this.characters.length] = char.id;
            this._LoadCharacterData(char);
        }
        
        _.each(this.preloadCharactersEvents, function(event)
        {
            event(char.id);
        });
    }
};

EventHandler.RegisterOnReady(function(){ CharacterInfo.Ready(); });
EventHandler.RegisterAddCharacter(function(char){ CharacterInfo.AddCharacter(char); });