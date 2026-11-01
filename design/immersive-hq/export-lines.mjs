// Writes every agent's scripted lines to voice-lines.json, read straight from index.html so the
// recordings always match what the page says. Usage: node export-lines.mjs [outfile]
import { readFileSync, writeFileSync } from 'node:fs';
import vm from 'node:vm';

const html = readFileSync('index.html', 'utf8');
const slice = (from, to) => {
  const i = html.indexOf(from), j = html.indexOf(to, i);
  if (i < 0 || j < 0) throw new Error(`could not find ${from}`);
  return html.slice(i, j);
};
const code = [
  slice('const AGENTS=[', 'const initials='),
  slice('function agentLines(a){', 'function replyKey('),
  'const out={};for(const a of AGENTS)out[a.id]=agentLines(a);out;',
].join('\n');
const lines = vm.runInNewContext(code, {});
const out = process.argv[2] || 'voice-lines.json';
writeFileSync(out, JSON.stringify(lines, null, 2));
const count = Object.values(lines).reduce((n, l) => n + Object.keys(l).length, 0);
console.log(`wrote ${count} lines for ${Object.keys(lines).length} agents to ${out}`);
