#!/usr/bin/env bash
# Cria a chave de assinatura (UMA vez por conta/jogo). GUARDE o arquivo e as senhas com segurança.
# Requer Java (keytool). Uso: bash tools/new-keystore.sh meujogo
set -e
NAME=${1:-upload}
keytool -genkeypair -v -keystore "$NAME.keystore" -alias "$NAME" -keyalg RSA -keysize 2048 -validity 10000
echo
echo "Agora adicione no GitHub (Settings > Secrets and variables > Actions):"
echo "  ANDROID_KEYSTORE_BASE64 = conteúdo abaixo"
echo "  ANDROID_KEYSTORE_PASSWORD / ANDROID_KEY_PASSWORD = as senhas que você digitou"
echo "  ANDROID_KEY_ALIAS = $NAME"
echo
base64 -w0 "$NAME.keystore" 2>/dev/null || base64 "$NAME.keystore"
echo
