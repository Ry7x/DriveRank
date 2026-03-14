'use server';
/**
 * @fileOverview Një rrjedhë Genkit për gjenerimin e një përmbledhjeje të performancës së vozitjes të fuqizuar nga AI në gjuhën shqipe.
 *
 * - aiRunPerformanceSummary - Një funksion që trajton procesin e gjenerimit të përmbledhjes nga AI.
 * - AiRunPerformanceSummaryInput - Lloji i hyrjes për funksionin aiRunPerformanceSummary.
 * - AiRunPerformanceSummaryOutput - Lloji i kthimit për funksionin aiRunPerformanceSummary.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AiRunPerformanceSummaryInputSchema = z.object({
  userId: z.string().describe('ID-ja e përdoruesit.'),
  carModel: z.string().describe('Modeli i makinës.'),
  modifications: z.string().optional().describe('Përshkrimi i modifikimeve të makinës.'),
  city: z.string().describe('Qyteti ku u krye gara.'),
  runDate: z.string().describe('Data e garës (p.sh., "YYYY-MM-DD").'),
  best0To100: z.number().optional().describe('Koha më e mirë 0-100 km/h në sekonda.'),
  best100To200: z.number().optional().describe('Koha më e mirë 100-200 km/h në sekonda.'),
  topSpeed: z.number().optional().describe('Shpejtësia më e lartë e arritur në km/h.'),
  quarterMileTime: z.number().optional().describe('Koha më e mirë e çerek miljes në sekonda.'),
});
export type AiRunPerformanceSummaryInput = z.infer<typeof AiRunPerformanceSummaryInputSchema>;

const AiRunPerformanceSummaryOutputSchema = z.object({
  summary: z.string().describe(
    'Një përmbledhje në gjuhën shqipe e performancës së vozitjes, duke përfshirë metrikat më të mira, përmirësimet e mundshme dhe këshilla të personalizuara.'
  ),
});
export type AiRunPerformanceSummaryOutput = z.infer<typeof AiRunPerformanceSummaryOutputSchema>;

export async function aiRunPerformanceSummary(
  input: AiRunPerformanceSummaryInput
): Promise<AiRunPerformanceSummaryOutput> {
  return aiRunPerformanceSummaryFlow(input);
}

const aiRunPerformanceSummaryPrompt = ai.definePrompt({
  name: 'aiRunPerformanceSummaryPrompt',
  input: { schema: AiRunPerformanceSummaryInputSchema },
  output: { schema: AiRunPerformanceSummaryOutputSchema },
  prompt: `Ju jeni një trajner dhe analist ekspert i performancës automobilistike për "DriveRank Kosovë". Qëllimi juaj është të jepni një përmbledhje të shkurtër në gjuhën shqipe të performancës së një përdoruesi, duke nxjerrë në pah metrikat e tyre më të mira, duke identifikuar fushat për përmirësim dhe duke ofruar këshilla të personalizuara.\n\nDetajet e garës:\nModeli i Makinës: {{{carModel}}}\n{{#if modifications}}Modifikimet: {{{modifications}}}\n{{/if}}Qyteti: {{{city}}}\nData: {{{runDate}}}\n\nMetrikat e performancës:\n{{#if best0To100}}0-100 km/h: {{{best0To100}}} sekonda\n{{/if}}{{#if best100To200}}100-200 km/h: {{{best100To200}}} sekonda\n{{/if}}{{#if topSpeed}}Shpejtësia Max: {{{topSpeed}}} km/h\n{{/if}}{{#if quarterMileTime}}Koha e Çerek Miljes: {{{quarterMileTime}}} sekonda\n{{/if}}\nAnalizoni të dhënat e ofruara.\nNxirrni në pah metrikat më mbresëlënëse.\nIdentifikoni një ose dy fusha specifike për përmirësim.\nOfroni një këshillë vepruese për të ndihmuar shoferin të përmirësohet.\nPërmbledhja duhet të jetë inkurajuese, profesionale dhe t'i drejtohet shoferit në gjuhën shqipe.`
});

const aiRunPerformanceSummaryFlow = ai.defineFlow(
  {
    name: 'aiRunPerformanceSummaryFlow',
    inputSchema: AiRunPerformanceSummaryInputSchema,
    outputSchema: AiRunPerformanceSummaryOutputSchema,
  },
  async (input) => {
    const { output } = await aiRunPerformanceSummaryPrompt(input);
    if (!output) {
      throw new Error('Dështoi gjenerimi i përmbledhjes së performancës.');
    }
    return output;
  }
);
