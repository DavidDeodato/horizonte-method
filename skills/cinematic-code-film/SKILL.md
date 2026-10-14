---
name: cinematic-code-film
description: Dirigir e renderizar filmes cinematográficos 100% em código (three.js + shaders + Web Audio) com um loop de iteração por folha de contato e métricas objetivas. Use quando o usuário pedir animações complexas, curtas, trailers ou cenas 3D geradas por código, principalmente espaço/sci-fi.
---

# Filme cinematográfico em código

Você não vê o vídeo nem ouve o som. Trabalhe sempre com evidências: quadros renderizados, folhas de contato e métricas.

## Arquitetura obrigatória
- Cada quadro é função pura do tempo: `renderFrameJPEG(t)`. Simulações pesadas rodam uma vez no carregamento e viram instantâneos interpolados.
- Render headless na GPU (puppeteer) direto para o ffmpeg; K subquadros acumulados para antialias + motion blur.
- Áudio sintetizado em `OfflineAudioContext` no mesmo projeto, com os mesmos tempos da imagem.
- Proteção contra NaN/Inf antes do bloom (um pixel inválido vira uma piscada preta na tela inteira).

## Loop (repita até passar)
1. Renderize uma folha de contato com 8–16 quadros-chave (meia resolução, K=1) e olhe.
2. Critique como espectador: o protagonista está no quadro? Algo se move perto da lente? Parece slide? Parece efeito 2D colado na tela?
3. Corrija a causa raiz e descreva-a em uma frase.
4. Rode as métricas. Só renderize o filme final quando passarem.

## Regras de direção
- Protagonista com agência; a câmera vai junto (perseguição, silhueta, rente à superfície, de frente, lateral).
- Transição entre rigs girando em volta do protagonista (interpolação esférica do vetor câmera→alvo), nunca atravessando.
- Estabilize: média temporal curta na câmera; rota suavizada; giro do protagonista < ~25°/s.
- Sempre um elemento em primeiro plano (poeira, detritos) para paralaxe.
- Sem cortes. Se precisar trocar de lugar, esconda a troca num clarão diegético (salto de dobra) e reutilize sempre o mesmo som para esse salto.
- Um som próprio para cada evento. Proibido ruído com estalos aleatórios ("fogo/chiado"); prefira grave tonal, acordes, pressão.
- Física plausível: no vácuo não há rastro de luz nem chama; motores iônicos brilham azul fraco; efeitos de luz saem da fonte certa (o clarão da supernova sai da estrela, não da nave).
- Pouco texto na tela: título curto e uma linha.

## Métricas
- Câmera: saltos (>8× a mediana local), paradas (<12% da velocidade anterior em 0,3 s), saltos de FOV. Zero fora das transições planejadas.
- Vídeo: piscadas pretas (luma do quadro < 60% dos vizinhos) = zero; movimento por janela de 10 s ≥ nível da melhor cena.
- Áudio: −14 LUFS e pico ≤ −1 dBFS; espectrograma com eventos distintos.

## Entrega
Relate o que mudou, os números das métricas e o que ainda não está bom. Não diga que está perfeito.
