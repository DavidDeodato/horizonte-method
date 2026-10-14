# O método: dirigir um filme em código com uma IA

A IA escreve código muito rápido, mas ela **não vê o vídeo** e **não ouve o som**. O método inteiro existe para fechar essa lacuna: transformar "ficou bom?" em coisas que dá para olhar, medir e corrigir em ciclos curtos.

## 1. Arquitetura: tudo é `f(t)`

- **Cada quadro é uma função pura do tempo.** Nada de estado acumulado nem física passo a passo durante o render. Simulações (a colisão de galáxias) rodam uma vez no carregamento e viram instantâneos interpolados. Resultado: qualquer quadro pode ser renderizado isolado, em qualquer ordem, e é sempre idêntico.
- **Renderizador headless na GPU**: puppeteer chama `renderFrameJPEG(t)`, os quadros vão direto para o ffmpeg.
- **Subquadros acumulados** (K amostras por quadro com jitter): dão antialias e motion blur de verdade. O motion blur é o que transforma partículas rápidas em rastros.
- **Áudio no mesmo arquivo**, em Web Audio offline (`OfflineAudioContext`), sincronizado pelos mesmos tempos da imagem.

## 2. O loop de iteração (o coração)

1. **Folha de contato**: renderize 8–16 quadros-chave em meia resolução e K=1 numa grade só. Leva segundos e é a principal forma de "ver".
2. **Critique como espectador**, não como programador: "a nave sumiu do quadro", "parece slide", "isso parece um efeito 2D em cima da tela".
3. **Corrija a causa, não o sintoma.** Exemplos reais deste projeto:
   - **Piscadas pretas**: um pixel NaN que o bloom espalhava pela tela → proteção contra NaN no pipeline.
   - **Nave sumindo do quadro**: a câmera mirava num ponto deslocado em direção à estrela distante → deslocamento absoluto e curto.
   - **"Corte" sutil em 2:30**: o campo de visão pulava de 44° para 46° na troca de plano → o detector de câmera passou a checar o FOV.
4. **Meça** (seção 4) antes do render final de ~30 min. Só renderize o filme quando as métricas passarem.

## 3. Regras de direção que funcionaram

- **Um protagonista com agência.** A virada de "+-" para "uau" veio quando a câmera passou a ir **junto** da nave, e a nave passou a **fazer** coisas: atravessar a nuvem, voar rente ao disco, fugir da gigante vermelha, levar o tranco da supernova, passar entre os feixes do pulsar.
- **Sempre algo perto da lente.** Poeira, rochas e destroços em primeiro plano dão paralaxe e velocidade. Sem isso, tudo parece um documentário visto de longe.
- **Sem cortes: os rigs de câmera se fundem.** Cada plano (perseguição, silhueta, rente ao disco, de frente, lateral) é uma função do quadro da nave. A troca entre eles gira **em volta** da nave (interpolação esférica), para nunca atravessá-la nem perdê-la do quadro.
- **Estabilizador.** A câmera é a média de 5 amostras em ±0,36 s, como um rig com amortecedor, e a rota da nave é suavizada em ±2 s. Uma nave grande não vira a mais de ~25°/s.
- **Um som próprio por evento.** O espectador percebe quando a ignição, a supernova e o salto usam o mesmo "pumm". Cada fenômeno ganha uma assinatura sonora; o salto de dobra é o único som repetido, de propósito, porque vira linguagem.
- **Nada de ruído com estalos aleatórios.** Chiado + estalinhos soa como "lava de Minecraft" e quebra a imersão. Prefira grave tonal, acordes e pressão.
- **Física plausível onde dá, ficção declarada onde não dá.** Motor iônico brilha azul fraco e não solta chama; não existe rastro de luz no vácuo; o planeta engolido afunda na superfície da estrela em vez de sumir. A dobra espacial e o tempo comprimido são ficção assumida e explicada na tela (contador de anos).
- **Escala em saltos.** "Powers of Ten" com velocidade: cada salto de dobra revela uma escala maior (vizinhança → galáxia → colisão → centro).
- **Pouco texto.** Título curto e uma linha. A imagem tem que contar a história sozinha.

## 4. Métricas (o que dá para medir sem "ver")

| Métrica | Ferramenta | Meta |
|---|---|---|
| Continuidade de câmera: saltos, paradas bruscas, salto de FOV | `camcheck.mjs` | zero fora das transições planejadas |
| Velocidade de giro da nave | debug na página (°/s por quadro) | < ~25°/s |
| Piscadas pretas (quadro isolado escuro) | `qa.mjs` (luma por quadro) | zero |
| Movimento na tela por janela de 10 s | `qa.mjs` (scene score) | ≥ nível da melhor cena (aqui, o buraco negro ≈ 0,35–0,5) |
| Loudness | ffmpeg `ebur128` | −14 LUFS, pico ≤ −1 dBFS |
| Espectro (o som tem identidade por evento?) | ffmpeg `showspectrumpic` | eventos visíveis e diferentes entre si |

A métrica de movimento foi a que mais ajudou: ela mostrou que o meio do filme estava 5 a 8 vezes mais parado que o buraco negro. Daí veio a decisão de pôr a nave como protagonista.

## 5. O que não funcionou

- Zoom cósmico lento e contemplativo por 40 s: o espectador desliga.
- Nebulosa como névoa colorida de baixa frequência: lida como "efeito 2D na tela". Funciona quando a nuvem é vista de longe como objeto e a estrela cava uma bolha com paredes iluminadas.
- Cones de luz em malha para o pulsar: parecem riscos chapados. Funcionam em volume no raymarch (média temporal do giro de 30 Hz).
- Mudar a rota sem medir: cada "ajuste no olho" criou um tranco novo. Medir a curvatura da rota resolveu.
- Normalização de loudness de passada única: não atinge o alvo; use ganho calculado + limitador.

## 6. Como usar com o seu agente

Copie `skills/cinematic-code-film/` para `.claude/skills/` (Claude Code) ou cole o `SKILL.md` como instrução de sistema em outro agente. A skill impõe o loop: folha de contato → crítica como espectador → causa raiz → métricas → render.
