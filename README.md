# Fábrica de Jogos — "Siege of Darkness"

Template de jogo mobile 2D (pixel art, retrato) com anúncios AdMob e build automático.
O primeiro jogo da fábrica é **Siege of Darkness**: um caçador com uma besta fica no centro, criaturas das trevas chegam de todos os lados e você segura o dedo para atirar enquanto orbes arcanos te ajudam.

## Estrutura

```
game.config.js        ← nome, ID da loja, versão, IDs do AdMob (o único arquivo de config por jogo)
src/engine/           ← motor reutilizável (NÃO muda entre jogos)
  core.js             tela pixel-perfect, loop, toque, botões, painéis
  pixel.js            gerador de pixel art (sombreamento, dithering, contorno)
  font.js             fonte bitmap 3x5
  audio.js            efeitos sonoros e trilha sintetizados (sem arquivos)
  ads.js              AdMob: banner, intersticial, recompensado, consentimento LGPD/GDPR
  platform.js         save, vibração, botão voltar, pausa ao minimizar
src/game/             ← o jogo em si (muda a cada jogo)
  content.js          ★ fases, monstros, melhorias e evoluções (dados — edite aqui para criar conteúdo)
  gfx.js              desenho da arte realista (criaturas giradas ou com frente/costas/lado, herói em 8 direções, cenário)
src/art/              arte otimizada (WebP) usada pelo jogo — gerada por tools/process-art.py a partir de art_src/
  play.js             gameplay
  scenes.js           menu e loja de melhorias
  strings.js          textos PT/EN
  meta.js             progresso salvo
assets/               ícone e tela de abertura do app
.github/workflows/    build Android automático
docs/privacy.html     política de privacidade (publicar via GitHub Pages)
store/                textos da Play Store
```

## Arte

A arte realista (medieval sombria) vem de PNGs grandes em `art_src/` (fora do git — guarde os zips originais).
Para atualizar: coloque os PNGs novos em `art_src/` com os mesmos nomes e rode `python3 tools/process-art.py`.
Ícone e abertura do app ficam em `assets/` (o build converte tudo para WebP).

- Criaturas vistas de cima (aranha, ratazana, lobo, vespa, morcego, sapo, chefes aranha/sapo) **giram** para onde andam.
- Personagens em pé (ogro, esqueleto, goblin, bruxa, golem, Bruxa do Pântano, Lich) usam **frente / costas / lado**.
- O herói tem **8 direções** e aponta a besta para onde atira.

## Conteúdo atual

- **5 mundos, cada um com 5 fases (1-1 … 1-5) numa corrida contínua**: você mantém nível e melhorias de uma fase para a outra; entre elas, cura 1 coração e escolhe uma recompensa. O chefe aparece no fim da 5ª fase. Morreu, recomeça o mundo. Mundos: Ruínas, Esgoto, Ferro-velho, Floresta Tóxica, Laboratório X — mais o modo **Sem Fim**.
- A cada fase os monstros ganham vida e velocidade, e aparecem **elites** (contorno vermelho, 3,5x vida).
- **13 monstros + 5 chefes**.
- **26 melhorias** em porcentagem (tiro, drones, 5 armas extras, defesa e utilidade) e **11 evoluções** (carta dourada). A pausa mostra as receitas que você já começou.
- Botão **Trocar** nas cartas (+1 com anúncio recompensado) e melhoria permanente "Sorte".

Ajustes rápidos de dificuldade no topo de `src/game/content.js`: `HP_MUL`, `XP_MUL`, `SCRAP_MUL`, `SUB_DURATION`, `ELITE`, e `hp`/`spawn` de cada mundo. Os números de cada melhoria ficam em `recalc()` em `play.js`.

Para adicionar um monstro: crie o sprite em `bestiary.js`, adicione uma linha em `ENEMIES` combinando comportamentos prontos, e coloque-o na lista `mobs` de alguma fase.

## Rodar no navegador

```bash
npm install
npm run dev        # abre em http://localhost:5173 — no navegador os anúncios são simulados
```

## Gerar o app Android

**Opção A — na nuvem (recomendado, não precisa instalar nada):**
1. Suba este projeto para um repositório no GitHub.
2. Aba **Actions** → "Android build" roda sozinho a cada push.
3. Baixe o artefato **apk-teste** e instale no celular para testar.

**Opção B — no seu PC** (precisa de Android Studio):
```bash
npm run android:init     # só na primeira vez
npm run android:sync     # depois de cada mudança
npx cap open android
```

## Colocar os anúncios reais (AdMob)

1. Crie a conta em admob.google.com e **adicione um app** (Android). Copie o **ID do app** (tem `~`).
2. Crie 3 blocos de anúncio: **Banner**, **Intersticial**, **Premiado (Rewarded)**. Copie os IDs (têm `/`).
3. Cole tudo em `game.config.js` → `ads.android` e mude `testing: false`.
4. Em **Privacidade e mensagens** no AdMob, crie a mensagem de consentimento **GDPR** (o jogo já mostra o formulário).
5. Publique o arquivo `app-ads.txt` no site do desenvolvedor (o AdMob mostra o conteúdo). Pode ser via GitHub Pages.

⚠️ Nunca clique nos seus próprios anúncios reais. Para testar, deixe `testing: true` ou cadastre seu aparelho como dispositivo de teste no AdMob.

### Onde aparecem os anúncios
| Tipo | Quando | Por quê |
|---|---|---|
| Banner | Menu e loja (nunca durante a partida) | evita clique acidental (política do AdMob) |
| Intersticial | Ao sair do game over, a cada 2 partidas, no mínimo 90 s de intervalo | receita sem irritar |
| Recompensado | "Reviver" (1x por partida) e "Dobrar sucata" | o jogador escolhe assistir — maior receita por visualização |

## Publicar na Play Store

1. Gere a chave de assinatura: `bash tools/new-keystore.sh ultimoposto` e cadastre os 4 secrets no GitHub (o script mostra quais). **Guarde o arquivo .keystore e as senhas — sem eles você não atualiza o app** (com a "Assinatura de apps do Google Play" dá para recuperar, mas dá trabalho).
2. Crie uma tag `v1.0.0` (ou rode o workflow manualmente) → baixe o artefato **aab-play-store**.
3. No Play Console: criar app → enviar o `.aab` em **Teste interno** primeiro.
4. Preencha: política de privacidade (URL do `docs/privacy.html` publicado), classificação de conteúdo, público-alvo (13+ recomendado), **"Contém anúncios: Sim"**, Segurança dos dados (o AdMob coleta ID de publicidade, dados de uso e diagnóstico).
5. Contas pessoais novas precisam de **teste fechado com 12 testadores por 14 dias** antes da produção.
6. Textos da loja prontos em `store/listing-pt.md`.

A cada atualização: aumente `versionCode` em `game.config.js`.

## Fazer um jogo novo com a fábrica

1. Copie este repositório.
2. Mude `game.config.js` (nome, `appId` novo, IDs de anúncio novos — um app no AdMob por jogo).
3. Troque `src/game/` (arte, gameplay, textos). O `src/engine/` continua igual.
4. Troque a arte em `art_src/` e o ícone/abertura em `assets/`, depois rode `python3 tools/process-art.py`.
