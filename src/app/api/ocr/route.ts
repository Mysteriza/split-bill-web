import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('receipt') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const apiKey = process.env.NEXT_PUBLIC_TABSCANNER_API_KEY || process.env.TABSCANNER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'TABSCANNER_API_KEY is not configured' }, { status: 500 });
    }

    // 1. Submit receipt to Tabscanner
    const submitFormData = new FormData();
    submitFormData.append('receipt', file);
    
    const submitResponse = await fetch('https://api.tabscanner.com/api/2/process', {
      method: 'POST',
      headers: { 'apikey': apiKey },
      body: submitFormData,
    });

    if (!submitResponse.ok) {
      return NextResponse.json({ error: 'Failed to submit receipt to OCR' }, { status: submitResponse.status });
    }

    const submitData = await submitResponse.json();
    if (!submitData.success || !submitData.token) {
      return NextResponse.json({ error: 'Failed to get token from OCR' }, { status: 500 });
    }

    const token = submitData.token;
    let status = 'pending';
    let resultData = null;
    let attempts = 0;

    // 2. Poll for results
    while (status === 'pending' && attempts < 25) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      attempts++;
      const resultResponse = await fetch(`https://api.tabscanner.com/api/result/${token}`, { headers: { 'apikey': apiKey } });
      if (resultResponse.ok) {
        const data = await resultResponse.json();
        status = data.status;
        if (status === 'done') resultData = data.result;
      }
    }

    if (status !== 'done' || !resultData) {
      return NextResponse.json({ error: 'OCR processing timed out' }, { status: 504 });
    }

    // 3. Post-process Tabscanner with Groq if available
    let lineItems: any[] = [];
    const groqApiKey = process.env.GROQ_API_KEY;

    if (groqApiKey) {
      try {
        console.log("Using Groq to clean OCR data...");
        const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${groqApiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [
              {
                role: "system",
                content: "You are an expert data extractor. Given OCR JSON data from an Indonesian receipt, extract ONLY the actual purchased items. CRITICAL RULES: 1. You MUST IGNORE subtotals, totals (Total Belanja, Grand Total, dll), taxes, service charges, change (Kembali, Change), payment methods (Tunai, Cash, dll), and header/footer text. 2. Prices are in IDR. Convert thousands separators (e.g. '500.000' -> 500000). Ensure 'totalPrice' is a full integer. 3. Output strictly a JSON object with a single key 'items' containing an array of objects. 4. Each object must have: 'qty' (number), 'name' (string), and 'totalPrice' (number). 5. MERGE MULTI-LINE ITEMS: In Indonesian receipts, the item name (e.g., 'Indomie Goreng', 'Fruit Tea Apple') is often on one line with 0 price, and the unit/size (e.g., '1 lusin', '500 ml', 'pcs') is on the next line with the actual price. You MUST merge these! Map the actual price to the real item name. Do NOT output unit sizes like '1 lusin' or '500 ml' as separate items. 6. FILTER OUT items with 0 price or items that are just unit descriptions. WARNING: Intelligently re-align items, names, and prices based on logical context. If no items are found, return an empty array."
              },
              { role: "user", content: JSON.stringify(resultData) }
            ],
            temperature: 0.1,
            response_format: { type: "json_object" }
          })
        });

        if (groqResponse.ok) {
          const groqData = await groqResponse.json();
          let content = groqData.choices[0].message.content;
          if (content.startsWith('```json')) content = content.replace(/^```json\n/, '').replace(/\n```$/, '');
          else if (content.startsWith('```')) content = content.replace(/^```\n/, '').replace(/\n```$/, '');
          
          try {
            const parsed = JSON.parse(content);
            if (Array.isArray(parsed)) lineItems = parsed;
            else if (parsed.items && Array.isArray(parsed.items)) lineItems = parsed.items;
            else {
              const arrayVals = Object.values(parsed).find(v => Array.isArray(v));
              if (arrayVals) lineItems = arrayVals as any[];
            }
          } catch (e) { console.error("Failed to parse Groq response"); }
        }
      } catch (e) { console.error("Error communicating with Groq:", e); }
    }

    if (!lineItems || lineItems.length === 0) {
      console.log("Using Tabscanner fallback parsing...");
      lineItems = (resultData.lineItems || []).map((item: any) => ({
        qty: item.qty || 1,
        name: item.descClean || item.desc || 'Item',
        totalPrice: item.lineTotal || 0,
      })).filter((item: any) => {
        const lowerName = item.name.toLowerCase();
        if (lowerName.includes('total') || lowerName.includes('kembali') || lowerName.includes('tunai') || lowerName.includes('terima kasih') || lowerName.includes('ppn')) return false;
        return item.totalPrice > 0;
      });
    }

    return NextResponse.json({ success: true, lineItems });

  } catch (error: any) {
    console.error('OCR Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error during OCR' }, { status: 500 });
  }
}
