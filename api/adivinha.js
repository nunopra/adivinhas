module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

  const { tema } = req.body || {};
  if (!tema) return res.status(400).json({ error: 'Tema em falta' });

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 512,
        system: 'És um especialista em adivinhas portuguesas para crianças. Respondes SEMPRE e APENAS com JSON válido — sem texto adicional, sem markdown, sem backticks, sem comentários.',
        messages: [{
          role: 'user',
          content: `Cria exatamente 3 adivinhas em português europeu sobre o tema "${tema}" para crianças de 4 a 6 anos.

Responde APENAS com este JSON (sem mais nada):
[{"pergunta":"...","resposta":"..."},{"pergunta":"...","resposta":"..."},{"pergunta":"...","resposta":"..."}]

Regras:
- Português europeu (nunca brasileiro)
- Divertidas e com rima sempre que possível
- Nem demasiado fáceis nem demasiado difíceis — boas para 4 a 6 anos
- Resposta: uma palavra ou frase muito curta
- Sem violência ou temas assustadores`
        }]
      })
    });

    const data = await r.json();
    if (!r.ok) throw new Error(data.error?.message || 'Erro API');

    const raw = data.content?.[0]?.text?.trim();
    if (!raw) throw new Error('Resposta vazia');

    const adivinhas = JSON.parse(raw);
    if (!Array.isArray(adivinhas) || adivinhas.length < 3) throw new Error('Formato inválido');

    return res.status(200).json({ adivinhas });

  } catch (err) {
    console.error('Erro:', err.message);
    return res.status(500).json({ error: 'Não foi possível gerar as adivinhas. Tenta novamente.' });
  }
};
