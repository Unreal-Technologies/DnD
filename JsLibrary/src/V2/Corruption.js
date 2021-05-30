var Corruption = 
{
    PreloadCharacter: function(charId)
    {
        var data = CharacterInfo.Data(charId);
        
        log('CORRUPTION PRELOAD '+charId);
        log(data);
    },
    
    AttributesChanged: function(charId, old_, new_)
    {
        log('CORRUPTION ATTR CHANGED '+charId);
        log(charId);
        log(old_);
        log(new_);
    }
};

CharacterInfo.RegisterOnPreloadCharacters(function(charId){ Corruption.PreloadCharacter(charId); });
CharacterInfo.RegisterOnAtributeUpdate(function(charId, old_, new_) { Corruption.AttributesChanged(charId, old_, new_); });