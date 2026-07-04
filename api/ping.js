export default async function handler(req, res) {
  // Pega as variáveis de ambiente que já estão configuradas no Vercel
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Missing environment variables' });
  }
  
  try {
    // Faz uma requisição simples na API do Supabase apenas para registrar atividade
    const response = await fetch(`${supabaseUrl}/rest/v1/?limit=1`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });
    
    await response.json();
    return res.status(200).json({ 
      message: 'Supabase pinged successfully! O projeto não vai dormir.', 
      success: true 
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
