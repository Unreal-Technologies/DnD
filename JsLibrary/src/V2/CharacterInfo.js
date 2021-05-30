var CharacterInfo =
{
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
    
    AddCharacter: function(char)
    {
        this._PreloadCharacters(char);
    },
    
    _PreloadCharacters: function(char)
    {
        log('PRELOAD');
        log(char);
    }
};

EventHandler.RegisterOnReady(function(){ CharacterInfo.Ready(); });
EventHandler.RegisterAddCharacter(function(char){ CharacterInfo.AddCharacter(char); });