import { prisma } from '../utils/prisma';

export class AiService {
    static async generateContent(userId: string, topic: string, keywords: string[]) {
        // 1. Check user credits (optional but recommended)
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new Error('User not found');

        // Simple logic: pretend we need 1 credit
        if (user.credit <= 0 && user.creditUsed >= user.credit) {
            // Depending on how credit is modeled. 
            // If credit is "total allowance" and creditUsed is "consumed".
            if (user.pricingPlanId) {
                // Check if allowance exceeded
                if ((user.credit - user.creditUsed) < 1) {
                    throw new Error('Insufficient credits');
                }
            }
        }

        // 2. "Generate" content (Mocking AI for now as no LLM provider is setup in context)
        // In a real app, this would call OpenAI/Gemini/Anthropic
        const generatedTitle = `Viral Video about ${topic} | ${keywords[0] || 'Amazing'}`;
        const generatedDescription = `In this video, we explore ${topic}. Don't forget to like and subscribe! \n\nTags: ${keywords.join(', ')}`;

        const output = JSON.stringify({ title: generatedTitle, description: generatedDescription });
        const input = JSON.stringify({ topic, keywords });

        // 3. Record history
        await prisma.generateHistory.create({
            data: {
                userId,
                input,
                output,
                credit: 1,
                status: 'SUCCESS'
            }
        });

        // 4. Deduct credit (update usage)
        await prisma.user.update({
            where: { id: userId },
            data: {
                creditUsed: { increment: 1 }
            }
        });

        return {
            title: generatedTitle,
            description: generatedDescription,
            creditsUsed: 1,
            remainingCredits: user.credit - (user.creditUsed + 1)
        };
    }
}
