# HORIZONTE — filmes cinematográficos 100% em código, dirigidos com o Claude

**HORIZONTE** é um curta de 3:43 sobre a vida de uma estrela, a colisão de galáxias e a queda num buraco negro, com uma nave em uma tomada contínua. Tudo foi gerado por código (three.js + shaders + Web Audio), sem modelo de vídeo, sem banco de imagens e sem trilha pronta. Cada quadro é uma função do tempo `f(t)`, renderizado de forma determinística.

Este repositório é o **método**: o motor, as ferramentas de medição e o protocolo que fizeram o filme sair de "slides com legenda" para algo que segura o espectador. A skill pronta deixa você plugar isso no seu agente (Claude Code ou outro).

```
film/      motor, filme, renderizador e ferramentas de QA (rode tudo daqui)
skills/    skill para Claude Code: o protocolo de direção em formato de instrução
METHOD.md  o método completo: o loop, as regras, as métricas, o que funcionou e o que não funcionou
```

## Rodar

Requisitos: Node 20+, Google Chrome e ffmpeg no PATH.

```bash
cd film
npm install
# quadros de teste (meia resolução, rápido)
node film_render.mjs horizonte.html stills ../out "k=1&res=0.5" 42.6 86.2 184
# trilha (Web Audio offline → WAV)
node film_render.mjs horizonte.html audio ../out/trilha.wav "res=0.25&k=1"
# filme final 1080p, 6 subquadros por quadro (antialias + motion blur)
node film_render.mjs horizonte.html full ../out/HORIZONTE.mp4 "k=6"
# QA: câmera (trancos, paradas, saltos de zoom) e vídeo (piscadas pretas, movimento por trecho)
node film_render.mjs horizonte.html cam ../out/cam.json "res=0.25&k=1" && node camcheck.mjs ../out/cam.json
node qa.mjs ../out/HORIZONTE.mp4
```

Se o Chrome estiver em outro caminho, ajuste `executablePath` em `film_render.mjs`.

## O que tem no motor (`film/`)

| Arquivo | O que é |
|---|---|
| `film_render.mjs` | Renderizador headless (puppeteer + GPU): `stills`, `audio`, `full`, `cam` |
| `space.js` | Pipeline de pós: acumulação de subquadros (AA + motion blur), lente de dobra, bloom, grade, proteção contra NaN |
| `ship.js` | Nave procedural (casco, anel, radiadores, motores iônicos fisicamente plausíveis) |
| `galsim.js` | Colisão de galáxias **simulada** (problema restrito de 3 corpos, 40 mil estrelas, ~1,3 s) |
| `horizonte.html` | O filme: linha do tempo, fundos em raymarch (nebulosa, estrela, supernova, pulsar, buraco negro com lente gravitacional), rigs de câmera |
| `horizonte_audio.js` | A trilha inteira sintetizada: órgão, coro, bateria e efeitos próprios por evento |
| `camcheck.mjs` | Detector de continuidade de câmera |
| `qa.mjs` | Detector de piscadas pretas e curva de movimento por trecho |

## Licença

MIT. Use, remixe e publique; se der crédito, eu agradeço.
