# Produção do vídeo B — "Meia barba" (31 s)

Divisão do trabalho:
- **Você:** imagens no ChatGPT e voz no ElevenLabs.
- **Eu:** animação por código e montagem final aqui (Python + ffmpeg, já instalados; nada novo para instalar).

## O que a animação por código faz (e o que não faz)

**Faz**
- Movimento de câmera em cada imagem: push-in, pull-out, subida, travelling.
- Cortes rápidos entre imagens em sequência (ex.: máquina no alto da bochecha e depois embaixo), no ritmo da fala.
- Profundidade 2.5D: produto recortado na frente e fundo em outra velocidade.
- Partículas desenhadas por código: pelos caindo, gotas, brilho passando no metal.
- Flash no clique da troca de cabeça.
- Legendas palavra a palavra, títulos na tela e efeitos sonoros sintetizados (clique, zumbido, água, pop, swoosh) no quadro exato da ação.
- Master em -14 LUFS e exportação 1080 × 1920, 30 fps.

**Não faz**
- Movimento humano real, como a mão deslizando continuamente pelo rosto. Isso só sai de um gerador de vídeo (Kling, Veo, Sora).
- Por isso o vídeo segue o estilo "foto em movimento": de 2 a 3 imagens por cena, cortadas no ritmo, com câmera, partículas e som vendendo a ação. Esse formato é comum em anúncio de produto no TikTok e funciona bem com cortes de 1 a 2,5 s.
- Se depois você tiver acesso a um gerador de vídeo, troco as cenas de rosto por clipes, sem refazer o resto.

## Passo 1 — Imagens no ChatGPT

**Regras para todas as imagens**
- Formato **retrato 2:3** (1024 × 1536). Deixe o assunto no centro, com folga nas laterais (eu recorto para 9:16).
- **Sempre anexe** `referencias/anuncio-foto-1.jpg` e `referencias/anuncio-foto-3.jpg` e escreva: *"the shaver must look exactly like the attached reference: blue and black body, white DALING label, blue sliding switch, vent lines at the base"*.
- Nas imagens com o homem, anexe também `personagem.png` (a imagem 0), para ele ser o mesmo em todas.
- **É um corpo só com cabeças que trocam.** Nunca três máquinas na mesma mão.
- Sem texto, sem logotipo extra, sem marca d'água.
- **Confira cada imagem contra a foto do anúncio** (cor, etiqueta DALING, botão). Se a máquina vier diferente, gere de novo. Produto errado no vídeo gera reclamação e devolução.

Estilo para colar no fim de cada prompt:
> Photorealistic, vertical 2:3, cinematic bathroom, warm 3200K key light from the left at 45 degrees, soft cool window fill from the right, subtle rim light, natural skin texture, shallow depth of field, no text.

| Arquivo | Cena | Prompt |
|---|---|---|
| `0-personagem.png` | referência | Brazilian man about 30, short dark hair, light brown skin, 4-day stubble beard, neutral expression, plain grey t-shirt, front and three-quarter view side by side, neutral studio light |
| `produto-barbear.png` | herói | The shaver with the foil shaving head attached, standing upright, three-quarter view, **transparent background PNG** |
| `produto-aparador.png` | herói | The same shaver with the beard trimmer head (comb guide) attached, **transparent background PNG** |
| `produto-nariz.png` | herói | The same shaver with the narrow nose trimmer head attached, **transparent background PNG** |
| `B1.png` | 0:00–0:03 | Mirror close-up of the man from the reference: LEFT half of his face cleanly shaved, RIGHT half still with 4-day stubble, sharp line down the middle of the chin; he holds the shaver with the beard trimmer head near his right cheek, looking at the mirror |
| `B2a.png` | 0:03–0:05 | Side close-up: the beard trimmer head touching the top of his stubbled cheek near the sideburn |
| `B2b.png` | 0:05–0:08 | Same angle: the trimmer lower on the cheek, a cleaner strip behind it, a few short hairs falling into the white sink below |
| `B3a.png` | 0:08–0:10 | Macro of two hands over the sink: one holds the shaver body, the other holds the trimmer head just removed |
| `B3b.png` | 0:10–0:13 | Macro: the foil shaving head now attached to the body, thumb on the blue switch, specular highlight on the foil |
| `B4a.png` | 0:13–0:15 | Low angle from below the chin: the shaver with the foil head on his neck |
| `B4b.png` | 0:15–0:18 | Same low angle: the shaver now at the chin, neck already clean |
| `B5.png` | 0:18–0:22 | Macro: only the foil head under a running bathroom tap, water droplets backlit, dark background (do not submerge the body) |
| `B6.png` | 0:22–0:27 | Mirror front view: the man with both sides of the face cleanly shaved and even, slight satisfied look, shaver in hand, no cable anywhere |
| `B7-fundo.png` | 0:27–0:31 | Empty light-grey stone bathroom counter, soft warm light, blurred mirror and plants in background, nothing on the counter (o produto eu coloco por código, com as imagens de produto) |

Total: 14 imagens. Se alguma ficar ruim, me mande mesmo assim e diga qual: às vezes dá para recortar ou combinar.

## Passo 2 — Voz no ElevenLabs

- **Voz:** masculina, português do Brasil, natural e de conversa (nada de locutor de rádio). Teste duas ou três vozes com a frase B1 e fique com a mais "gente comum".
- **Modelo:** Multilingual v2 (ou o mais novo de PT-BR que você tiver).
- **Ajustes sugeridos:** estabilidade de 40 a 50%, similaridade de 75%, estilo de 0 a 15%, velocidade 1,0. Se ficar arrastado, use 1,05.
- **Um arquivo por fala**, com exatamente estes nomes e textos (assim eu sincronizo legenda e cena sem adivinhar):

| Arquivo | Texto | Cabe em |
|---|---|---|
| `B1.mp3` | Metade feita. Agora a outra metade. | 3 s |
| `B2.mp3` | Primeiro o volume, com o aparador. | 5 s |
| `B3.mp3` | Um clique, e troca pra cabeça de barbear. | 5 s |
| `B4.mp3` | Queixo e pescoço com a mesma máquina. | 5 s |
| `B5.mp3` | No fim, enxágua a cabeça na pia. Ela é resistente à água. | 4 s |
| `B6.mp3` | Os dois lados iguais, e nenhum fio no caminho. | 5 s |
| `B7.mp3` | Tá no carrinho. Confere o preço de hoje. | 4 s |

Se alguma fala passar do tempo, não se preocupe: eu ajusto a duração da cena.

## Passo 3 — Me envie

Mande as 14 imagens e os 7 áudios aqui no chat. Com eles eu:
1. Recorto e preparo as imagens para 1080 × 1920.
2. Animo cena a cena e sincronizo as legendas com cada áudio.
3. Gero os efeitos sonoros e faço a mixagem e o master em -14 LUFS.
4. Exporto o `B-meia-barba.mp4` (H.264 + AAC, 30 fps) e mando uma prévia.

**Música:** saio sem trilha. Ao publicar, você escolhe uma da **biblioteca comercial do TikTok** no próprio app, em volume baixo. Assim não há risco de direitos autorais, e um som em alta pode ajudar o alcance.

## Ao publicar

- Ativar o rótulo **"Conteúdo gerado por IA"**: a pessoa e as cenas são sintéticas.
- Vincular o produto **na variante 3 em 1** (o anúncio tem outras, como a "4 em 1").
- Não escrever preço, desconto ou "últimas unidades" na legenda do post. O card do produto já mostra o preço atual.
