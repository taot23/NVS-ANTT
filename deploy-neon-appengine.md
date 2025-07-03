# Deploy Google Cloud App Engine + Neon Database

## Pré-requisitos

1. **Conta Google Cloud** com faturamento ativado
2. **Conta Neon** (https://neon.tech) - gratuita
3. **Google Cloud SDK** instalado

## Passo 1: Configurar Banco Neon

1. Acesse https://neon.tech e crie conta gratuita
2. Crie novo projeto/database
3. Copie a string de conexão que terá formato:
   ```
   postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/dbname?sslmode=require
   ```

## Passo 2: Configurar Google Cloud

```bash
# Instalar Google Cloud SDK (se não tiver)
curl https://sdk.cloud.google.com | bash
exec -l $SHELL

# Fazer login
gcloud auth login

# Listar projetos ou criar novo
gcloud projects list
# ou criar novo: gcloud projects create meu-projeto-vendas

# Configurar projeto
gcloud config set project SEU_PROJECT_ID

# Habilitar App Engine
gcloud services enable appengine.googleapis.com
gcloud services enable cloudbuild.googleapis.com

# Criar aplicação App Engine (escolha região mais próxima)
gcloud app create --region=southamerica-east1
```

## Passo 3: Configurar app.yaml

Edite o arquivo `app.yaml` e configure sua DATABASE_URL do Neon:

```yaml
runtime: nodejs20
env: standard

env_variables:
  NODE_ENV: "production"
  PORT: "8080"
  DATABASE_URL: "SUA_STRING_DE_CONEXAO_NEON_AQUI"
  SESSION_SECRET: "chave_super_secreta_para_sessoes_2024"

automatic_scaling:
  min_instances: 1
  max_instances: 10
  target_cpu_utilization: 0.8

resources:
  cpu: 1
  memory_gb: 1
  disk_size_gb: 10
```

## Passo 4: Deploy

```bash
# Fazer deploy
gcloud app deploy

# Abrir aplicação no navegador
gcloud app browse
```

## Passo 5: Executar Migrações

Após deploy bem-sucedido, execute as migrações do banco:

```bash
# Executar migrações remotamente via URL
# A aplicação vai criar as tabelas automaticamente na primeira execução
# ou execute o script de migração manualmente se necessário
```

## Custos

### Neon Database (Gratuito)
- 0.5 GB de storage
- 100 horas de compute por mês
- Ideal para desenvolvimento/teste

### Google Cloud App Engine
- Tier gratuito: 28 horas de instância por dia
- Após tier gratuito: ~$0.05/hora
- **Custo estimado: R$ 0-150/mês**

## Vantagens desta Configuração

✅ **Banco gratuito** com Neon  
✅ **Deploy simples** sem Docker  
✅ **SSL automático** no App Engine  
✅ **Auto-scaling** baseado no tráfego  
✅ **Monitoramento integrado**  
✅ **Backup automático** no Neon  

## Comandos Úteis

```bash
# Ver logs da aplicação
gcloud app logs tail -s default

# Ver versões deployadas
gcloud app versions list

# Rollback para versão anterior
gcloud app versions migrate VERSAO_ANTERIOR

# Configurar domínio personalizado
gcloud app domain-mappings create seudominio.com

# Escalar aplicação
gcloud app versions migrate --split-by=traffic
```

## Estrutura de Arquivos para Deploy

A aplicação será deployada com esta estrutura:
```
/
├── app.yaml              # Configuração App Engine
├── package.json          # Dependências Node.js
├── server/              # Backend Express
├── client/              # Frontend React (buildado)
├── shared/              # Schemas compartilhados
└── dist/                # Aplicação buildada
```

## Troubleshooting

**Erro de conexão com banco:**
- Verifique se DATABASE_URL está correta no app.yaml
- Confirme que string do Neon inclui `?sslmode=require`

**Erro 502 Bad Gateway:**
- Verifique se PORT=8080 está configurado
- Confirme se aplicação está ouvindo na porta correta

**Build falha:**
- Execute `npm run build` localmente primeiro
- Verifique se todas dependências estão no package.json