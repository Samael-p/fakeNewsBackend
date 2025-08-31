const axios = require('axios');
require('dotenv').config(); // Cargar variables desde .env

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama3-70b-8192';

// Verificar que la API key esté configurada
if (!GROQ_API_KEY) {
  console.error('ERROR: GROQ_API_KEY no está configurada en el archivo .env');
  throw new Error('GROQ_API_KEY no está configurada');
}

async function verificarConIA(texto) {
  try {
    const prompt = `
Eres un verificador de hechos boliviano especializado en detectar noticias falsas. 
Tu tarea es evaluar cuidadosamente el texto proporcionado y responder SOLO con un JSON válido y completo, sin explicaciones externas ni texto adicional. 

Debes analizar la información basándote en: 
- Consistencia lógica (si el hecho es posible o altamente improbable).
- Disponibilidad de fuentes confiables (medios oficiales, periódicos reconocidos, comunicados de instituciones públicas, organismos internacionales).
- Lenguaje utilizado (si contiene frases sensacionalistas, conspirativas o exageradas).
- Contexto boliviano y latinoamericano (considera la realidad política, económica y social actual).
- Contraste con eventos recientes y verificables.

REGLAS DEL VEREDICTO:
- Usa "Posiblemente Verdadera" si hay coincidencias sólidas en fuentes confiables.
- Usa "Posiblemente Falsa" si se contradice con fuentes confiables o presenta rasgos típicos de noticias falsas.
- Usa "No concluyente" si no hay suficiente evidencia para determinar su veracidad.

SCORE (0–100):
- 0–30 → Muy probablemente falso.
- 31–69 → Incierto o no concluyente.
- 70–100 → Altamente probable que sea verdadero.

FORMATO DE SALIDA ÚNICO (JSON estricto):
{
  "veredicto": "Posiblemente Verdadera" | "Posiblemente Falsa" | "No concluyente",
  "score": número entre 0 y 100,
  "razonamiento": "explicación breve y objetiva en español",
  "fuenteCoincidente": "url confiable o null si no hay"
}

Texto a evaluar:
"""${texto}"""
`;

    const response = await axios.post(
      GROQ_API_URL,
      {
        model: MODEL,
        messages: [
          { role: 'system', content: 'Eres un verificador de hechos experto en noticias bolivianas.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 512
      },
      {
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const content = response.data.choices[0].message.content;
    const jsonStart = content.indexOf('{');
    const jsonEnd = content.lastIndexOf('}');
    const jsonString = content.substring(jsonStart, jsonEnd + 1);

    const resultado = JSON.parse(jsonString);
    return resultado;

  } catch (err) {
    console.error('Error al usar Groq:', err.response?.data || err.message);
    return {
      veredicto: 'No concluyente',
      score: 50,
      razonamiento: 'No se pudo analizar el texto correctamente.',
      fuenteCoincidente: null
    };
  }
}

module.exports = verificarConIA;
