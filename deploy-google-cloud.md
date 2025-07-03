# Guia de Deploy - Google Cloud Platform

## Pré-requisitos

1. **Google Cloud SDK instalado** no seu computador
2. **Projeto Google Cloud criado** e configurado
3. **Cloud SQL PostgreSQL** provisionado (recomendado)
4. **Faturamento ativado** no projeto

## Passos para Deploy

### 1. Preparar o Ambiente Local

```bash
# Instalar Google Cloud SDK (se não tiver)
curl https://sdk.cloud.google.com | bash
exec -l $SHELL

# Fazer login na sua conta Google
gcloud auth login

# Configurar o projeto (substitua PROJECT_ID pelo seu ID)
gcloud config set project SEU_PROJECT_ID

# Habilitar APIs necessárias
gcloud services enable appengine.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable sqladmin.googleapis.com
```

### 2. Configurar Banco de Dados PostgreSQL

```bash
# Criar instância Cloud SQL PostgreSQL
gcloud sql instances create vendas-db \
    --database-version=POSTGRES_15 \
    --tier=db-f1-micro \
    --region=us-central1

# Criar banco de dados
gcloud sql databases create vendas --instance=vendas-db

# Criar usuário
gcloud sql users create vendas-user \
    --instance=vendas-db \
    --password=SUA_SENHA_SEGURA

# Obter string de conexão
gcloud sql instances describe vendas-db
```

### 3. Configurar Variáveis de Ambiente

Edite o arquivo `app.yaml`:

```yaml
runtime: nodejs20
env: standard

env_variables:
  NODE_ENV: "production"
  PORT: "8080"
  DATABASE_URL: "postgresql://vendas-user:SUA_SENHA@/vendas?host=/cloudsql/SEU_PROJECT_ID:us-central1:vendas-db"
  SESSION_SECRET: "sua_chave_secreta_muito_segura_aqui_2024"

automatic_scaling:
  min_instances: 1
  max_instances: 10
  target_cpu_utilization: 0.8

resources:
  cpu: 1
  memory_gb: 0.5
  disk_size_gb: 10
```

### 4. Fazer Deploy

```bash
# Na pasta raiz do projeto
gcloud app deploy

# Definir versão como padrão (se necessário)
gcloud app versions migrate v1
```

### 5. Executar Migrações do Banco

Após o deploy, execute as migrações:

```bash
# Via Cloud Shell ou localmente com proxy
gcloud sql connect vendas-db --user=vendas-user

# Ou usar o script de migração remoto
gcloud app browse
```

## Configurações de Produção

### Otimizações Recomendadas

1. **Cloud SQL Proxy** para conexões seguras
2. **Cloud Storage** para uploads de arquivos
3. **Cloud CDN** para assets estáticos
4. **Cloud Monitoring** para logs e métricas

### Custos Estimados (Tier Básico)
- App Engine: $10-30/mês
- Cloud SQL: $7-25/mês  
- Total: ~$20-60/mês

## Comandos Úteis

```bash
# Ver logs da aplicação
gcloud app logs tail -s default

# Ver status dos serviços
gcloud app services list

# Escalar aplicação
gcloud app versions migrate v2

# Rollback se necessário
gcloud app versions migrate v1
```

## Domínio Personalizado

```bash
# Mapear domínio personalizado
gcloud app domain-mappings create seudominio.com

# Configurar SSL (automático no App Engine)
```

## Troubleshooting

1. **Erro de conexão DB**: Verificar string de conexão
2. **Erro de build**: Verificar dependências no package.json
3. **Erro 502**: Verificar se porta 8080 está configurada
4. **Logs**: Sempre verificar `gcloud app logs tail`

## Próximos Passos

Após deploy bem-sucedido:
1. Configurar backups automáticos do Cloud SQL
2. Configurar alertas de monitoramento  
3. Implementar CI/CD com Cloud Build
4. Configurar domínio personalizado