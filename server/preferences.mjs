// Whitelisted per-user settings, separate from budget revisions so settings cannot overwrite ledger data.
export function defaultPreferences(){return {theme:'system',palette:'cream',chat:{homeOnly:false,position:null,shareBudget:true},chatHistory:[]};}
export function mergePreferences(existing,patch){
  if(!patch||typeof patch!=='object'||Array.isArray(patch))throw new Error('Invalid settings.');
  const allowed=['theme','palette','chat','chatHistory'];
  if(Object.keys(patch).some(key=>!allowed.includes(key)))throw new Error('Unknown setting.');
  const result=structuredClone(existing||defaultPreferences());
  if('theme' in patch){if(!['system','light','dark'].includes(patch.theme))throw new Error('Invalid theme.');result.theme=patch.theme;}
  if('palette' in patch){if(!['cream','sage','ocean','rose'].includes(patch.palette))throw new Error('Invalid palette.');result.palette=patch.palette;}
  if('chat' in patch){
    if(!patch.chat||typeof patch.chat!=='object'||Array.isArray(patch.chat)||Object.keys(patch.chat).some(key=>!['homeOnly','position','shareBudget'].includes(key)))throw new Error('Invalid chat settings.');
    for(const key of ['homeOnly','shareBudget'])if(key in patch.chat){if(typeof patch.chat[key]!=='boolean')throw new Error('Invalid chat preference.');result.chat[key]=patch.chat[key];}
    if('position' in patch.chat){const position=patch.chat.position;if(position!==null&&(!position||typeof position!=='object'||Array.isArray(position)||!Number.isFinite(position.x)||!Number.isFinite(position.y)||position.x<0||position.x>1||position.y<0||position.y>1))throw new Error('Invalid chat position.');result.chat.position=position===null?null:{x:position.x,y:position.y};}
  }
  if('chatHistory' in patch){
    if(!Array.isArray(patch.chatHistory)||patch.chatHistory.length>14||patch.chatHistory.some(message=>!message||!['user','assistant'].includes(message.role)||typeof message.content!=='string'||!message.content.trim()||message.content.length>6000))throw new Error('Invalid chat history.');
    result.chatHistory=patch.chatHistory.map(({role,content})=>({role,content}));
  }
  return result;
}
