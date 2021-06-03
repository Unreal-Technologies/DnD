var Corruption = 
{
    _PreloadCharacter: function(charId)
    {
//        var data = CharacterInfo.Data(charId);
//        
//        var attributes = data['attributes'];
//        if(!attributes.hasOwnProperty('corruption'))
//        {
//            CharacterInfo.CreateAttribute(charId, 'corruption', 0, 0);
//        }
//        _.each(data['equipment'], function(item)
//        {
//           log('CHECK CORRUPTION');
//           log(item);
//        });
    },
    
    _AttributesChanged: function(charId, name, old_, new_)
    {
        if(old_ === null || new_ === null || old_ === undefined || new_ === undefined)
        {
            return;
        }
        log(name);
        
//        log('CORRUPTION ATTR CHANGED '+charId);
//        log(charId);
//        log(old_);
//        log(new_);
    }
};

CharacterInfo.Register_OnPreloadCharacters(function(charId){ Corruption._PreloadCharacter(charId); });
CharacterInfo.Register_OnAtributeUpdate(function(charId, name, old_, new_) { Corruption._AttributesChanged(charId, name, old_, new_); });