// ============================================================
//  CONFIGURAÇÃO DO JOGO — único arquivo que muda entre jogos da fábrica
// ============================================================
export default {
  appId: 'com.ultimoposto.survivor',   // ID único na loja (não pode mudar depois de publicar)
  name: 'Último Posto',
  versionName: '1.0.0',
  versionCode: 1,                       // aumente a cada envio para a Play Store

  ads: {
    // false = sem anúncio nenhum (para testar o jogo). Os botões de anúncio premiado funcionam de graça.
    enabled: false,
    // true = anúncios de teste do Google. Troque para false SÓ depois de colar seus IDs reais.
    testing: true,
    interstitialEvery: 2,               // intersticial a cada N game overs
    interstitialCooldownSec: 90,        // intervalo mínimo entre intersticiais
    android: {
      appId: 'ca-app-pub-3940256099942544~3347511713', // ID do APP no AdMob (tem "~")
      banner: '',
      interstitial: '',
      rewarded: '',
    },
    ios: {
      appId: 'ca-app-pub-3940256099942544~1458002511',
      banner: '',
      interstitial: '',
      rewarded: '',
    },
  },

  privacyPolicyUrl: '',                 // URL pública da política de privacidade (obrigatória na loja)
};
