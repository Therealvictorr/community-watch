import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const apiKey = process.env.GROQ_API_KEY

  if (!apiKey) {
    return NextResponse.json({ error: 'GROQ_API_KEY is not configured' }, { status: 500 })
  }

  const { message, reports } = await request.json()

  const reportsContext = reports?.length
    ? `\nHere are the current active community reports:\n${JSON.stringify(
        reports.map((r: any) => ({
          id: r.id,
          subject: r.subject,
          type: r.report_type,
          status: r.status,
          location: r.last_seen_location,
          description: r.description,
          created_at: r.created_at,
          sighting_count: r.sighting_count || 0,
        })),
        null,
        2
      )}`
    : '\nNo reports are currently in the system.'

  const systemPrompt = `You are a Community Watch AI assistant. You help community members understand safety reports, find information, and analyze patterns.

You have access to the following live report data:${reportsContext}

Guidelines:
- Be concise and helpful. Keep answers to 2-3 sentences when possible.
- When asked about reports, reference specific report subjects and details from the data above.
- When asked about hotspots or patterns, analyze the location data from reports.
- When asked for statistics, calculate them from the actual report data.
- If asked about something unrelated to community safety, politely redirect.
- Use a friendly, reassuring tone.`

  try {
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message },
        ],
        temperature: 0.6,
        max_tokens: 500,
      }),
    })

    if (!groqRes.ok) {
      const err = await groqRes.text()
      return NextResponse.json({ error: `Groq API error: ${err}` }, { status: 502 })
    }

    const data = await groqRes.json()
    const content = data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.'

    return NextResponse.json({ response: content })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Unexpected error' }, { status: 500 })
  }
}
