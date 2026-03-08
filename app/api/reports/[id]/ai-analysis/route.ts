import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { buildVconObject } from '@/lib/vcon'
import { mockReports, mockSightings } from '@/lib/mock-data'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const apiKey = process.env.GROQ_API_KEY

  if (!apiKey) {
    return NextResponse.json({ error: 'GROQ_API_KEY is not configured' }, { status: 500 })
  }

  // Build vCon object from real or mock data
  let vcon
  if (!isSupabaseConfigured()) {
    const report = mockReports.find((r) => r.id === id)
    if (!report) return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    vcon = buildVconObject({ report, sightings: mockSightings.filter((s) => s.report_id === id), attachments: [] })
  } else {
    const supabase = await createClient()
    const { data: report } = await supabase
      .from('reports')
      .select('*, reporter:profiles(id, full_name), attachments:report_attachments(*)')
      .eq('id', id)
      .maybeSingle()

    if (!report) {
      const mock = mockReports.find((r) => r.id === id)
      if (!mock) return NextResponse.json({ error: 'Report not found' }, { status: 404 })
      vcon = buildVconObject({ report: mock, sightings: mockSightings.filter((s) => s.report_id === id), attachments: [] })
    } else {
      const { data: sightings } = await supabase
        .from('sightings')
        .select('*')
        .eq('report_id', id)
        .order('sighted_at', { ascending: true })
      vcon = buildVconObject({ report, sightings: sightings || [], attachments: report.attachments || [] })
    }
  }

  const prompt = `You are an AI assistant for a community safety platform. Analyze this vCon (Virtual Conversation) record for a community incident report and return a structured analysis.

vCon Record:
${JSON.stringify(vcon, null, 2)}

Respond ONLY with valid JSON in this exact format (no markdown, no explanation):
{
  "summary": "A 2-sentence plain-English summary of the incident suitable for community members",
  "urgency": "low|medium|high|critical",
  "key_details": ["detail 1", "detail 2", "detail 3"],
  "recommended_actions": ["action 1", "action 2", "action 3"],
  "vcon_insight": "One sentence explaining how the vCon standard enables better incident tracking in this specific case"
}

Urgency guide: low=minor incident/no immediate danger, medium=concerning but not emergency, high=potentially dangerous/time-sensitive, critical=immediate threat to life or safety.`

  const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.4,
      max_tokens: 800,
    }),
  })

  if (!groqRes.ok) {
    const err = await groqRes.text()
    return NextResponse.json({ error: `Groq API error: ${err}` }, { status: 502 })
  }

  const groqData = await groqRes.json()
  const rawContent = groqData.choices?.[0]?.message?.content || ''

  try {
    // Strip any markdown code fences if model adds them
    const cleaned = rawContent.replace(/```json?\n?/g, '').replace(/```/g, '').trim()
    const parsed = JSON.parse(cleaned)
    return NextResponse.json(parsed)
  } catch {
    return NextResponse.json({ error: 'Failed to parse AI response', raw: rawContent }, { status: 500 })
  }
}
