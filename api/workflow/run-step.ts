import { generatePegasusText } from '../../core/runtime/agents/pegasusReasoner.js';
import { AGENTS } from '../../src/data/agents.ts';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { stepNumber, projectBrief = '', accumulatedDossier = {} } = req.body || {};
    const agent = AGENTS.find((a) => a.step === Number(stepNumber));
    if (!agent) return res.status(404).json({ error: `Step ${stepNumber} agent not found` });

    const previous = Object.entries(accumulatedDossier)
      .map(([step, data]: any) => `[Step ${step} - ${data.agentName}]: ${data.spokenSummary}\nKey Artifact: ${data.keyDeliverable}`)
      .join('\n\n')
      .slice(0, 12000);
    let keyDeliverable = agent.knowledge.sampleDeliverables[0];
    let spokenSummary = agent.voiceConfig.samplePhrase;
    let deliverableMarkdown = '';
    const prompt = `PROJECT BRIEF:
"${projectBrief || 'Launch Pegasus AI Operations Platform.'}"

PREVIOUS TEAM OUTPUT:
${previous || 'First stage.'}

MISSION:
You are ${agent.name}, ${agent.tagline}. Department: ${agent.department}.
Primary action: ${agent.workflowAction}.
Frameworks: ${agent.knowledge.frameworks.join(', ')}.

Return JSON only:
{"keyDeliverable":"title","spokenSummary":"2-4 concise sentences for the war room","detailedDossierMarkdown":"structured markdown analysis and handoff"}`;

    const response = await generatePegasusText({
      system: agent.systemPrompt + ' Return only valid JSON with the requested keys.',
      prompt,
      maxOutputTokens: 900
    });
    try {
      const parsed = JSON.parse(response.text || '{}');
      keyDeliverable = parsed.keyDeliverable || keyDeliverable;
      spokenSummary = parsed.spokenSummary || spokenSummary;
      deliverableMarkdown = parsed.detailedDossierMarkdown || 'Analysis completed.';
    } catch {
      deliverableMarkdown = response.text || 'Analysis completed.';
    }
    return res.status(200).json({
      step: agent.step,
      agentId: agent.id,
      agentName: agent.name,
      tagline: agent.tagline,
      department: agent.department,
      keyDeliverable,
      spokenSummary,
      deliverableMarkdown

    });
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || 'Failed to run workflow step' });
  }
}
