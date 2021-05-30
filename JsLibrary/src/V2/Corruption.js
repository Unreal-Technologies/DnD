var Corruption = 
{
    PreloadCharacter: function(charId)
    {
        var data = CharacterInfo.Data(charId);
        
        log('CORRUPTION PRELOAD '+charId);
        log(data);
    }
};

CharacterInfo.RegisterPreloadCharacters(function(charId){ Corruption.PreloadCharacter(charId); });