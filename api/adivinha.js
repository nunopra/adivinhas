module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

  const { tema, dificuldade } = req.body || {};
  if (!tema) return res.status(400).json({ error: 'Tema em falta' });

  const idade = dificuldade === 'dificil' ? '6' : '4';

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
          content: `Cria exatamente 3 adivinhas em português europeu sobre o tema "${tema}" para uma criança de ${idade} anos.

Responde APENAS com este JSON (sem mais nada):
[{"pergunta":"...","resposta":"..."},{"pergunta":"...","resposta":"..."},{"pergunta":"...","resposta":"..."}]

Regras:
- Português europeu (nunca brasileiro)
- ${dificuldade === 'dificil' ? 'Um pouco desafiantes mas divertidas, com rima se possível' : 'Muito simples e diretas, com dicas óbvias, ideais para 4 anos'}
- Resposta: uma palavra ou frase muito curta
- Sem violência, sem temas assustadores`
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
