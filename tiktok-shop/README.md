# TikTok shop

Pacote com 10 skills + a skill orquestradora `tiktok-shop-agencia` (o método da agência, que usa as outras) para criar vídeos curtos que vendem no TikTok Shop.

| Skill | Para que serve | Origem (repositório público) |
|---|---|---|
| `hook-anatomy` | Capturar atenção (ganchos) | scrollmark/social-skills @ c2bafd6 (MIT) |
| `marketing-psychology` | Despertar desejo | coreyhaines31/marketingskills @ 8fd2fca (MIT) |
| `copywriting` | Persuasão | coreyhaines31/marketingskills @ 8fd2fca (MIT) |
| `video-shorts` | Retenção em vídeos curtos | ericrisco/rsc-harness @ 89cf6a2 (MIT) |
| `customer-research` | Entender o consumidor | coreyhaines31/marketingskills @ 8fd2fca (MIT) |
| `video-script` | Estrutura narrativa do roteiro | vargHQ/skills @ 55ac28d (MIT) |
| `offers` | Apresentação da oferta | coreyhaines31/marketingskills @ 8fd2fca (MIT) |
| `copy-editing` | Refinamento do roteiro | coreyhaines31/marketingskills @ 8fd2fca (MIT) |
| `video` | Produção audiovisual | coreyhaines31/marketingskills @ 8fd2fca (MIT) |
| `remotion-best-practices` | Animação programática (Remotion) | remotion-dev/skills @ 89c8afa (sem arquivo de licença no repositório) |

As licenças originais estão em `licenses/`.

## Como usar

- **Claude Code neste repositório:** já funciona. As skills ficam em `.claude/skills/` (atalhos para esta pasta) e são carregadas sozinhas em qualquer sessão aberta no repositório. Peça, por exemplo: "use hook-anatomy para criar 5 ganchos para este produto".
- **Instalar como plugin em outro projeto (Claude Code):**
  ```
  /plugin marketplace add Vihentorxx/teste1
  /plugin install tiktok-shop@teste1-skills
  ```
