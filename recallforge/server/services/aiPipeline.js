import Anthropic from '@anthropic-ai/sdk';
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// pull out the testable facts from raw notes
export async function extractKeyConcepts(rawText) {
    const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        messages: [{
            role: 'user',
            content: `List the key concepts, definitions, and testable facts from this
            material as a bullet list:\n\n${rawText}`
        }],
    });


    return response.content[0].text;
}


// Branch B: turn key concepts into strict-JSON flashcards
export async function generateFlashcardsJSON(keyConcepts) {
    const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 2000,
        messages: [{
            role: 'user',
            content: `Based on these key concepts, generate flashcards as a JSON array of
            {"front": "...", "back": "..."} objects. Return ONLY valid JSON, no prose.
    Key concepts:
    ${keyConcepts}`
        }],
    });
return JSON.parse(response.content[0].text);
}
