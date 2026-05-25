import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const CATEGORY_LABELS: Record<string, string> = {
  engine: 'Motor',
  transmission: 'Şanzıman',
  brakes: 'Frenler',
  suspension: 'Süspansiyon',
  electrical: 'Elektrik',
  ac_heating: 'Klima/Isıtma',
  fuel_system: 'Yakıt Sistemi',
  exhaust: 'Egzoz',
  body_paint: 'Kaporta/Boya',
  interior: 'İç Mekan',
  safety_systems: 'Güvenlik Sistemleri',
  steering: 'Direksiyon',
  tires_wheels: 'Lastik/Jant',
  other: 'Diğer',
};

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting: kullanıcı başına günde max 5 analiz
    const today = new Date().toISOString().split('T')[0];
    const { count } = await supabase
      .from('ai_analyses')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', `${today}T00:00:00Z`);

    if ((count ?? 0) >= 20) {
      return NextResponse.json(
        { error: 'Günlük AI analiz limiti aşıldı. Yarın tekrar deneyin.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { complaintId } = body;

    // Şikayeti detaylı çek
    const { data: complaint, error: cErr } = await supabase
      .from('complaints')
      .select(`
        *,
        vehicles (brand, model, year, engine, transmission, fuel_type)
      `)
      .eq('id', complaintId)
      .single();

    if (cErr || !complaint) {
      return NextResponse.json({ error: 'Şikayet bulunamadı.' }, { status: 404 });
    }

    // Check if an analysis already exists for this complaintId
    const { data: existingAnalysis } = await supabase
      .from('ai_analyses')
      .select('*')
      .eq('complaint_id', complaintId)
      .maybeSingle();

    if (existingAnalysis) {
      return NextResponse.json({ analysis: existingAnalysis, similarCount: 0 });
    }

    // Aynı araç+kategorideki benzer şikayetleri çek
    const complaintData = complaint as any;
    const { data: similar } = await supabase
      .from('complaints')
      .select('id, symptoms, km_at_complaint, description, severity, created_at')
      .eq('vehicle_id', complaintData.vehicle_id)
      .eq('category', complaintData.category)
      .neq('id', complaintId)
      .order('created_at', { ascending: false })
      .limit(10);

    const vehicleInfo = complaintData.vehicles;
    const categoryLabel = CATEGORY_LABELS[complaintData.category] || complaintData.category;

    const prompt = `Sen araç güvenilirlik uzmanısın. Aşağıdaki araca ait şikayeti analiz et ve JSON formatında yanıt ver.

## Araç Bilgisi
- Marka/Model: ${vehicleInfo.brand} ${vehicleInfo.model} ${vehicleInfo.year}
- Motor: ${vehicleInfo.engine}
- Şanzıman: ${vehicleInfo.transmission}
- Yakıt: ${vehicleInfo.fuel_type}

## Mevcut Şikayet
- Kategori: ${categoryLabel}
- Semptomlar: ${complaintData.symptoms.join(', ')}
- Km: ${complaintData.km_at_complaint}
- Şiddet: ${complaintData.severity}/5
- Açıklama: ${complaintData.description || 'Yok'}
- Tekrarlayan mı: ${complaintData.is_recurring ? 'Evet' : 'Hayır'}

## Benzer Şikayetler (Veritabanından)
${similar && similar.length > 0
  ? similar.map((s: any, i) => `${i + 1}. ${s.symptoms.join(', ')} | ${s.km_at_complaint}km | Şiddet:${s.severity}`).join('\n')
  : 'Henüz benzer şikayet kaydı yok.'}

## Görevin
Şikayeti şu kriterlere göre analiz et:
1. **verdict**: Bu sorun bu araç modelinde kronik mi (10+ vakada görülüyor), yaygın ama kronik değil mi, izole bir vaka mı, yoksa kullanıcı hatası mı? (chronic/common/isolated/user_error)
2. **summary**: 2-3 cümle özet (Türkçe)
3. **insights**: Teknik analiz, olası neden, önerilen çözüm adımları (Türkçe, 100-200 kelime)
4. **confidence_score**: 0-1 arası güven puanı

Yanıtını YALNIZCA aşağıdaki JSON formatında ver:
{
  "verdict": "chronic|common|isolated|user_error",
  "summary": "...",
  "insights": "...",
  "confidence_score": 0.85
}`;

    // Cache kontrolü: aynı araç+kategori için 24s cache
    const cacheKey = `${complaintData.vehicle_id}_${complaintData.category}`;
    const { data: cachedAnalysis } = await supabase
      .from('ai_analyses')
      .select('verdict, summary, insights, confidence_score')
      .in('complaint_id', ((similar || []) as any[]).map(s => s.id))
      .order('created_at', { ascending: false })
      .limit(1);

    let aiResult;

    if (cachedAnalysis && cachedAnalysis.length > 0) {
      // Cache'den al ama yeni verdict'i yaz
      aiResult = cachedAnalysis[0];
    } else {
      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-latest',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      });

      const rawText = response.content[0].type === 'text' ? response.content[0].text : '';
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return NextResponse.json({ error: 'AI yanıtı işlenemedi.' }, { status: 500 });
      }
      aiResult = JSON.parse(jsonMatch[0]);
    }

    // DB'ye kaydet
    const { data: analysis, error: aErr } = await supabase
      .from('ai_analyses')
      .insert({
        complaint_id: complaintId,
        verdict: aiResult.verdict,
        summary: aiResult.summary,
        similar_complaint_ids: ((similar || []) as any[]).map(s => s.id),
        insights: aiResult.insights,
        confidence_score: aiResult.confidence_score,
      } as any)
      .select()
      .single();

    if (aErr) {
      return NextResponse.json({ error: 'Analiz kaydedilemedi.' }, { status: 500 });
    }

    // Şikayetin kronik durumunu güncelle
    if (aiResult.verdict === 'chronic') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('complaints')
        .update({ is_chronic: true })
        .eq('id', complaintId);
    }

    return NextResponse.json({ analysis, similarCount: similar?.length || 0 });
  } catch (err) {
    console.error('AI Analysis error:', err);
    return NextResponse.json({ error: 'Sunucu hatası.' }, { status: 500 });
  }
}
