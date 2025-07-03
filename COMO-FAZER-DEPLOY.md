# 🚀 Como Fazer Deploy no Google Cloud

## ✅ Configuração Simplificada (App Engine + Neon)

### Passo 1: Configurar Google Cloud
```bash
./setup-appengine.sh
```
Este script vai:
- Configurar autenticação Google Cloud
- Criar/configurar projeto 
- Habilitar APIs necessárias
- Configurar App Engine

### Passo 2: Configurar Banco Neon (Gratuito)

1. **Criar conta Neon:**
   - Acesse: https://neon.tech
   - Clique "Sign Up" (gratuito)
   - Crie novo projeto/database

2. **Copiar string de conexão:**
   - No dashboard Neon, vá em "Connection string"
   - Copie a URL que termina com `?sslmode=require`
   - Exemplo: `postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/dbname?sslmode=require`

### Passo 3: Configurar app.yaml

Edite o arquivo `app.yaml` e substitua:
```yaml
# DATABASE_URL: "postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/db?sslmode=require"
```

Por:
```yaml
DATABASE_URL: "SUA_STRING_NEON_AQUI"
```

### Passo 4: Deploy
```bash
./deploy.sh
```

## 💰 Custos

| Serviço | Custo |
|---------|-------|
| **Neon Database** | **Gratuito** (0.5GB) |
| **App Engine** | Tier gratuito + ~R$0-150/mês |
| **SSL/Domínio** | **Gratuito** |
| **Total** | **R$0-150/mês** |

## 🎯 Vantagens

✅ **Sem Docker** - Deploy direto  
✅ **Banco gratuito** - Neon tier gratuito  
✅ **SSL automático** - Certificado gerenciado  
✅ **Auto-scaling** - Escala conforme demanda  
✅ **Zero configuração** - Funciona imediatamente  

## 📱 URL Final

Após deploy, sua aplicação estará em:
```
https://SEU_PROJECT_ID.uc.r.appspot.com
```

Login inicial:
- **Usuário:** admin  
- **Senha:** admin123

## 🔧 Comandos Úteis

```bash
# Ver logs em tempo real
gcloud app logs tail -s default

# Ver versões deployadas  
gcloud app versions list

# Rollback para versão anterior
gcloud app versions migrate v1

# Configurar domínio personalizado
gcloud app domain-mappings create seudominio.com
```

## 🆘 Troubleshooting

**Erro "DATABASE_URL não configurada":**
- Verifique se removeu o `#` da linha DATABASE_URL no app.yaml
- Confirme que a string do Neon está correta

**Erro "App Engine não encontrado":**
- Execute `./setup-appengine.sh` primeiro

**Erro de build:**
- Execute `npm run build` localmente primeiro
- Verifique se não há erros no código

**Aplicação não carrega:**
- Verifique logs: `gcloud app logs tail -s default`
- Confirme que PORT=8080 está configurado