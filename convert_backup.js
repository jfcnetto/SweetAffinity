const fs = require('fs');

const inputFile = 'backup_sweetaffinity.sql';
const outputFile = 'backup_inserts.sql';

if (!fs.existsSync(inputFile)) {
  console.error(`Arquivo ${inputFile} não encontrado!`);
  process.exit(1);
}

const content = fs.readFileSync(inputFile, 'utf16le');
const lines = content.split('\n');

let currentTable = null;
let currentColumns = null;
let insertCount = 0;

// Armazenar inserts por tabela
const tableInserts = {};

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  if (currentTable) {
    if (line.trim() === '\\.') {
      currentTable = null;
      currentColumns = null;
      continue;
    }

    const values = line.replace(/\r$/, '').split('\t').map(val => {
      if (val === '\\N') return 'NULL';
      let escaped = val.replace(/'/g, "''");
      return `'${escaped}'`;
    });

    const insertSql = `INSERT INTO ${currentTable} (${currentColumns}) VALUES (${values.join(', ')});\n`;
    if (!tableInserts[currentTable]) {
      tableInserts[currentTable] = [];
    }
    tableInserts[currentTable].push(insertSql);
    insertCount++;
  } 
  else {
    const copyMatch = line.match(/^COPY\s+(.+?)\s+\((.+?)\)\s+FROM\s+stdin;/i);
    if (copyMatch) {
      currentTable = copyMatch[1];
      currentColumns = copyMatch[2];
    }
  }
}

// ORDEM DE DEPENDÊNCIA DE CHAVES ESTRANGEIRAS
const tableOrder = [
  'public.users',
  'public.plans',
  'public.profiles',
  'public.photos',
  'public.notifications',
  'public.refresh_tokens',
  'public.blog_posts',
  'public.campaigns'
];

let outStream = fs.createWriteStream(outputFile);

// Grava primeiro as tabelas base (users, plans...)
for (const table of tableOrder) {
  if (tableInserts[table]) {
    for (const sql of tableInserts[table]) {
      outStream.write(sql);
    }
    delete tableInserts[table]; // Remove depois de escrever
  }
}

// Grava as tabelas que sobraram
for (const table in tableInserts) {
  for (const sql of tableInserts[table]) {
    outStream.write(sql);
  }
}

outStream.end();
console.log(`Sucesso! Foram gerados ${insertCount} comandos INSERT de forma ORDENADA.`);
console.log(`Agora você pode colar o conteúdo de ${outputFile} diretamente no SQL Editor do Neon.tech!`);
