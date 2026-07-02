#!/bin/bash

# ==============================================================================
# Script de Backup Automático - PostgreSQL
# Deve ser configurado no Cron do Servidor (ex: rodar todo dia às 03:00)
# 0 3 * * * /caminho/para/db-backup.sh
# ==============================================================================

# Variáveis do Banco de Dados (Substitua pelos dados da produção ou pegue do .env)
DB_USER="postgres"
DB_NAME="sweetaffinity"
DB_HOST="localhost"
DB_PORT="5432"

# Diretório onde os backups serão salvos
BACKUP_DIR="/var/backups/sweetaffinity"
DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/db_backup_$DATE.sql.gz"

# Número de dias para reter os backups (Direito ao Esquecimento / Espaço em Disco)
RETENTION_DAYS=30

echo "[$(date)] Iniciando rotina de backup..."

# Cria o diretório de backup caso não exista
mkdir -p "$BACKUP_DIR"

# Executa o dump e comprime via gzip
# A senha deve estar no arquivo ~/.pgpass do usuário do sistema
pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME | gzip > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
  echo "[$(date)] Backup concluído com sucesso: $BACKUP_FILE"
else
  echo "[$(date)] ERRO: Falha ao realizar o backup."
  # Se o Sentry estivesse rodando aqui, dispararíamos um alerta
  exit 1
fi

# ==============================================================================
# LIMPEZA / COMPLIANCE LGPD
# Exclui backups com mais de $RETENTION_DAYS dias
# ==============================================================================
echo "[$(date)] Apagando backups mais antigos que $RETENTION_DAYS dias..."
find "$BACKUP_DIR" -type f -name "*.sql.gz" -mtime +$RETENTION_DAYS -exec rm -f {} \;

echo "[$(date)] Rotina de backup finalizada."
exit 0
