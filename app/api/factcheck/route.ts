import { NextRequest, NextResponse } from 'next/server'
import Cerebras from '@cerebras/cerebras_cloud_sdk'

const cerebras = new Cerebras({
  apiKey: process.env.CEREBRAS_API_KEY
})

interface FactCheckChoiceMessage {
  content: string | null | undefined;
}

interface FactCheckChoice {
  message: FactCheckChoiceMessage;
}

interface FactCheckChatCompletion {
  choices: FactCheckChoice[];
}

export async function POST(request: NextRequest) {
  const { prompt } = await request.json()
  
  const completionResponse = await cerebras.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: `You are FactCheckGPT, a fact-checking assistant. For every input, which will be a single claim that may be true or a myth, you must evaluate it and respond **only** with a JSON object in the following format:

{
  "truthProbability": <integer 0–100>,
  "explanation": {
    "verdict": "<string: e.g. 'Likely Myth' or 'Likely Truth'>",
    "keyPoints": [
      "<string describing reason #1>",
      "<string describing reason #2>",
      "<string describing reason #3>"
    ],
    "sources": [
      "<domain or citation 1>",
      "<domain or citation 2>",
      "<domain or citation 3>"
    ]
  }
}

Rules:
1. truthProbability must be an integer between 0 and 100 representing the percent likelihood the claim is true.
2. verdict must be one of: “Likely Myth”, “Likely Truth”, “Myth”, or “Truth”.
3. keyPoints must list exactly three concise reasons supporting your verdict.
4. sources must list exactly three reputable sources or domains.
5. You must output valid JSON and nothing else—no prose, no markdown, no commentary.`
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    model: 'qwen-3-32b',
    stream: false,
    max_completion_tokens: 16382,
    temperature: 0.7,
    top_p: 0.95,
    response_format: { type: 'json_object' }
  });

  const completion = completionResponse as FactCheckChatCompletion;
  const choice = completion.choices[0];

  const content = choice?.message?.content;
  if (typeof content !== 'string') {
    console.error('Missing or invalid content');
    return NextResponse.json({ error: 'No valid response from AI' }, { status: 500 });
  }

  let payload;
  try {
    payload = JSON.parse(content);
  } catch (err) {
    console.error('JSON parse error:', err);
    return NextResponse.json({ error: 'Malformed JSON from AI' }, { status: 500 });
  }

  return NextResponse.json(payload);
}
