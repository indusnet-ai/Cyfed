import { NextResponse } from 'next/server';
import { LLMChatSchema } from '@fedsoc/schemas';
import { createLogger } from '@fedsoc/shared';

const logger = createLogger('api-chat');

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parseResult = LLMChatSchema.safeParse(body);
    
    if (!parseResult.success) {
      return NextResponse.json({ error: parseResult.error.format() }, { status: 400 });
    }

    const { messages, config } = parseResult.data;
    const provider = config?.provider || 'ollama';
    const modelName = config?.modelName || 'llama3.1:8b';
    const baseUrl = config?.baseUrl || 'http://localhost:11434';

    logger.info({ provider, modelName, baseUrl }, 'Relaying message to LLM');

    if (provider === 'ollama') {
      try {
        const response = await fetch(`${baseUrl}/api/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: modelName,
            messages: messages,
            stream: false,
          }),
          signal: AbortSignal.timeout(10000), // 10s timeout
        });

        if (response.ok) {
          const result = await response.json();
          const content = result.message?.content || '';
          
          return NextResponse.json({
            content,
            usage: {
              promptTokens: result.prompt_eval_count || 0,
              completionTokens: result.eval_count || 0,
              totalTokens: (result.prompt_eval_count || 0) + (result.eval_count || 0),
            }
          });
        } else {
          const text = await response.text();
          logger.warn({ status: response.status, text }, 'Ollama connection failed, returning offline fallback');
        }
      } catch (err: any) {
        logger.warn({ err }, 'Ollama is unreachable, returning offline fallback');
      }
    }

    // Fallback offline mock response generator matching the python package behavior
    const lastUserMessage = messages.reverse().find(m => m.role === 'user')?.content || '';
    let mockContent = '';

    if (lastUserMessage.toLowerCase().includes('threat') || lastUserMessage.toLowerCase().includes('event') || lastUserMessage.toLowerCase().includes('alert')) {
      mockContent = `### Threat Synthesis Report (Offline Mock)
- **Attacker Vector**: Suspected high-volume port scanning or credential stuffing (detected high \`count\` / \`srv_count\` metrics).
- **Impact Assessment**: Target node environment exhibits abnormal request frequency. Risk of Denial of Service (DoS) or unauthorized discovery.
- **Remediation Steps**:
  1. Block origin IP via regional firewall configurations.
  2. Enable adaptive rate-limiting on target load balancers.
  3. Rotate API keys and inspect system session states.`;
    } else if (lastUserMessage.toLowerCase().includes('federated') || lastUserMessage.toLowerCase().includes('round')) {
      mockContent = `### FL Aggregation Synthesis (Offline Mock)
- **Trend Analysis**: Global model weights have successfully aggregated via \`FedAvg\`. Accuracy remains stable.
- **Node Contribution Quality**: No clear signs of gradient poisoning. All local models converged in line with expected learning rates.`;
    } else {
      mockContent = `⚠️ **Note**: Ollama server is currently offline or unreachable at ${baseUrl}.
Showing offline analytical synthesis instead. Connect to a local Ollama instance running Llama 3.1 for live LLM reasoning.`;
    }

    return NextResponse.json({
      content: mockContent,
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 }
    });

  } catch (err: any) {
    logger.error({ err }, 'Chat API handler error');
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
