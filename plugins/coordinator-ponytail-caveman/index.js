import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
const require = createRequire(import.meta.url);

function loadPonytail(mode) {
  try {
    // Resolve through the plugin's real path so symlinked loading (e.g. ~/.config/opencode/plugins) still finds the repo's node_modules.
    const pluginFile = fs.realpathSync(fileURLToPath(import.meta.url));
    const repoRoot = path.resolve(path.dirname(pluginFile), '../..');
    const ponyRoot = path.join(repoRoot, 'node_modules', '@dietrichgebert', 'ponytail');
    const { getPonytailInstructions } = require(path.join(ponyRoot, 'hooks/ponytail-instructions'));
    return getPonytailInstructions(mode) || null;
  } catch { return null; }
}
// Per-agent ponytail mode, mirroring each agent file's declared intent.
// reader / watchdog stay off (null = no injection).
function ponyModeFor(agent) {
  if (agent === 'coordinator') return 'full';
  if (agent === 'planner-hard') return 'lite';
  if (agent === 'worker' || agent === 'worker-fast') return 'ultra';
  return null;
}
function agentOf(event) {
  return event?.agent || event?.agentID || event?.session?.agentID || event?.session?.agent || event?.context?.agent;
}
function buildInjection(agent) {
  const mode = ponyModeFor(agent);
  if (!mode) return null;
  return loadPonytail(mode);
}

export default {
  id: 'coordinator-ponytail-caveman',
  async setup(ctx) {
    const addRuleset = (event) => {
      const agent = agentOf(event);
      // log for visibility; event shape unknown — dump keys to file
      try { fs.appendFileSync('/tmp/coordinator-ponytail-caveman.log', JSON.stringify({hook:'context', agent, keys: Object.keys(event||{} )})+'\n'); } catch {}
      const injection = buildInjection(agent);
      if (!injection) return;
      event.system.push({ type: 'text', text: injection });
    };
    await ctx.session.hook('context', addRuleset);
    await ctx.session.hook('compaction', addRuleset);
  },
  async server({ client } = {}) {
    const log=(m)=>{ try{client?.app?.log?.({body:{service:'coordinator-ponytail-caveman',level:'info',message:m}})}catch{} try{fs.appendFileSync('/tmp/coordinator-ponytail-caveman.log', new Date().toISOString()+' '+m+'\n')}catch{} };
    return {
      'experimental.chat.system.transform': async (input, output) => {
        log('server transform keys='+Object.keys(input||{}).join(',')+' json='+JSON.stringify(input||{}).slice(0,800));
        const agent = input?.agent || input?.agentID || input?.session?.agentID || input?.session?.agent || input?.context?.agent;
        const injection = buildInjection(agent);
        if (!injection) { log('skip agent='+(agent||'?')); return; }
        const marker = 'PONYTAIL MODE ACTIVE';
        for (let i=0;i<output.system.length;i++) if(typeof output.system[i]==='string'&&output.system[i].includes(marker)) {log('already injected for '+agent); return;}
        if (output.system.length>0) output.system[output.system.length-1]+='\n\n'+injection;
        else output.system.push(injection);
        log('injected ponytail for '+agent);
      }
    };
  }
};
