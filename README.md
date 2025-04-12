# True iPhones System

## Configuração do Ambiente

1. Instale as dependências:
```bash
npm install
```

2. Configure as variáveis de ambiente:
Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:
```
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
```

## Desenvolvimento Local

Para rodar o projeto localmente:
```bash
npm run dev
```

## Build e Deploy

### Build Local
```bash
npm run build
```

### Opções de Deploy

#### Vercel
1. Faça push do código para um repositório Git
2. Importe o projeto na Vercel
3. Configure as variáveis de ambiente na interface da Vercel
4. A Vercel detectará automaticamente que é um projeto Vite

#### Netlify
1. Faça push do código para um repositório Git
2. Importe o projeto no Netlify
3. Configure as variáveis de ambiente na interface do Netlify
4. O arquivo `netlify.toml` já está configurado para o deploy

## Estrutura do Projeto

- `/src` - Código fonte da aplicação
- `/public` - Arquivos estáticos
- `/dist` - Build de produção (gerado após npm run build)
